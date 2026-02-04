import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { AI_URL } from '../api/apiurl';
import { useTheme } from '@/components/theme-provider';
import { useChatHistoryActions } from './rename_delete_handlers';
import type { Message, ChatSession } from './types';
import { 
  SupportHeader, 
  HistorySidebar, 
  ChatMessages, 
  InputArea, 
  TableModal 
} from './components';

// Constants
const AGENT_ID = '3e60de9c-4fec-4aa3-873c-bbaf6984609e';
const API_BASE_URL = AI_URL;

// Helper function to parse SSE chunks
const parseSSEChunk = (chunk: string) => {
  const events: Array<{ type: string; text?: string; conversationId?: string; [key: string]: any }> = [];
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;

    try {
      const data = JSON.parse(line.slice(6));

      // ✅ NORMAL TEXT
      if (data.type === 'text-delta') {
        events.push({
          type: 'text-delta',
          text: data.text ?? ''  // Changed from data.textDelta to data.text
        });
      }

      // ✅ REASONING TEXT (THIS WAS MISSING)
      if (data.type === 'reasoning-delta') {
        const reasoningText =
          data.providerMetadata?.openrouter?.reasoning_details
            ?.map((r: any) => r.text)
            .join('') ?? '';

        events.push({
          type: 'reasoning-delta',
          text: reasoningText
        });
      }

      if (data.type === 'finish') {
        events.push({ type: 'finish', conversationId: data.conversationId, ...data });
      }
    } catch (e) {
      console.error('[SSE Parse Error]', e);
    }
  }

  return events;
};

// Helper function to detect and extract JSON from text
const extractJSON = (text: string): { hasJSON: boolean; jsonData: any[] | null; beforeJSON: string; afterJSON: string; isPartialJSON?: boolean } => {
  if (!text) return { hasJSON: false, jsonData: null, beforeJSON: '', afterJSON: '', isPartialJSON: false };

  try {
    // Check if --json marker exists (even if incomplete)
    const hasMarkerStart = text.includes('--json');
    const hasMarkerEnd = text.includes('json--');
    
    // If we have start marker but not end marker, it's still streaming
    if (hasMarkerStart && !hasMarkerEnd) {
      console.log('⏳ [extractJSON] Partial JSON detected - still streaming');
      const beforeMarker = text.substring(0, text.indexOf('--json')).trim();
      return { 
        hasJSON: false, 
        jsonData: null, 
        beforeJSON: beforeMarker, 
        afterJSON: '', 
        isPartialJSON: true 
      };
    }
    
    // 1. Try to extract using --json and json-- markers first (most reliable)
    const markerRegex = /--json\s*(\[[\s\S]*?\])\s*json--/i;
    const markerMatch = text.match(markerRegex);
    
    if (markerMatch) {
      const jsonStr = markerMatch[1].trim();
      try {
        const jsonData = JSON.parse(jsonStr);
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          let beforeJSON = text.substring(0, markerMatch.index ?? 0).trim();
          const afterJSON = text.substring((markerMatch.index ?? 0) + markerMatch[0].length).trim();
          
          console.log('📋 [extractJSON] beforeJSON:', beforeJSON.substring(0, 200));
          
          // Check if there's a heading like "Available Workflows", "Available Agents", etc.
          // Everything before the heading is "thinking", everything after is "output"
          const headingMatch = beforeJSON.match(/(Available\s+\w+)/i);
          
          console.log('🔍 [extractJSON] headingMatch:', headingMatch);
          
          if (headingMatch && headingMatch.index !== undefined) {
            // Split: thinking vs output
            const thinkingPart = beforeJSON.substring(0, headingMatch.index).trim();
            const outputPart = beforeJSON.substring(headingMatch.index).trim();
            
            console.log('💭 [extractJSON] thinkingPart length:', thinkingPart.length);
            console.log('📄 [extractJSON] outputPart:', outputPart.substring(0, 100));
            
            // If there's thinking, format it with the accordion pattern
            if (thinkingPart) {
              beforeJSON = `🤔 Thinking...\n${thinkingPart}\n\n${outputPart}`;
              console.log('✅ [extractJSON] Formatted with thinking accordion');
            } else {
              beforeJSON = outputPart;
              console.log('⚠️ [extractJSON] No thinking part, using output only');
            }
          } else {
            // No heading found - treat ALL beforeJSON as thinking, show nothing as output
            console.log('⚠️ [extractJSON] No heading match found - treating all as thinking');
            if (beforeJSON.trim()) {
              beforeJSON = `🤔 Thinking...\n${beforeJSON}\n\n`;
              console.log('✅ [extractJSON] All content moved to thinking accordion');
            }
          }
          
          return { hasJSON: true, jsonData, beforeJSON, afterJSON, isPartialJSON: false };
        }
      } catch (e) {
        console.error('Marker-based JSON parse failed:', e);
      }
    }

    // 2. Fallback: Try regex patterns if no markers or marker parse failed
    const cleanText = text.replace(/--json\s*/gi, '').replace(/\s*json--/gi, '');
    
    const patterns = [
      /\[\s*\{[\s\S]*?\}\s*(?:,\s*\{[\s\S]*?\}\s*)*\]/,
      /\[[\s\S]*\]/,
    ];
    
    for (const pattern of patterns) {
      const jsonMatch = cleanText.match(pattern);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        try {
          const jsonData = JSON.parse(jsonStr);
          if (Array.isArray(jsonData) && jsonData.length > 0 && typeof jsonData[0] === 'object') {
            const beforeJSON = cleanText.substring(0, jsonMatch.index).trim();
            const afterJSON = cleanText.substring((jsonMatch.index || 0) + jsonStr.length).trim();
            return { hasJSON: true, jsonData, beforeJSON, afterJSON, isPartialJSON: false };
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
    }
  } catch (e) {
    console.error('JSON extraction error:', e);
  }
  
  return { hasJSON: false, jsonData: null, beforeJSON: text, afterJSON: '', isPartialJSON: false };
};

export const Support = () => {
  // Get user from context
  const { user } = useUser();
  const USER_ID = user?.id || 'support-user-' + Date.now();
  
  // State
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string>('current');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isGeneratingTable, setIsGeneratingTable] = useState<boolean>(false);
  const [typingText, setTypingText] = useState<string>('');
  const [showTableModal, setShowTableModal] = useState<boolean>(false);
  const [modalTableData, setModalTableData] = useState<any[]>([]);
  
  // Use theme context for dark mode
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingText]);

  useEffect(() => {
    loadConversationHistory();
  }, []);

  // Load conversation history from API
  async function loadConversationHistory() {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/memory/conversations?conversationId=${currentConversationId || ''}&userId=${USER_ID}`
      );
      
      // Handle 404 - conversation doesn't exist yet
      if (response.status === 404) {
        console.log('[History] Conversation not found (404) - this is normal for new conversations');
        setChatHistory([]);
        setIsLoadingHistory(false);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        const sessions: ChatSession[] = (data.conversations || []).map((conv: any) => ({
          id: conv.conversation_id,
          conversationId: conv.conversation_id,
          title: conv.title || conv.runtime_title || 'Untitled Chat',
          subtitle: conv.runtime_title?.substring(0, 30) + '...' || 'No messages',
          date: new Date(conv.last_message_at || conv.updated_at || Date.now())
        }));
        
        setChatHistory(sessions);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  // Use the chat history actions hook
  const {
    editingSessionId,
    editingTitle,
    isDeletingSession,
    setEditingTitle,
    deleteConversation,
    startRename,
    saveRename,
    cancelRename
  } = useChatHistoryActions({
    userId: USER_ID,
    activeSession,
    setChatHistory,
    setMessages,
    setCurrentConversationId,
    setActiveSession,
    loadConversationHistory
  });

  // Send message with streaming
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setTypingText('');

    let accumulatedThinking = '';
    let accumulatedOutput = '';
    const tempMessageId = (Date.now() + 1).toString();

    try {
      // Use streaming endpoint
      const response = await fetch(`${API_BASE_URL}/agents/${AGENT_ID}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: userMessage.content,
          userId: USER_ID,
          conversationId: currentConversationId || "chat_"+Date.now(),
          options: {
            userId: USER_ID,
            conversationId: currentConversationId || "chat_"+Date.now(),
            context: {
              userId: USER_ID,
              conversationId: currentConversationId || "chat_"+Date.now()
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullStreamBuffer = '';

      console.log('🚀 [Stream] Starting to read stream...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('✅ [Stream] Stream completed');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('📦 [Stream] Raw chunk:', chunk);
        
        const events = parseSSEChunk(chunk);
        
        for (const event of events) {
          console.log('📋 [Stream] Parsed event:', event);
          
          if (event.type === 'reasoning-delta') {
            const reasoningText = event.text || '';
            console.log('🤔 [Stream] Reasoning delta:', reasoningText);
            accumulatedThinking += reasoningText;
            
            console.log('💭 [Stream] Accumulated thinking:', accumulatedThinking);
            console.log('📄 [Stream] Accumulated output:', accumulatedOutput);
            
            // Update or add the streaming message with separate thinking
            setMessages(prev => {
              const existingIndex = prev.findIndex(m => m.id === tempMessageId);
              
              const streamingMsg: Message = {
                id: tempMessageId,
                role: 'assistant',
                content: accumulatedOutput,     // ONLY OUTPUT
                thinking: accumulatedThinking,  // ONLY THINKING
                timestamp: new Date()
              };
              
              if (existingIndex >= 0) {
                // Update existing message
                const updated = [...prev];
                updated[existingIndex] = streamingMsg;
                return updated;
              } else {
                // Add new message
                return [...prev, streamingMsg];
              }
            });
          } else if (event.type === 'text-delta') {
            const textDelta = event.text || '';
            console.log('💬 [Stream] Text delta:', textDelta);
            
            fullStreamBuffer += textDelta;
            accumulatedOutput += textDelta;
            
            console.log('💭 [Stream] Accumulated thinking:', accumulatedThinking);
            console.log('📄 [Stream] Accumulated output:', accumulatedOutput);
            
            // Update or add the streaming message with separate thinking
            setMessages(prev => {
              const existingIndex = prev.findIndex(m => m.id === tempMessageId);
              
              const streamingMsg: Message = {
                id: tempMessageId,
                role: 'assistant',
                content: accumulatedOutput,     // ONLY OUTPUT
                thinking: accumulatedThinking,  // ONLY THINKING
                timestamp: new Date()
              };
              
              if (existingIndex >= 0) {
                // Update existing message
                const updated = [...prev];
                updated[existingIndex] = streamingMsg;
                return updated;
              } else {
                // Add new message
                return [...prev, streamingMsg];
              }
            });
          } else if (event.type === 'finish') {
            console.log('🏁 [Stream] Finish event received');
            console.log('📊 [Stream] Final thinking:', accumulatedThinking);
            console.log('📊 [Stream] Final output:', accumulatedOutput);
            
            // Replace the streaming message with final content
            setMessages(prev => {
              const filtered = prev.filter(m => m.id !== tempMessageId);
              
              return [
                ...filtered,
                {
                  id: tempMessageId,
                  role: 'assistant',
                  content: accumulatedOutput || 'No output generated.',
                  thinking: accumulatedThinking,
                  timestamp: new Date()
                }
              ];
            });
            
            setTypingText('');
            
            // Update conversation ID if provided
            if (event.conversationId && !currentConversationId) {
              setCurrentConversationId(event.conversationId);
            }
            
            // Reload history to get updated conversations
            await loadConversationHistory();
          } else {
            console.log('❓ [Stream] Unknown event type:', event.type);
          }
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setTypingText('');
    } finally {
      setIsLoading(false);
      setIsGeneratingTable(false);
    }
  };

  // Load session from history
  const loadSession = async (sessionId: string) => {
    if (sessionId === 'current') {
      setActiveSession('current');
      return;
    }

    // Prevent loading if already loading or already on this session
    if (isLoadingSession || activeSession === sessionId) {
      return;
    }

    setIsLoadingSession(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/memory/conversations/${sessionId}?userId=${USER_ID}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const loadedMessages: Message[] = (data.messages || []).map((msg: any) => ({
          id: msg.id || Date.now().toString(),
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp || Date.now())
        }));
        
        setMessages(loadedMessages);
        setCurrentConversationId(sessionId);
        setActiveSession(sessionId);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Start new chat
  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setActiveSession('current');
    setInputMessage('');
  };

  // Clear current chat
  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear this chat?')) {
      setMessages([]);
      setInputMessage('');
    }
  };

  // Format time
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Toggle dark mode using theme context
  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Handle view table
  const handleViewTable = (data: any[]) => {
    setModalTableData(data);
    setShowTableModal(true);
  };

  // Handle suggestion click
  const handleSuggestionClick = (message: string) => {
    setInputMessage(message);
  };

  return (
    <div className={`flex h-[calc(100vh-64px)] transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-gray-900' 
        : 'bg-linear-to-br from-purple-50 via-white to-blue-50'
    }`}>
      {/* History Sidebar */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={chatHistory}
        activeSession={activeSession}
        onLoadSession={loadSession}
        onNewChat={startNewChat}
        onClearChat={clearChat}
        isDarkMode={isDarkMode}
        editingSessionId={editingSessionId}
        editingTitle={editingTitle}
        onStartRename={startRename}
        onSaveRename={saveRename}
        onCancelRename={cancelRename}
        onEditingTitleChange={setEditingTitle}
        onDeleteConversation={deleteConversation}
        currentMessages={messages}
        formatTime={formatTime}
        isLoadingSession={isLoadingSession}
        isDeletingSession={isDeletingSession}
        isLoadingHistory={isLoadingHistory}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <SupportHeader
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onNewChat={startNewChat}
          onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
        />

        {/* Messages */}
        <ChatMessages
          messages={messages}
          typingText={typingText}
          isGeneratingTable={isGeneratingTable}
          isDarkMode={isDarkMode}
          onViewTable={handleViewTable}
          onSuggestionClick={handleSuggestionClick}
          extractJSON={extractJSON}
          messagesEndRef={messagesEndRef}
          isLoading={isLoading}
        />

        {/* Input Area */}
        <InputArea
          value={inputMessage}
          onChange={setInputMessage}
          onSend={handleSendMessage}
          isLoading={isLoading}
          isDarkMode={isDarkMode}
          onSuggestionClick={handleSuggestionClick}
        />
      </div>

      {/* Table Modal */}
      <TableModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        data={modalTableData}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};

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

const extractJSON = (text: string): { 
  hasJSON: boolean; 
  jsonData: any[] | null; 
  beforeJSON: string; 
  afterJSON: string; 
  isPartialJSON?: boolean;
  thinking?: string;
} => {
  if (!text) return { hasJSON: false, jsonData: null, beforeJSON: '', afterJSON: '', isPartialJSON: false };

  let extractedThinking = '';
  let mainText = text;

  // 1. Extract thinking first if it exists
  const headingMatch = text.match(/(Available\s+\w+)/i);
  if (headingMatch && headingMatch.index !== undefined) {
    extractedThinking = text.substring(0, headingMatch.index).trim();
    mainText = text.substring(headingMatch.index).trim();
  }

  // 2. Look for --json and json-- markers
  const jsonStartIndex = mainText.indexOf('--json');
  if (jsonStartIndex !== -1) {
    const jsonEndIndex = mainText.indexOf('json--', jsonStartIndex + 6);
    const beforeJSON = mainText.substring(0, jsonStartIndex).trim();
    
    if (jsonEndIndex === -1) {
      // Partial JSON (still streaming)
      return {
        hasJSON: false,
        jsonData: null,
        beforeJSON,
        afterJSON: '',
        isPartialJSON: true,
        thinking: extractedThinking || undefined
      };
    } else {
      // Potentially complete JSON
      const jsonStr = mainText.substring(jsonStartIndex + 6, jsonEndIndex).trim();
      const afterJSON = mainText.substring(jsonEndIndex + 6).trim();
      
      try {
        const jsonData = JSON.parse(jsonStr);
        if (Array.isArray(jsonData)) {
          return {
            hasJSON: true,
            jsonData,
            beforeJSON,
            afterJSON,
            isPartialJSON: false,
            thinking: extractedThinking || undefined
          };
        }
      } catch (e) {
        console.error('Failed to parse JSON between markers:', e);
        // If it looks like it's still being formed or just broken, 
        // fallback to partial or raw text
        return {
          hasJSON: false,
          jsonData: null,
          beforeJSON,
          afterJSON,
          isPartialJSON: true, // Show loading if markers are there but parse fails
          thinking: extractedThinking || undefined
        };
      }
    }
  }

  // 3. Fallback: Regex for data without markers (e.g. from history)
  const patterns = [
    /\[\s*\{[\s\S]*?\}\s*(?:,\s*\{[\s\S]*?\}\s*)*\]/,
    /\[[\s\S]*\]/,
  ];
  
  for (const pattern of patterns) {
    const match = mainText.match(pattern);
    if (match) {
      try {
        const jsonData = JSON.parse(match[0]);
        if (Array.isArray(jsonData) && jsonData.length > 0) {
          const beforeJSON = mainText.substring(0, match.index).trim();
          const afterJSON = mainText.substring((match.index || 0) + match[0].length).trim();
          return {
            hasJSON: true,
            jsonData,
            beforeJSON,
            afterJSON,
            isPartialJSON: false,
            thinking: extractedThinking || undefined
          };
        }
      } catch (e) {
        // continue
      }
    }
  }
  
  return { 
    hasJSON: false, 
    jsonData: null, 
    beforeJSON: mainText, 
    afterJSON: '', 
    isPartialJSON: false,
    thinking: extractedThinking || undefined
  };
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
  
  // Sync currentConversationId with localStorage
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem('last_support_conversation_id', currentConversationId);
    }
  }, [currentConversationId]);

  // Load last active session on mount
  useEffect(() => {
    const lastSessionId = localStorage.getItem('last_support_conversation_id');
    if (lastSessionId) {
      loadSession(lastSessionId);
    }
    loadConversationHistory();
  }, []);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingText]);

  // Load conversation history from API
  async function loadConversationHistory() {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/memory/conversations?userId=${USER_ID}&limit=50&offset=0`
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

    const nextConvId = currentConversationId || "chat_" + Date.now();
    
    // Set immediate conversation ID if it's a new chat
    if (!currentConversationId) {
      setCurrentConversationId(nextConvId);
    }

    try {
      // Use streaming endpoint
      const response = await fetch(`${API_BASE_URL}/agents/${AGENT_ID}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: userMessage.content,
          userId: USER_ID,
          conversationId: nextConvId,
          options: {
            userId: USER_ID,
            conversationId: nextConvId,
            context: {
              userId: USER_ID,
              conversationId: nextConvId
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
            
            if (event.conversationId) {
              setCurrentConversationId(event.conversationId);
              localStorage.setItem('last_support_conversation_id', event.conversationId);
            }
            
            const finalConvId = event.conversationId || currentConversationId;

            // AUTO-TITLE: If this was the first user message, update the conversation title
            if (messages.length <= 1 && finalConvId) {
              try {
                const firstUserMsg = userMessage.content;
                const newTitle = firstUserMsg.length > 40 ? firstUserMsg.substring(0, 37) + '...' : firstUserMsg;
                
                console.log(`🏷️ [Auto-Title] Updating title for ${finalConvId} to: ${newTitle}`);
                
                await fetch(`${API_BASE_URL}/api/memory/conversations/${finalConvId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ title: newTitle }),
                });
              } catch (titleError) {
                console.error('Failed to auto-title conversation:', titleError);
              }
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
        `${API_BASE_URL}/api/memory/conversations/${sessionId}?userId=${USER_ID}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const loadedMessages: Message[] = (data.messages || []).map((m: any) => {
          let content = '';
          let thinking = '';
          
          if (Array.isArray(m.parts)) {
            m.parts.forEach((part: any) => {
              if (part.type === 'text') {
                content += (part.text || '');
              } else if (part.type === 'reasoning' || part.type === 'reasoning.text' || part.type === 'thinking') {
                thinking += (part.text || '');
              } else if (typeof part === 'string') {
                content += part;
              }
            });
          } else if (typeof m.parts === 'string') {
            content = m.parts;
          } else {
            content = m.content || '';
          }
          
          return {
            id: m.id || Math.random().toString(36).substr(2, 9),
            role: m.role,
            content: content,
            thinking: thinking || undefined,
            timestamp: new Date(m.created_at || m.timestamp || Date.now())
          };
        });
        
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

  // Clear all history for this agent
  const handleClearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear ALL conversation history? This cannot be undone.')) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/memory/agent/${AGENT_ID}?userId=${USER_ID}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setChatHistory([]);
        setCurrentConversationId(null);
        setMessages([]);
        setActiveSession('current');
      }
    } catch (error) {
      console.error('Failed to clear agent history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Start new chat
  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setActiveSession('current');
    setInputMessage('');
    localStorage.removeItem('last_support_conversation_id');
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
    <div className={`flex h-[calc(100vh-64px)] transition-colors duration-200 relative overflow-hidden ${
      isDarkMode 
        ? 'bg-gray-900' 
        : 'bg-linear-to-br from-purple-50 via-white to-blue-50'
    }`}>
      {/* Background Overlay for Mobile Sidebar */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 sm:hidden transition-opacity duration-300"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

      {/* History Sidebar */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={chatHistory}
        activeSession={activeSession}
        onLoadSession={loadSession}
        onNewChat={startNewChat}
        onClearChat={handleClearAllHistory}
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

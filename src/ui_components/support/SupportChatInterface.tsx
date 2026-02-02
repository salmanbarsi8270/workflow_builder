import { useState, useEffect, useRef } from 'react';
import { AI_URL } from '../../ui_components/api/apiurl';
import { parseSSEChunk } from '@/lib/sse-parser';
import { SupportHeader } from './components/SupportHeader';
import { SupportBody } from './components/SupportBody';
import { SupportInput } from './components/SupportInput';
import { HistorySlider } from './components/HistorySlider';
import { SidebarProvider, SidebarInset } from '@/components/sidebar';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    id: string;
    status?: 'sending' | 'sent' | 'error' | 'thinking';
    feedback?: 'helpful' | 'not-helpful';
    metadata?: {
        toolCalls?: any[];
        toolResults?: any[];
        currentTool?: string;
    };
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    timestamp: Date;
    isPinned?: boolean;
    tags?: string[];
    preview: string;
} 

interface SupportChatInterfaceProps {
    userId: string;
    userName?: string;
}

export function SupportChatInterface({ userId, userName = 'Guest' }: SupportChatInterfaceProps) {
    const [currentSession, setCurrentSession] = useState<ChatSession>({
        id: 'current',
        title: 'New Conversation',
        messages: [],
        timestamp: new Date(),
        preview: 'Start a new conversation',
        tags: ['current']
    });
    
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(20);
    const [showHistorySlider, setShowHistorySlider] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('chat_'+Date.now());
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const agentId = "2d6123b7-4149-4052-b60a-3306428497dc";

    // Load chat history from localStorage and Backend on mount
    useEffect(() => {
        const fetchHistory = async () => {
            let sessions: ChatSession[] = [];
            
            // 1. Load from localStorage first (for immediate responsiveness)
            const savedSessions = localStorage.getItem(`chat_sessions_${userId}`);
            if (savedSessions) {
                try {
                    const parsed = JSON.parse(savedSessions);
                    sessions = parsed.map((session: any) => ({
                        ...session,
                        timestamp: new Date(session.timestamp),
                        messages: session.messages.map((msg: any) => ({
                            ...msg,
                            timestamp: new Date(msg.timestamp)
                        }))
                    }));
                } catch (error) {
                    console.error('Failed to load local chat sessions:', error);
                }
            }

            // 2. Fetch from Backend and Merge
            try {
                const response = await fetch(`${AI_URL}/memory/conversations?userId=${userId}`);
                const data = await response.json();
                
                if (data.conversations) {
                    const backendSessions: ChatSession[] = data.conversations.map((c: any) => {
                        // Check if we already have this session locally
                        const local = sessions.find(s => s.id === c.conversation_id);
                        return {
                            id: c.conversation_id,
                            title: c.title || 'Conversation',
                            timestamp: new Date(c.updated_at),
                            messages: local?.messages || [], // Messages will be fetched on demand if empty
                            preview: local?.preview || 'Persisted on server',
                            isPinned: local?.isPinned,
                            tags: ['server']
                        };
                    });

                    // Merge: Keep local messages if available, add new ones from server
                    const merged = [...sessions];
                    backendSessions.forEach(bs => {
                        if (!merged.find(m => m.id === bs.id)) {
                            merged.push(bs);
                        }
                    });
                    
                    setChatSessions(merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
                }
            } catch (error) {
                console.error('Failed to fetch backend history:', error);
                if (sessions.length > 0) setChatSessions(sessions);
            }
        };

        fetchHistory();

        setCurrentSession(prev => ({
            ...prev,
            messages: [],
            timestamp: new Date()
        }));
    }, [userId, userName]);

    // Save chat sessions to localStorage
    useEffect(() => {
        localStorage.setItem(`chat_sessions_${userId}`, JSON.stringify(chatSessions));
    }, [chatSessions, userId]);

    // Update session in history when messages change
    useEffect(() => {
        if (currentSession.messages.length <= 1) return;

        const updateTimer = setTimeout(() => {
            if (currentSession.id === 'current') {
                // Promote to a real session after some activity
                const newId = `session_${Date.now()}`;
                const newSession: ChatSession = {
                    ...currentSession,
                    id: newId,
                    title: generateSessionTitle(currentSession.messages),
                    preview: getSessionPreview(currentSession.messages),
                    tags: ['saved']
                };
                setSelectedSessionId(newId);
                setCurrentSession(newSession);
                setChatSessions(prev => [newSession, ...prev]);
            } else {
                // Update existing session in history
                setChatSessions(prev => prev.map(s => 
                    s.id === currentSession.id 
                        ? { 
                            ...currentSession, 
                            title: generateSessionTitle(currentSession.messages),
                            preview: getSessionPreview(currentSession.messages)
                          } 
                        : s
                ));
            }
        }, 1000);

        return () => clearTimeout(updateTimer);
    }, [currentSession.messages]);


    const generateSessionTitle = (messages: Message[]): string => {
        const firstUserMessage = messages.find(m => m.role === 'user');
        if (firstUserMessage) {
            const text = firstUserMessage.content.substring(0, 30);
            return text.length < 30 ? text : text + '...';
        }
        return 'New Conversation';
    };

    const getSessionPreview = (messages: Message[]): string => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage) {
            return lastMessage.content.substring(0, 50) + '...';
        }
        return 'Empty conversation';
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentSession.messages]);

    const handleSendMessage = async (overrideInput?: string) => {
        const userMessage = overrideInput || input.trim();
        if (!userMessage || loading) return;

        setInput('');
        const userMessageObj: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
            status: 'sending'
        };

        const updatedMessages = [...currentSession.messages, userMessageObj];
        setCurrentSession(prev => ({
            ...prev,
            messages: updatedMessages,
            timestamp: new Date()
        }));
        
        setLoading(true);

        try {
            const response = await fetch(`${AI_URL}/agents/${agentId}/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
                body: JSON.stringify({
                    input: userMessage,
                    options: {
                        userId: userId,
                        conversationId: selectedSessionId,
                        uiMode: "chat",
                        stream: true,
                        context: {
                            sessionId: selectedSessionId,
                            previousMessages: currentSession.messages
                                .filter(m => m.role === 'user')
                                .map(m => m.content)
                                .slice(-5)
                        },
                        temperature: 0.7,
                        maxOutputTokens: 4000
                    }
                })
            });

            if (!response.body) throw new Error('No response body');
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';
            
            const assistantMessageId = (Date.now() + 1).toString();
            const assistantMessage: Message = {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date()
            };

            setCurrentSession(prev => ({
                ...prev,
                messages: [...updatedMessages, assistantMessage]
            }));

            setIsTyping(true);

            let fullStreamBuffer = '';
            let isCollectingJson = false;
            let currentLineBuffer = '';
            let hasOpenedThink = false;
            let currentToolName = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const events = parseSSEChunk(chunk) as any[];

                for (const event of events) {
                    // 1. Handle Tool Activites (Keeping existing functionality)
                    let metadataUpdate: any = {};
                    if (event.toolCall || event.type === 'toolCall') {
                        const toolCall = event.toolCall || event;
                        currentToolName = toolCall.toolName;
                        metadataUpdate = {
                            currentTool: currentToolName,
                            toolCalls: [toolCall]
                        };
                    } else if (event.toolResult || event.type === 'toolResult') {
                        const toolResult = event.toolResult || event;
                        currentToolName = '';
                        metadataUpdate = {
                            currentTool: '',
                            toolResults: [toolResult]
                        };
                    }

                    // 2. Handle Text & Reasoning Content
                    const delta = event.reasoning || 
                                 event.text || 
                                 event['text-delta'] || 
                                 event.content || 
                                 (event.delta && (event.delta.content || event.delta['text-delta'] || event.delta.reasoning));

                    if (delta && typeof delta === 'string') {
                        // If it's explicitly reasoning from the backend, we treat it as thoughts
                        const isExplicitReasoning = !!event.reasoning;
                        
                        fullStreamBuffer += delta;

                        if (!isCollectingJson) {
                            const jsonMarkerIndex = fullStreamBuffer.indexOf('```json');
                            if (jsonMarkerIndex !== -1) {
                                isCollectingJson = true;

                                // Finalize current line if any
                                if (currentLineBuffer.trim() || isExplicitReasoning) {
                                    if (!hasOpenedThink) {
                                        assistantContent += '<think>\n';
                                        hasOpenedThink = true;
                                    }
                                    assistantContent += `• ${currentLineBuffer.trim() || delta.trim()}\n`;
                                    currentLineBuffer = '';
                                }

                                if (hasOpenedThink) {
                                    assistantContent += '</think>\n';
                                    hasOpenedThink = false;
                                }

                                assistantContent += '• Constructing UI Component...\n';
                                assistantContent += fullStreamBuffer.substring(jsonMarkerIndex);
                            } else {
                                // Still in thought mode
                                if (delta.includes('\n') || isExplicitReasoning) {
                                    const parts = (currentLineBuffer + delta).split('\n');
                                    const completedLines = parts.slice(0, -1).filter(l => l.trim());
                                    currentLineBuffer = parts[parts.length - 1];

                                    if (completedLines.length > 0 || isExplicitReasoning) {
                                        if (!hasOpenedThink) {
                                            assistantContent += '<think>\n';
                                            hasOpenedThink = true;
                                        }
                                        completedLines.forEach(line => {
                                            assistantContent += `• ${line.trim()}\n`;
                                        });
                                        // If it's reasoning delta but no newline yet, we could still append it
                                        // But to keep bullets clean, we only append to currentLineBuffer if no newline
                                    }
                                } else {
                                    currentLineBuffer += delta;
                                }
                                
                                // Update processed index
                            }
                        } else {
                            // After JSON marker, we just append the delta
                            assistantContent += delta;
                        }
                    }

                    if (event.done) {
                        console.log('Stream finished with conversationId:', event.conversationId);
                    }

                    setCurrentSession(prev => ({
                        ...prev,
                        messages: prev.messages.map(msg =>
                            msg.id === assistantMessageId
                                ? {
                                    ...msg,
                                    content: assistantContent,
                                    status: currentToolName ? 'thinking' : msg.status,
                                    metadata: {
                                        ...msg.metadata,
                                        ...metadataUpdate
                                    }
                                  }
                                : msg
                        )
                    }));
                }
            }
            
            // Finalize remaining buffer as a last bullet if not JSON
            if (!isCollectingJson && currentLineBuffer.trim()) {
                if (!hasOpenedThink) {
                    assistantContent += '<think>\n';
                    hasOpenedThink = true;
                }
                assistantContent += `• ${currentLineBuffer.trim()}\n`;
                currentLineBuffer = '';
            }

            // Finalize thoughts if they were left open
            if (hasOpenedThink) {
                assistantContent += '</think>';
            }
            
            // Final full sync
            setCurrentSession(prev => ({
                ...prev,
                messages: prev.messages.map(msg => 
                    msg.id === assistantMessageId 
                        ? { ...msg, content: assistantContent }
                        : msg
                )
            }));

            setIsTyping(false);
            
            // Update user message status to 'sent'
            setCurrentSession(prev => ({
                ...prev,
                messages: prev.messages.map(msg => 
                    msg.id === userMessageObj.id 
                        ? { ...msg, status: 'sent' }
                        : msg
                )
            }));

        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: '❌ Failed to connect to assistant.',
                timestamp: new Date()
            };
            setCurrentSession(prev => ({
                ...prev,
                messages: [...prev.messages, errorMessage]
            }));
        } finally {
            setLoading(false);
            setIsTyping(false);
        }
    };

    const handleSaveCurrentSession = () => {
        if (currentSession.messages.length <= 1) return;
        
        const newSession: ChatSession = {
            id: `session_${Date.now()}`,
            title: generateSessionTitle(currentSession.messages),
            messages: currentSession.messages,
            timestamp: new Date(),
            preview: getSessionPreview(currentSession.messages),
            tags: ['saved']
        };
        
        setChatSessions(prev => [newSession, ...prev]);
        
        // Show notification
        console.log('Session saved!');
    };

    const handleLoadSession = async (sessionId: string) => {
        setShowHistorySlider(false);
        setSelectedSessionId(sessionId);

        if (sessionId === 'current') {
            setCurrentSession({
                id: 'current',
                title: 'New Conversation',
                messages: [],
                timestamp: new Date(),
                preview: 'Start a new conversation',
                tags: ['current']
            });
            return;
        }

        const session = chatSessions.find(s => s.id === sessionId);
        if (session) {
            // If session has no messages but is from server, fetch them
            if (session.messages.length === 0 || (session.messages.length === 1 && session.messages[0].id === 'welcome')) {
                setLoading(true);
                try {
                    const res = await fetch(`${AI_URL}/memory/conversation/${sessionId}?userId=${userId}`);
                    const data = await res.json();
                    if (data.messages) {
                        const messages = data.messages.map((m: any, idx: number) => ({
                            id: `msg_${idx}_${Date.now()}`,
                            role: m.role,
                            content: typeof m.parts === 'string' ? m.parts : (m.parts[0]?.text || ''),
                            timestamp: new Date(m.created_at)
                        }));
                        
                        const updatedSession = { ...session, messages };
                        setCurrentSession(updatedSession);
                        setChatSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));
                    }
                } catch (error) {
                    console.error('Failed to fetch session messages:', error);
                    setCurrentSession(session);
                } finally {
                    setLoading(false);
                }
            } else {
                setCurrentSession(session);
            }
        }
    };

    const handleDeleteSession = (sessionId: string) => {
        if (sessionId === selectedSessionId) {
            handleLoadSession('current');
        }
        setChatSessions(prev => prev.filter(session => session.id !== sessionId));
    };

    const handlePinSession = (sessionId: string) => {
        setChatSessions(prev => prev.map(session => 
            session.id === sessionId 
                ? { ...session, isPinned: !session.isPinned }
                : session
        ));
        
        if (sessionId === selectedSessionId) {
            setCurrentSession(prev => ({ ...prev, isPinned: !prev.isPinned }));
        }
    };

    const handleRenameSession = (sessionId: string, newTitle: string) => {
        setChatSessions(prev => prev.map(session => 
            session.id === sessionId 
                ? { ...session, title: newTitle }
                : session
        ));
        if (sessionId === selectedSessionId) {
            setCurrentSession(prev => ({ ...prev, title: newTitle }));
        }
    };

    const handleClearHistory = () => {
        if (window.confirm('Are you sure you want to clear all chat history?')) {
            setChatSessions([]);
            localStorage.removeItem(`chat_sessions_${userId}`);
            handleLoadSession('current');
        }
    };

    const handleExportSession = (sessionId: string) => {
        const session = sessionId === 'current' 
            ? currentSession 
            : chatSessions.find(s => s.id === sessionId);
        
        if (session) {
            const dataStr = JSON.stringify(session, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `chat_${session.title.replace(/\s+/g, '_')}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
        }
    };

    const suggestions = [
        { title: 'Workflow Analytics', badge: 'Automation', desc: 'List all automation flows and get status summaries.', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: '📊' },
        { title: 'Agent Configurator', badge: 'AI Agents', desc: 'Show and manage my configured AI assistants in real-time.', color: 'bg-primary/10 text-primary border-primary/20', icon: '🤖', popular: true },
        { title: 'Execution Logs', badge: 'Recent', desc: 'Review the latest flow executions and performance metrics.', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: '⏱️' },
        { title: 'User Roles', badge: 'Security', desc: 'Manage user permissions and access control for my workflows.', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: '👥' },
    ];

    return (
        <SidebarProvider open={showHistorySlider} onOpenChange={setShowHistorySlider} className="h-full min-h-0 relative">
            <HistorySlider 
                agentId={agentId}
                sessions={chatSessions}
                currentSession={currentSession}
                selectedSessionId={selectedSessionId}
                onSelectSession={handleLoadSession}
                onDeleteSession={handleDeleteSession}
                onPinSession={handlePinSession}
                onRenameSession={handleRenameSession}
                onClearHistory={handleClearHistory}
                onExportSession={handleExportSession}
                onCreateNew={() => handleLoadSession('chat_'+Date.now())}
            />

            <SidebarInset className="flex flex-col h-full max-w-[90%] mx-auto bg-[#f8f9fa] dark:bg-[#050505] text-foreground relative font-inter border-l border-border/50 dark:border-white/5">
                <SupportHeader 
                    messageCount={currentSession.messages.length}
                    isTyping={isTyping}
                    typingSpeed={typingSpeed}
                    onTypingSpeedChange={setTypingSpeed}
                    currentSessionTitle={currentSession.title}
                    onToggleHistory={() => setShowHistorySlider(!showHistorySlider)}
                    onSaveSession={handleSaveCurrentSession}
                />
                
                <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
                    <SupportBody 
                        messages={currentSession.messages}
                        userName={userName}
                        loading={loading}
                        isTyping={isTyping}
                        scrollAreaRef={scrollAreaRef}
                        messagesEndRef={messagesEndRef}
                    />
                </div>

                <SupportInput 
                    input={input}
                    setInput={setInput}
                    onSendMessage={() => handleSendMessage()}
                    loading={loading || isTyping}
                    suggestions={suggestions}
                />
            </SidebarInset>
        </SidebarProvider>
    );
}
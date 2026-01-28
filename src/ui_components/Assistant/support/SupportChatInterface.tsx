import { useState, useEffect, useRef } from 'react';
import { API_URL } from '@/ui_components/api/apiurl';
import { SupportHeader } from './components/SupportHeader';
import { SupportBody } from './components/SupportBody';
import { SupportInput } from './components/SupportInput';
import { HistorySlider } from './components/HistorySlider';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    id: string;
    status?: 'sending' | 'sent' | 'error';
    feedback?: 'helpful' | 'not-helpful';
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
    const [selectedSessionId, setSelectedSessionId] = useState<string>('current');
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
                const response = await fetch(`${API_URL}/memory/conversations?userId=${userId}`);
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
            const response = await fetch(`${API_URL}/api/v1/support/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userMessage,
                    userId: userId,
                    sessionId: selectedSessionId,
                    stream: true,
                    context: {
                        sessionId: selectedSessionId,
                        previousMessages: currentSession.messages
                            .filter(m => m.role === 'user')
                            .map(m => m.content)
                            .slice(-5)
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

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                assistantContent += chunk;

                setCurrentSession(prev => ({
                    ...prev,
                    messages: prev.messages.map(msg => 
                        msg.id === assistantMessageId 
                            ? { ...msg, content: assistantContent }
                            : msg
                    )
                }));
            }
            
            setIsTyping(false);
            
            // SECONDARY GUARD: If the response was a JSON wrapper, unwrap it for the UI
            let finalContent = assistantContent.trim();
            if (finalContent.startsWith('{') && finalContent.endsWith('}')) {
                try {
                    const parsed = JSON.parse(finalContent);
                    if (parsed && typeof parsed === 'object' && parsed.output) {
                        finalContent = parsed.output;
                    }
                } catch (e) {
                    // Not valid JSON or no output field, keep as is
                }
            }

            // Update with final unwrapped content
            setCurrentSession(prev => ({
                ...prev,
                messages: prev.messages.map(msg => 
                    msg.id === assistantMessageId 
                        ? { ...msg, content: finalContent }
                        : msg
                )
            }));
            
            // Update user message status
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
                    const res = await fetch(`${API_URL}/memory/conversation/${sessionId}?userId=${userId}`);
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
        { title: 'Workflow Analytics', badge: 'Automation', desc: 'List all active automation flows and get status summaries.', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: '�' },
        { title: 'Agent Configurator', badge: 'AI Agents', desc: 'Show and manage your configured AI assistants in real-time.', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: '🤖', popular: true },
        { title: 'Execution Logs', badge: 'Recent', desc: 'Review the latest flow executions and performance metrics.', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: '🕒' },
        { title: 'User Roles', badge: 'Access', desc: 'Manage user permissions and organizational access controls.', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: '👥' },
    ];

    return (
        <div className="flex h-full w-full bg-[#f8f9fa] dark:bg-[#050505] text-foreground relative font-inter overflow-hidden">
            <HistorySlider 
                sessions={chatSessions}
                selectedSessionId={selectedSessionId}
                onSelectSession={handleLoadSession}
                onDeleteSession={handleDeleteSession}
                onPinSession={handlePinSession}
                onRenameSession={handleRenameSession}
                onClearHistory={handleClearHistory}
                onExportSession={handleExportSession}
                onCreateNew={() => handleLoadSession('current')}
                isOpen={showHistorySlider}
            />

            <div className="flex-1 flex flex-col h-full min-w-0 relative">
                <SupportHeader 
                    messageCount={currentSession.messages.length}
                    isTyping={isTyping}
                    typingSpeed={typingSpeed}
                    onTypingSpeedChange={setTypingSpeed}
                    currentSessionTitle={currentSession.title}
                    onToggleHistory={() => setShowHistorySlider(!showHistorySlider)}
                    isHistoryOpen={showHistorySlider}
                    onSaveSession={handleSaveCurrentSession}
                />
                
                <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
                    <>
                            <SupportBody 
                                messages={currentSession.messages}
                                userName={userName}
                                loading={loading}
                                isTyping={isTyping}
                                onSendMessage={handleSendMessage}
                                scrollAreaRef={scrollAreaRef}
                                messagesEndRef={messagesEndRef}
                                sessionTitle={currentSession.title}
                                onRenameSession={(title) => handleRenameSession(selectedSessionId, title)}
                            />
                            <div className="shrink-0">
                                <SupportInput 
                                    input={input}
                                    setInput={setInput}
                                    onSendMessage={handleSendMessage}
                                    loading={loading || isTyping}
                                    suggestions={suggestions}
                                />
                            </div>
                        </>
                </div>
            </div>
        </div>
    );
}
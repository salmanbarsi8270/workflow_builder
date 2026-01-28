import { useState, useEffect, useRef } from 'react';
import { API_URL } from '@/ui_components/api/apiurl';
import aiClient from '@/ui_components/api/aiClient';
import { SupportHeader } from './components/SupportHeader';
import { SupportBody } from './components/SupportBody';
import { SupportInput } from './components/SupportInput';
import { HistorySlider } from '../shared/HistorySlider';
import { type Message, type ChatSession } from '../../types';
import { generateSessionTitle, getSessionPreview } from '../shared/utils';

interface SupportChatInterfaceProps {
    userId: string;
    userName: string;
    activeSessionId?: string | null;
    onSessionSelect?: (id: string | null) => void;
    history?: any;
}

export const SupportChatInterface: React.FC<SupportChatInterfaceProps> = ({ 
    userId, 
    userName,
    activeSessionId,
    onSessionSelect,
    history
}) => {
    const { 
        sessions: chatSessions, 
        setSessions: setChatSessions, 
        deleteSession: apiDeleteSession,
        renameSession: apiRenameSession
    } = history || { sessions: [], setSessions: () => {}, isLoading: false };

    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(20);
    const [showHistorySlider, setShowHistorySlider] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('current');
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial setup for "New Conversation" if no active session
    useEffect(() => {
        if (!currentSession && !activeSessionId) {
            const initialSession: ChatSession = {
                id: 'current',
                title: 'New Conversation',
                messages: [],
                timestamp: new Date(),
                preview: 'Start a new conversation',
                tags: ['current']
            };
            setCurrentSession(initialSession);
            setMessages([]);
            setSelectedSessionId('current');
        }
    }, []);

    // Load initial history if not provided by prop
    useEffect(() => {
        if (history) return; 
        
        const fetchHistory = async () => {
            let sessions: ChatSession[] = [];
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

            try {
                const response = await aiClient.get(`/api/v1/presentation/history?userId=${userId}`);
                const data = response.data;
                
                if (data.conversations) {
                    const backendSessions: ChatSession[] = data.conversations.map((c: any) => {
                        const local = sessions.find(s => s.id === c.id);
                        return {
                            id: c.id,
                            title: c.title || 'Conversation',
                            timestamp: new Date(c.date || Date.now()),
                            messages: local?.messages || [],
                            preview: local?.preview || 'Persisted on server',
                            isPinned: local?.isPinned,
                            tags: ['server']
                        };
                    });

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
    }, [userId, history]);

    // Save history to localStorage if local-only
    useEffect(() => {
        if (!history && chatSessions.length > 0) {
            localStorage.setItem(`chat_sessions_${userId}`, JSON.stringify(chatSessions));
        }
    }, [chatSessions, userId, history]);

    // Lifted session selection
    useEffect(() => {
        if (activeSessionId && activeSessionId !== selectedSessionId) {
            const session = chatSessions.find((s: ChatSession) => s.id === activeSessionId);
            if (session) {
                handleLoadSession(session);
            }
        }
    }, [activeSessionId, chatSessions]);

    // Auto-update session in history
    useEffect(() => {
        if (!currentSession || messages.length <= 1) return;

        const updateTimer = setTimeout(() => {
            if (currentSession.id === 'current') {
                const newId = `session_${Date.now()}`;
                const newSession: ChatSession = {
                    ...currentSession,
                    id: newId,
                    messages: messages,
                    title: generateSessionTitle(messages),
                    preview: getSessionPreview(messages),
                    tags: ['saved']
                };
                setSelectedSessionId(newId);
                onSessionSelect?.(newId);
                setCurrentSession(newSession);
                setChatSessions((prev: ChatSession[]) => [newSession, ...prev]);
            } else {
                setChatSessions((prev: ChatSession[]) => prev.map(s => 
                    s.id === currentSession.id 
                        ? { 
                            ...currentSession, 
                            messages: messages,
                            title: generateSessionTitle(messages),
                            preview: getSessionPreview(messages)
                          } 
                        : s
                ));
            }
        }, 1000);

        return () => clearTimeout(updateTimer);
    }, [messages, currentSession]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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

        const updatedMessages = [...messages, userMessageObj];
        setMessages(updatedMessages);
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/v1/support/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userMessage,
                    userId: userId,
                    sessionId: selectedSessionId === 'current' ? undefined : selectedSessionId,
                    stream: true
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

            setMessages(() => [...updatedMessages, assistantMessage]);
            setIsTyping(true);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                assistantContent += chunk;

                setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                        ? { ...msg, content: assistantContent }
                        : msg
                ));
            }
            
            setIsTyping(false);
            
            let finalContent = assistantContent.trim();
            if (finalContent.startsWith('{') && finalContent.endsWith('}')) {
                try {
                    const parsed = JSON.parse(finalContent);
                    if (parsed && typeof parsed === 'object' && parsed.output) {
                        finalContent = parsed.output;
                    }
                } catch (e) {}
            }

            setMessages(prev => prev.map(msg => 
                msg.id === assistantMessageId ? { ...msg, content: finalContent } : msg
            ));
            
            setMessages(prev => prev.map(msg => 
                msg.id === userMessageObj.id ? { ...msg, status: 'sent' } : msg
            ));

        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: '❌ Failed to connect to assistant.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
            setIsTyping(false);
        }
    };

    const handleLoadSession = async (session: ChatSession | string) => {
        setShowHistorySlider(false);
        
        let targetSession: ChatSession;

        if (typeof session === 'string') {
            if (session === 'current') {
                targetSession = {
                    id: 'current',
                    title: 'New Conversation',
                    messages: [],
                    timestamp: new Date(),
                    preview: 'Start a new conversation',
                    tags: ['current']
                };
            } else {
                const found = chatSessions.find((s: ChatSession) => s.id === session);
                if (found) {
                    targetSession = found;
                } else {
                    return;
                }
            }
        } else {
            targetSession = session;
        }

        setSelectedSessionId(targetSession.id);
        onSessionSelect?.(targetSession.id);
        setCurrentSession(targetSession);
        setMessages(targetSession.messages);

        if (targetSession.id !== 'current' && (targetSession.messages.length === 0 || (targetSession.messages.length === 1 && targetSession.messages[0].id === 'welcome'))) {
            setLoading(true);
            try {
                const response = await aiClient.get(`/api/v1/presentation/conversation/${targetSession.id}?userId=${userId}`);
                const data = response.data;
                if (data.messages) {
                    const fetchedMessages = data.messages.map((m: any, idx: number) => ({
                        id: m.id || `msg_${idx}_${Date.now()}`,
                        role: m.role,
                        content: typeof m.content === 'string' ? m.content : (m.parts?.[0]?.text || ''),
                        timestamp: new Date(m.created_at || m.timestamp || Date.now())
                    }));
                    setMessages(fetchedMessages);
                    const updatedSession = { ...targetSession, messages: fetchedMessages };
                    setCurrentSession(updatedSession);
                    setChatSessions((prev: ChatSession[]) => prev.map(s => s.id === targetSession.id ? updatedSession : s));
                }
            } catch (error) {
                console.error('Failed to fetch session messages:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDeleteSession = (sessionId: string) => {
        if (sessionId === selectedSessionId) {
            handleLoadSession('current');
        }
        if (apiDeleteSession) {
            apiDeleteSession(sessionId);
        } else {
            setChatSessions((prev: ChatSession[]) => prev.filter(session => session.id !== sessionId));
        }
    };

    const handlePinSession = (sessionId: string) => {
        setChatSessions((prev: ChatSession[]) => prev.map(session => 
            session.id === sessionId ? { ...session, isPinned: !session.isPinned } : session
        ));
    };

    const handleRenameSession = (sessionId: string, newTitle: string) => {
        if (apiRenameSession) {
            apiRenameSession(sessionId, newTitle);
        } else {
            setChatSessions((prev: ChatSession[]) => prev.map(session => 
                session.id === sessionId ? { ...session, title: newTitle } : session
            ));
        }
        
        if (selectedSessionId === sessionId && currentSession) {
            setCurrentSession({ ...currentSession, title: newTitle });
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
        const session = sessionId === 'current' ? currentSession : chatSessions.find((s: ChatSession) => s.id === sessionId);
        if (session) {
            const dataStr = JSON.stringify(session, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', `chat_${session.title.replace(/\s+/g, '_')}.json`);
            linkElement.click();
        }
    };

    const suggestions = [
        { title: 'Workflow Analytics', badge: 'Automation', desc: 'List all active automation flows.', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: '📊' },
        { title: 'Agent Configurator', badge: 'AI Agents', desc: 'Manage your AI assistants.', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: '🤖', popular: true },
        { title: 'Execution Logs', badge: 'Recent', desc: 'Review latest flow executions.', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: '🕒' },
        { title: 'User Roles', badge: 'Access', desc: 'Manage user permissions.', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: '👥' },
    ];

    if (!currentSession) return null;

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
                    messageCount={messages.length}
                    isTyping={isTyping}
                    typingSpeed={typingSpeed}
                    onTypingSpeedChange={setTypingSpeed}
                    currentSessionTitle={currentSession.title}
                    onToggleHistory={() => setShowHistorySlider(!showHistorySlider)}
                    isHistoryOpen={showHistorySlider}
                    onSaveSession={() => {}} 
                />
                
                <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
                    <SupportBody 
                        messages={messages}
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
                </div>
            </div>
        </div>
    );
};
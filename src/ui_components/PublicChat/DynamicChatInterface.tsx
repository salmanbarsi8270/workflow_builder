import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Paperclip, PanelLeft, Trash2, Search, SquarePen } from "lucide-react";
import { AI_URL } from '../../ui_components/api/apiurl';
import { API_URL } from '../../ui_components/api/apiurl';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface DynamicChatInterfaceProps {
    agent: any;
    userId: string;
}

export function DynamicChatInterface({ agent, userId }: DynamicChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(true);
    const [conversations, setConversations] = useState<any[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [switchingChat, setSwitchingChat] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Extract UI design from agent
    const themeColor = agent.theme_color || '#4dabf7';
    const historyColor = agent.component_styles?.history_panel_color || '#f8fafc';
    const title = agent.title || agent.name || 'Chat Assistant';
    const subtitle = agent.subtitle || 'We\'re here to help!';
    const welcomeMessage = agent.welcome_message || '👋 Hello! How can I help you today?';
    const inputPlaceholder = agent.input_placeholder || 'Type your message...';
    const fontFamily = agent.font_family || 'Inter, sans-serif';
    const showHeader = agent.show_header !== false;
    const showAgentAvatar = agent.show_agent_avatar !== false;
    const allowFileUploads = agent.allow_file_uploads === true;
    const showHistory = agent.show_history !== false;

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchConversations = async () => {
        try {
            const response = await fetch(`${AI_URL}/memory/conversations?conversationId=${conversationId || ''}&userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                const fetched = data.conversations || [];

                setConversations(prev => {
                    const existingTitles = new Map(prev.map(c => [c.conversation_id, c.runtime_title]));
                    return fetched.map((c: any) => ({
                        ...c,
                        // Priority: Session Memory > Backend Title (if not an ID/Date) > null
                        runtime_title: existingTitles.get(c.conversation_id) || (c.title?.length > 20 && !c.title.includes('-') ? c.title : null)
                    }));
                });
            }
        } catch (e) {
            console.warn("Failed to fetch history", e);
        }
    };

    // Fetch history on mount
    useEffect(() => {
        if (showHistory && userId) {
            fetchConversations();
        }
    }, [showHistory, userId]);

    // Background title scanner: Discover titles for history items automatically
    useEffect(() => {
        const discoverTitles = async () => {
            const untitled = conversations.filter(c => !c.runtime_title);
            if (untitled.length === 0) return;

            // Process one at a time to be gentle on the backend
            for (const conv of untitled) {
                try {
                    const res = await fetch(`${AI_URL}/memory/conversation/${conv.conversation_id}?userId=${userId}`);
                    if (res.ok) {
                        const data = await res.json();
                        const firstUserMsg = data.messages.find((m: any) => m.role === 'user');
                        if (firstUserMsg) {
                            const content = Array.isArray(firstUserMsg.parts)
                                ? firstUserMsg.parts.map((p: any) => p.text || '').join('')
                                : (firstUserMsg.content || '');

                            if (content) {
                                setConversations(prev => prev.map(c =>
                                    c.conversation_id === conv.conversation_id ? { ...c, runtime_title: content } : c
                                ));
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`Failed to discover title for ${conv.conversation_id}`, e);
                }
                // Small delay between fetches
                await new Promise(r => setTimeout(r, 500));
            }
        };

        if (conversations.length > 0) {
            discoverTitles();
        }
    }, [conversations.length > 0]); // Trigger once when list is first loaded

    const loadConversation = async (convId: string) => {
        if (conversationId === convId) return;
        setSwitchingChat(true);
        setLoading(true);
        try {
            const response = await fetch(`${AI_URL}/memory/conversation/${convId}?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                // Transform memory messages to UI messages
                const uiMessages = data.messages.map((m: any) => ({
                    role: m.role,
                    content: (Array.isArray(m.parts) ? m.parts.map((p: any) => p.text || '') : (m.content || '')) || ''
                }));

                // Learn title from first message if not already known
                if (uiMessages.length > 0) {
                    const firstMsg = uiMessages[0].content;
                    setConversations(prev => prev.map(c =>
                        c.conversation_id === convId ? { ...c, runtime_title: firstMsg } : c
                    ));
                }

                setMessages(uiMessages);
                setConversationId(convId);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setSwitchingChat(false);
        }
    };

    const deleteConversation = async (convId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this conversation?')) return;

        try {
            const response = await fetch(`${AI_URL}/memory/conversation/${convId}?userId=${userId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setConversations(prev => prev.filter(c => c.conversation_id !== convId));
                if (conversationId === convId) {
                    startNewChat();
                }
            }
        } catch (e) {
            console.error('Failed to delete conversation', e);
        }
    };

    const startNewChat = () => {
        setMessages(welcomeMessage ? [{ role: 'assistant', content: welcomeMessage }] : []);
        setConversationId(null);
    };

    useEffect(() => {
        if (!conversationId && welcomeMessage && messages.length === 0) {
            setMessages([{ role: 'assistant', content: welcomeMessage }]);
        }
    }, [welcomeMessage, conversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', userId);

            const response = await fetch(`${API_URL}/api/v1/agents/${agent.id}/public-upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `📎 File uploaded: **${file.name}**. I'll keep this in mind during our conversation.`
            }]);

        } catch (error: any) {
            console.error('Upload error:', error);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        setLoading(true);

        try {
            const response = await fetch(`${AI_URL}/api/v1/agents/${agent.id}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: userMessage,
                    userId: userId,
                    conversationId: conversationId,
                    stream: false
                })
            });

            const data = await response.json();

            // Update conversation ID if backend returns it (crucial for linking subsequent messages)
            if (data.conversationId && !conversationId) {
                setConversationId(data.conversationId);
                // Refresh list and then inject the first message as a title
                fetchConversations().then(() => {
                    setConversations(prev => prev.map(c =>
                        c.conversation_id === data.conversationId ? { ...c, runtime_title: userMessage } : c
                    ));
                });
            }

            if (data.error || data.details) {
                const errorMessage = data.details || data.error;
                setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${errorMessage}` }]);
                return;
            }

            const assistantMessage = data.output || 'Sorry, I couldn\'t process that request.';
            setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
        } catch (error: any) {
            if (error.name === 'AbortError') {
                setMessages(prev => [...prev, { role: 'assistant', content: '_Generation stopped._' }]);
            } else {
                console.error('Error sending message:', error);
            }
        } finally {
            setLoading(false);
        }
    };


    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="h-screen flex" style={{ fontFamily }}>
            {showHistory && historyOpen && (
                <div
                    className={`${isCollapsed ? 'w-[72px]' : 'w-80'} border-r border-slate-200 flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out`}
                    style={{ backgroundColor: historyColor }}
                >
                    <div className={`p-4 border-b border-slate-200/50 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
                        {!isCollapsed && <h2 className="font-semibold text-slate-800">History</h2>}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-slate-500 hover:bg-black/5"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            <PanelLeft className="h-5 w-5" />
                        </Button>
                    </div>

                    {!isCollapsed ? (
                        <div className="p-3">
                            <div className="relative">
                                <Search
                                    className="absolute left-1 top-1/2 -translate-y-1/2 h-5 w-5 z-10 pointer-events-none"
                                    style={{ color: "rgb(15, 23, 42)" }}
                                />
                                <Input
                                    placeholder="Search chats"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 h-10 border-none bg-transparent placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-800 text-base"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center p-3 border-b border-slate-200/30">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsCollapsed(false)}
                                className="h-10 w-10 text-slate-500 rounded-lg"
                            >
                                <Search className="h-5 w-5" />
                            </Button>
                        </div>
                    )}

                    <div className="p-1">
                        <Button
                            variant="ghost"
                            className={`w-full ${isCollapsed ? 'px-0 h-10' : 'justify-start pl-3'} gap-3 text-slate-800 hover:bg-black/5 transition-all text-base font-normal`}
                            onClick={startNewChat}
                        >
                            <SquarePen className="h-5 w-5 shrink-0" />
                            {!isCollapsed && <span>New chat</span>}
                        </Button>
                    </div>

                    {!isCollapsed && (
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {conversations
                                .filter(conv => !searchQuery || conv.runtime_title?.toLowerCase().includes(searchQuery.toLowerCase()))
                                .map((conv: any) => (
                                    <div
                                        key={conv.conversation_id}
                                        className={`group w-full text-left p-3 rounded-lg text-sm transition-all flex items-start justify-between gap-2 cursor-pointer ${conversationId === conv.conversation_id
                                            ? 'border'
                                            : 'hover:bg-black/5 text-slate-600 border border-transparent'
                                            }`}
                                        style={conversationId === conv.conversation_id ? {
                                            backgroundColor: `${themeColor}15`,
                                            color: themeColor,
                                            borderColor: `${themeColor}40`
                                        } : {}}
                                        onClick={() => loadConversation(conv.conversation_id)}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium truncate">
                                                {conv.runtime_title || 'Loading...'}
                                            </div>
                                            <div className="text-xs opacity-70 truncate">
                                                {new Date(conv.last_message_at || conv.updated_at || Date.now()).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => deleteConversation(conv.conversation_id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            {conversations.length === 0 && (
                                <div className="p-4 text-center text-slate-400 text-sm">
                                    No history yet.
                                </div>
                            )}
                        </div>
                    )}
                    {conversations.length === 0 && (
                        <div className="p-4 text-center text-slate-400 text-sm">
                            {!isCollapsed && "No history yet."}
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 flex flex-col h-full relative">
                {showHeader && (
                    <div
                        className="p-6 text-white shadow-lg shrink-0"
                        style={{
                            background: `linear-gradient(135deg, ${themeColor} 0%, ${adjustColor(themeColor, -20)} 100%)`
                        }}
                    >
                        <div className="flex items-center gap-4">
                            {showHistory && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-white hover:bg-white/20"
                                    onClick={() => {
                                        if (!historyOpen) setHistoryOpen(true);
                                        else setHistoryOpen(false);
                                    }}
                                >
                                    <PanelLeft className="h-5 w-5" />
                                </Button>
                            )}
                            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                <Bot className="h-8 w-8" />
                            </div>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold">{title}</h1>
                                <p className="text-white/90 text-sm">{subtitle}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4 relative">
                    {switchingChat ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 z-10">
                            <div className="flex flex-col items-center gap-3">
                                <div
                                    className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
                                    style={{ borderColor: `${themeColor}40`, borderTopColor: themeColor }}
                                />
                                <p className="text-sm font-medium text-slate-500">Loading conversation...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {message.role === 'assistant' && showAgentAvatar && (
                                        <div
                                            className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white"
                                            style={{ backgroundColor: themeColor }}
                                        >
                                            <Bot className="h-5 w-5" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm ${message.role === 'user'
                                            ? 'text-white'
                                            : 'bg-white text-slate-800'
                                            }`}
                                        style={message.role === 'user' ? { backgroundColor: themeColor } : {}}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                    {message.role === 'user' && (
                                        <div
                                            className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white"
                                            style={{ backgroundColor: themeColor }}
                                        >
                                            <User className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {loading && !switchingChat && (
                                <div className="flex gap-3 justify-start">
                                    {showAgentAvatar && (
                                        <div
                                            className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white"
                                            style={{ backgroundColor: themeColor }}
                                        >
                                            <Bot className="h-5 w-5" />
                                        </div>
                                    )}
                                    <div className="bg-white px-4 py-3 rounded-2xl shadow-sm">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>


                <div className="p-4 bg-white border-t border-slate-200 shadow-lg shrink-0">
                    <div className="flex gap-2 max-w-4xl mx-auto items-center">
                        {allowFileUploads && (
                            <>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                <Button variant="ghost" size="icon" onClick={handleFileClick} className="text-slate-400">
                                    <Paperclip className="h-5 w-5" />
                                </Button>
                            </>
                        )}
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={inputPlaceholder}
                            className="flex-1 bg-white text-slate-900 border-slate-200"
                            disabled={loading}
                        />
                        <Button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            style={{ backgroundColor: themeColor }}
                            className="text-white hover:opacity-90 shrink-0"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div >
    );
}

function adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

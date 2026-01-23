import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Paperclip, PanelLeft, Trash2, Search, SquarePen, History, Clock, Loader2, MoreHorizontal, Pencil, Moon, Sun, Info } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from '@/components/theme-provider';
import { AI_URL, API_URL } from '../../ui_components/api/apiurl';
import { cn } from "@/lib/utils";

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
}

interface DynamicChatInterfaceProps {
    agent: any;
    userId: string;
}

export function DynamicChatInterface({ agent, userId }: DynamicChatInterfaceProps) {
    const { theme, setTheme } = useTheme()
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [switchingChat, setSwitchingChat] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [typingText, setTypingText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Extract UI design from agent
    const uiConfig = agent.ui_config || {};
    const componentStyles = uiConfig.component_styles || agent.component_styles || {};
    
    // Basic config
    const title = uiConfig.title || agent.title || agent.name || 'Chat Assistant';
    const subtitle = uiConfig.subtitle || agent.subtitle || 'We\'re here to help!';
    const welcomeMessage = uiConfig.welcome_message || agent.welcome_message || '👋 Hello! How can I help you today?';
    const inputPlaceholder = uiConfig.input_placeholder || agent.input_placeholder || 'Type your message...';
    const fontFamily = uiConfig.font_family || agent.font_family || 'Inter, sans-serif';
    const agentDescription = uiConfig.description || agent.description || '';
    
    // Boolean flags
    const showHeader = (uiConfig.show_header !== undefined ? uiConfig.show_header : agent.show_header) !== false;
    const showAgentAvatar = (uiConfig.show_agent_avatar !== undefined ? uiConfig.show_agent_avatar : agent.show_agent_avatar) !== false;
    const allowFileUploads = (uiConfig.allow_file_uploads === true) || (agent.allow_file_uploads === true);
    const showHistory = (uiConfig.show_history !== undefined ? uiConfig.show_history : agent.show_history) !== false;
    
    // Theme Colors
    const themeColor = uiConfig.theme_color || agent.theme_color || '#2563EB';
    const secondaryColor = uiConfig.secondary_color || agent.secondary_color || '#7950f2';
    const backgroundColor = uiConfig.background_color || agent.background_color || 'hsl(var(--background))';
    const textColor = uiConfig.text_color || agent.text_color || 'hsl(var(--foreground))';
    const historyColor = componentStyles.history_panel_color;
    const headerGradient = uiConfig.header_gradient || agent.header_gradient;
    
    // Typography
    const fontSize = componentStyles.font_size || '14px';
    const lineHeight = componentStyles.line_height || '1.6';
    const fontWeight = componentStyles.font_weight || '400';
    
    // Animation & Effects
    const enableParallax = componentStyles.enable_parallax || false;
    const backgroundImage = componentStyles.background_image;
    const backgroundBlur = componentStyles.background_blur || '0px';
    
    // Layout
    const messageGap = componentStyles.message_gap || '24px';
    const maxWidth = componentStyles.max_width || '75%';
    const messagePadding = componentStyles.message_padding || '16px';
    const borderRadius = componentStyles.border_radius || '16px';
    
    // Shadows
    const shadowLevel = componentStyles.shadow_level || 'md';
    const shadowColor = componentStyles.shadow_color || 'rgba(0,0,0,0.1)';
    
    // Component Style Mappings
    const bubbleStyle = componentStyles.bubble_style || 'rounded';
    const avatarStyle = componentStyles.avatar_style || 'rounded';
    const inputStyle = componentStyles.input_style || 'glass';
    const headerStyle = componentStyles.header_style || 'gradient';

    const getBubbleClass = (style: string, isUser: boolean) => {
        switch (style) {
            case 'square': return isUser ? 'rounded-none rounded-tl-none' : 'rounded-none rounded-tr-none';
            case 'leaf': return isUser ? 'rounded-[20px] rounded-br-[4px]' : 'rounded-[20px] rounded-bl-[4px]';
            case 'rounded': default: return isUser ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm';
            case 'modern': return isUser ? 'rounded-3xl rounded-br-none' : 'rounded-3xl rounded-bl-none';
            case 'soft': return isUser ? 'rounded-[28px]' : 'rounded-[28px]';
        }
    };

    const getAvatarClass = (style: string) => {
        switch (style) {
            case 'square': return 'rounded-md';
            case 'rounded': return 'rounded-xl';
            case 'hexagon': return 'clip-hexagon';
            case 'circle': default: return 'rounded-full';
        }
    };

    const getInputClass = (style: string) => {
        switch (style) {
            case 'line': return 'rounded-none border-b border-t-0 border-x-0 bg-transparent px-0';
            case 'pill': return 'rounded-full px-6';
            case 'glass': return 'rounded-[24px] px-4 bg-white/20 backdrop-blur-sm border-white/30';
            case 'rounded': default: return 'rounded-[24px] px-4';
        }
    };

    const getShadowClass = (level: string) => {
        switch (level) {
            case 'none': return 'shadow-none';
            case 'sm': return 'shadow-sm';
            case 'md': return 'shadow-md';
            case 'lg': return 'shadow-lg';
            case 'xl': return 'shadow-xl';
            case '2xl': return 'shadow-2xl';
            default: return 'shadow-md';
        }
    };

    const getHeaderStyle = () => {
        switch (headerStyle) {
            case 'gradient':
                return headerGradient 
                    ? { background: headerGradient }
                    : themeColor 
                    ? { background: `linear-gradient(135deg, ${themeColor} 0%, ${adjustColor(themeColor, -20)} 100%)` }
                    : { background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)' };
            case 'solid':
                return themeColor 
                    ? { backgroundColor: themeColor }
                    : { backgroundColor: 'hsl(var(--primary))' };
            case 'glass':
                return themeColor 
                    ? { backgroundColor: `${themeColor}40`, backdropFilter: 'blur(20px)' }
                    : { backgroundColor: 'hsl(var(--primary)/0.4)', backdropFilter: 'blur(20px)' };
            default:
                return themeColor 
                    ? { background: `linear-gradient(135deg, ${themeColor} 0%, ${adjustColor(themeColor, -20)} 100%)` }
                    : {};
        }
    };

    const themeHsl = themeColor ? hexToHsl(themeColor) : null;
    const contrastHsl = themeColor ? getContrastColor(themeColor) : null;

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize typing effect for welcome message
    useEffect(() => {
        if (welcomeMessage && messages.length === 0 && !conversationId) {
            setTypingText('');
            let i = 0;
            typingIntervalRef.current = setInterval(() => {
                if (i < welcomeMessage.length) {
                    setTypingText(welcomeMessage.substring(0, i + 1));
                    i++;
                } else {
                    if (typingIntervalRef.current) {
                        clearInterval(typingIntervalRef.current);
                    }
                    setTimeout(() => {
                        setMessages([{ role: 'assistant', content: welcomeMessage }]);
                        setTypingText('');
                    }, 500);
                }
            }, 30);
        }
        return () => {
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
        };
    }, [welcomeMessage, conversationId]);

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
                        runtime_title: existingTitles.get(c.conversation_id) || 
                                     (c.title?.length > 20 && !c.title.includes('-') ? c.title : null)
                    }));
                });
            }
        } catch (e) {
            console.warn("Failed to fetch history", e);
        }
    };

    useEffect(() => {
        if (showHistory && userId) {
            fetchConversations();
        }
    }, [showHistory, userId]);

    useEffect(() => {
        const discoverTitles = async () => {
            const untitled = conversations.filter(c => !c.runtime_title);
            if (untitled.length === 0) return;

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
                await new Promise(r => setTimeout(r, 500));
            }
        };

        if (conversations.length > 0) {
            discoverTitles();
        }
    }, [conversations.length > 0]);

    const loadConversation = async (convId: string) => {
        if (conversationId === convId) return;
        setSwitchingChat(true);
        setLoading(true);
        try {
            const response = await fetch(`${AI_URL}/memory/conversation/${convId}?userId=${userId}`);
            if (response.ok) {
                const data = await response.json();
                const uiMessages = data.messages.map((m: any) => ({
                    role: m.role,
                    content: (Array.isArray(m.parts) ? m.parts.map((p: any) => p.text || '') : (m.content || '')) || '',
                    timestamp: new Date(m.timestamp || Date.now())
                }));

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

    const startRename = (conv: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingConversationId(conv.conversation_id);
        setEditTitle(conv.runtime_title || 'New Chat');
    };

    const saveRename = async (convId: string) => {
        if (!editTitle.trim()) {
            setEditingConversationId(null);
            return;
        }

        setConversations(prev => prev.map(c => 
            c.conversation_id === convId ? { ...c, runtime_title: editTitle } : c
        ));
        setEditingConversationId(null);

        try {
            await fetch(`${AI_URL}/memory/conversation/${convId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editTitle, userId })
            });
        } catch (e) {
            console.error('Failed to update title', e);
        }
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent, convId: string) => {
        if (e.key === 'Enter') {
            e.stopPropagation();
            saveRename(convId);
        } else if (e.key === 'Escape') {
            e.stopPropagation();
            setEditingConversationId(null);
        }
    };

    const deleteConversation = async (convId: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
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
        setMessages([]);
        setConversationId(null);
        setTypingText('');
        
        // Type out welcome message
        if (welcomeMessage) {
            let i = 0;
            typingIntervalRef.current = setInterval(() => {
                if (i < welcomeMessage.length) {
                    setTypingText(welcomeMessage.substring(0, i + 1));
                    i++;
                } else {
                    if (typingIntervalRef.current) {
                        clearInterval(typingIntervalRef.current);
                    }
                    setTimeout(() => {
                        setMessages([{ role: 'assistant', content: welcomeMessage }]);
                        setTypingText('');
                    }, 500);
                }
            }, 30);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingText]);

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
        setMessages(prev => [...prev, { 
            role: 'user', 
            content: userMessage,
            timestamp: new Date()
        }]);

        setLoading(true);

        // Simulate typing effect
        setTypingText('');
        const typingSim = setInterval(() => {
            const responses = [
                "Thinking..."
            ];
            setTypingText(responses[Math.floor(Math.random() * responses.length)]);
        }, 1000);

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

            clearInterval(typingSim);

            const data = await response.json();

            if (data.conversationId && !conversationId) {
                setConversationId(data.conversationId);
                fetchConversations().then(() => {
                    setConversations(prev => prev.map(c =>
                        c.conversation_id === data.conversationId ? { ...c, runtime_title: userMessage } : c
                    ));
                });
            }

            if (data.error || data.details) {
                const errorMessage = data.details || data.error;
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: `❌ Error: ${errorMessage}`,
                    timestamp: new Date()
                }]);
                setTypingText('');
                return;
            }

            const assistantMessage = data.output || 'Sorry, I couldn\'t process that request.';
            
            // Type out response
            setTypingText('');
            let i = 0;
            typingIntervalRef.current = setInterval(() => {
                if (i < assistantMessage.length) {
                    setTypingText(assistantMessage.substring(0, i + 1));
                    i++;
                } else {
                    if (typingIntervalRef.current) {
                        clearInterval(typingIntervalRef.current);
                    }
                    setTimeout(() => {
                        setMessages(prev => [...prev, { 
                            role: 'assistant', 
                            content: assistantMessage,
                            timestamp: new Date()
                        }]);
                        setTypingText('');
                    }, 500);
                }
            }, 20);

        } catch (error: any) {
            clearInterval(typingSim);
            if (error.name === 'AbortError') {
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: '_Generation stopped._',
                    timestamp: new Date()
                }]);
            } else {
                console.error('Error sending message:', error);
                setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: '❌ Sorry, there was an error processing your request.',
                    timestamp: new Date()
                }]);
            }
            setTypingText('');
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
        <div 
            className={cn(
                "flex overflow-hidden bg-background relative transition-all duration-300 h-screen"
            )}
            style={{ 
                fontFamily,
                fontSize,
                lineHeight,
                fontWeight,
                backgroundColor: backgroundColor,
                color: textColor,
                ...(themeHsl ? { 
                    '--primary': themeHsl,
                    '--primary-foreground': contrastHsl,
                    '--ring': themeHsl,
                    '--secondary': secondaryColor ? hexToHsl(secondaryColor) : themeHsl
                } as React.CSSProperties : {}),
                ...(backgroundImage ? {
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: enableParallax ? 'fixed' : 'scroll'
                } : {}),
                backdropFilter: backgroundBlur !== '0px' ? `blur(${backgroundBlur})` : undefined
            }}
        >
            {/* Background Overlay */}
            {backgroundImage && (
                <div 
                    className="absolute inset-0 bg-background/80 dark:bg-background/90"
                    style={{ backdropFilter: backgroundBlur }}
                />
            )}

            {showHistory && (
                <>
                    {/* Backdrop */}
                    <div className={cn(
                            "absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-30 transition-opacity duration-300",
                            historyOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                        )}
                        onClick={() => setHistoryOpen(false)}
                    />
                    
                    {/* Drawer Sidebar */}
                    <div
                        className={cn(
                            "absolute left-0 top-0 h-full z-40 transition-[width] duration-300 ease-in-out backdrop-blur-xl overflow-hidden shadow-2xl border-r border-border",
                            historyOpen ? 'w-80' : 'w-0 border-none',
                            !historyColor && "bg-background/95 dark:bg-background/90"
                        )}
                        style={historyColor ? { backgroundColor: historyColor } : {}}
                    >
                        <div className="w-80 flex flex-col h-full">
                            <div className="p-4 pb-2 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2" style={themeColor ? { color: themeColor } : { color: 'hsl(var(--primary))' }}>
                                        <div className={cn(
                                            "p-1.5 rounded-lg",
                                            themeColor ? "text-white" : "bg-primary text-primary-foreground"
                                        )} style={themeColor ? { backgroundColor: themeColor } : {}}>
                                            <History className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-extrabold text-xs tracking-widest text-foreground">HISTORY</span>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Your Private Chats</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted ml-auto"
                                        onClick={() => setHistoryOpen(false)}
                                    >
                                        <PanelLeft className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div 
                                    className="relative group focus-within:ring-1 rounded-xl transition-all duration-200"
                                    style={themeColor ? { 
                                        '--ring': themeColor 
                                    } as React.CSSProperties : {}}
                                >
                                    <Search 
                                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" 
                                        style={themeColor ? { color: 'var(--ring)' } : {}}
                                    />
                                    <Input
                                        placeholder="Search chats..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 h-10 bg-background/50 dark:bg-background/30 border-input shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-[var(--ring)] focus-visible:border-[var(--ring)]"
                                        style={themeColor ? { borderColor: `${themeColor}40` } : {}}
                                    />
                                </div>
                                <Button
                                    onClick={startNewChat}
                                    className="w-full bg-background dark:bg-background/50 hover:bg-muted/50 dark:hover:bg-muted/30 text-foreground border border-border shadow-sm h-10 rounded-xl justify-start px-3 gap-2 group transition-all"
                                    style={themeColor ? { 
                                        backgroundColor: `${themeColor}10`,
                                        borderColor: `${themeColor}20`,
                                        color: themeColor
                                    } : {}}
                                >
                                    <SquarePen className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="font-semibold text-sm">New Conversation</span>
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 custom-scrollbar">
                                {conversations
                                    .filter(conv => !searchQuery || conv.runtime_title?.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((conv: any) => (
                                        <div
                                            key={conv.conversation_id}
                                            className={cn(
                                                "group w-full text-left p-3 rounded-xl text-sm transition-all flex items-start justify-between gap-2 cursor-pointer border",
                                                conversationId === conv.conversation_id
                                                    ? "bg-background dark:bg-background/80 border-border shadow-sm text-foreground"
                                                    : "border-transparent hover:bg-muted/30 dark:hover:bg-muted/20 text-muted-foreground hover:text-foreground"
                                            )}
                                            style={conversationId === conv.conversation_id && themeColor ? {
                                                backgroundColor: `${themeColor}15`,
                                                color: themeColor,
                                                borderColor: `${themeColor}40`
                                            } : {}}
                                            onClick={() => {
                                                if (editingConversationId !== conv.conversation_id) {
                                                    loadConversation(conv.conversation_id);
                                                }
                                            }}
                                        >
                                            <div className="min-w-0 flex-1">
                                                {editingConversationId === conv.conversation_id ? (
                                                    <Input
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        onKeyDown={(e) => handleRenameKeyDown(e, conv.conversation_id)}
                                                        onBlur={() => saveRename(conv.conversation_id)}
                                                        autoFocus
                                                        className="h-6 py-0 px-1 text-sm bg-background/80 dark:bg-background/60 border-border"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <>
                                                        <div className={cn(
                                                            "font-semibold truncate mb-0.5",
                                                            conversationId === conv.conversation_id ? "text-foreground" : "text-muted-foreground"
                                                        )} style={conversationId === conv.conversation_id && themeColor ? { color: themeColor } : {}}>
                                                            {conv.runtime_title || 'Loading...'}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium" style={conversationId === conv.conversation_id && themeColor ? { color: `${themeColor}90` } : {}}>
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(conv.last_message_at || conv.updated_at || Date.now()).toLocaleDateString()}
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Action Menu */}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-6 w-6 -mr-1 hover:bg-background/50 dark:hover:bg-background/30"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[160px]">
                                                        <DropdownMenuItem onClick={(e) => startRename(conv, e)}>
                                                            <Pencil className="mr-2 h-3.5 w-3.5" />
                                                            <span>Rename</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={(e) => deleteConversation(conv.conversation_id, e)}
                                                            className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                                                        >
                                                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                                                            <span>Delete</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>

                            <div className="p-4 border-t border-border bg-background/50 dark:bg-background/30 backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 bg-muted dark:bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground border border-border">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-foreground">Active Session</span>
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Connected
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="flex-1 flex flex-col h-full relative">
                {showHeader && (
                    <div
                        className="px-6 py-4 shadow-lg shrink-0 z-10 flex items-center justify-between transition-all duration-300"
                        style={getHeaderStyle()}
                    >
                        <div className="flex items-center gap-4">
                            {showHistory && !historyOpen && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-9 w-9 -ml-2 rounded-xl transition-all",
                                        themeColor ? "text-white hover:bg-white/20" : "text-muted-foreground hover:bg-muted"
                                    )}
                                    onClick={() => setHistoryOpen(true)}
                                >
                                    <History className="h-5 w-5" />
                                </Button>
                            )}
                            
                            <div className={cn(
                                "p-2 rounded-xl shadow-lg backdrop-blur-sm transition-all",
                                themeColor ? "bg-white/20 text-white" : "bg-primary text-primary-foreground"
                            )}>
                                <Bot className="h-5 w-5" />
                            </div>
                            
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <h1 className={cn(
                                        "text-sm font-black uppercase tracking-wider transition-colors",
                                        themeColor ? "text-white" : "text-foreground"
                                    )}>{title}</h1>
                                    {agentDescription && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="h-3 w-3 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="text-xs max-w-xs">{agentDescription}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold uppercase tracking-widest transition-colors",
                                    themeColor ? "text-white/80" : "text-muted-foreground"
                                )}>{subtitle}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={cn(
                                "gap-1.5 px-2.5 py-1 backdrop-blur-md transition-all",
                                themeColor 
                                    ? "bg-white/20 text-white hover:bg-white/30 border-white/20" 
                                    : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
                            )}>
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full animate-pulse",
                                    themeColor ? "bg-white" : "bg-emerald-500"
                                )} />
                                LIVE
                            </Badge>

                            <Button variant="ghost" size="icon"
                                className={cn(
                                    "h-9 w-9 rounded-xl transition-all",
                                    themeColor ? "text-white hover:bg-white/20" : "text-muted-foreground hover:bg-muted"
                                )}
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            >
                                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Messages Area */}
                <div 
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 relative custom-scrollbar transition-all duration-300"
                    style={{ 
                        gap: messageGap,
                        background: backgroundImage ? 'transparent' : undefined
                    }}
                >
                    {switchingChat ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 dark:bg-background/70 backdrop-blur-sm z-10">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                <span className="text-sm text-muted-foreground">Loading conversation...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {message.role === 'assistant' && showAgentAvatar && (
                                        <div 
                                            className={cn(
                                                "flex-shrink-0 h-8 w-8 bg-foreground text-background flex items-center justify-center shadow-sm mt-1",
                                                getAvatarClass(avatarStyle)
                                            )}
                                            style={themeColor ? { backgroundColor: themeColor, color: '#ffffff' } : {}}
                                        >
                                            <Bot className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div
                                        className={cn(
                                            "max-w-[75%] px-5 py-3.5 text-sm leading-relaxed shadow-sm",
                                            getBubbleClass(bubbleStyle, message.role === 'user'),
                                            message.role === 'user'
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-background border border-border text-foreground"
                                        )}
                                        style={message.role === 'user' && themeColor ? { backgroundColor: themeColor, color: '#ffffff', borderColor: themeColor } : {}}
                                    >
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                    {message.role === 'user' && (
                                        <div 
                                            className={cn(
                                                "flex-shrink-0 h-8 w-8 bg-muted text-muted-foreground flex items-center justify-center border border-border mt-1",
                                                getAvatarClass(avatarStyle)
                                            )}
                                            style={themeColor ? { backgroundColor: themeColor, color: '#ffffff', borderColor: themeColor } : {}}
                                        >
                                            <User className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {typingText && (
                                <div className="flex gap-4 justify-start animate-in fade-in duration-300">
                                    {showAgentAvatar && (
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center shadow-sm">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div 
                                        className={cn(
                                            "bg-background dark:bg-background/80 px-4 py-3 border border-border transition-all",
                                            getBubbleClass(bubbleStyle, false)
                                        )}
                                        style={{
                                            maxWidth: maxWidth,
                                            padding: messagePadding,
                                            borderRadius: borderRadius,
                                            boxShadow: `0 4px 12px ${shadowColor}`
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                                            </div>
                                            <span className="text-sm text-muted-foreground">{typingText}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Loading indicator */}
                            {loading && !typingText && !switchingChat && (
                                <div className="flex gap-4 justify-start">
                                    {showAgentAvatar && (
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center shadow-sm">
                                            <Bot className="h-4 w-4" />
                                        </div>
                                    )}
                                    <div 
                                        className={cn(
                                            "bg-background dark:bg-background/80 px-4 py-3 border border-border",
                                            getBubbleClass(bubbleStyle, false)
                                        )}
                                        style={{
                                            maxWidth: maxWidth,
                                            padding: messagePadding,
                                            borderRadius: borderRadius,
                                            boxShadow: `0 4px 12px ${shadowColor}`
                                        }}
                                    >
                                        <div className="flex gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-6 pt-2 bg-linear-to-t from-background via-background to-transparent shrink-0">
                    <div className="relative group max-w-4xl mx-auto">
                        <div className="absolute inset-0 bg-muted/50 dark:bg-muted/20 rounded-[20px] -rotate-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className={cn(
                            "relative flex gap-2 items-end bg-background/50 dark:bg-background/30 backdrop-blur-sm p-2 pl-4 border border-border/60 shadow-xs focus-within:shadow-md focus-within:border-border transition-all",
                            inputStyle === 'line' ? 'rounded-none' : 'rounded-[24px]',
                            getShadowClass(shadowLevel)
                        )} style={{ boxShadow: `0 4px 12px ${shadowColor}` }}>
                            {allowFileUploads && (
                                <>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={handleFileClick} 
                                                    className="text-muted-foreground hover:text-foreground h-9 w-9 rounded-full hover:bg-muted dark:hover:bg-muted/50 mb-0.5 transition-all"
                                                >
                                                    <Paperclip className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">Attach file</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </>
                            )}
                            
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={inputPlaceholder}
                                className={cn(
                                    "flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-3 h-auto min-h-[44px] max-h-[120px] resize-none text-foreground placeholder:text-muted-foreground font-medium transition-all",
                                    getInputClass(inputStyle)
                                )}
                                style={{ fontFamily }}
                                disabled={loading}
                                rows={1}
                            />
                            
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={sendMessage}
                                            disabled={loading || !input.trim()}
                                            className="h-9 w-9 rounded-xl mb-0.5 shadow-lg shadow-black/5 transition-all active:scale-95 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                            size="icon"
                                            style={themeColor ? { 
                                                backgroundColor: themeColor, 
                                                color: '#ffffff',
                                                boxShadow: `0 4px 12px ${shadowColor}`
                                            } : {}}
                                        >
                                            {loading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs">Send message</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                    Powered by {agent.name || 'Agent'}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">
                                    {messages.filter(m => m.role === 'user').length} messages
                                </span>
                                <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">
                                    {conversationId ? 'Saved' : 'New chat'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper functions
function hexToHsl(hex: string): string | null {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return null;
    
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        if (h) h /= 6;
    }

    if (h === undefined) h = 0;
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function getContrastColor(hex: string): string {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    return (yiq >= 128) ? '0 0% 0%' : '0 0% 100%';
}

function adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

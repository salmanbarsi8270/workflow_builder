import { useRef, useState, useEffect } from "react";
import {
    Bot, Trash2, ChevronRight, Plus, History,
    MessageSquare, PanelLeftClose, PanelLeftOpen,
    PanelRightClose, PanelRightOpen, Sparkles, Send,
    Mic, Moon, Sun, Palette
} from "lucide-react";
import { Canvas } from "../generative_ui/Canvas";
import type { UIComponent } from "../generative_ui/types";
import { parseSSEChunk } from "@/lib/sse-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../components/theme-provider";
import { AI_URL } from "../api/apiurl";
import { cn } from "@/lib/utils";

interface Message {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    componentJson?: string;
}

const initialSchema: UIComponent = {
    type: 'container',
    props: {
        className: 'p-8 h-full overflow-y-auto pb-48',
        layout: 'grid',
        gap: 6
    },
    children: []
};

const cloneDeep = (obj: any) => JSON.parse(JSON.stringify(obj));

const transformComponentData = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map(transformComponentData);
    let transformed: any = { props: {} };
    let sourceData = data;
    const componentTypes = [
        'container', 'text', 'button', 'card', 'card-header', 'card-content',
        'card-footer', 'input', 'icon', 'grid', 'stack', 'metric', 'avatar',
        'badge', 'table', 'table-header', 'table-row', 'table-head', 'table-body',
        'table-cell', 'chart', 'chart-placeholder', 'streaming-text', 'error-state',
        'section', 'status-badge'
    ];
    const keys = Object.keys(data);
    const explicitType = data.type || data.component;
    if (explicitType && typeof explicitType === 'string' && componentTypes.includes(explicitType)) {
        transformed.type = explicitType;
        sourceData = data;
    } else if (keys.length === 1 && componentTypes.includes(keys[0])) {
        transformed.type = keys[0];
        sourceData = data[keys[0]];
    } else if (keys.length === 1 && typeof data[keys[0]] === 'object' && (data[keys[0]].type || data[keys[0]].component)) {
        return transformComponentData(data[keys[0]]);
    } else {
        transformed.type = explicitType || (keys.length === 1 ? keys[0] : 'container');
        sourceData = (keys.length === 1 && !explicitType) ? data[keys[0]] : data;
    }
    if (typeof sourceData === 'object' && sourceData !== null) {
        if (sourceData.props && typeof sourceData.props === 'object') {
            transformed.props = { ...transformed.props, ...sourceData.props };
        }
        Object.keys(sourceData).forEach(key => {
            if (!['type', 'component', 'children', 'content', 'props'].includes(key)) {
                transformed.props[key] = sourceData[key];
            }
        });
        const childrenSource = sourceData.children || sourceData.content;
        if (childrenSource !== undefined) {
            if (Array.isArray(childrenSource)) {
                transformed.children = childrenSource.map(transformComponentData);
            } else if (typeof childrenSource === 'object' && childrenSource !== null) {
                transformed.children = transformComponentData(childrenSource);
            } else {
                transformed.children = childrenSource;
            }
        }
    } else {
        transformed.children = sourceData;
    }

    // PATCH: Handle AI confusion between 'table' (html structure) and 'SimpleTablePanel' (data props)
    if (transformed.type === 'table' && (transformed.props?.columns || transformed.props?.rows)) {
        transformed.type = 'SimpleTablePanel';
    }

    return transformed;
};

export default function CanvasPage() {
    const { user } = useUser();
    const { theme, setTheme, accentColor, setAccentColor } = useTheme();
    const [uiSchema, setUiSchema] = useState<UIComponent>(initialSchema);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isNamingNewChat, setIsNamingNewChat] = useState(false);
    const [newChatName, setNewChatName] = useState("");
    const [isLeftOpen, setIsLeftOpen] = useState(true);
    const [isRightOpen, setIsRightOpen] = useState(true);

    const userId = user?.id || localStorage.getItem('userId') || 'guest';

    const fetchConversations = async () => {
        try {
            const response = await fetch(`${AI_URL}/api/memory/conversations?userId=${userId}&limit=50&offset=0`);
            const data = await response.json();
            if (data.conversations) setConversations(data.conversations);
        } catch (error) { console.error('Failed to fetch conversations:', error); }
    };

    useEffect(() => { if (userId) fetchConversations(); }, [userId]);

    const handleNewChat = async () => {
        setIsNamingNewChat(true);
        setNewChatName(`New Chat ${new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit' })}`);
    };

    const confirmCreateChat = async () => {
        const title = newChatName.trim() || `New Chat ${new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit' })}`;
        setIsNamingNewChat(false);
        try {
            const response = await fetch(`${AI_URL}/api/memory/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, title, metadata: { type: 'canvas' }, resourceId: 'assistant' })
            });
            const data = await response.json();
            const newId = data.id || data.conversation?.id;
            if (newId) {
                setCurrentConversationId(newId);
                setUiSchema(initialSchema);
                setMessages([{ id: '1', role: 'assistant', content: `Welcome! I'm ready to help you in "${title}".`, timestamp: new Date() }]);
                fetchConversations();
            }
        } catch (error) { console.error('Failed to create chat:', error); }
    };

    const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this conversation?')) return;
        try {
            await fetch(`${AI_URL}/api/memory/conversations/${id}?userId=${userId}`, { method: 'DELETE' });
            fetchConversations();
            if (currentConversationId === id) {
                setCurrentConversationId(null);
                setMessages([]);
                setUiSchema(initialSchema);
            }
        } catch (error) { console.error('Failed to delete chat:', error); }
    };

    const handleClearAllHistory = async () => {
        if (!confirm('Are you sure you want to clear ALL conversation history for this agent? This cannot be undone.')) return;
        try {
            await fetch(`${AI_URL}/api/memory/agent/assistant?userId=${userId}`, {
                method: 'DELETE'
            });
            setConversations([]);
            setCurrentConversationId(null);
            setMessages([]);
            setUiSchema(initialSchema);
        } catch (error) {
            console.error('Failed to clear agent memory:', error);
        }
    };

    const handleLoadConversation = async (conv: any) => {
        setIsLoading(true);
        setCurrentConversationId(conv.conversation_id);
        try {
            const response = await fetch(`${AI_URL}/api/memory/conversations/${conv.conversation_id}?userId=${userId}`);
            const data = await response.json();
            if (data.messages) {
                const loadedMessages = data.messages.map((m: any) => {
                    let componentJson = m.metadata?.componentJson || null;
                    const content = typeof m.parts === 'string' ? m.parts : (m.parts[0]?.text || '');
                    if (!componentJson && content.includes('```json')) {
                        const match = content.match(/```json\n([\s\S]*?)\n```/);
                        if (match) componentJson = match[1];
                    }
                    return { id: Math.random().toString(36).substr(2, 9), role: m.role, content, timestamp: new Date(m.created_at), componentJson };
                });
                setMessages(loadedMessages);
                const messagesWithUI = loadedMessages.filter((m: any) => m.role === 'assistant' && m.componentJson);
                if (messagesWithUI.length > 0) {
                    const canvasChildren = messagesWithUI.map((m: any) => {
                        try {
                            const msgIndex = loadedMessages.indexOf(m);
                            const prevMessage = msgIndex > 0 ? loadedMessages[msgIndex - 1] : null;
                            const userQuestion = prevMessage && prevMessage.role === 'user' ? prevMessage.content : "AI Response";

                            const transformed = transformComponentData(JSON.parse(m.componentJson!));
                            return {
                                type: 'card',
                                id: `wrapper-${m.id || Math.random()}`,
                                props: { className: 'col-span-12 mb-8 border border-border/20 bg-card text-card-foreground shadow-sm rounded-2xl overflow-hidden' },
                                children: [
                                    {
                                        type: 'div', props: { className: 'flex flex-col pt-2' },
                                        children: [
                                            {
                                                type: 'div', props: { className: 'flex items-center justify-between px-6 py-4' },
                                                children: [
                                                    {
                                                        type: 'stack', props: { direction: 'row', className: 'items-center gap-3' },
                                                        children: [
                                                            { type: 'div', props: { className: 'flex items-center justify-center w-10 h-10 rounded-full bg-primary/5 text-primary' }, children: [{ type: 'icon', props: { name: 'User', className: 'h-5 w-5' } }] },
                                                            { type: 'div', props: { className: 'flex flex-col gap-0.5' }, children: [{ type: 'text', props: { className: 'text-[11px] uppercase tracking-widest font-bold text-muted-foreground/70' }, children: 'Request' }, { type: 'text', props: { className: 'text-base font-medium leading-none tracking-tight' }, children: userQuestion }] }
                                                        ]
                                                    },
                                                    { type: 'icon', props: { name: 'Sparkles', className: 'h-4 w-4 text-amber-500/80' } }
                                                ]
                                            }
                                        ]
                                    },
                                    { type: 'card-content', props: { className: 'p-6 pt-2 bg-transparent' }, children: [transformed] }
                                ]
                            };
                        } catch (e) { return null; }
                    }).filter(Boolean);
                    setUiSchema(prev => ({ ...prev, children: canvasChildren }));
                } else {
                    setUiSchema(initialSchema);
                }
            }
        } catch (error) { console.error('Failed to load chat:', error); }
        finally { setIsLoading(false); }
    };

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(() => { scrollToBottom(); }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;
        if (!currentConversationId) { alert("Please select or create a conversation first."); return; }
        processAIResponse(inputValue.trim());
    };

    const processAIResponse = async (text: string) => {
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        const initialWrapper: UIComponent = {
            type: 'card',
            id: `wrapper-${Date.now()}`,
            props: { className: 'col-span-12 mb-8 border border-border/20 bg-card text-card-foreground shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500' },
            children: [
                {
                    type: 'div', props: { className: 'flex flex-col pt-2' },
                    children: [
                        {
                            type: 'div', props: { className: 'flex items-center justify-between px-6 py-4' },
                            children: [
                                {
                                    type: 'stack', props: { direction: 'row', className: 'items-center gap-3' },
                                    children: [
                                        { type: 'div', props: { className: 'flex items-center justify-center w-10 h-10 rounded-full bg-primary/5 text-primary' }, children: [{ type: 'icon', props: { name: 'User', className: 'h-5 w-5' } }] },
                                        { type: 'div', props: { className: 'flex flex-col gap-0.5' }, children: [{ type: 'text', props: { className: 'text-[11px] uppercase tracking-widest font-bold text-muted-foreground/70' }, children: 'Request' }, { type: 'text', props: { className: 'text-base font-medium leading-none tracking-tight' }, children: text }] }
                                    ]
                                },
                                { type: 'icon', props: { name: 'Sparkles', className: 'h-4 w-4 text-amber-500/80' } }
                            ]
                        },
                        {
                            type: 'thinking-block', id: `thinking-${Date.now()}`, props: { className: 'px-6 pb-2', finished: false },
                            children: [{ type: 'text', props: { className: 'mb-1 block flex items-center gap-2 text-xs text-muted-foreground' }, children: '• Thinking...' }]
                        }
                    ]
                },
                { type: 'card-content', props: { className: 'p-6 pt-2 bg-transparent' }, children: [{ type: 'div', props: { className: 'h-32 w-full bg-muted/10 animate-pulse rounded-lg' }, children: [] }] }
            ]
        };

        setUiSchema(prev => ({ ...prev, children: [...(prev.children || []), initialWrapper] }));

        try {
            const response = await fetch(`${AI_URL}/agents/dcf594b0-148c-47e3-95a7-78c09b339740/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
                body: JSON.stringify({ input: text, userId, conversationId: currentConversationId })
            });
            if (!response.body) throw new Error("No body");
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullStreamBuffer = '', isCollectingJson = false, jsonStartIndex = -1, currentLineBuffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const events = parseSSEChunk(decoder.decode(value, { stream: true }));
                for (const event of events) {
                    if (event.type === 'text-delta') {
                        const delta = event.text || '';
                        fullStreamBuffer += delta;
                        if (!isCollectingJson) {
                            const idx = fullStreamBuffer.indexOf('```json');
                            if (idx !== -1) {
                                isCollectingJson = true; jsonStartIndex = idx + 7;
                                setUiSchema(prev => {
                                    const newChildren = cloneDeep(prev.children);
                                    const thinkingBlock = newChildren[newChildren.length - 1].children[0].children[1];
                                    thinkingBlock.children.push({ type: 'text', props: { className: 'block flex items-center gap-2 text-primary font-medium animate-pulse text-xs' }, children: '• Generating UI...' });
                                    return { ...prev, children: newChildren };
                                });
                            } else if (delta.includes('\n')) {
                                const parts = (currentLineBuffer + delta).split('\n');
                                const completed = parts.slice(0, -1).filter(l => l.trim());
                                currentLineBuffer = parts[parts.length - 1];
                                if (completed.length > 0) {
                                    setUiSchema(prev => {
                                        const newChildren = cloneDeep(prev.children);
                                        const thinkingBlock = newChildren[newChildren.length - 1].children[0].children[1];
                                        completed.forEach(l => thinkingBlock.children.push({ type: 'text', props: { className: 'mb-1 block flex items-center gap-2 text-xs text-muted-foreground' }, children: `• ${l}` }));
                                        return { ...prev, children: newChildren };
                                    });
                                }
                            } else currentLineBuffer += delta;
                        }
                    }
                }
            }

            let assistantContent = fullStreamBuffer || "Processed", assistantMetadata: any = {};
            if (isCollectingJson) {
                let jsonText = fullStreamBuffer.substring(jsonStartIndex);
                const closingIdx = jsonText.lastIndexOf('```');
                if (closingIdx !== -1) jsonText = jsonText.substring(0, closingIdx);
                try {
                    const parsed = JSON.parse(jsonText);
                    const componentData = transformComponentData(parsed);
                    assistantContent = "Generated component";
                    assistantMetadata = { componentJson: JSON.stringify(parsed, null, 2) };
                    setUiSchema(prev => {
                        const newChildren = cloneDeep(prev.children);
                        const last = newChildren[newChildren.length - 1];
                        const tb = last.children[0].children[1];
                        tb.props.finished = true;
                        tb.children = tb.children.filter((c: any) => !c.props?.className?.includes('animate-pulse'));
                        tb.children.push({ type: 'text', props: { className: 'text-green-600 font-semibold text-xs' }, children: '• Success' });
                        last.children[1].children = [componentData];
                        return { ...prev, children: newChildren };
                    });
                } catch (e) { assistantContent = "Error parsing component JSON"; }
            }

            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: assistantContent, timestamp: new Date(), componentJson: assistantMetadata.componentJson }]);

            fetch(`${AI_URL}/api/memory/save-messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    conversationId: currentConversationId,
                    messages: [
                        { role: 'user', content: text },
                        { role: 'assistant', content: assistantContent, metadata: assistantMetadata }
                    ]
                })
            }).catch(e => console.error(e));

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "An error occurred.", timestamp: new Date() }]);
        } finally { setIsLoading(false); }
    };

    return (
        <div className="flex h-screen w-full bg-[#f8fafc] dark:bg-[#020617] overflow-hidden font-sans relative">

            {/* Left Sidebar - History (PROJECTS) */}
            <aside
                className={cn(
                    "border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 shrink-0 h-full transition-all duration-300 ease-in-out z-40 relative",
                    isLeftOpen ? "w-72" : "w-0 -translate-x-full border-none"
                )}
            >
                <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 mb-2">
                    <div className="flex items-center gap-2 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        <History className="h-4 w-4" /> Projects
                    </div>
                </div>

                {/* Theme & Accent Controls */}
                <div className="px-5 py-2 space-y-4">
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-xl border border-slate-200/50 dark:border-white/5">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTheme("light")}
                            className={cn("h-8 flex-1 rounded-lg gap-2 text-[10px] font-bold uppercase tracking-wider transition-all", theme === "light" ? "bg-white shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600")}
                        >
                            <Sun className="h-3.5 w-3.5" /> Light
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTheme("dark")}
                            className={cn("h-8 flex-1 rounded-lg gap-2 text-[10px] font-bold uppercase tracking-wider transition-all", theme === "dark" ? "bg-slate-900 shadow-sm text-blue-400" : "text-slate-400 hover:text-slate-200")}
                        >
                            <Moon className="h-3.5 w-3.5" /> Dark
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 p-1">
                        <div className="flex-1 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                            {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setAccentColor(color)}
                                    className={cn(
                                        "w-5 h-5 rounded-full shrink-0 transition-all hover:scale-110 active:scale-95",
                                        accentColor === color ? "ring-2 ring-offset-2 ring-slate-300 dark:ring-slate-700 scale-110 shadow-lg" : "opacity-60"
                                    )}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <div className="relative group shrink-0">
                            <Input
                                type="color"
                                value={accentColor}
                                onChange={(e) => setAccentColor(e.target.value)}
                                className="w-6 h-6 p-0 border-none rounded-full overflow-hidden cursor-pointer bg-transparent"
                            />
                            <Palette className="h-3 w-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-white mix-blend-difference" />
                        </div>
                    </div>
                </div>

                <div className="px-5 pt-2 mb-2">
                    {!isNamingNewChat ? (
                        <Button onClick={handleNewChat} className="w-full justify-start gap-2 h-10 px-3 bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                            <Plus className="h-4 w-4" />
                            <span className="font-bold text-xs uppercase tracking-wider">New Project</span>
                        </Button>
                    ) : (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-blue-500/20 shadow-sm animate-in fade-in slide-in-from-top-2">
                            <Input
                                value={newChatName}
                                onChange={(e) => setNewChatName(e.target.value)}
                                placeholder="Name..."
                                className="h-9 text-xs mb-2 bg-white dark:bg-slate-900"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') confirmCreateChat();
                                    if (e.key === 'Escape') setIsNamingNewChat(false);
                                }}
                            />
                            <div className="flex gap-2">
                                <Button size="sm" className="flex-1 h-7 text-[10px] bg-blue-600 hover:bg-blue-700" onClick={confirmCreateChat}>Create</Button>
                                <Button size="sm" variant="ghost" className="flex-1 h-7 text-[10px]" onClick={() => setIsNamingNewChat(false)}>Cancel</Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
                    {conversations.length === 0 ? (
                        <div className="py-12 text-center opacity-20 italic text-xs">No project history</div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.conversation_id}
                                onClick={() => handleLoadConversation(conv)}
                                className={cn(
                                    "group p-3 rounded-xl relative cursor-pointer transition-all duration-200",
                                    currentConversationId === conv.conversation_id
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 shadow-sm"
                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                        currentConversationId === conv.conversation_id ? "bg-blue-100 dark:bg-blue-800/40" : "bg-slate-100 dark:bg-slate-800"
                                    )}>
                                        <MessageSquare className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-[13px] truncate">{conv.title || 'Untitled Project'}</h3>
                                        <p className="text-[10px] opacity-60 font-medium">{new Date(conv.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 bg-inherit px-1">
                                        <button onClick={(e) => handleDeleteConversation(conv.conversation_id, e)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Toggle Button for Left Sidebar */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsLeftOpen(!isLeftOpen)}
                    className={cn(
                        "absolute -right-10 top-5 h-9 w-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xl z-50 rounded-full transition-all",
                        isLeftOpen ? "-right-4" : ""
                    )}
                >
                    {isLeftOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                </Button>
            </aside>

            {/* Main Content - Canvas (CENTER) */}
            <main className="flex-1 overflow-hidden relative transition-all duration-300">
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40 dark:opacity-10 pointer-events-none" />

                <div className="absolute top-6 left-6 z-10 flex gap-2">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Live Workspace</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleClearAllHistory} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 rounded-xl border border-border/40 text-[10px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-50">
                        <Trash2 className="h-3 w-3 mr-2" /> Wipe Memory
                    </Button>
                </div>

                <Canvas uiSchema={uiSchema} />

                {/* BOTTOM FLOATING CHAT INPUT (CENTERED) */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50 group">
                    <form onSubmit={handleSendMessage} className="relative transition-all duration-500 hover:scale-[1.01] focus-within:scale-[1.01]">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-10 group-focus-within:opacity-20 transition duration-500"></div>
                        <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-2 pl-4 shadow-2xl backdrop-blur-xl">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Ask me anything..."
                                disabled={isLoading}
                                className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm font-medium h-12 shadow-none dark:text-white"
                            />
                            <div className="flex items-center gap-1">
                                <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-slate-600 rounded-xl"><Mic className="h-4 w-4" /></Button>
                                <Button type="submit" disabled={!inputValue.trim() || isLoading} className={cn(
                                    "h-10 w-10 rounded-xl transition-all shadow-lg",
                                    isLoading ? "bg-slate-100 animate-pulse" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                                )}>
                                    {isLoading ? <Sparkles className="h-4 w-4 animate-spin text-blue-600" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>

            {/* Right Sidebar - Chat History (AI INSIGHTS) */}
            <aside
                className={cn(
                    "border-l border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 shrink-0 h-full transition-all duration-300 ease-in-out z-40 relative",
                    isRightOpen ? "w-[420px]" : "w-0 translate-x-full border-none"
                )}
            >
                {/* Toggle Button for Right Sidebar */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsRightOpen(!isRightOpen)}
                    className={cn(
                        "absolute -left-10 top-5 h-9 w-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-xl z-50 rounded-full transition-all",
                        isRightOpen ? "-left-4" : ""
                    )}
                >
                    {isRightOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                </Button>

                <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-2 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        <Bot className="h-4 w-4 text-blue-500" /> AI Insights
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 filter grayscale scale-90">
                            <Sparkles className="h-12 w-12 mb-4" />
                            <p className="text-xs font-bold uppercase tracking-widest">Start a conversation</p>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div key={msg.id} className={cn("flex flex-col gap-2", msg.role === 'user' ? "items-end" : "items-start animate-in fade-in slide-in-from-bottom-4")}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{msg.role === 'user' ? 'You' : 'AI'}</span>
                                    <div className={cn("w-1 h-1 rounded-full", msg.role === 'user' ? "bg-slate-300" : "bg-blue-500")} />
                                </div>
                                <div className={cn(
                                    "p-4 rounded-2xl text-[13px] font-medium leading-[1.6] transition-all shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-slate-900 dark:bg-slate-800 text-white rounded-tr-none"
                                        : "bg-[#f1f5f9] dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-100 dark:border-slate-800/50"
                                )}>
                                    {msg.content}
                                </div>
                                {msg.componentJson && (
                                    <Collapsible className="w-full mt-2">
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2 transition-all">
                                                <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" /> Source Code
                                            </Button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="mt-3 overflow-hidden animate-in slide-in-from-top-1">
                                            <pre className="text-[10px] bg-slate-950 text-blue-400 p-5 rounded-2xl max-h-80 overflow-auto border border-slate-800/50 shadow-inner scrollbar-thin font-mono leading-relaxed">
                                                {msg.componentJson}
                                            </pre>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 flex justify-center border-t border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-60">Connected to Intelligence</span>
                    </div>
                </div>
            </aside>
        </div>
    );
}

import { useRef, useState, useEffect } from "react";
import {
    Bot, ChevronRight, Plus, History,
    PanelLeftClose, PanelLeftOpen,
    Sparkles, Send,
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
import { Canvashistorybutton } from "./Canvasheader";

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

    // PATCH: Fix stack direction 'column' -> 'col' (DynamicRenderer validation fix)
    if (transformed.type === 'stack' && transformed.props?.direction === 'column') {
        transformed.props.direction = 'col';
    }

    return transformed;
};

interface CanvasPageProps {
    conversationId?: string | null;
    onToggleHistory?: () => void;
    onConversationIdChange?: (id: string) => void;
}

export default function CanvasPage({ conversationId, onToggleHistory, onConversationIdChange }: CanvasPageProps) {
    const { user } = useUser();

    const [uiSchema, setUiSchema] = useState<UIComponent>(initialSchema);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isRightOpen, setIsRightOpen] = useState(true);

    const userId = user?.id || localStorage.getItem('userId') || 'guest';
    const currentConversationId = conversationId;

    useEffect(() => {
        if (conversationId) {
            loadConversation(conversationId);
        } else {
            setMessages([]);
            setUiSchema(initialSchema);
        }
    }, [conversationId]);



    const handleClearAllHistory = async () => {
        if (!confirm('Are you sure you want to clear ALL conversation history for this agent? This cannot be undone.')) return;
        try {
            await fetch(`${AI_URL}/api/memory/agent/assistant?userId=${userId}`, {
                method: 'DELETE'
            });
            setMessages([]);
            setUiSchema(initialSchema);
            if (onConversationIdChange) onConversationIdChange("");
        } catch (error) {
            console.error('Failed to clear agent memory:', error);
        }
    };

    const loadConversation = async (id: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${AI_URL}/api/memory/conversations/${id}?userId=${userId}`);
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

        let targetId = currentConversationId;
        if (!targetId) {
            // Auto-create conversation
            try {
                const title = `New Chat ${new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit' })}`;
                const response = await fetch(`${AI_URL}/api/memory/conversations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, title, metadata: { type: 'canvas' }, resourceId: 'assistant' })
                });
                const data = await response.json();
                targetId = data.id || data.conversation?.id;
                if (targetId && onConversationIdChange) {
                    onConversationIdChange(targetId);
                }
            } catch (error) {
                console.error('Failed to create chat:', error);
                alert("Failed to create new conversation.");
                return;
            }
        }

        if (targetId) processAIResponse(inputValue.trim(), targetId);
    };

    const processAIResponse = async (text: string, activeConvId: string | null | undefined) => {
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
                body: JSON.stringify({ input: text, userId, conversationId: activeConvId })
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
                    conversationId: activeConvId,
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
        <div className="flex h-full w-full bg-[#f8fafc] dark:bg-[#020617] overflow-hidden font-sans relative">

            {/* Main Content - Canvas (CENTER) */}
            <main className="flex-1 overflow-hidden relative transition-all duration-300">
                <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40 dark:opacity-10 pointer-events-none" />

                <div className="absolute top-3 left-20 z-10 flex items-center gap-3">
                    <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-lg flex items-center gap-2">
                        <Canvashistorybutton onToggleHistory={onToggleHistory} />
                    </div>
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
                        "absolute -left-5 top-1/2 -translate-y-1/2 h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl z-50 rounded-xl transition-all duration-500 flex items-center justify-center hover:scale-110",
                        isRightOpen ? "bg-slate-50 dark:bg-slate-800" : "-left-12 opacity-80"
                    )}
                >
                    <Bot className={cn("h-5 w-5 transition-all duration-500", isRightOpen ? "text-blue-500 rotate-[360deg] scale-110" : "text-slate-400")} />
                </Button>

                <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-2 font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        <Bot className="h-4 w-4 text-blue-500" /> AI Insights
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-700/50 animate-pulse">
                                <Bot className="h-8 w-8 text-blue-500 opacity-40" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Ready to Analyze</p>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-[200px] leading-relaxed">
                                    Send a message to see AI insights and component breakdowns here.
                                </p>
                            </div>
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

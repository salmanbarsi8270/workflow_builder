import { useRef, useState, useEffect } from "react";
import { Send, Bot, User, Trash2, Sparkles, ChevronRight, Plus, Pencil } from "lucide-react";
import { Canvas } from "./Canvas";
import type { UIComponent } from "./types";
import { parseSSEChunk } from "@/lib/sse-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/collapsible";
import { useUser } from "../../context/UserContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AI_URL } from "../../ui_components/api/apiurl";

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
        className: 'p-6 h-full overflow-y-auto custom-scrollbar',
        layout: 'grid',
        cols: 4,
        gap: 4
    },
    children: []
};

const cloneDeep = (obj: any) => JSON.parse(JSON.stringify(obj));

// Transform API response format to Canvas format
const transformComponentData = (data: any): any => {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
        return data.map(transformComponentData);
    }

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
    return transformed;
};

export const Presentation = () => {
    const { user } = useUser();
    const [uiSchema, setUiSchema] = useState<UIComponent>(initialSchema);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("chat");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const userId = user?.id || localStorage.getItem('userId') || 'guest';

    const fetchConversations = async () => {
        try {
            const response = await fetch(`${AI_URL}/api/memory/conversations?userId=${userId}&limit=50&offset=0`);
            const data = await response.json();
            if (data.conversations) {
                setConversations(data.conversations);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        }
    };

    useEffect(() => {
        if (userId) fetchConversations();
    }, [userId]);

    const handleNewChat = async () => {
        const inputName = prompt("Enter conversation name:", `New Chat ${new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit' })}`);
        if (inputName === null) return;

        const finalTitle = inputName.trim() || `New Chat ${new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit' })}`;

        try {
            const response = await fetch(`${AI_URL}/api/memory/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    title: finalTitle,
                    metadata: { type: 'presentation' },
                    resourceId: 'assistant'
                })
            });
            const data = await response.json();
            const newId = data.id || data.conversation?.id;
            if (newId) {
                setCurrentConversationId(newId);
                setUiSchema(initialSchema);
                setMessages([{
                    id: '1',
                    role: 'assistant',
                    content: `Welcome! I'm ready to help you build visuals in "${finalTitle}".`,
                    timestamp: new Date()
                }]);
                setHasStarted(true);
                fetchConversations();
                setActiveTab("chat");
            }
        } catch (error) {
            console.error('Failed to create new conversation:', error);
        }
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
                setHasStarted(false);
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        }
    };

    const handleRenameConversation = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newTitle = prompt('Enter new title:');
        if (!newTitle) return;
        try {
            await fetch(`${AI_URL}/api/memory/conversations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle, userId })
            });
            fetchConversations();
        } catch (error) {
            console.error('Failed to rename conversation:', error);
        }
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
            setHasStarted(false);
        } catch (error) {
            console.error('Failed to clear agent memory:', error);
        }
    };

    const handleLoadConversation = async (conv: any) => {
        setIsLoading(true);
        setCurrentConversationId(conv.conversation_id);
        setActiveTab("chat");
        setHasStarted(true);
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
                    return {
                        id: Math.random().toString(36).substr(2, 9),
                        role: m.role,
                        content: content,
                        timestamp: new Date(m.created_at),
                        componentJson
                    };
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
                                span: 'quarter',
                                props: { className: 'mb-6 border border-border/20 bg-card text-card-foreground shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow' },
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
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(() => { scrollToBottom(); }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;
        if (!currentConversationId) {
            alert("Please select or create a conversation first.");
            return;
        }

        const userPrompt = inputValue.trim();
        setInputValue("");
        setIsLoading(true);
        setHasStarted(true);

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userPrompt, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);

        setUiSchema(prev => ({
            ...prev,
            children: [...(prev.children || []), {
                type: 'card',
                id: `wrapper-${Date.now()}`,
                span: 'quarter',
                props: { className: 'mb-6 border border-border/20 bg-card text-card-foreground shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 hover:shadow-md transition-shadow' },
                children: [
                    {
                        type: 'div',
                        props: { className: 'flex flex-col pt-2' },
                        children: [
                            {
                                type: 'div',
                                props: { className: 'flex items-center justify-between px-6 py-4' },
                                children: [
                                    {
                                        type: 'stack',
                                        props: { direction: 'row', className: 'items-center gap-3' },
                                        children: [
                                            {
                                                type: 'div',
                                                props: { className: 'flex items-center justify-center w-10 h-10 rounded-full bg-primary/5 text-primary' },
                                                children: [{ type: 'icon', props: { name: 'User', className: 'h-5 w-5' } }]
                                            },
                                            {
                                                type: 'div',
                                                props: { className: 'flex flex-col gap-0.5' },
                                                children: [
                                                    { type: 'text', props: { className: 'text-[11px] uppercase tracking-widest font-bold text-muted-foreground/70' }, children: 'Request' },
                                                    { type: 'text', props: { className: 'text-base font-medium leading-none tracking-tight' }, children: userPrompt }
                                                ]
                                            }
                                        ]
                                    },
                                    { type: 'icon', props: { name: 'Sparkles', className: 'h-4 w-4 text-amber-500/80' } }
                                ]
                            },
                            {
                                type: 'thinking-block',
                                id: `thinking-${Date.now()}`,
                                props: { className: 'px-6 pb-2' },
                                children: [{ type: 'text', props: { className: 'mb-1 block flex items-center gap-2 text-muted-foreground/70 text-xs' }, children: '• Starting generation...' }]
                            }
                        ]
                    },
                    {
                        type: 'card-content',
                        props: { className: 'p-6 pt-2 bg-transparent' },
                        children: [{ type: 'div', props: { className: 'h-32 w-full bg-muted/10 animate-pulse rounded-lg' }, children: [] }]
                    }
                ]
            }]
        }));

        try {
            const response = await fetch(`${AI_URL}/agents/dc9b860c-8eda-4922-88e6-5fd01bdb9ceb/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
                body: JSON.stringify({ input: userPrompt, userId, conversationId: currentConversationId })
            });

            if (!response.body) throw new Error("No response body");
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullStreamBuffer = '';
            let isCollectingJson = false;
            let jsonStartIndex = -1;
            let currentLineBuffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const events = parseSSEChunk(chunk);

                for (const event of events) {
                    if (event.type === 'text-delta') {
                        const delta = event.text || '';
                        fullStreamBuffer += delta;

                        if (!isCollectingJson) {
                            const jsonMarkerIndex = fullStreamBuffer.indexOf('```json');
                            if (jsonMarkerIndex !== -1) {
                                isCollectingJson = true;
                                jsonStartIndex = jsonMarkerIndex + 7;
                                setUiSchema(prev => {
                                    const newChildren = cloneDeep(prev.children);
                                    const lastWrapper = newChildren[newChildren.length - 1];
                                    const thinkingBlock = lastWrapper.children[0].children[1];
                                    thinkingBlock.children.push({ type: 'text', props: { className: 'text-primary/80 font-medium text-xs block animate-pulse flex items-center gap-2' }, children: '• Constructing UI Component...' });
                                    return { ...prev, children: newChildren };
                                });
                            } else {
                                currentLineBuffer += delta;
                                const lines = currentLineBuffer.split('\n');
                                if (lines.length > 1) {
                                    const completedLines = lines.slice(0, -1).filter(l => l.trim());
                                    currentLineBuffer = lines[lines.length - 1];
                                    if (completedLines.length > 0) {
                                        setUiSchema(prev => {
                                            const newChildren = cloneDeep(prev.children);
                                            const lastWrapper = newChildren[newChildren.length - 1];
                                            const thinkingBlock = lastWrapper.children[0].children[1];
                                            completedLines.forEach(line => {
                                                thinkingBlock.children.push({ type: 'text', props: { className: 'text-muted-foreground/90 text-xs block' }, children: `• ${line.trim()}` });
                                            });
                                            return { ...prev, children: newChildren };
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Finalize
            let assistantMetadata: any = {};
            let assistantContent = fullStreamBuffer || "I've processed your request.";

            if (isCollectingJson) {
                let jsonText = fullStreamBuffer.substring(jsonStartIndex);
                const closingMarkerIndex = jsonText.lastIndexOf('```');
                if (closingMarkerIndex !== -1) jsonText = jsonText.substring(0, closingMarkerIndex);
                try {
                    const parsed = JSON.parse(jsonText);
                    const componentData = transformComponentData(parsed);
                    assistantMetadata = { componentJson: JSON.stringify(parsed, null, 2) };
                    assistantContent = "I've generated the component for you.";
                    setUiSchema(prev => {
                        const newChildren = cloneDeep(prev.children);
                        const lastWrapper = newChildren[newChildren.length - 1];
                        const thinkingBlock = lastWrapper.children[0].children[1];
                        thinkingBlock.props.finished = true;
                        thinkingBlock.children = thinkingBlock.children.filter((c: any) => !c.props?.className?.includes('animate-pulse'));
                        thinkingBlock.children.push({ type: 'text', props: { className: 'text-green-600 dark:text-green-400 font-semibold block text-xs' }, children: '• UI Component Successfully Generated' });
                        lastWrapper.children[1].children = [componentData];
                        return { ...prev, children: newChildren };
                    });
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: assistantContent, timestamp: new Date(), componentJson: assistantMetadata.componentJson }]);
                } catch (e) {
                    assistantContent = "Error parsing component JSON.";
                    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: assistantContent, timestamp: new Date() }]);
                }
            } else {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: assistantContent, timestamp: new Date() }]);
                setUiSchema(prev => {
                    const newChildren = cloneDeep(prev.children);
                    const lastWrapper = newChildren[newChildren.length - 1];
                    const thinkingBlock = lastWrapper.children[0].children[1];
                    thinkingBlock.props.finished = true;
                    thinkingBlock.children.push({ type: 'text', props: { className: 'text-blue-500 font-medium block text-xs' }, children: '• Response received.' });
                    return { ...prev, children: newChildren };
                });
            }

            // SAVE PAIR TO BACKEND
            fetch(`${AI_URL}/api/memory/save-messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    conversationId: currentConversationId,
                    messages: [
                        { role: 'user', content: userPrompt },
                        { role: 'assistant', content: assistantContent, metadata: assistantMetadata }
                    ]
                })
            }).catch(e => console.error(e));

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "An error occurred.", timestamp: new Date() }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!hasStarted) {
        return (
            <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans relative">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] dark:bg-[radial-gradient(#1f1f1f_1px,transparent_1px)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-2xl w-full px-4 z-10 text-center">
                    <h1 className="text-4xl font-semibold tracking-tight mb-2 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent italic">What can I build for you?</h1>
                    <p className="text-muted-foreground mb-8 text-sm">Generate UI components instantly with streaming AI responses.</p>
                    <form onSubmit={handleSendMessage} className="relative">
                        <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Describe the UI component..." disabled={isLoading} className="pr-12 py-6 rounded-xl h-14" />
                        <Button type="submit" size="icon" disabled={!inputValue.trim() || isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-blue-600">
                            {isLoading ? <Sparkles className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
            <div className="flex-1 overflow-hidden relative bg-slate-100/50 dark:bg-slate-950">
                <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
                <Canvas uiSchema={uiSchema} />
            </div>
            <div className="w-[400px] border-l border-border/40 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 h-screen z-20 shadow-xl">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full">
                    <div className="p-4 border-b border-border/40 bg-white/50 dark:bg-slate-900/50 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider text-muted-foreground"><Bot className="h-4 w-4 text-primary" />AI Assistant</div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={handleNewChat}><Plus className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={handleClearAllHistory}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        <TabsList className="grid w-full grid-cols-2 bg-muted/50 rounded-lg p-1">
                            <TabsTrigger value="chat" className="text-xs">Chat</TabsTrigger>
                            <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="chat" className="flex-1 overflow-hidden flex flex-col m-0 p-0">
                        <div className="flex-1 p-4 overflow-y-auto space-y-6">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${msg.role === 'assistant' ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                        {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                    </div>
                                    <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`p-3 rounded-2xl text-sm shadow-sm border ${msg.role === 'assistant' ? 'bg-white rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>{msg.content}</div>
                                        {msg.componentJson && (
                                            <Collapsible className="w-full mt-2">
                                                <CollapsibleTrigger className="flex items-center gap-2 text-[10px] text-muted-foreground"><ChevronRight className="h-2 w-2" />View JSON</CollapsibleTrigger>
                                                <CollapsibleContent className="mt-2"><pre className="text-[10px] bg-slate-900 text-green-400 p-2 rounded-lg max-h-40 overflow-auto">{msg.componentJson}</pre></CollapsibleContent>
                                            </Collapsible>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t border-border/40 bg-white/50">
                            <form onSubmit={handleSendMessage} className="relative">
                                <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Type a message..." disabled={isLoading} className="pr-12 h-12 rounded-xl" />
                                <Button type="submit" size="icon" disabled={!inputValue.trim() || isLoading} className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 bg-blue-600"><Bot className="h-4 w-4 text-white" /></Button>
                            </form>
                        </div>
                    </TabsContent>
                    <TabsContent value="history" className="flex-1 overflow-y-auto m-0 p-4">
                        <div className="space-y-3">
                            {conversations.length === 0 ? <p className="text-center py-10 text-xs text-muted-foreground">No history</p> :
                                conversations.map(conv => (
                                    <div key={conv.conversation_id} onClick={() => handleLoadConversation(conv)} className={`p-4 rounded-xl border cursor-pointer relative shadow-sm hover:shadow-md transition-all ${currentConversationId === conv.conversation_id ? 'bg-primary/5 border-primary/20' : 'bg-white border-border/30'}`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-semibold text-xs truncate pr-4">{conv.title || 'Untitled'}</h3>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => handleRenameConversation(conv.conversation_id, e)} className="p-1 hover:bg-slate-100 rounded transition-colors" title="Rename"><Pencil className="h-3 w-3 text-muted-foreground" /></button>
                                                <button onClick={(e) => handleDeleteConversation(conv.conversation_id, e)} className="p-1 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 className="h-3 w-3 text-red-400" /></button>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">{new Date(conv.updated_at).toLocaleString()}</p>
                                        {currentConversationId === conv.conversation_id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                                    </div>
                                ))
                            }
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

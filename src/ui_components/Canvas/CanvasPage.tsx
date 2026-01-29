import { useRef, useState, useEffect } from "react";
import { Send, Bot, User, Trash2, Sparkles } from "lucide-react";
import { Canvas } from "../generative_ui/Canvas";
import type { UIComponent } from "../generative_ui/types";
import { parseSSEChunk } from "@/lib/sse-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronRight, Code2 } from "lucide-react";

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
        className: 'p-8 h-full overflow-y-auto',
        layout: 'grid',
        gap: 6
    },
    children: []
};

const cloneDeep = (obj: any) => JSON.parse(JSON.stringify(obj));

export default function CanvasPage() {
    const [uiSchema, setUiSchema] = useState<UIComponent>(initialSchema);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Welcome to your Canvas. I'll help you visualize data and build workflows. Try asking something like 'Show me a sales chart'.",
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        processAIResponse(inputValue);
    };

    const processAIResponse = async (text: string) => {
        // 1. Add User Message immediately
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            // 2. Initial Setup: Create the Wrapper with Thinking Block immediately
            const thinkingBlockId = `thinking-${Date.now()}`;
            const contentBlockId = `content-${Date.now()}`;

            const initialWrapper: UIComponent = {
                type: 'card',
                id: `wrapper-${Date.now()}`,
                props: {
                    className: 'col-span-12 mb-8 border border-border/20 bg-card text-card-foreground shadow-sm rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500'
                },
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
                                                children: [
                                                    { type: 'icon', props: { name: 'User', className: 'h-5 w-5' } }
                                                ]
                                            },
                                            {
                                                type: 'div',
                                                props: { className: 'flex flex-col gap-0.5' },
                                                children: [
                                                    { type: 'text', props: { className: 'text-[11px] uppercase tracking-widest font-bold text-muted-foreground/70' }, children: 'Request' },
                                                    { type: 'text', props: { className: 'text-base font-medium leading-none tracking-tight' }, children: text }
                                                ]
                                            }
                                        ]
                                    },
                                    { type: 'icon', props: { name: 'Sparkles', className: 'h-4 w-4 text-amber-500/80' } }
                                ]
                            },
                            {
                                type: 'thinking-block',
                                id: thinkingBlockId,
                                props: { className: 'px-6 pb-2' },
                                children: [
                                    { type: 'text', props: { className: 'mb-1 block flex items-center gap-2' }, children: '• Initializing agent...' }
                                ]
                            }
                        ]
                    },
                    {
                        type: 'card-content',
                        id: contentBlockId,
                        props: { className: 'p-6 pt-2 bg-transparent' },
                        children: [
                            { type: 'div', props: { className: 'h-32 w-full bg-muted/10 animate-pulse rounded-lg' }, children: [] }
                        ]
                    }
                ]
            };

            setUiSchema(prev => ({
                ...prev,
                children: [...(prev.children || []), initialWrapper]
            }));

            // 3. Start Stream
            const response = await fetch('http://localhost:4000/agents/dc9b860c-8eda-4922-88e6-5fd01bdb9ceb/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
                body: JSON.stringify({ input: text })
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let fullStreamBuffer = '';
            let isCollectingJson = false;
            let lastProcessedIndex = 0;
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

                        // Check for JSON start marker if not already collecting
                        if (!isCollectingJson) {
                            const jsonMarkerIndex = fullStreamBuffer.indexOf('```json');
                            if (jsonMarkerIndex !== -1) {
                                isCollectingJson = true;
                                jsonStartIndex = jsonMarkerIndex + 7; // Length of ```json

                                // Take everything before the marker and process it as thoughts
                                const preJsonText = fullStreamBuffer.substring(lastProcessedIndex, jsonMarkerIndex);
                                if (preJsonText.trim()) {
                                    const lines = preJsonText.split('\n').filter(l => l.trim());
                                    if (lines.length > 0) {
                                        setUiSchema(prev => {
                                            const newChildren = cloneDeep(prev.children);
                                            const lastWrapper = newChildren[newChildren.length - 1];
                                            const thinkingBlock = lastWrapper.children[0].children[1];
                                            lines.forEach(line => {
                                                thinkingBlock.children.push({
                                                    type: 'text',
                                                    props: { className: 'mb-1 block flex items-center gap-2' },
                                                    children: `• ${line}`
                                                });
                                            });
                                            return { ...prev, children: newChildren };
                                        });
                                    }
                                }

                                // Update processed index
                                lastProcessedIndex = jsonMarkerIndex + 7;

                                // Visual feedback for component start
                                setUiSchema(prev => {
                                    const newChildren = cloneDeep(prev.children);
                                    const lastWrapper = newChildren[newChildren.length - 1];
                                    const thinkingBlock = lastWrapper.children[0].children[1];
                                    thinkingBlock.children.push({ type: 'text', props: { className: 'block flex items-center gap-2 text-primary font-medium animate-pulse' }, children: '• Constructing UI Component...' });
                                    return { ...prev, children: newChildren };
                                });
                            } else {
                                // Still in thought mode: check for newlines in the raw deltas to update UI
                                // We use currentLineBuffer to avoid character-by-character bullets
                                if (delta.includes('\n')) {
                                    const parts = (currentLineBuffer + delta).split('\n');
                                    const completedLines = parts.slice(0, -1).filter(l => l.trim());
                                    currentLineBuffer = parts[parts.length - 1];

                                    if (completedLines.length > 0) {
                                        setUiSchema(prev => {
                                            const newChildren = cloneDeep(prev.children);
                                            const lastWrapper = newChildren[newChildren.length - 1];
                                            const thinkingBlock = lastWrapper.children[0].children[1];
                                            completedLines.forEach(line => {
                                                thinkingBlock.children.push({
                                                    type: 'text',
                                                    props: { className: 'mb-1 block flex items-center gap-2' },
                                                    children: `• ${line}`
                                                });
                                            });
                                            return { ...prev, children: newChildren };
                                        });
                                    }
                                } else {
                                    currentLineBuffer += delta;
                                }
                                lastProcessedIndex = fullStreamBuffer.length;
                            }
                        }
                    }
                }
            }

            // 4. Finalize
            if (isCollectingJson) {
                // Extract the JSON content between markers
                let jsonText = fullStreamBuffer.substring(jsonStartIndex);
                const closingMarkerIndex = jsonText.lastIndexOf('```');
                if (closingMarkerIndex !== -1) {
                    jsonText = jsonText.substring(0, closingMarkerIndex);
                }

                try {
                    const componentData = JSON.parse(jsonText);
                    console.log('📊 [Canvas] Parsed Component Data:', componentData);
                    console.log('📊 [Canvas] Component Type:', componentData.type);
                    setUiSchema(prev => {
                        const newChildren = cloneDeep(prev.children);
                        const lastWrapper = newChildren[newChildren.length - 1];
                        const thinkingBlock = lastWrapper.children[0].children[1];

                        // Set finished state and clean up status
                        thinkingBlock.props = { ...thinkingBlock.props, finished: true };
                        thinkingBlock.children = thinkingBlock.children.filter((c: any) =>
                            !(c.props?.className?.includes('animate-pulse'))
                        );

                        thinkingBlock.children.push({
                            type: 'text',
                            props: { className: 'text-green-600 dark:text-green-400 font-semibold block flex items-center gap-2' },
                            children: '• UI Component Successfully Generated'
                        });

                        const contentBlock = lastWrapper.children[1];
                        contentBlock.children = [componentData];
                        console.log('📊 [Canvas] Updated UI Schema:', newChildren);
                        return { ...prev, children: newChildren };
                    });

                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: "I've generated the component for you.",
                        timestamp: new Date(),
                        componentJson: JSON.stringify(componentData, null, 2)
                    }]);
                } catch (e) {
                    console.error("JSON Parse Error", e);
                    console.error("Raw JSON Text:", jsonText);
                    console.error("Full Stream Buffer:", fullStreamBuffer);

                    setUiSchema(prev => {
                        const newChildren = cloneDeep(prev.children);
                        const lastWrapper = newChildren[newChildren.length - 1];
                        const thinkingBlock = lastWrapper.children[0].children[1];
                        thinkingBlock.props = { ...thinkingBlock.props, finished: true };
                        thinkingBlock.children = thinkingBlock.children.filter((c: any) =>
                            !(c.props?.className?.includes('animate-pulse'))
                        );
                        thinkingBlock.children.push({
                            type: 'text',
                            props: { className: 'text-red-500 font-medium block flex items-center gap-2' },
                            children: `• JSON Parse Error: ${e instanceof Error ? e.message : 'Unknown error'}`
                        });
                        return { ...prev, children: newChildren };
                    });

                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: "I encountered an error processing the component JSON. Please check the console for details.",
                        timestamp: new Date(),
                        componentJson: `// MALFORMED JSON - PARSE ERROR\n${jsonText}`
                    }]);
                }
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: fullStreamBuffer || "I'm sorry, I couldn't generate a response.",
                    timestamp: new Date()
                }]);
                setUiSchema(prev => {
                    const newChildren = cloneDeep(prev.children);
                    const lastWrapper = newChildren[newChildren.length - 1];
                    const thinkingBlock = lastWrapper.children[0].children[1];
                    thinkingBlock.props = { ...thinkingBlock.props, finished: true };
                    thinkingBlock.children = thinkingBlock.children.filter((c: any) =>
                        !(c.props?.className?.includes('animate-pulse'))
                    );
                    thinkingBlock.children.push({ type: 'text', props: { className: 'text-blue-500 font-medium block flex items-center gap-2' }, children: '• Response received.' });
                    return { ...prev, children: newChildren };
                });
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "An unexpected error occurred. Please check the console.",
                timestamp: new Date()
            }]);
            setUiSchema(prev => {
                const newChildren = cloneDeep(prev.children);
                const lastWrapper = newChildren[newChildren.length - 1];
                const thinkingBlock = lastWrapper.children[0].children[1];
                thinkingBlock.children.push({ type: 'text', props: { className: 'text-red-500 font-medium block flex items-center gap-2' }, children: '• Request failed.' });
                return { ...prev, children: newChildren };
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
            {/* Chat Sidebar */}
            <div className="w-[400px] border-r border-border/40 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl shrink-0 h-screen z-20 shadow-xl">
                <div className="p-4 border-b border-border/40 font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center justify-between bg-white/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-primary" />
                        Canvas Assistant
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { setUiSchema(initialSchema); setMessages([]); }} title="Reset Canvas">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm
                                ${msg.role === 'assistant'
                                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
                                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}>
                                {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            </div>
                            <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {msg.role === 'assistant' ? 'AI Assistant' : 'You'}
                                </span>
                                <div className={`p-3 rounded-2xl text-sm shadow-sm border leading-relaxed
                                    ${msg.role === 'assistant'
                                        ? 'bg-white dark:bg-slate-800 border-border/50 rounded-tl-none text-slate-700 dark:text-slate-300'
                                        : 'bg-blue-600 text-white border-blue-600/50 rounded-tr-none'
                                    }`}>
                                    {msg.content}
                                </div>
                                {msg.componentJson && (
                                    <Collapsible className="w-full mt-2">
                                        <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group">
                                            <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
                                            <Code2 className="h-3 w-3" />
                                            <span>View Component JSON</span>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="mt-2">
                                            <pre className="text-[10px] bg-slate-900 dark:bg-slate-950 text-green-400 p-3 rounded-lg overflow-x-auto max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                                                {msg.componentJson}
                                            </pre>
                                        </CollapsibleContent>
                                    </Collapsible>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-border/40 bg-white/50 dark:bg-slate-900/50">
                    <form onSubmit={handleSendMessage} className="relative">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type a message..."
                            disabled={isLoading}
                            className="pr-12 py-6 rounded-xl bg-white dark:bg-slate-800 border-border/50 focus-visible:ring-blue-500/20 shadow-sm transition-all focus:shadow-md h-12"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!inputValue.trim() || isLoading}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md shadow-blue-500/20 transition-all hover:scale-105"
                        >
                            {isLoading ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 overflow-hidden relative bg-slate-100/50 dark:bg-slate-950 transition-colors duration-500">
                <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] opacity-20 pointer-events-none" />
                <Canvas uiSchema={uiSchema} />
            </div>
        </div>
    );
}

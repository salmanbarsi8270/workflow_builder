import { cn } from '@/lib/utils';
import { Bot, Sparkles, Copy, Check, Code, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { extractAllJson } from './utils';

import { type Message } from '../../types';

interface MessageHistorySidebarProps {
    isOpen: boolean;
    messages: Message[];
    className?: string;
}

export function MessageHistorySidebar({ isOpen, messages, className }: MessageHistorySidebarProps) {
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isOpen]);

    const handleCopy = (text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    /**
     * Cleans internal metadata/instructions from user messages in the sidebar
     */
    const cleanContent = (content: string, role: 'user' | 'assistant') => {
        if (role === 'assistant') return content;

        const patterns = [
            /USER QUESTION:\s*([\s\S]*)/i,
            /You are an expert AI Presentation[\s\S]*USER QUESTION:\s*([\s\S]*)/i
        ];

        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match && match[1]) return match[1].trim();
        }

        return content;
    };

    /**
     * Splits message content into text and all extracted JSON blocks
     */
    const renderMessageContent = (content: string, msgIdx: number) => {
        const schemas = extractAllJson(content);

        // Robust isolation of text vs JSON
        let cleanText = content;
        // Find the first occurrence of { or [
        const firstJsonIdx = content.search(/[{\[]/);
        if (firstJsonIdx !== -1) {
            cleanText = content.substring(0, firstJsonIdx).trim();
        }

        // Remove markdown block backticks if they remain in cleanText
        cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();

        return (
            <div className="space-y-4">
                {cleanText && (
                    <p className="whitespace-pre-wrap text-foreground/80 leading-relaxed text-[13px]">{cleanText}</p>
                )}

                {schemas.map((schema, blockIdx) => (
                    <div key={`${msgIdx}-${blockIdx}`} className="rounded-xl border border-border bg-black/5 dark:bg-white/5 overflow-hidden group/json">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
                            <div className="flex items-center gap-2">
                                <Code className="h-3 w-3 text-primary/60" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    {schema.type} {schemas.length > 1 ? `#${blockIdx + 1}` : ''}
                                </span>
                            </div>
                            <button
                                onClick={() => handleCopy(JSON.stringify(schema, null, 2), msgIdx * 100 + blockIdx)}
                                className="h-6 w-6 rounded-md hover:bg-background flex items-center justify-center transition-colors"
                            >
                                {copiedIdx === (msgIdx * 100 + blockIdx) ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                            </button>
                        </div>
                        <div className="p-3 overflow-x-auto">
                            <pre className="text-[10px] font-mono leading-relaxed text-primary/80">
                                {JSON.stringify(schema, null, 2)}
                            </pre>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div
            className={cn(
                "bg-background border-l border-border flex flex-col h-full transition-all duration-500 ease-in-out overflow-hidden shadow-2xl z-50",
                isOpen ? "w-[360px]" : "w-0 border-l-0",
                className
            )}
        >
            <div className="w-[360px] flex flex-col h-full shrink-0">
                {/* Header */}
                <div className="p-4 h-14 border-b border-border flex items-center justify-between bg-muted/20 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <h2 className="font-black text-xs uppercase tracking-[0.2em]">Contextual Insights</h2>
                    </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar pb-10 scroll-smooth">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 opacity-30">
                            <Bot className="h-12 w-12" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting interaction...</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500",
                                    msg.role === 'user' ? "items-end" : "items-start"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "h-6 w-6 rounded-lg flex items-center justify-center border",
                                        msg.role === 'user' ? "bg-primary border-primary" : "bg-muted border-border"
                                    )}>
                                        {msg.role === 'user' ? <User className="h-3 w-3 text-primary-foreground" /> : <Bot className="h-3 w-3 text-foreground" />}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                                        {msg.role === 'user' ? 'Inquiry' : 'Intelligence Agent'}
                                    </span>
                                </div>
                                <div
                                    className={cn(
                                        "max-w-full w-full p-4 rounded-3xl text-[13px] leading-relaxed shadow-sm border transition-all",
                                        msg.role === 'user'
                                            ? "bg-primary/5 border-primary/20 rounded-tr-none"
                                            : "bg-muted/30 border-border rounded-tl-none text-foreground/90"
                                    )}
                                >
                                    {msg.role === 'assistant'
                                        ? renderMessageContent(msg.content, idx)
                                        : <p className="font-medium">{cleanContent(msg.content, 'user')}</p>
                                    }
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer status */}
                <div className="p-4 border-t border-border bg-muted/20">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-background border border-border shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Neural Engine Active</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

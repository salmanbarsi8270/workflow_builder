import React, { useEffect, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Bot, User, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import type { Message } from '../SupportChatInterface';
import { MessageBubble } from './MessageBubble';


// Add this interface to SupportBody props
interface SupportBodyProps {
    messages: Message[];
    userName: string;
    loading: boolean;
    isTyping: boolean;
    onMessageFeedback?: (messageId: string, helpful: boolean) => void;
    scrollAreaRef: React.RefObject<HTMLDivElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const SupportBody: React.FC<SupportBodyProps> = ({ 
    messages, 
    userName, 
    loading, 
    isTyping,
    onMessageFeedback,
    scrollAreaRef, 
    messagesEndRef,
}) => {
    const [messageAnimations, setMessageAnimations] = useState<Record<string, boolean>>({});

    // Trigger animations when messages change
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && !messageAnimations[lastMessage.id]) {
            setMessageAnimations(prev => ({ ...prev, [lastMessage.id]: true }));
            setTimeout(() => {
                setMessageAnimations(prev => ({ ...prev, [lastMessage.id]: false }));
            }, 1000);
        }
    }, [messages]);

    // Auto-scroll when typing, loading, or new messages
    useEffect(() => {
        if (isTyping || loading || messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isTyping, loading, messages.length]);

    const handleCopyMessage = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    return (
        <div className="flex-1 flex flex-col relative z-20 w-full h-full overflow-hidden">
            <ScrollArea className="flex-1 h-full w-full" ref={scrollAreaRef}>
                <div className="flex flex-col w-[90%] mx-auto py-2">
                    {messages.length === 0 ? (
                        <div className="flex flex-col justify-center h-[55vh] items-center px-8 py-20 animate-fade-in -mt-20">
                            <div className="text-center mb-12 flex flex-col items-center">
                                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-2 animate-slide-up text-center">
                                    Hey! <span className="text-primary">{userName}</span>
                                </h1>
                                <h2 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white animate-slide-up delay-100 text-center">
                                    What can I help with?
                                </h2>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-8 w-full px-4 sm:px-8">
                            {messages.map((m) => (
                                <div 
                                    key={m.id} 
                                    className={`flex gap-5 ${m.role === 'user' ? 'flex-row-reverse' : ''} 
                                        ${messageAnimations[m.id] ? 'animate-pulse-once' : ''}`}
                                >
                                    <Avatar className={`h-9 w-9 border-none transition-transform ${m.role === 'user' ? 'scale-95' : ''}`}>
                                        {m.role === 'assistant' ? (
                                            <div className={`p-2 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 text-primary 
                                                ${m.feedback === 'helpful' ? 'animate-bounce-subtle' : ''}`}>
                                                <Bot size={20} />
                                            </div>
                                        ) : (
                                            <div className={`p-2 rounded-xl dark:bg-linear-to-br dark:from-white/20 dark:to-white/10 text-slate-500 dark:text-white/60
                                                ${m.status === 'sending' ? 'animate-pulse' : ''}`}>
                                                <User size={20} />
                                            </div>
                                        )}
                                    </Avatar>
                                    
                                    <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[75%] ${m.role === 'user' ? 'items-end' : ''}`}>
                                        <MessageBubble 
                                            message={m}
                                            role={m.role}
                                        />
                                        
                                        <div className={`flex items-center gap-2 mt-1 ${m.role === 'user' ? 'justify-end' : ''}`}>
                                            {m.role === 'assistant' && m.content && (
                                                <>
                                                    <button
                                                        onClick={() => handleCopyMessage(m.content)}
                                                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-white/60"
                                                        title="Copy message"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => onMessageFeedback?.(m.id, true)}
                                                        className={`p-1.5 rounded-lg transition-colors ${
                                                            m.feedback === 'helpful' 
                                                                ? 'bg-green-500/20 text-green-400' 
                                                                : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-green-400'
                                                        }`}
                                                        title="Helpful"
                                                    >
                                                        <ThumbsUp className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => onMessageFeedback?.(m.id, false)}
                                                        className={`p-1.5 rounded-lg transition-colors ${
                                                            m.feedback === 'not-helpful' 
                                                                ? 'bg-red-500/20 text-red-400' 
                                                                : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-red-400'
                                                        }`}
                                                        title="Not helpful"
                                                    >
                                                        <ThumbsDown className="h-3 w-3" />
                                                    </button>
                                                </>
                                            )}
                                            <span className="text-[10px] text-white/20 font-medium">
                                                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {(loading || isTyping) && (
                                <div className="flex gap-5 animate-fade-in">
                                    <div className="p-2 h-9 w-9 rounded-xl bg-linear-to-br from-primary/20 to-primary/10 text-primary">
                                        <Bot size={20} />
                                    </div>
                                    <div className="h-10 w-auto min-w-[120px] border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-2xl flex items-center gap-4 shadow-sm">
                                        <div className="flex gap-1.5">
                                            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                        <span className="text-xs text-muted-foreground font-medium tracking-wide">
                                            {(() => {
                                                const lastMsg = messages[messages.length - 1];
                                                if (lastMsg?.status === 'thinking' && lastMsg.metadata?.currentTool) {
                                                    const toolName = lastMsg.metadata.currentTool;
                                                    return toolName === 'execute_smart_query' ? 'Searching Database' : 
                                                           toolName === 'mainAgent' ? 'Computing' : 
                                                           `Running ${toolName}`;
                                                }
                                                return isTyping ? 'Typing...' : 'Analysing...';
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </ScrollArea>
        </div>
    );
};

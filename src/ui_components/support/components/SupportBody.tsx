import React, { useEffect, useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { Bot, User, ThumbsUp, ThumbsDown, Copy, ChevronRight, Edit2 } from "lucide-react";
import type { Message } from '../SupportChatInterface';
import { MessageBubble } from './MessageBubble';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


// Add this interface to SupportBody props
interface SupportBodyProps {
    messages: Message[];
    userName: string;
    loading: boolean;
    isTyping: boolean;
    suggestions: any[];
    onSendMessage: (text: string) => void;
    onMessageFeedback?: (messageId: string, helpful: boolean) => void;
    scrollAreaRef: React.RefObject<HTMLDivElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    sessionTitle?: string;
    onRenameSession?: (title: string) => void;
}

export const SupportBody: React.FC<SupportBodyProps> = ({ 
    messages, 
    userName, 
    loading, 
    isTyping,
    suggestions, 
    onSendMessage, 
    onMessageFeedback,
    scrollAreaRef, 
    messagesEndRef,
    sessionTitle,
    onRenameSession,
}) => {
    const [messageAnimations, setMessageAnimations] = useState<Record<string, boolean>>({});
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [newSessionTitle, setNewSessionTitle] = useState(sessionTitle || '');

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

    const handleTitleSave = () => {
        if (newSessionTitle.trim() && onRenameSession) {
            onRenameSession(newSessionTitle.trim());
        }
        setIsEditingTitle(false);
    };

    return (
        <div className="flex-1 flex flex-col relative z-20 w-full h-full overflow-hidden">
            <ScrollArea className="flex-1 h-full w-full" ref={scrollAreaRef}>
                <div className="flex flex-col w-[90%] mx-auto py-2">
                    {messages.length === 0 ? (
                        <div className="flex flex-col justify-center items-start px-8 animate-fade-in">
                            <div className="mb-6">
                                <h1 className="text-3xl md:text-4xl font-light text-foreground/90 animate-slide-up">
                                    Hey! <span className="text-primary">{userName}</span>
                                </h1>
                                <h2 className="text-3xl md:text-4xl font-semibold text-foreground mt-1 animate-slide-up delay-100">
                                    What can I help with?
                                </h2>
                            </div>

                            <div className="w-full">
                                {isEditingTitle ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={newSessionTitle}
                                            onChange={(e) => setNewSessionTitle(e.target.value)}
                                            className="bg-white/5 border-white/10 text-xl"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleTitleSave();
                                                if (e.key === 'Escape') setIsEditingTitle(false);
                                            }}
                                        />
                                        <Button
                                            size="sm"
                                            onClick={handleTitleSave}
                                            className="bg-teal-500 hover:bg-teal-600"
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setIsEditingTitle(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group">
                                        <h2 className="text-2xl font-semibold text-foreground/80">{sessionTitle}</h2>
                                        {onRenameSession && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setNewSessionTitle(sessionTitle || '');
                                                    setIsEditingTitle(true);
                                                }}
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                                            >
                                                <Edit2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-[1200px] animate-stagger">
                                {suggestions.map((s, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => onSendMessage(s.desc)}
                                        className="relative flex flex-col items-start p-6 rounded-3xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 transition-all text-left group hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:scale-[1.02] active:scale-[0.98] transform-gpu duration-300 animate-slide-up shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <div className="w-full flex items-start justify-between mb-6">
                                            <div className={cn(
                                                "h-14 w-14 rounded-2xl flex items-center justify-center text-2xl transition-all shadow-sm",
                                                s.color?.split(' ').find((c: any) => c.startsWith('bg-')) || 'bg-slate-50',
                                                "bg-opacity-10 dark:bg-opacity-20"
                                            )}>
                                                {s.icon}
                                            </div>
                                            <div className="flex gap-2">
                                                {s.popular && (
                                                    <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/20 text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest border border-orange-200 dark:border-orange-500/20 shadow-sm">
                                                        Popular
                                                    </span>
                                                )}
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                                    s.color?.split(' ').filter((c: any) => !c.startsWith('text-')).join(' ') || 'bg-slate-50 border-slate-200'
                                                )}>
                                                    {s.badge}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-6">
                                            <h3 className="text-[18px] font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                                                {s.title}
                                            </h3>
                                            <p className="text-[13px] text-slate-500 dark:text-white/40 leading-relaxed line-clamp-2 font-medium">
                                                {s.desc}
                                            </p>
                                        </div>

                                        <div className="w-full pt-4 mt-auto border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-300 dark:text-white/10 uppercase tracking-widest mb-1">Status</span>
                                                <span className="text-[11px] font-bold text-slate-500 dark:text-white/40">Ready to assist</span>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-white/20 group-hover:text-primary transition-colors transform group-hover:translate-x-1" />
                                        </div>
                                    </button>
                                ))}
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
                                            {isTyping ? 'Typing...' : 'Analysing...'}
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

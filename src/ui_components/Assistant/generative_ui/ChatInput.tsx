import React, { useState, useRef } from 'react';
import { Mic, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
    onSubmit?: (value: string) => void;
    className?: string;
}

export function ChatInput({ onSubmit, className }: ChatInputProps) {
    const [value, setValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!value.trim()) return;
        onSubmit?.(value);
        setValue('');
        if (textareaRef.current) {
            textareaRef.current.style.height = '24px';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = '24px';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    };

    return (

        <div className={cn("relative w-full  mx-auto", className)}>
            <div className="relative group">
                {/* Gradient Border & Glow Effect - Always Visible */}
                <div
                    className={cn(
                        "absolute -inset-[1px] rounded-2xl transition-opacity duration-500",
                        "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-sm",
                        "opacity-100"
                    )}
                />
                <div
                    className={cn(
                        "absolute -inset-[1px] rounded-2xl transition-opacity duration-500",
                        "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500",
                        "opacity-100"
                    )}
                />

                <form
                    onSubmit={handleSubmit}
                    className="relative flex flex-col w-full bg-background border border-border/50 rounded-2xl shadow-sm focus-within:shadow-md transition-all overflow-hidden z-10"
                >
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything..."
                        className="w-full bg-transparent border-0 ring-0 focus:ring-0 resize-none min-h-[56px] max-h-[200px] py-4 px-5 pr-28 text-[15px] text-foreground placeholder:text-muted-foreground/60 no-scrollbar font-normal leading-relaxed tracking-wide"
                    />

                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300"
                        >
                            <Mic className="h-4 w-4" />
                        </Button>

                        <Button
                            type="submit"
                            disabled={!value.trim()}
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-full transition-all duration-300 shadow-sm",
                                value.trim()
                                    ? "bg-foreground text-background hover:scale-105"
                                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                            )}
                        >
                            <Send className="h-4 w-4 fill-current" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

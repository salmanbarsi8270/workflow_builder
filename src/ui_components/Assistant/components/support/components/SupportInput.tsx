import React, { useRef, useEffect }  from 'react';
import { Button } from "@/components/ui/button";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { 
    Sparkles, 
    Paperclip, 
    ArrowUp, 
    Plus,
    Mic 
} from "lucide-react";



interface Suggestion {
    title: string;
    icon: string | React.ReactNode;
    desc: string;
    badge: string;
    color: string;
}

interface SupportInputProps {
    input: string;
    setInput: (val: string) => void;
    onSendMessage: (overrideInput?: string) => void;
    loading: boolean;
    suggestions: Suggestion[];
}

export const SupportInput: React.FC<SupportInputProps> = ({ input, setInput, onSendMessage, loading, suggestions }) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;

        el.style.height = '0px';
        el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }, [input]);

    return (
        <div className="px-3 pb-4 sm:px-4 sm:pb-6 bg-transparent">
            <div className="max-w-4xl mx-auto">
                {/* Suggestions Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-4 animate-slide-up">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => setInput(s.desc)}
                            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-semibold shadow-sm hover:shadow-md"
                        >
                            <span className="text-sm">{s.icon}</span>
                            <span className="text-slate-600 dark:text-white/60 group-hover:text-primary transition-colors">{s.title}</span>
                        </button>
                    ))}
                </div>

                <div
                    className="
                        flex items-center gap-2
                        rounded-[32px]
                        border border-slate-200/70 dark:border-white/10
                        bg-white dark:bg-[#0f0f0f]
                        px-3 sm:px-5 py-2 sm:py-3
                        shadow-lg shadow-black/5
                        focus-within:ring-2 focus-within:ring-primary/20
                        transition-all
                    "
                >
                    {/* Plus */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="
                                    h-10 w-10 rounded-full
                                    text-slate-400
                                    hover:text-slate-600
                                    hover:bg-slate-100
                                    dark:hover:bg-white/10
                                "
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            side="top"
                            align="start"
                            sideOffset={10}
                            className="
                                w-64 p-2 rounded-2xl
                                bg-white dark:bg-[#0f0f0f]
                                border border-slate-200 dark:border-white/10
                                shadow-2xl
                            "
                        >
                            <DropdownMenuItem className="gap-3 rounded-xl p-3">
                                <Paperclip className="h-4 w-4 text-emerald-500" />
                                Add photos & files
                            </DropdownMenuItem>

                            <DropdownMenuItem className="gap-3 rounded-xl p-3">
                                <Sparkles className="h-4 w-4 text-blue-500" />
                                Deep research
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Input */}
                    <textarea ref={textareaRef} value={input} placeholder="Ask Automation details..." rows={1}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (input.trim()) onSendMessage();
                            }
                        }}
                        className="flex-1 resize-none bg-transparent outline-none border-none text-[15px] sm:text-[16px] text-slate-900 dark:text-white placeholder:text-slate-400/80 px-2 leading-relaxed max-h-[160px] overflow-y-auto"
                    />

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="
                                h-10 w-10 rounded-full
                                text-slate-400
                                hover:text-slate-600
                                hover:bg-slate-100
                                dark:hover:bg-white/10
                            "
                        >
                            <Mic className="h-5 w-5" />
                        </Button>

                        <Button
                            size="icon"
                            disabled={!input.trim() || loading}
                            onClick={() => onSendMessage()}
                            className="
                                h-10 w-10 rounded-full
                                bg-orange-500 hover:bg-orange-600
                                text-white
                                transition-all
                                hover:scale-105
                                active:scale-95
                                disabled:opacity-40
                                shadow-lg shadow-orange-500/20
                            "
                        >
                            <ArrowUp className="h-5 w-5 stroke-[2.5]" />
                        </Button>
                    </div>
                </div>

                <p className="mt-3 text-[10px] sm:text-[11px] text-center text-muted-foreground/60 font-medium">
                    List of commands - "show history", "show agents", "show workflows", "show my active flows"
                </p>
            </div>
        </div>
    );
};

import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
    ShoppingBag, 
    Image as ImageIcon, 
    MousePointer2
} from "lucide-react";

interface SupportInputProps {
    input: string;
    setInput: (val: string) => void;
    onSendMessage: () => void;
    loading: boolean;
    suggestions: {
        title: string;
        badge: string;
        desc: string;
        color: string;
        icon: string;
    }[];
}

export const SupportInput: React.FC<SupportInputProps> = ({ 
    input, 
    setInput, 
    onSendMessage, 
    loading,
    suggestions
}) => {
    return (
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-[#050505] border-t border-border/50 dark:border-white/5 z-20">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-xl rounded-[28px] border border-slate-200 dark:border-white/10 p-5 shadow-2xl focus-within:border-primary/30 transition-all relative">
                
                {/* Suggestions / Quick Actions */}
                <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">
                    {suggestions.map((s, idx) => (
                        <button
                            key={idx}
                            onClick={() => setInput(s.desc)}
                            className="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 transition-colors flex items-center gap-2"
                        >
                            <span className="text-xs">{s.icon}</span>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">{s.title}</span>
                        </button>
                    ))}
                </div>

                {/* Textarea Area */}
                <div className="flex gap-4 items-start pt-1">
                    <Sparkles className="h-5 w-5 text-slate-400 dark:text-white/40 shrink-0 mt-2" />
                    <Textarea
                        placeholder="Ask anything..."
                        value={input}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                onSendMessage();
                            }
                        }}
                        className="border-none bg-transparent text-foreground placeholder:text-slate-400 dark:placeholder:text-white/20 p-0 min-h-[40px] max-h-[200px] resize-none focus-visible:ring-0 text-xl shadow-none custom-scrollbar"
                        rows={1}
                    />
                </div>

                {/* Bottom Controls */}
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-9 w-9 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/60 border border-slate-200 dark:border-white/5 shadow-sm transition-all active:scale-95"
                                    title="More Options"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent 
                                className="w-64 rounded-2xl p-2 bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl space-y-0.5" 
                                side="top" 
                                align="start"
                                sideOffset={12}
                            >
                                <DropdownMenuItem className="rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 group">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                                        <Paperclip className="h-4 w-4" />
                                    </div>
                                    <span className="font-semibold text-sm">Add photos & files</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem className="rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 group">
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                    <span className="font-semibold text-sm">Deep research</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem className="rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 group">
                                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-transform">
                                        <ShoppingBag className="h-4 w-4" />
                                    </div>
                                    <span className="font-semibold text-sm">Shopping research</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem className="rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 group">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                                        <ImageIcon className="h-4 w-4" />
                                    </div>
                                    <span className="font-semibold text-sm">Create image</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem className="rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 group">
                                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                                        <MousePointer2 className="h-4 w-4" />
                                    </div>
                                    <span className="font-semibold text-sm">Agent mode</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <Button 
                        size="icon" 
                        onClick={onSendMessage} 
                        disabled={loading || !input.trim()}
                        className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        <ArrowUp className="h-5 w-5 font-bold" />
                    </Button>
                </div>
            </div>
            
        </div>
    );
};

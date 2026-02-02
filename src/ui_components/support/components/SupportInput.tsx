import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
    ArrowUp, 
    Plus, 
} from "lucide-react";

interface SupportInputProps {
    input: string;
    setInput: (val: string) => void;
    onSendMessage: () => void;
    loading: boolean;
    suggestions: any[];
}

const Mic = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
);

export const SupportInput: React.FC<SupportInputProps> = ({ 
    input, 
    setInput, 
    onSendMessage, 
    loading,
    suggestions,
}) => {
    return (
        <div className="p-6 bg-transparent z-20">
            <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6">
                
                {/* Suggestions Top */}
                <div className="flex flex-wrap justify-center gap-2 max-w-4xl animate-stagger">
                    {suggestions.map((s, i) => (
                        <button 
                            key={i} 
                            onClick={() => setInput(s.desc)}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 transition-all hover:bg-slate-200 dark:hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] duration-300 shadow-sm group"
                        >
                            <span className="text-sm">{s.icon}</span>
                            <span className="text-[11px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest leading-none">{s.title}</span>
                        </button>
                    ))}
                </div>

                <div className="w-full flex border-2 items-center gap-4 bg-slate-100 dark:bg-[#0f0f0f] rounded-full border-slate-200 dark:border-primary/20 px-6 py-3 shadow-2xl focus-within:border-primary/40 transition-all">
                    
                    <button className="text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/80 transition-colors">
                        <Plus className="h-5 w-5" />
                    </button>

                    <Textarea
                        placeholder="Ask Automation details..."
                        value={input}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                onSendMessage();
                            }
                        }}
                        className="flex-1 border-none bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 p-0 min-h-[24px] max-h-[100px] resize-none focus-visible:ring-0 text-base shadow-none custom-scrollbar"
                        rows={1}
                    />

                    <div className="flex items-center gap-3">
                        <button className="text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/80 transition-colors">
                            <Mic className="h-5 w-5" />
                        </button>
                        
                        <Button 
                            size="icon" 
                            onClick={onSendMessage} 
                            disabled={loading || !input.trim()}
                            className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                            <ArrowUp className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <p className="text-[10px] text-slate-400 dark:text-white/40 font-medium tracking-tight">
                    List of commands - <span className="opacity-80">"show history", "show agents", "show workflows", "show my active flows"</span>
                </p>
            </div>
        </div>
    );
};

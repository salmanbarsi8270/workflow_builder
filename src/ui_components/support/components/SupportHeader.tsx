import React from 'react';
import { History } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SupportHeaderProps {
    messageCount?: number;
    isTyping?: boolean;
    typingSpeed?: number;
    onTypingSpeedChange?: (speed: number) => void;
    currentSessionTitle?: string;
    onToggleHistory?: () => void;
    onSaveSession?: () => void;
}

export const SupportHeader: React.FC<SupportHeaderProps> = ({ 
    isTyping = false,
    onToggleHistory,
}) => {

    return (
        <div className="relative z-30 w-full px-12 pt-8 pb-4 bg-transparent">

            {/* Hero Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex-1">
                    <div className="mb-4">
                        <h1 className="text-[36px] font-bold text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                            Support Assistant
                        </h1>
                        <div className="h-1.5 w-12 bg-orange-500 rounded-full shadow-[0_4px_12px_rgba(249,115,22,0.3)]" />
                    </div>
                    
                    <p className="text-slate-500 dark:text-white/40 text-[14px] max-w-[750px] leading-relaxed font-medium">
                        Get real-time assistance for your automation flows. Our intelligent support system handles queries, fetches database insights, and provides step-by-step guidance for your AI agents.
                    </p>
                </div>

                {/* Status Section */}
                <div className="flex items-center gap-4 mb-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleHistory}
                        className="h-12 w-12 rounded-[20px] bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 shadow-sm border border-slate-100 dark:border-white/5 transition-all hover:scale-105 active:scale-95"
                        title="Chat History"
                    >
                        <History className="h-5 w-5" />
                    </Button>
                    
                    <div className="flex items-center gap-3 px-6 py-3 rounded-[20px] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                        <div className={cn(
                            "h-2.5 w-2.5 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.4)]",
                            isTyping ? "animate-pulse bg-primary" : "bg-green-500"
                        )} />
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40">
                            {isTyping ? 'AI is thinking...' : 'System Ready'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

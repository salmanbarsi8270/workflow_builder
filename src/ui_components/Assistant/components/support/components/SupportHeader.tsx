import { cn } from '@/lib/utils';
import { History } from 'lucide-react';

interface SupportHeaderProps {
    messageCount?: number;
    isTyping?: boolean;
    typingSpeed?: number;
    onTypingSpeedChange?: (speed: number) => void;
    currentSessionTitle?: string;
    onToggleHistory?: () => void;
    onSaveSession?: () => void;
    isHistoryOpen?: boolean;
}

export const SupportHeader: React.FC<SupportHeaderProps> = ({
    onToggleHistory,
    isHistoryOpen = false,
    currentSessionTitle
}) => {

    return (
        <div className="relative z-30 w-full px-4 md:px-12 pt-8 pb-4 bg-transparent">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex flex-row items-start gap-6 flex-1">
                    <button
                        onClick={onToggleHistory}
                        className={cn(
                            "absolute top-2 left-4 h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-[0_0_15px_rgba(var(--primary),0.2)]",
                            isHistoryOpen ? "bg-primary text-primary-foreground shadow-lg scale-105" : "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                        title="Chat History"
                    >
                        <History className="h-4 w-4" />
                    </button>
                    <div className="flex-1">
                        <div className="mb-4 w-[90%] mx-auto">
                            <div className="inline-block group cursor-default">
                                <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-semibold text-slate-900 dark:text-white tracking-tight leading-none">
                                {currentSessionTitle || 'Support Assistant'}
                                </h1>
                                <div className="mt-2 h-1.5 w-full origin-left scale-x-[0.25] bg-primary rounded-full shadow-[0_4px_12px_rgba(249,115,22,0.3)] transition-transform duration-300 ease-out group-hover:scale-x-100" />
                            </div>
                        </div>
                        <div className="w-[90%] mx-auto">
                            <p className="text-slate-500 dark:text-white/40 text-sm md:text-[14px] max-w-[750px] leading-relaxed font-medium">
                                Get real-time assistance for your automation flows. Our intelligent support system handles queries, fetches database insights, and provides step-by-step guidance for your AI agents.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

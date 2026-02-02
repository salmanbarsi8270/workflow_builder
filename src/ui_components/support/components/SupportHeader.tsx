import React from 'react';
import { History, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    onToggleHistory,
}) => {

    return (
        <div className="relative z-30 w-full px-12 pt-10 pb-4 bg-transparent">

            {/* Hero Section */}
            <div className="flex items-start gap-5">
                {/* History Button (Yellow Circle) */}
                {/* History Button */}
                <Button 
                    onClick={onToggleHistory} 
                    className="h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 p-0"
                    title="View History"
                >
                    <History className="h-4 w-4" />
                </Button>

                <div className="flex-1">
                    <div className="mb-2">
                        <h1 className="text-[40px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                            New Conversation
                        </h1>
                    </div>
                    
                    <p className="text-slate-500 dark:text-white/40 text-[14px] max-w-[750px] leading-relaxed font-medium">
                        Get real-time assistance for your automation flows. Our intelligent support system handles queries, fetches database insights, and provides step-by-step guidance for your AI agents.
                    </p>
                </div>
            </div>
        </div>
    );
};

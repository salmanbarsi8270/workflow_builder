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

export const Canvashistorybutton: React.FC<SupportHeaderProps> = ({
    onToggleHistory,
}) => {

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={onToggleHistory}
            className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 transition-all shrink-0"
            title="View History"
        >
            <History className="h-4 w-4" />
        </Button>
    );
};

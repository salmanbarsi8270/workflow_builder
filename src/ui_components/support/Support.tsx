import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { SupportChatInterface } from './SupportChatInterface';
import { Loader2, Bot } from 'lucide-react';

interface SupportProps {
    conversationId: string | null;
    onToggleHistory: () => void;
    onConversationIdChange?: (id: string) => void;
}

export default function Support({ conversationId, onToggleHistory, onConversationIdChange }: SupportProps) {
    const { user } = useUser();
    const [agent, setAgent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setAgent({
            id: 'support-llm',
            name: 'Workflow Assistant',
            ui_config: {
                welcome_message: '👋 Hello! I am your Workflow Assistant. I have context about ALL your automations. How can I help you today?'
            }
        });
        setLoading(false);
    }, [user?.id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary animate-pulse">
                    <Bot className="h-8 w-8" />
                </div>
                <div className="flex items-center gap-2 font-medium">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Initializing Support Agent...
                </div>
            </div>
        );
    }

    if (!agent) return null;

    return (
        <div className="h-full bg-transparent text-slate-900 dark:text-white overflow-y-hidden relative animate-in fade-in duration-500">
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.015)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-size-[50px_50px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none" />

            <div className="relative z-10 w-full flex flex-col h-full">
                <SupportChatInterface 
                    userId={user?.id || 'anonymous'} 
                    userName={user?.name || 'user'} 
                    conversationId={conversationId}
                    onToggleHistory={onToggleHistory}
                    onConversationIdChange={onConversationIdChange}
                />
            </div>
        </div>
    );
};


import { useState, useCallback, useEffect } from 'react';
import aiClient from '@/ui_components/api/aiClient';
import { type ChatSession } from '../types';

export const useAssistantHistory = (userId: string | undefined, agentId?: string) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        setError(null);
        try {
            let url = `/api/v1/presentation/history?userId=${userId}`;
            if (agentId) {
                url += `&agentId=${agentId}`;
            }
            const response = await aiClient.get(url);
            if (response.data?.success) {
                const mappedSessions: ChatSession[] = response.data.conversations.map((c: any) => ({
                    id: c.id,
                    title: c.title || 'Untitled Project',
                    timestamp: new Date(c.date || Date.now()),
                    messages: [],
                    preview: 'Project analysis available',
                    isPinned: false,
                    tags: []
                }));
                setSessions(mappedSessions);
            }
        } catch (err: any) {
            console.error("Failed to fetch history:", err);
            setError(err.message || 'Failed to fetch history');
        } finally {
            setIsLoading(false);
        }
    }, [userId, agentId]);

    const deleteSession = useCallback(async (sessionId: string) => {
        if (!userId) return false;
        try {
            await aiClient.delete(`/api/v1/presentation/conversation/${sessionId}?userId=${userId}`);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            return true;
        } catch (err) {
            console.error("Failed to delete session:", err);
            return false;
        }
    }, [userId]);

    const renameSession = useCallback(async (sessionId: string, newTitle: string) => {
        if (!userId || !newTitle.trim()) return false;
        try {
            await aiClient.patch(`/api/v1/presentation/conversation/${sessionId}`, {
                title: newTitle,
                userId: userId
            });
            setSessions(prev => prev.map(s => 
                s.id === sessionId ? { ...s, title: newTitle } : s
            ));
            return true;
        } catch (err) {
            console.error("Failed to rename session:", err);
            return false;
        }
    }, [userId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    return {
        sessions,
        isLoading,
        error,
        fetchHistory,
        deleteSession,
        renameSession,
        setSessions
    };
};

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DynamicChatInterface } from './DynamicChatInterface.js';
import { API_URL } from '@/ui_components/api/apiurl';

export function PublicChat() {
    const { slug } = useParams<{ slug: string }>();
    const [agent, setAgent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAgent = async () => {
            try {
                const response = await fetch(`${API_URL}/api/v1/agents/slug/${slug}`);

                if (!response.ok) {
                    throw new Error('Agent not found or not published');
                }

                const data = await response.json();
                setAgent(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchAgent();
        }
    }, [slug]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-slate-600">Loading chat...</p>
                </div>
            </div>
        );
    }

    if (error || !agent) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4 max-w-md px-4">
                    <div className="text-6xl">🤖</div>
                    <h1 className="text-2xl font-bold text-slate-900">Agent Not Found</h1>
                    <p className="text-slate-600">
                        {error || 'This agent is not available or has not been published.'}
                    </p>
                </div>
            </div>
        );
    }

    return <DynamicChatInterface agent={agent} />;
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { DynamicChatInterface } from './DynamicChatInterface.js';
import { useUser } from '../../context/UserContext';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_URL } from '../api/apiurl.js';

export function PublicChat() {
    const { slug } = useParams<{ slug: string }>();
    const [agent, setAgent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, isLoading: isAuthLoading } = useUser();
    const navigate = useNavigate();
    const location = useLocation();

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

    if (loading || isAuthLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <div className="text-center space-y-6 max-w-md bg-white p-8 rounded-xl shadow-lg border border-slate-100">
                    <div className="text-4xl mb-2">🔒</div>
                    <h1 className="text-2xl font-bold text-slate-900">Authentication Required</h1>
                    <p className="text-slate-600">
                        You need to be logged in to chat with this agent.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => navigate('/login', { state: { from: location } })}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            Log In
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/')}
                            className="w-full"
                        >
                            Go to Dashboard
                        </Button>
                    </div>
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

    return <DynamicChatInterface agent={agent} userId={user.id} />;
}

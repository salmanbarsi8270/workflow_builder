import { useState, useEffect } from 'react';
import { Canvas } from './Canvas';
import { ChatInput } from './ChatInput';
import { generateUI } from './ai-engine';
import { useUser } from '@/context/UserContext';
import { ConversationListSidebar } from '../shared/ConversationListSidebar';
import { MessageHistorySidebar } from '../shared/MessageHistorySidebar';
import { MessageSquare, History, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractAllJson, generateComponentId } from '../shared/utils';
import aiClient from '@/ui_components/api/aiClient';
import { type Message, type UIComponent, type AssistantHistory } from '../../types';

const PRESENTATION_AGENT_ID = 'e8cd753a-7a7e-4aba-8795-1cfdafee333e';

interface PresentationProps {
    activeSessionId?: string | null;
    onSessionSelect?: (id: string | null) => void;
    history?: AssistantHistory;
}

export const Presentation: React.FC<PresentationProps> = ({ 
    activeSessionId, 
    onSessionSelect, 
    history 
}) => {
    const [uiSchemas, setUiSchemas] = useState<UIComponent[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const { user } = useUser();
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Sync active conversation with parent
    useEffect(() => {
        if (activeSessionId && activeSessionId !== activeConversationId) {
            loadConversation(activeSessionId);
        }
    }, [activeSessionId]);

    const handlePrompt = async (prompt: string) => {
        setIsGenerating(true);
        if (!hasGenerated) setHasGenerated(true);
        const userMsg: Message = { role: 'user', content: prompt, id: crypto.randomUUID(), timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);

        try {
            // Ensure we have a conversation ID
            const convoId = activeConversationId || `canvas_${crypto.randomUUID()}`;
            if (!activeConversationId) {
                setActiveConversationId(convoId);
                onSessionSelect?.(convoId);
            }

            const { text, schemas: newSchemas } = await generateUI(prompt, user?.id || '', true, uiSchemas, convoId);

            setUiSchemas(prev => {
                let updated = [...prev];
                newSchemas.forEach((newSchema, idx) => {
                    // Ensure the component has a stable ID
                    const sid = newSchema.id || generateComponentId(newSchema.type, updated.length + idx);
                    const index = updated.findIndex(s => s.id === sid);

                    // Attach the user's prompt to the component for hover tooltip
                    const componentWithPrompt = {
                        ...newSchema,
                        id: sid,
                        _userPrompt: prompt // Store the original question
                    };

                    if (index !== -1) {
                        updated[index] = componentWithPrompt;
                    } else {
                        updated.push(componentWithPrompt);
                    }
                });
                return updated;
            });

            // Add the assistant message with its actual text content
            const assistantMsg: Message = { role: 'assistant', content: text, id: crypto.randomUUID(), timestamp: new Date() };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (e) {
            console.error(e);
            const errorMsg: Message = { role: 'assistant', content: "Failed to augment the design system.", id: crypto.randomUUID(), timestamp: new Date() };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReset = () => {
        setIsLoadingHistory(true); // Visual indicator of reset
        setTimeout(() => {
            setUiSchemas([]);
            setMessages([]);
            setHasGenerated(false);
            setLeftOpen(false);
            setRightOpen(false);
            setActiveConversationId(null); 
            onSessionSelect?.(null);
            setIsLoadingHistory(false);
        }, 300);
    };

    const loadConversation = async (id: string) => {
        if (!id || id === 'current') {
            handleReset();
            return;
        }

        setIsLoadingHistory(true);
        setActiveConversationId(id);
        onSessionSelect?.(id);
        setHasGenerated(true); // Show the canvas area
        try {
            const response = await aiClient.get(`/api/v1/presentation/conversation/${id}?userId=${user?.id}`);
            if (response.data?.success && response.data.messages) {
                const fetchedMessages: Message[] = response.data.messages.map((m: any, idx: number) => ({
                    id: m.id || `msg_${idx}_${Date.now()}`,
                    role: m.role,
                    content: typeof m.content === 'string' ? m.content : (m.parts?.[0]?.text || ''),
                    timestamp: new Date(m.created_at || m.timestamp || Date.now())
                }));
                setMessages(fetchedMessages);

                // Reconstruct UI schemas from ALL assistant messages using robust parser
                const assistantMessages = fetchedMessages.filter(m => m.role === 'assistant');
                const allSchemas: UIComponent[] = [];

                assistantMessages.forEach(msg => {
                    const extracted = extractAllJson(msg.content);

                    // Find the user message that preceded this assistant message
                    const msgIndexInAll = fetchedMessages.indexOf(msg);
                    let userPrompt: string | undefined;
                    for (let i = msgIndexInAll - 1; i >= 0; i--) {
                        if (fetchedMessages[i].role === 'user') {
                            const fullMessage = fetchedMessages[i].content;

                            // Extract user question part resiliently
                            const questionMatch = fullMessage.match(/(?:USER QUESTION:|# User's Query:)\s*\n?([\s\S]+?)$/i);
                            userPrompt = questionMatch ? questionMatch[1].trim() : fullMessage;
                            
                            // Further cleanup if it contains system templates
                            if (userPrompt.includes('### USER QUESTION')) {
                                userPrompt = userPrompt.split('### USER QUESTION')[1].trim();
                            }
                            break;
                        }
                    }

                    // Add user prompt to each extracted schema
                    extracted.forEach(schema => {
                        allSchemas.push({
                            ...schema,
                            _userPrompt: userPrompt
                        });
                    });
                });

                if (allSchemas.length > 0) {
                    const finalSchemas: UIComponent[] = [];
                    allSchemas.forEach((schema, idx) => {
                        const sid = schema.id || generateComponentId(schema.type as string, idx);
                        if (!finalSchemas.find(s => s.id === sid)) {
                            finalSchemas.push({ ...schema, id: sid });
                        }
                    });
                    setUiSchemas(finalSchemas);
                } else {
                    setUiSchemas([]);
                }
            }
        } catch (e) {
            console.error("Failed to load conversation:", e);
            setUiSchemas([]);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    return (
        <div className="flex h-full w-full mx-auto bg-background text-foreground overflow-hidden font-sans relative">

            {/* Loading Overlay */}
            {isLoadingHistory && (
                <div className="absolute inset-0 z-100 bg-background/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(var(--primary),0.3)]" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">Switching Project...</p>
                    </div>
                </div>
            )}

            {/* Left Sidebar: Conversation List */}
            <ConversationListSidebar
                isOpen={leftOpen}
                onSelect={(id) => {
                    onSessionSelect?.(id);
                    loadConversation(id);
                }}
                onNew={handleReset}
                activeId={activeConversationId || undefined}
                agentId={PRESENTATION_AGENT_ID}
                history={history}
            />

            {/* Main Center Area */}
            <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-500 overflow-hidden relative">

                {/* Toolbar */}
                <div className="h-14 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 z-40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[20px_20px] dark:bg-[radial-gradient(#1f1f1f_1px,transparent_1px)]">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setLeftOpen(!leftOpen)}
                            className={cn(
                                "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-[0_0_15px_rgba(var(--primary),0.2)]",
                                leftOpen ? "bg-primary text-primary-foreground shadow-lg scale-105" : "bg-primary/10 text-primary hover:bg-primary/20"
                            )}
                        >
                            <History className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {hasGenerated && (
                            <button
                                onClick={handleReset}
                                title="Clear Canvas"
                                className="h-9 w-9 rounded-xl bg-destructive/10 hover:bg-destructive/20 hover:text-destructive text-destructive/80 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <button
                            onClick={() => setRightOpen(!rightOpen)}
                            className={cn(
                                "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-[0_0_15px_rgba(var(--primary),0.2)]",
                                rightOpen ? "bg-primary text-primary-foreground shadow-lg scale-105" : "bg-primary/10 text-primary hover:bg-primary/20"
                            )}
                        >
                            <MessageSquare className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[20px_20px] dark:bg-[radial-gradient(#1f1f1f_1px,transparent_1px)]">
                    {isGenerating && (
                        <div className="absolute inset-x-0 top-0 z-50 p-6 flex justify-center">
                            <div className="px-4 py-2 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                <span className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Visualizing Response...</span>
                            </div>
                        </div>
                    )}

                    <Canvas uiSchemas={uiSchemas} />

                    {/* Chat Input Area */}
                    <div
                        className={cn(
                            "absolute z-40 transition-all duration-700 ease-in-out w-full px-4",
                            hasGenerated
                                ? "bottom-8 left-1/2 -translate-x-1/2 max-w-2xl px-8"
                                : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-3xl"
                        )}
                    >
                        {!hasGenerated && (
                            <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                                <h1 className="text-5xl font-black tracking-tighter mb-4 bg-linear-to-br from-foreground to-foreground/40 bg-clip-text text-transparent">
                                    AI PRESENTATION
                                </h1>
                                <p className="text-muted-foreground max-w-sm mx-auto text-sm font-medium leading-relaxed opacity-60">
                                    Ask any question and receive visual, component-based answers.
                                </p>
                            </div>
                        )}
                        <ChatInput onSubmit={handlePrompt} className={hasGenerated ? "shadow-2xl translate-y-0" : "shadow-3xl"} />
                    </div>
                </div>
            </div>

            {/* Right Sidebar: Message History */}
            <MessageHistorySidebar isOpen={rightOpen} messages={messages} />
        </div>
    );
};


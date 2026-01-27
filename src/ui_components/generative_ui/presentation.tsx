import { useState } from 'react';
import { Canvas } from './Canvas';
import { ChatInput } from './ChatInput';
import { generateUI } from './ai-engine';
import type { UIComponent } from './types';
import { useUser } from '@/context/UserContext';
import { ConversationListSidebar } from './ConversationListSidebar';
import { MessageHistorySidebar } from './MessageHistorySidebar';
import { MessageSquare, History, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import aiClient from '../api/aiClient';
import { extractAllJson, generateComponentId } from './utils';

const PRESENTATION_AGENT_ID = 'e8cd753a-7a7e-4aba-8795-1cfdafee333e';

export const Presentation = () => {
    const [uiSchemas, setUiSchemas] = useState<UIComponent[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [leftOpen, setLeftOpen] = useState(false);
    const [rightOpen, setRightOpen] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const { user } = useUser();
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const handlePrompt = async (prompt: string) => {
        setIsGenerating(true);
        if (!hasGenerated) setHasGenerated(true);
        setMessages(prev => [...prev, { role: 'user', content: prompt }]);

        try {
            // Ensure we have a conversation ID
            const convoId = activeConversationId || crypto.randomUUID();
            if (!activeConversationId) setActiveConversationId(convoId);

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
            setMessages(prev => [...prev, { role: 'assistant', content: text }]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'assistant', content: "Failed to augment the design system." }]);
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
            setActiveConversationId(null); // Clear ID, handlePrompt will generate a new one
            setIsLoadingHistory(false);
        }, 300);
    };

    const loadConversation = async (id: string) => {
        if (!id) {
            handleReset();
            return;
        }

        setIsLoadingHistory(true);
        setActiveConversationId(id);
        setHasGenerated(true); // Show the canvas area
        try {
            const response = await aiClient.get(`/api/v1/presentation/conversation/${id}?userId=${user?.id}`);
            if (response.data?.success) {
                const fetchedMessages = response.data.messages;
                setMessages(fetchedMessages);

                // Reconstruct UI schemas from ALL assistant messages using robust parser
                const assistantMessages = fetchedMessages.filter((m: any) => m.role === 'assistant');
                const allSchemas: any[] = [];

                assistantMessages.forEach((msg: any) => {
                    const extracted = extractAllJson(msg.content);

                    // Find the user message that preceded this assistant message
                    const msgIndexInAll = fetchedMessages.indexOf(msg);
                    let userPrompt: string | undefined;
                    for (let i = msgIndexInAll - 1; i >= 0; i--) {
                        if (fetchedMessages[i].role === 'user') {
                            const fullMessage = fetchedMessages[i].content;

                            // Extract just the user question part (after "USER QUESTION:")
                            const questionMatch = fullMessage.match(/USER QUESTION:\s*\n(.+?)$/s);
                            userPrompt = questionMatch ? questionMatch[1].trim() : fullMessage;
                            break;
                        }
                    }

                    // Add user prompt to each extracted schema
                    extracted.forEach((schema: any) => {
                        allSchemas.push({
                            ...schema,
                            _userPrompt: userPrompt
                        });
                    });
                });

                if (allSchemas.length > 0) {
                    const finalSchemas: any[] = [];
                    allSchemas.forEach((schema, idx) => {
                        const sid = schema.id || generateComponentId(schema.type, idx);
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
        <div className="flex h-full w-full bg-background text-foreground overflow-hidden font-sans relative">

            {/* Loading Overlay */}
            {isLoadingHistory && (
                <div className="absolute inset-0 z-[100] bg-background/60 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(var(--primary),0.3)]" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary animate-pulse">Switching Project...</p>
                    </div>
                </div>
            )}

            {/* Left Sidebar: Conversation List */}
            <ConversationListSidebar
                isOpen={leftOpen}
                onSelect={loadConversation}
                onNew={handleReset}
                activeId={activeConversationId || undefined}
                agentId={PRESENTATION_AGENT_ID}
            />

            {/* Main Center Area */}
            <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-500 overflow-hidden relative">

                {/* Toolbar */}
                <div className="h-14 bg-background/80 backdrop-blur-md flex items-center justify-between px-4 z-40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] dark:bg-[radial-gradient(#1f1f1f_1px,transparent_1px)]">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setLeftOpen(!leftOpen)}
                            className={cn(
                                "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-[0_0_15px_rgba(var(--primary),0.2)]",
                                leftOpen ? "bg-primary text-primary-foreground shadow-lg scale-105" : "bg-primary/10 text-primary hover:bg-primary/20"
                            )}
                        >
                            <MessageSquare className="h-4 w-4" />
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
                            <History className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] dark:bg-[radial-gradient(#1f1f1f_1px,transparent_1px)]">
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
                                <h1 className="text-5xl font-black tracking-tighter mb-4 bg-gradient-to-br from-foreground to-foreground/40 bg-clip-text text-transparent">
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

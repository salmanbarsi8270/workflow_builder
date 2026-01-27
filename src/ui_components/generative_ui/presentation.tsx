import { useState } from 'react';
import { Canvas } from './Canvas';
import { ChatInput } from './ChatInput';
import { generateUI } from './ai-engine';
import type { UIComponent } from './types';
import { useUser } from '@/context/UserContext'; // Import UserContext

export const Presentation = () => {
    const [uiSchema, setUiSchema] = useState<UIComponent | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);
    const { user } = useUser(); // Get user from context

    const handlePrompt = async (prompt: string) => { // Make async
        setIsGenerating(true);
        setHasGenerated(true);
        // Simulate network delay for "AI" feeling - Optional, but API is real now.
        // We can keep a small delay or just wait for the API.

        try {
            // Pass userId (or undefined -> handled in engine as public-user)
            const newSchema = await generateUI(prompt, user?.id || '');
            setUiSchema(newSchema);
        } catch (e) {
            console.error(e);
            // Error state handled by engine returning error UI, or we could set error state here
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReset = () => {
        setUiSchema(null);
        setHasGenerated(false);
        setIsGenerating(false);
    };

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans relative">

            {/* Close/Reset Button - Only visible after generation */}
            <div className={`absolute top-4 right-4 z-50 transition-opacity duration-300 ${hasGenerated ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div
                    onClick={handleReset}
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-muted/20 hover:bg-muted/40 text-muted-foreground hover:text-foreground backdrop-blur-sm cursor-pointer transition-all border border-transparent hover:border-border/50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </div>
            </div>

            {/* Main Content Area - Only visible after generation */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${hasGenerated ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                <div className="flex-1 flex flex-col h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] dark:bg-[radial-gradient(#1f1f1f_1px,transparent_1px)]">
                    <main className="flex-1 relative flex flex-col overflow-hidden">
                        {isGenerating && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm transition-all duration-300">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                    <p className="text-sm font-medium text-muted-foreground animate-pulse">Generating UI...</p>
                                </div>
                            </div>
                        )}
                        <div className={`flex-1 relative flex flex-col overflow-hidden transition-opacity duration-300 ${isGenerating ? 'opacity-50' : 'opacity-100'}`}>
                            {uiSchema && <Canvas uiSchema={uiSchema} />}
                        </div>
                    </main>
                </div>
            </div>

            {/* Chat Input Container - Dynamic Positioning */}
            <div
                className={`absolute z-50 transition-all duration-700 ease-in-out w-full px-4
                    ${hasGenerated
                        ? 'bottom-8 right-8 max-w-[600px] translate-y-0 translate-x-0' // Final position: Bottom Right
                        : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-2xl' // Initial position: Center
                    }
                `}
            >
                <div className={`transition-all duration-500 delay-100 ${hasGenerated ? 'mr-0 ml-auto' : 'mx-auto'}`}>
                    {/* Welcome Text only on initial screen */}
                    <div className={`mb-8 text-center transition-opacity duration-500 ${hasGenerated ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100'}`}>
                        <h1 className="text-4xl font-semibold tracking-tight mb-2 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                            What can I build for you?
                        </h1>
                        <p className="text-muted-foreground">
                            Generate standard UI components instantly with a simple prompt.
                        </p>
                    </div>

                    <ChatInput onSubmit={handlePrompt} className={hasGenerated ? "shadow-lg" : "shadow-xl"} />
                </div>
            </div>
        </div>
    );
};

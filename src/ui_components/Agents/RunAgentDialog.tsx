import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Terminal, Loader2, Play, Bot } from "lucide-react";
import { AI_URL } from '../api/apiurl';
import type { Agent } from './types';

interface RunAgentDialogProps {
    agent: Agent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId?: string;
}

export function RunAgentDialog({ agent, open, onOpenChange, userId }: RunAgentDialogProps) {
    const [input, setInput] = useState('');
    const [response, setResponse] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    // UI Config
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uiConfig: any = agent?.ui_config || {};
    const themeColor = uiConfig.theme_color || '#2563eb';
    const fontFamily = uiConfig.font_family || 'Inter, sans-serif';

    // Reset state when dialog opens/closes or agent changes
    useEffect(() => {
        setInput('');
        setResponse('');
        setIsRunning(false);
    }, [open, agent]);

    const handleRun = async () => {
        if (!agent || !input.trim()) return;

        setIsRunning(true);
        setResponse(''); // Clear previous response

        try {
            // Direct AI_URL call to VoltAgent Core API
            const res = await fetch(`${AI_URL}/agents/${agent.id}/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: input,
                    options: {
                        userId: userId,
                        conversationId: agent.id,
                        temperature: 0.7,
                        contextLimit: 10,
                        context: {
                            userId: userId,
                        }
                    }
                })
            });

            if (!res.ok) {
                try {
                    const data = await res.json();
                    setResponse(`Error: ${data.error || 'Failed to run agent'}`);
                } catch (e) {
                    setResponse(`Error: Failed to run agent (${res.status})`);
                }
                return;
            }

            // Check if response is JSON
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                // Extract text from response
                const reply = data.text || data.output || data._output || (typeof data === 'string' ? data : JSON.stringify(data, null, 2));
                setResponse(reply);
            } else {
                // Handle SSE streaming response
                if (!res.body) {
                    setResponse("Error: No response body received.");
                    return;
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let fullText = '';
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;

                    // Parse SSE format: "data: {...}\n\n"
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const jsonStr = line.slice(6); // Remove "data: " prefix
                                const data = JSON.parse(jsonStr);
                                
                                // Extract text from text-delta events
                                if (data.type === 'text-delta' && data.text) {
                                    fullText += data.text;
                                    setResponse(fullText);
                                }
                                
                                // Handle tool calls
                                if (data.type === 'tool-call-start' && data.toolName) {
                                    fullText += `\n\n🔧 Executing tool: ${data.toolName}...\n`;
                                    setResponse(fullText);
                                }
                                
                                if (data.type === 'tool-call' && data.toolName) {
                                    fullText += `\n✅ Tool executed: ${data.toolName}\n`;
                                    if (data.result) {
                                        fullText += `Result: ${typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2)}\n`;
                                    }
                                    setResponse(fullText);
                                }
                                
                                if (data.type === 'tool-call-delta' && data.text) {
                                    fullText += data.text;
                                    setResponse(fullText);
                                }
                                
                                // Handle errors
                                if (data.error) {
                                    setResponse(`Error: ${data.error}`);
                                    return;
                                }
                            } catch (e) {
                                // Skip invalid JSON or non-JSON lines
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error(error);
            setResponse("Error: Something went wrong while communicating with the AI service.");
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-0 gap-0" style={{ fontFamily }}>
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: themeColor }} />
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            {uiConfig.logo_url ? (
                                <img src={uiConfig.logo_url} alt="Logo" className="h-5 w-5 rounded-full object-cover" />
                            ) : (
                                <Terminal className="h-5 w-5" style={{ color: themeColor }} />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span style={{ color: themeColor }} className="font-bold text-lg">{agent?.name || 'Agent'}</span>
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                                {agent?.model ? `Model: ${agent.model}` : 'Run Agent'}
                            </span>
                        </div>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Interact with {agent?.name} and see its live responses here.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 grid gap-6 h-[500px] grid-rows-[auto_1fr]">
                    <div className="grid gap-2">
                        <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User Input</Label>
                        <div className="flex gap-3">
                            <Textarea
                                placeholder="Enter your prompt here..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="resize-none h-24 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 focus-visible:ring-blue-500 font-medium leading-relaxed"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleRun();
                                    }
                                }}
                            />
                            <Button
                                className="h-24 w-28 flex flex-col gap-2 shadow-lg active:scale-95 transition-all text-white border-none"
                                style={{ backgroundColor: themeColor }}
                                onClick={handleRun}
                                disabled={isRunning || !input.trim()}
                            >
                                {isRunning ? <Loader2 className="h-6 w-6 animate-spin" /> : <Play className="h-6 w-6" />}
                                {isRunning ? "Running..." : "Run"}
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-2 h-full overflow-hidden">
                        <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                            Agent Response
                            {response && !isRunning && (
                                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">Completed</span>
                            )}
                        </Label>
                        <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 p-6 font-mono text-sm h-full overflow-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                            {isRunning && !response ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 dark:text-slate-500">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
                                        <Bot className="h-8 w-8 relative z-10 animate-bounce" />
                                    </div>
                                    <span className="text-xs font-medium animate-pulse">Processing request...</span>
                                </div>
                            ) : response ? (
                                <div className="animate-in fade-in duration-500 flex flex-col gap-4">
                                    <div>{response}</div>
                                    {isRunning && (
                                        <div className="flex items-center gap-2 text-blue-500 animate-pulse mt-2">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Agent is typing...</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400/60 dark:text-slate-600">
                                    <Terminal className="h-8 w-8 opacity-20" />
                                    <span className="text-xs">Response will appear here...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Terminal, Loader2, Play, Bot } from "lucide-react";
import { API_URL } from '../api/apiurl';
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
            const res = await fetch(`${API_URL}/api/v1/agents/${agent.id}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: input,
                    userId: userId
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
                // Prefer 'text', then 'output', then stringify the object if neither exists
                const reply = data.text || data.output || data._output || (typeof data === 'string' ? data : JSON.stringify(data, null, 2));
                setResponse(reply);
            } else {
                // Fallback to streaming reader if it's not JSON
                if (!res.body) {
                    setResponse("Error: No response body received.");
                    return;
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let fullText = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    fullText += chunk;
                    setResponse(fullText);
                }

                // After streaming, try to see if the whole thing was a JSON object
                try {
                    const parsed = JSON.parse(fullText);
                    const reply = parsed.text || parsed.output || parsed._output || fullText;
                    setResponse(reply);
                } catch (e) {
                    // Not a JSON, keep as is
                }
            }

        } catch (error) {
            console.error(error);
            setResponse("Error: Something went wrong while communicating with the agent.");
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-0 gap-0">
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-blue-600 to-indigo-600" />
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                            <Terminal className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div className="flex flex-col">
                            <span>Run Agent Check</span>
                            <span className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">Test environment for <span className="text-blue-600 dark:text-blue-300 font-semibold">{agent?.name}</span></span>
                        </div>
                    </DialogTitle>
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
                                className="h-24 w-28 flex flex-col gap-2 bg-linear-to-b from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-white border-none"
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
                            {isRunning ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 dark:text-slate-500">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
                                        <Bot className="h-8 w-8 relative z-10 animate-bounce" />
                                    </div>
                                    <span className="text-xs font-medium animate-pulse">Processing request...</span>
                                </div>
                            ) : response ? (
                                <div className="animate-in fade-in duration-500">
                                    {response}
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

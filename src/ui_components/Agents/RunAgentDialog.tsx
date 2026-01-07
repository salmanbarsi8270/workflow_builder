import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
        if (open) {
            setInput('');
            setResponse('');
            setIsRunning(false);
        }
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
                    userId: userId,
                    stream: true
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

            if (!res.body) {
                setResponse("Error: No response body received.");
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                setResponse(prev => prev + chunk);
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
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-primary" />
                        Run Agent: {agent?.name}
                    </DialogTitle>
                    <DialogDescription>
                        Test your agent by sending a prompt and viewing the response.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4 h-[400px] grid-rows-[auto_1fr]">
                    <div className="grid gap-2">
                        <Label>User Input</Label>
                        <div className="flex gap-2">
                            <Textarea 
                                placeholder="Enter your prompt here..." 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="resize-none h-24"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleRun();
                                    }
                                }}
                            />
                            <Button className="h-24 w-24 flex flex-col gap-1" onClick={handleRun} disabled={isRunning || !input.trim()}>
                                {isRunning ? <Loader2 className="h-6 w-6 animate-spin" /> : <Play className="h-6 w-6" />}
                                {isRunning ? "Running" : "Run"}
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-2 h-full overflow-hidden">
                        <Label>Agent Response</Label>
                        <div className="rounded-md border bg-muted/30 p-4 font-mono text-sm h-full overflow-auto whitespace-pre-wrap">
                            {isRunning ? (
                                <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                                    <Bot className="h-4 w-4" />
                                    Thinking...
                                </div>
                            ) : response ? (
                                response
                            ) : (
                                <span className="text-muted-foreground italic">Response will appear here...</span>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

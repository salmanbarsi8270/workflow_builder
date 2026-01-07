import { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Bot, Terminal, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { ResizableSheetContent } from '../Utility/ResizableSheet';
import type { Agent } from './types';

interface AgentInfoSheetProps {
    agent: Agent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRun: (agent: Agent) => void;
}

export function AgentInfoSheet({ agent, open, onOpenChange, onRun }: AgentInfoSheetProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = 200;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <ResizableSheetContent
                side="right"
                storageKey="agent-info-width"
                defaultWidth={500}
                className="sm:max-w-none border-l-0 shadow-2xl p-0"
            >
                {agent && (
                    <div className="h-full flex flex-col">
                        <div className="p-6 pb-4 border-b bg-muted/5">
                            <SheetHeader className="text-left space-y-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                        <Bot className="h-6 w-6" />
                                    </div>
                                    <SheetTitle className="text-2xl font-bold tracking-tight">{agent.name}</SheetTitle>
                                </div>
                                <SheetDescription className="text-sm font-medium text-muted-foreground/80">
                                    Agent Configuration & Details
                                </SheetDescription>
                            </SheetHeader>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* ID Section */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent ID</Label>
                                <div className="p-3 rounded-lg bg-muted/30 font-mono text-xs select-all border">
                                    {agent.id}
                                </div>
                            </div>

                            {/* Model Section */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Model</Label>
                                <div className="p-3 rounded-lg bg-muted/30 font-mono text-sm border flex items-center gap-2">
                                    <Terminal className="h-4 w-4 text-muted-foreground" />
                                    {agent.model}
                                </div>
                            </div>

                            {/* System Instructions */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Instructions</Label>
                                <div className="p-4 rounded-lg bg-muted/30 text-sm whitespace-pre-wrap border leading-relaxed">
                                    {agent.instructions || <span className="text-muted-foreground italic">No instructions provided.</span>}
                                </div>
                            </div>

                            {/* Tools Section */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Tools</Label>
                                {agent.tools && agent.tools.length > 0 ? (
                                    <Tabs defaultValue="tool-0" className="w-full">
                                        <div className="relative group/tabs">
                                            {/* Left Scroll Button */}
                                            <div className="absolute left-0 top-0 bottom-0 w-8 bg-linear-to-r from-background to-transparent z-10 flex items-center">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-full bg-background/80 shadow-sm border opacity-0 group-hover/tabs:opacity-100 transition-opacity hover:bg-background"
                                                    onClick={() => scroll('left')}
                                                >
                                                    <ChevronLeft className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            <TabsList 
                                                ref={scrollContainerRef}
                                                className="w-full justify-start overflow-x-auto no-scrollbar bg-muted/50 p-1 h-auto rounded-xl snap-x"
                                            >
                                                {agent.tools.map((tool, index) => (
                                                    <TabsTrigger 
                                                        key={index} 
                                                        value={`tool-${index}`}
                                                        className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1.5 text-xs font-medium min-w-fit snap-start"
                                                    >
                                                        {tool.name}
                                                    </TabsTrigger>
                                                ))}
                                            </TabsList>

                                            {/* Right Scroll Button */}
                                            <div className="absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-background to-transparent z-10 flex items-center justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-full bg-background/80 shadow-sm border opacity-0 group-hover/tabs:opacity-100 transition-opacity hover:bg-background"
                                                    onClick={() => scroll('right')}
                                                >
                                                    <ChevronRight className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        {agent.tools.map((tool, index) => (
                                            <TabsContent key={index} value={`tool-${index}`} className="mt-3 animate-in fade-in-50 slide-in-from-top-1">
                                                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 space-y-3">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {tool.mcpConfig ? (
                                                            <>
                                                                <div className="space-y-1">
                                                                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Type</span>
                                                                    <div className="flex items-center gap-2 font-mono text-sm bg-muted/30 p-2 rounded border truncate" title={tool.mcpConfig.type}>
                                                                        {tool.mcpConfig.type || 'MCP'}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Source</span>
                                                                    <div className="flex items-center gap-2 font-mono text-sm bg-muted/30 p-2 rounded border truncate" title={tool.mcpConfig.url || tool.mcpConfig.name}>
                                                                        {tool.mcpConfig.name || 'External'}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="space-y-1">
                                                                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Piece</span>
                                                                    <div className="flex items-center gap-2 font-mono text-sm bg-muted/30 p-2 rounded border">
                                                                        {tool.piece || '-'}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Action</span>
                                                                    <div className="flex items-center gap-2 font-mono text-sm bg-muted/30 p-2 rounded border">
                                                                        {tool.action || '-'}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="space-y-1 pt-1">
                                                        <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Full Tool Name</span>
                                                        <p className="text-sm font-medium">{tool.name}</p>
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                ) : (
                                    <div className="p-4 rounded-lg border border-dashed text-center text-sm text-muted-foreground bg-muted/10">
                                        No tools configured for this agent.
                                    </div>
                                )}
                            </div>
                            
                            {/* Created At (if available) */}
                            {agent.created_at && (
                                <div className="space-y-2 pt-4 border-t">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Created</span>
                                        <span>{new Date(agent.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-6 border-t bg-muted/5 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                            <Button onClick={() => {
                                onOpenChange(false);
                                onRun(agent);
                            }}>
                                <Play className="h-4 w-4 mr-2" />
                                Run Agent
                            </Button>
                        </div>
                    </div>
                )}
            </ResizableSheetContent>
        </Sheet>
    );
}

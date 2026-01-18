import { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Bot, Terminal, Play, ChevronLeft, ChevronRight, Key, Globe } from "lucide-react";
import { ResizableSheetContent } from '../Utility/ResizableSheet';
import type { Agent, ConnectionOption } from './types';
import { PublishSettings } from './PublishSettings';

interface AgentInfoSheetProps {
    agent: Agent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onRun: (agent: Agent) => void;
    connections?: ConnectionOption[];
    onUpdate?: (updates: Partial<Agent>) => void;
    initialTab?: 'details' | 'publish';
}



export function AgentInfoSheet({ agent, open, onOpenChange, onRun, connections = [], onUpdate, initialTab = 'details' }: AgentInfoSheetProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const subagentsList = agent?.subagents || agent?.sub_agents || [];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <ResizableSheetContent
                side="right"
                storageKey="agent-info-width"
                defaultWidth={600}
                className="sm:max-w-none border-l shadow-2xl p-0 border-slate-200 dark:border-white/10"
            >
                {agent && (
                    <div className="h-full flex flex-col bg-slate-50/50 dark:bg-[#0a0a0a]">
                        <div className="p-6 pb-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f0f0f]">
                            <SheetHeader className="text-left space-y-1">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 shadow-sm">
                                        <Bot className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <SheetTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{agent.name}</SheetTitle>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-1">
                                            <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10">
                                                {agent.id.slice(0, 8)}...
                                            </span>
                                            <span className="text-slate-300 dark:text-white/20">|</span>
                                            <span>Created {agent.created_at ? new Date(agent.created_at).toLocaleDateString() : 'Recently'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <SheetDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 pl-1">
                                    Agent Configuration & Details
                                </SheetDescription>
                            </SheetHeader>
                        </div>


                        <Tabs defaultValue={initialTab} className="flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-[#0a0a0a]">
                            <div className="px-6 pt-2 pb-0">
                                <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-white/5 p-1 rounded-lg">
                                    <TabsTrigger value="details" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-[#151515] data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all duration-200">Details</TabsTrigger>
                                    <TabsTrigger value="publish" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-[#151515] data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all duration-200 flex items-center gap-2">
                                        <Globe className="h-3.5 w-3.5" />
                                        Publish
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="details" className="flex-1 overflow-y-auto p-6 space-y-8 mt-0 outline-none">

                                {/* Model Section */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                        <Terminal className="h-3 w-3" />
                                        Model Configuration
                                    </Label>
                                    <div className="p-4 rounded-xl bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/5 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                                <Bot className="h-4 w-4 text-slate-500" />
                                            </div>
                                            <div className="font-mono text-sm font-medium text-slate-700 dark:text-slate-200">
                                                {agent.model}
                                            </div>
                                        </div>
                                    </div>

                                    {agent.connectionId && (
                                        <div className="p-4 rounded-xl bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/5 shadow-sm mt-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] uppercase text-blue-600 dark:text-blue-400 font-bold tracking-wider">AI Service Connection</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                                    <Key className="h-4 w-4 text-blue-500" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                        {connections.find(c => c.id === agent.connectionId)?.name || 'Linked Connection'}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-slate-400 opacity-50 truncate">#{agent.connectionId.slice(0, 8)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}


                                </div>

                                {/* System Instructions */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">System Instructions</Label>
                                    <div className="p-5 rounded-xl bg-white dark:bg-[#151515] text-sm whitespace-pre-wrap border border-slate-200 dark:border-white/5 shadow-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                        {agent.instructions || <span className="text-muted-foreground italic">No instructions provided.</span>}
                                    </div>
                                </div>

                                {/* Tools Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Active Tools ({agent.tools?.length || 0})</Label>
                                    </div>

                                    {agent.tools && agent.tools.length > 0 ? (
                                        <Tabs defaultValue="tool-0" className="w-full">
                                            <div className="relative group/tabs mb-4 flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0 rounded-full bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10"
                                                    onClick={() => {
                                                        if (scrollContainerRef.current) {
                                                            scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
                                                        }
                                                    }}
                                                >
                                                    <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                                </Button>

                                                <div className="flex-1 overflow-hidden">
                                                    <TabsList
                                                        ref={scrollContainerRef}
                                                        className="w-full justify-start overflow-x-auto no-scrollbar bg-transparent p-0 h-auto rounded-none snap-x gap-2"
                                                    >
                                                        {agent.tools.map((tool, index) => (
                                                            <TabsTrigger
                                                                key={index}
                                                                value={`tool-${index}`}
                                                                className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 px-4 py-2 text-xs font-medium min-w-fit snap-start transition-all hover:border-blue-300 dark:hover:border-blue-500/50"
                                                            >
                                                                {tool.name}
                                                            </TabsTrigger>
                                                        ))}
                                                    </TabsList>
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0 rounded-full bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10"
                                                    onClick={() => {
                                                        if (scrollContainerRef.current) {
                                                            scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
                                                        }
                                                    }}
                                                >
                                                    <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                                                </Button>
                                            </div>

                                            {agent.tools.map((tool, index) => (
                                                <TabsContent key={index} value={`tool-${index}`} className="mt-0 animate-in fade-in-50 slide-in-from-top-1">
                                                    <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#151515] text-card-foreground shadow-sm p-5 space-y-4 hover:border-blue-200 dark:hover:border-blue-500/20 transition-colors">
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {tool.mcpConfig ? (
                                                                <>
                                                                    <div className="space-y-1.5">
                                                                        <span className="text-[10px] uppercase text-blue-600 dark:text-blue-400 font-bold tracking-wider">Type</span>
                                                                        <div className="flex items-center gap-2 font-mono text-sm bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300">
                                                                            {tool.mcpConfig.type || 'MCP'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <span className="text-[10px] uppercase text-blue-600 dark:text-blue-400 font-bold tracking-wider">Source</span>
                                                                        <div className="flex items-center gap-2 font-mono text-sm bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300 truncate">
                                                                            {tool.mcpConfig.name || 'External'}
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="space-y-1.5">
                                                                        <span className="text-[10px] uppercase text-blue-600 dark:text-blue-400 font-bold tracking-wider">App Principle</span>
                                                                        <div className="flex items-center gap-2 font-mono text-sm bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300">
                                                                            {tool.piece || '-'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <span className="text-[10px] uppercase text-blue-600 dark:text-blue-400 font-bold tracking-wider">Action ID</span>
                                                                        <div className="flex items-center gap-2 font-mono text-sm bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-300">
                                                                            {tool.action || '-'}
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Connection Detail */}
                                                        {tool.connectionId && (
                                                            <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-[10px] uppercase text-blue-600 dark:text-blue-400 font-bold tracking-wider">Connected Account</span>
                                                                    <span className="text-[10px] font-mono text-slate-400 truncate ml-2 opacity-50">#{tool.connectionId.slice(0, 8)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 p-3 rounded-lg border border-slate-100 dark:border-white/5">
                                                                    <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                                        <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
                                                                    </div>
                                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                                        {connections.find(c => c.id === tool.connectionId)?.name || 'Unknown Account'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                                                            <span className="text-[10px] uppercase text-blue-600 dark:text-blue-400 font-bold tracking-wider block mb-1">Full Tool Name</span>
                                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{tool.name}</p>
                                                        </div>
                                                    </div>
                                                </TabsContent>
                                            ))}
                                        </Tabs>
                                    ) : (
                                        <div className="p-8 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 text-center flex flex-col items-center gap-2 text-muted-foreground bg-slate-50/50 dark:bg-white/5">
                                            <Terminal className="h-8 w-8 opacity-20" />
                                            <p className="text-sm">No tools configured for this agent.</p>
                                        </div>
                                    )}
                                </div>


                                {/* Sub-Agents Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Sub-Agents ({subagentsList.length})</Label>
                                    </div>

                                    {subagentsList.length > 0 ? (
                                        <Tabs defaultValue="subagent-0" className="w-full">
                                            <div className="relative group/tabs mb-4 flex items-center gap-2">

                                                <div className="flex-1 overflow-hidden">
                                                    <TabsList
                                                        className="w-full justify-start overflow-x-auto no-scrollbar bg-transparent p-0 h-auto rounded-none snap-x gap-2"
                                                    >
                                                        {subagentsList.map((subAgent, index) => (
                                                            <TabsTrigger
                                                                key={index}
                                                                value={`subagent-${index}`}
                                                                className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 px-4 py-2 text-xs font-medium min-w-fit snap-start transition-all hover:border-blue-300 dark:hover:border-blue-500/50"
                                                            >
                                                                {subAgent.name}
                                                            </TabsTrigger>
                                                        ))}
                                                    </TabsList>
                                                </div>
                                            </div>

                                            {subagentsList.map((subAgent, index) => (
                                                <TabsContent key={index} value={`subagent-${index}`} className="mt-0 animate-in fade-in-50 slide-in-from-top-1">
                                                    <div className="rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#151515] text-card-foreground shadow-sm p-5 space-y-4 hover:border-blue-200 dark:hover:border-blue-500/20 transition-colors">
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                                                                    <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{subAgent.name}</h4>
                                                                    <span className="text-xs text-muted-foreground font-mono">{subAgent.model}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-3 rounded-lg border border-slate-100 dark:border-white/5">
                                                                {subAgent.instructions || <span className="italic">No instructions.</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TabsContent>
                                            ))}
                                        </Tabs>
                                    ) : (
                                        <div className="p-8 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 text-center flex flex-col items-center gap-2 text-muted-foreground bg-slate-50/50 dark:bg-white/5">
                                            <Bot className="h-8 w-8 opacity-20" />
                                            <p className="text-sm">No sub-agents configured.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="publish" className="flex-1 overflow-y-auto p-6 mt-0 outline-none">
                                {/* Publish Section */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                        <Globe className="h-3 w-3" />
                                        Publish Settings
                                    </Label>
                                    <div className="p-4 rounded-xl bg-white dark:bg-[#151515] border border-slate-200 dark:border-white/5 shadow-sm">
                                        {onUpdate ? (
                                            <PublishSettings agent={agent} onUpdate={onUpdate} />
                                        ) : (
                                            <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg">
                                                Update functionality not available. Please refresh the page.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>


                        <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f0f0f] flex justify-between gap-4">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500">
                                Close
                            </Button>
                            <Button
                                onClick={() => {
                                    onOpenChange(false);
                                    onRun(agent);
                                }}
                                className="flex-1 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20"
                            >
                                <Play className="h-4 w-4 mr-2" />
                                Run Agent
                            </Button>
                        </div>

                    </div>
                )}
            </ResizableSheetContent>
        </Sheet >
    );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bot, Play, Settings2, Trash2, Info } from "lucide-react";
import type { Agent } from './types';

interface AgentCardProps {
    agent: Agent;
    onEdit: (agent: Agent) => void;
    onDelete: (agentId: string) => void;
    onRun: (agent: Agent) => void;
    onInfo: (agent: Agent) => void;
}

export function AgentCard({ agent, onEdit, onDelete, onRun, onInfo }: AgentCardProps) {
    return (
        <Card className="group hover:shadow-md transition-all border-l-primary/50">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Bot className="h-5 w-5 text-primary" />
                        {agent.name}
                    </CardTitle>
                    <div className="flex gap-1 group-hover:opacity-100 opacity-0 transition-opacity">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onInfo(agent)}>
                                        <Info className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Agent Info</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(agent)}>
                                        <Settings2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Agent</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        {!((agent.visibility === 'public' || (agent as any).is_public)) && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50" onClick={() => onDelete(agent.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete Agent</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>
                <CardDescription className="line-clamp-1 text-xs font-mono bg-muted/50 w-fit px-2 py-0.5 rounded">
                    {agent.model}
                </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground line-clamp-3 min-h-18">
                    {agent.instructions || "No specific instructions provided."}
                </p>
            </CardContent>
            <CardFooter className="pt-3 border-t bg-muted/5 gap-2">
                <Button className="w-full gap-2" variant="default" onClick={() => onRun(agent)}>
                    <Play className="h-4 w-4" />
                    Run Agent
                </Button>
            </CardFooter>
        </Card>
    );
}

import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { API_URL } from './api/apiurl';
import { getServices } from './api/connectionlist';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Plus, Loader2, Play, Settings2, Trash2, Key, Terminal, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { APP_DEFINITIONS } from './Automation/metadata';
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, } from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  instructions: string;
  model: string;
  created_at?: string;
  tools?: { name: string; piece: string; action: string; }[];
}

interface ConnectionOption {
  id: string;
  name: string;
  service: string;
}

interface RunAgentDialogProps {
    agent: Agent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId?: string;
}

function RunAgentDialog({ agent, open, onOpenChange, userId }: RunAgentDialogProps) {
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

export default function Agents() {
  const { user } = useUser();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Run Agent State
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null); // Track agent being edited
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [model, setModel] = useState('mistralai/mistral-7b-instruct:free');
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  
  // Data for Dropdown
  const [connections, setConnections] = useState<ConnectionOption[]>([]);

  useEffect(() => {
    fetchAgents();
    if (user?.id) {
      loadConnections();
    }
  }, [user?.id]);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/agents`);
      if (response.ok) {
        const data = await response.json();
        setAgents(Array.isArray(data) ? data : []);
      } else {
         console.error("Failed to fetch agents");
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to load agents");
    } finally {
      setIsLoading(false);
    }
  };

  const loadConnections = async () => {
    try {
      if (!user?.id) return;
      const data = await getServices(user.id);
      const services = data.data || [];
      const options: ConnectionOption[] = [];
      
      services.forEach((service: any) => {
        // Filter for OpenRouter services (checking id 'openrouter' or name 'AI'/'OpenRouter')
        const isOpenRouter = (service.id === 'openrouter') || 
                             (service.name && service.name.toLowerCase().includes('openrouter')) ||
                             (service.name === 'AI'); // OpenRouter uses name 'AI' in metadata

        if (isOpenRouter && service.accounts && Array.isArray(service.accounts)) {
          service.accounts.forEach((acc: any) => {
            options.push({
              id: acc.id,
              name: acc.username || acc.id,
              service: service.name // Keep original name for display
            });
          });
        }
      });
      setConnections(options);
    } catch (error) {
      console.error("Error loading connections:", error);
    }
  };

  const handleCreateAgent = async () => {
    if (!name.trim()) {
      toast.error("Agent name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { 
          name, 
          instructions, 
          model, 
          userId: user?.id, 
          connectionId: selectedConnection,
          tools: selectedTools.map(t => {
            const [piece, actionId] = t.split(':');
            const app = APP_DEFINITIONS.find(a => a.id === piece);
            const action = app?.actions.find(a => a.id === actionId);
            return {
                name: action?.name || actionId,
                piece: piece,
                action: actionId
            };
          })
      };

      let response;
      if (editingAgent) {
         // Update existing agent
         response = await fetch(`${API_URL}/api/v1/agents/${editingAgent.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
         });
      } else {
         // Create new agent
         response = await fetch(`${API_URL}/api/v1/agents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
         });
      }

      if (response.ok) {
        if (editingAgent) {
            const updatedAgent = await response.json();
            setAgents(agents.map(a => a.id === updatedAgent.id ? updatedAgent : a));
            toast.success("Agent updated successfully");
        } else {
            const newAgent = await response.json();
            setAgents([newAgent, ...agents]);
            toast.success("Agent created successfully");
        }
        setIsModalOpen(false);
        resetForm();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to save agent");
      }
    } catch (error) {
      console.error("Error saving agent:", error);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setInstructions('');
    setModel('');
    setSelectedConnection('');
    setSelectedTools([]);
    setEditingAgent(null); // Clear editing state
  };

  const handleEditClick = (agent: Agent) => {
    setEditingAgent(agent);
    setName(agent.name);
    setInstructions(agent.instructions);
    setModel(agent.model);
    setSelectedTools(agent.tools?.map(t => `${t.piece}:${t.action}`) || []);
    // Note: connectionId isn't on the Agent interface yet, but if it were, we'd set it here.
    // For now, user might need to re-select connection if they edit, or we need to return it from API.
    setIsModalOpen(true);
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) return;

    try {
        const response = await fetch(`${API_URL}/api/v1/agents/${agentId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            setAgents(agents.filter(a => a.id !== agentId));
            toast.success("Agent deleted successfully");
        } else {
            toast.error("Failed to delete agent");
        }
    } catch (error) {
        console.error("Error deleting agent:", error);
        toast.error("Something went wrong");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Bot className="h-8 w-8" />
             </div>
             <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
                <p className="text-muted-foreground">Cancel, create, and manage your autonomous agents.</p>
             </div>
          </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchAgents} disabled={isLoading}>
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button className="gap-2 shadow-lg">
                        <Plus className="h-4 w-4" />
                        Create Agent
                    </Button>
                </DialogTrigger>
            </Dialog>
        </div>
        <Dialog open={isModalOpen} onOpenChange={(open) => {
            if (!open) resetForm(); // Reset on close
            setIsModalOpen(open);
        }}>
             <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{editingAgent ? "Edit Agent" : "Create New Agent"}</DialogTitle>
                    <DialogDescription>
                        {editingAgent ? "Update your agent's configuration." : "Configure your agent's personality and capabilities."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Agent Name *</Label>
                        <Input 
                            id="name" 
                            placeholder="e.g. Support Bot" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="model">Model</Label>
                        <Input 
                            id="model" 
                            placeholder="e.g. openai/gpt-4-turbo" 
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground">Enter the OpenRouter model ID (e.g. anthropic/claude-3-opus)</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="connection">API Connection (Optional)</Label>
                        <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an API Key/Connection" />
                            </SelectTrigger>
                            <SelectContent>
                                {connections.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground text-center">No connections found</div>
                                ) : (
                                    connections.map(conn => (
                                        <SelectItem key={conn.id} value={conn.id}>
                                            <div className="flex items-center gap-2">
                                                <Key className="h-3 w-3 text-muted-foreground" />
                                                <span>{conn.name}</span>
                                                <span className="text-xs text-muted-foreground">({conn.service})</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">Select an existing connection or API key for this agent to use.</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="instructions">System Instructions</Label>
                        <Textarea 
                            id="instructions" 
                            placeholder="You are a helpful assistant..." 
                            className="h-32 resize-none"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Tools (Optional)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="justify-between w-full font-normal">
                                    {selectedTools.length > 0 ? `${selectedTools.length} tools selected` : "Select tools..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search tools..." />
                                    <CommandList>
                                        <CommandEmpty>No tools found.</CommandEmpty>
                                        {APP_DEFINITIONS.filter(app => app.category === 'app').map(app => {
                                            const actions = app.actions.filter(action => action.type === 'action' && action.id !== 'run_agent');
                                            if (actions.length === 0) return null;
                                            
                                            return (
                                                <CommandGroup key={app.id} heading={app.name}>
                                                    {actions.map(action => {
                                                        const toolId = `${app.id}:${action.id}`;
                                                        const isSelected = selectedTools.includes(toolId);
                                                        return (
                                                            <CommandItem
                                                                key={toolId}
                                                                value={`${app.name} ${action.name}`}
                                                                onSelect={() => {
                                                                    if (isSelected) {
                                                                        setSelectedTools(selectedTools.filter(t => t !== toolId));
                                                                    } else {
                                                                        setSelectedTools([...selectedTools, toolId]);
                                                                    }
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Checkbox 
                                                                        checked={isSelected}
                                                                        onCheckedChange={() => {}} // Handled by CommandItem onSelect
                                                                        className="pointer-events-none"
                                                                    />
                                                                    <span>{action.name}</span>
                                                                </div>
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            );
                                        })}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        
                        {/* Selected Tools Badges */}
                        {selectedTools.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {selectedTools.map(toolId => {
                                    const [appId, actionId] = toolId.split(':');
                                    const app = APP_DEFINITIONS.find(a => a.id === appId);
                                    const action = app?.actions.find(a => a.id === actionId);
                                    return (
                                        <Badge key={toolId} variant="secondary" className="gap-1 pr-1">
                                            {app?.name}: {action?.name}
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-3 w-3 hover:bg-muted ml-1 rounded-full p-0"
                                                onClick={() => setSelectedTools(selectedTools.filter(t => t !== toolId))}
                                            >
                                                <X className="h-2 w-2" />
                                            </Button>
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" disabled={isSubmitting} onClick={resetForm}>Reset</Button>
                    <Button onClick={handleCreateAgent} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingAgent ? "Save Changes" : "Create Agent"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
                <Card key={i} className="bg-muted/20 border-dashed animate-pulse">
                    <CardHeader className="h-24"></CardHeader>
                    <CardContent className="h-20"></CardContent>
                </Card>
            ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 rounded-3xl border-2 border-dashed">
            <div className="bg-muted p-4 rounded-full mb-4">
                <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No Agents Created</h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                Create your first autonomous agent to start automating tasks with AI.
            </p>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>Create Agent</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
                <Card key={agent.id} className="group hover:shadow-md transition-all border-l-primary/50">
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
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEditClick(agent)}>
                                                <Settings2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Edit Agent</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleDeleteAgent(agent.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Delete Agent</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                        <CardDescription className="line-clamp-1 text-xs font-mono bg-muted/50 w-fit px-2 py-0.5 rounded">
                            {agent.model}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                        <p className="text-sm text-muted-foreground line-clamp-3 min-h-[4.5rem]">
                            {agent.instructions || "No specific instructions provided."}
                        </p>
                    </CardContent>
                    <CardFooter className="pt-3 border-t bg-muted/5 gap-2">
                         <Button className="w-full gap-2" variant="default" onClick={() => {
                                setSelectedAgent(agent);
                                setIsRunModalOpen(true);
                            }}>
                            <Play className="h-4 w-4" />
                            Run Agent
                         </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      )}

      {/* Run Agent Modal */}
      <RunAgentDialog 
        agent={selectedAgent} 
        open={isRunModalOpen} 
        onOpenChange={setIsRunModalOpen} 
        userId={user?.id}
      />
    </div>
  );
}

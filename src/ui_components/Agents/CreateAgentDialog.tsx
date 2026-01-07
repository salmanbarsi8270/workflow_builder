import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronsUpDown, X, Key } from "lucide-react";
import { toast } from "sonner";
import { APP_DEFINITIONS } from '../Automation/metadata';
import { API_URL } from '../api/apiurl';
import type { Agent, ConnectionOption } from './types';

interface CreateAgentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialAgent: Agent | null; // If valid, we are editing
    userId?: string;
    connections: ConnectionOption[];
    onSuccess: (agent: Agent, isEdit: boolean) => void;
}

export function CreateAgentDialog({ open, onOpenChange, initialAgent, userId, connections, onSuccess }: CreateAgentDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form State
    const [name, setName] = useState('');
    const [instructions, setInstructions] = useState('');
    const [model, setModel] = useState('mistralai/mistral-7b-instruct:free');
    const [selectedConnection, setSelectedConnection] = useState<string>('');
    const [selectedTools, setSelectedTools] = useState<string[]>([]);
    const [apiKey, setApiKey] = useState<string>('');
    
    useEffect(() => {
        if (open) {
            if (initialAgent) {
                // Edit Mode
                setName(initialAgent.name);
                setInstructions(initialAgent.instructions);
                setModel(initialAgent.model);
                setSelectedTools(initialAgent.tools?.map(t => `${t.piece}:${t.action}`) || []);
                // Ensure connection logic is handled if backend returns it
            } else {
                // Create Mode
                resetForm();
            }
        }
    }, [open, initialAgent]);

    const resetForm = () => {
        setName('');
        setInstructions('');
        setModel('mistralai/mistral-7b-instruct:free');
        setSelectedConnection('');
        setSelectedTools([]);
    };

    async function getapikey(id:string) {
        if (!id) return '';
        const response = await fetch(`${API_URL}/api/openrouter/key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await response.json();
        return data.apiKey;
    }

    useEffect(() => {
        if (selectedConnection) {
            getapikey(selectedConnection).then(apiKey => setApiKey(apiKey));
        }
    }, [selectedConnection]);

    const handleSave = async () => {
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
              apiKey,
              userId: userId, 
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
          if (initialAgent) {
             // Update existing agent
             response = await fetch(`${API_URL}/api/v1/agents/${initialAgent.id}`, {
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
            const savedAgent = await response.json();
            toast.success(initialAgent ? "Agent updated successfully" : "Agent created successfully");
            onSuccess(savedAgent, !!initialAgent);
            onOpenChange(false);
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
             <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{initialAgent ? "Edit Agent" : "Create New Agent"}</DialogTitle>
                    <DialogDescription>
                        {initialAgent ? "Update your agent's configuration." : "Configure your agent's personality and capabilities."}
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
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialAgent ? "Save Changes" : "Create Agent"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

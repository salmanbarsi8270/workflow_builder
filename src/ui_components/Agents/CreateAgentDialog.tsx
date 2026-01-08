
import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronsUpDown, X, Key, Bot, Terminal, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import ConnectionSelector from "@/ui_components/Connections/ConnectionSelector";
import { APP_DEFINITIONS } from '../Automation/metadata';
import { API_URL } from '../api/apiurl';
import type { Agent, ConnectionOption, MCPConfig } from './types';

interface CreateAgentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialAgent: Agent | null; // If valid, we are editing
    userId?: string;
    connections: ConnectionOption[];
    onSuccess: (agent: Agent, isEdit: boolean) => void;
    availableAgents: Agent[];
}

export function CreateAgentDialog({ open, onOpenChange, initialAgent, userId, connections, onSuccess, availableAgents }: CreateAgentDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [instructions, setInstructions] = useState('');
    const [model, setModel] = useState('');
    const [selectedConnection, setSelectedConnection] = useState<string>('');
    const [selectedTools, setSelectedTools] = useState<{ toolId: string; connectionId?: string }[]>([]);
    const [selectedSubAgents, setSelectedSubAgents] = useState<string[]>([]);
    const [api_key, setApiKey] = useState<string>('');
    const [mcpTools, setMcpTools] = useState<MCPConfig[]>([]);

    // Flattened agents list for easier lookup and selection
    const allAvailableAgents = useMemo(() => {
        const flat: Agent[] = [];
        const seen = new Set<string>();

        const traverse = (list: Agent[]) => {
            if (!list || !Array.isArray(list)) return;
            list.forEach(agent => {
                if (!seen.has(agent.id)) {
                    flat.push(agent);
                    seen.add(agent.id);
                }
                const sub = agent.sub_agents || agent.subagents;
                if (sub && Array.isArray(sub)) {
                    traverse(sub);
                }
            });
        };

        traverse(availableAgents);
        return flat;
    }, [availableAgents]);

    useEffect(() => {
        if (open) {
            if (initialAgent) {
                // Edit Mode
                setName(initialAgent.name);
                setInstructions(initialAgent.instructions);
                setModel(initialAgent.model);
                const standardTools = initialAgent.tools
                    ?.filter(t => !t.mcpConfig && t.piece && t.piece !== 'undefined')
                    .map(t => ({
                        toolId: `${t.piece}:${t.action}`,
                        connectionId: t.connectionId
                    })) || [];
                setSelectedTools(standardTools);
                const subAgents = initialAgent.sub_agents || initialAgent.subagents || [];
                setSelectedSubAgents(subAgents.map(a => a.id) || []);
                setApiKey(initialAgent.api_key || '');
                setSelectedConnection(initialAgent.connectionId || initialAgent.connection_id || '');

                // Load existing MCP tools if any
                const existingMcpTools = initialAgent.tools
                    ?.filter(t => t.mcpConfig)
                    .map(t => t.mcpConfig as MCPConfig) || [];
                setMcpTools(existingMcpTools);

            } else {
                // Create Mode
                resetForm();
            }
        }
    }, [open, initialAgent]);

    const resetForm = () => {
        setName('');
        setInstructions('');
        setModel('');
        setSelectedConnection('');
        setSelectedTools([]);
        setSelectedSubAgents([]);
        setMcpTools([]);
    };

    async function getapikey(id: string) {
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

    const hasMissingRequiredConnections = selectedTools.some(tool => {
        const [appId, actionId] = tool.toolId.split(':');
        const app = APP_DEFINITIONS.find(a => a.id === appId);
        const action = app?.actions.find(a => a.id === actionId);

        const requiresConnection = action?.parameters?.some(p => p.type === 'connection');

        return requiresConnection && !tool.connectionId;
    });

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Agent name is required");
            return;
        }

        if (hasMissingRequiredConnections) {
            toast.error("Please select required connections for all tools");
            return;
        }

        setIsSubmitting(true);
        try {
            // Merge standard tools and MCP tools
            const standardTools = selectedTools.map(t => {
                const [piece, actionId] = t.toolId.split(':');
                const app = APP_DEFINITIONS.find(a => a.id === piece);
                const action = app?.actions.find(a => a.id === actionId);
                return {
                    name: action?.name || actionId,
                    piece: piece,
                    action: actionId,
                    connectionId: t.connectionId
                };
            });

            const formattedMcpTools = mcpTools.map(config => ({
                mcpConfig: config
            }));

            const payload = {
                name,
                instructions,
                model,
                api_key: api_key,
                connectionId: selectedConnection,
                userId: userId,
                sub_agents: selectedSubAgents,
                tools: [...standardTools, ...formattedMcpTools]
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

    const addMcpTool = () => {
        setMcpTools([...mcpTools, { name: '', type: 'streamable-http', url: '' }]);
    };

    const updateMcpTool = (index: number, field: keyof MCPConfig, value: string) => {
        const newTools = [...mcpTools];
        newTools[index] = { ...newTools[index], [field]: value };
        setMcpTools(newTools);
    };

    const removeMcpTool = (index: number) => {
        setMcpTools(mcpTools.filter((_, i) => i !== index));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
                <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-blue-600 to-indigo-600" />
                <DialogHeader className="p-0 mb-4 shrink-0">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                            <Bot className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        {initialAgent ? "Edit Agent" : "Create New Agent"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                        {initialAgent ? "Update your agent's configuration." : "Configure your agent's personality and capabilities."}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2 grid gap-5 py-2 pl-2">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-slate-700 dark:text-white font-medium">Agent Name <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            placeholder="e.g. Support Bot"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 focus-visible:ring-blue-500 font-medium"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="instructions" className="text-slate-700 dark:text-white font-medium">System Instructions <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="instructions"
                            placeholder="You are a helpful assistant..."
                            className="h-32 resize-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 focus-visible:ring-blue-500 font-mono text-sm leading-relaxed"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="model" className="text-slate-700 dark:text-white font-medium">Model ID <span className="text-red-500">*</span></Label>
                        <Input
                            id="model"
                            placeholder="e.g. openai/gpt-4-turbo"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 focus-visible:ring-blue-500 text-xs font-mono"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="connection" className="text-slate-700 dark:text-white font-medium">AI Service Connection (OpenRouter) <span className="text-red-500">*</span></Label>
                        <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                            <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 focus:ring-blue-500">
                                <SelectValue placeholder="Select Connection" />
                            </SelectTrigger>
                            <SelectContent>
                                {connections.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground text-center">No connections found</div>
                                ) : (
                                    connections.map(conn => (
                                        <SelectItem key={conn.id} value={conn.id}>
                                            <div className="flex items-center gap-2 max-w-[180px]">
                                                <Key className="h-3 w-3 text-blue-500" />
                                                <span className="truncate">{conn.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-slate-700 dark:text-white font-medium">Tools</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="justify-between w-full font-normal bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5">
                                    {selectedTools.length > 0 ? (
                                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300">
                                            <Terminal className="h-4 w-4" />
                                            <span className="font-semibold">{selectedTools.length} tools selected</span>
                                        </div>
                                    ) : (
                                        "Select capabilities..."
                                    )}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[450px] p-0" align="start">
                                <Command className="border rounded-lg shadow-xl">
                                    <CommandInput placeholder="Search available tools..." />
                                    <CommandList className="max-h-[300px]">
                                        <CommandEmpty>No tools found.</CommandEmpty>
                                        {APP_DEFINITIONS.filter(app => app.category === 'app').map(app => {
                                            const actions = app.actions.filter(action => action.type === 'action' && action.id !== 'run_agent');
                                            if (actions.length === 0) return null;

                                            return (
                                                <CommandGroup key={app.id} heading={app.name}>
                                                    {actions.map(action => {
                                                        const toolId = `${app.id}:${action.id}`;
                                                        const isSelected = selectedTools.some(t => t.toolId === toolId);
                                                        return (
                                                            <CommandItem
                                                                key={toolId}
                                                                value={`${app.name} ${action.name}`}
                                                                onSelect={() => {
                                                                    if (isSelected) {
                                                                        setSelectedTools(selectedTools.filter(t => t.toolId !== toolId));
                                                                    } else {
                                                                        setSelectedTools([...selectedTools, { toolId }]);
                                                                    }
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <div className={`
                                                                        w-4 h-4 rounded border flex items-center justify-center transition-colors
                                                                        ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'}
                                                                    `}>
                                                                        {isSelected && <X className="h-3 w-3 rotate-45" />}
                                                                    </div>
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

                        {/* Selected Tools List with Connection Selection */}
                        {selectedTools.length > 0 && (
                            <div className="flex flex-col gap-2 mt-2 max-h-[200px] overflow-y-auto">
                                {selectedTools.map((tool, idx) => {
                                    const [appId, actionId] = tool.toolId.split(':');
                                    const app = APP_DEFINITIONS.find(a => a.id === appId);
                                    const action = app?.actions.find(a => a.id === actionId);

                                    // Check if the action requires a connection
                                    const actionRequiresConnection = action?.parameters?.some(p => p.type === 'connection');
                                    const isMissing = actionRequiresConnection && !tool.connectionId;

                                    return (
                                        <div key={tool.toolId} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 group hover:border-blue-200 dark:hover:border-blue-500/30 transition-all">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Badge variant="secondary" className="bg-blue-100/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20">
                                                    {app?.name}
                                                </Badge>
                                                <span className="font-medium text-slate-700 dark:text-slate-200">{action?.name}</span>
                                            </div>

                                            <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                                                {/* Connection Selector for Tool */}
                                                {actionRequiresConnection && (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="w-[200px]">
                                                            <ConnectionSelector
                                                                appName={app?.id || ''}
                                                                value={tool.connectionId || ''}
                                                                onChange={(val) => {
                                                                    const newTools = [...selectedTools];
                                                                    newTools[idx].connectionId = val;
                                                                    setSelectedTools(newTools);
                                                                }}
                                                                hasError={isMissing}
                                                            />
                                                        </div>
                                                        {isMissing && (
                                                            <span className="text-[10px] text-red-500 font-medium">
                                                                Connection required
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full shrink-0"
                                                    onClick={() => setSelectedTools(selectedTools.filter(t => t.toolId !== tool.toolId))}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* MCP Configuration Section */}
                    <div className="grid gap-2">
                        <Label className="text-slate-700 dark:text-white font-medium flex justify-between items-center">
                            <span>MCP Servers (External Tools)</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={addMcpTool}
                                    className="h-6 px-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                >
                                <Plus className="h-3 w-3 mr-1" /> Add Server
                            </Button>
                        </Label>

                        {mcpTools.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {mcpTools.map((tool, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg flex flex-col gap-2 relative group">
                                        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-400 hover:text-red-500"
                                                onClick={() => removeMcpTool(idx)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Server Name</Label>
                                                <Input
                                                    className="h-8 text-sm"
                                                    placeholder="e.g. Zapier"
                                                    value={tool.name}
                                                    onChange={(e) => updateMcpTool(idx, 'name', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs text-muted-foreground">Type</Label>
                                                <Select
                                                    value={tool.type}
                                                    onValueChange={(val: any) => updateMcpTool(idx, 'type', val)}
                                                >
                                                    <SelectTrigger className="h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="sse">SSE</SelectItem>
                                                        <SelectItem value="streamable-http">Streamable HTTP</SelectItem>
                                                        <SelectItem value="http">HTTP</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Server URL</Label>
                                            <Input
                                                className="h-8 text-sm font-mono"
                                                placeholder="https://..."
                                                value={tool.url}
                                                onChange={(e) => updateMcpTool(idx, 'url', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 italic text-center py-2 border border-dashed rounded-lg">
                                No external MCP servers configured
                            </div>
                        )}
                    </div>

                    {/* Sub-Agents Selection */}
                    <div className="grid gap-2">
                        <Label className="text-slate-700 dark:text-white font-medium">Sub-Agents</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="justify-between w-full font-normal bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5">
                                    {selectedSubAgents.length > 0 ? (
                                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300">
                                            <Bot className="h-4 w-4" />
                                            <span className="font-semibold">{selectedSubAgents.length} sub-agents selected</span>
                                        </div>
                                    ) : (
                                        "Select sub-agents..."
                                    )}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[450px] p-0" align="start">
                                <Command className="border rounded-lg shadow-xl">
                                    <CommandInput placeholder="Search agents..." />
                                    <CommandList className="max-h-[300px]">
                                        <CommandEmpty>No agents found.</CommandEmpty>
                                        <CommandGroup heading="Available Agents">
                                            {allAvailableAgents
                                                .filter(a => a.id !== initialAgent?.id) // Prevent self-selection
                                                .map(agent => {
                                                    const isSelected = selectedSubAgents.includes(agent.id);
                                                    return (
                                                        <CommandItem
                                                            key={agent.id}
                                                            value={agent.name}
                                                            onSelect={() => {
                                                                if (isSelected) {
                                                                    setSelectedSubAgents(selectedSubAgents.filter(id => id !== agent.id));
                                                                } else {
                                                                    setSelectedSubAgents([...selectedSubAgents, agent.id]);
                                                                }
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2 flex-1">
                                                                <div className={`
                                                                w-4 h-4 rounded border flex items-center justify-center transition-colors
                                                                ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'}
                                                            `}>
                                                                    {isSelected && <X className="h-3 w-3 rotate-45" />}
                                                                </div>
                                                                <span>{agent.name}</span>
                                                                <span className="ml-auto text-xs text-muted-foreground">{agent.model}</span>
                                                            </div>
                                                        </CommandItem>
                                                    );
                                                })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {/* Selected Sub-Agents List */}
                        {selectedSubAgents.length > 0 && (
                            <div className="flex flex-col gap-2 mt-2 max-h-[150px] overflow-y-auto">
                                {selectedSubAgents.map(agentId => {
                                    const agent = allAvailableAgents.find(a => a.id === agentId);
                                    if (!agent) return null;
                                    return (
                                        <div key={agent.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 group hover:border-blue-200 dark:hover:border-blue-500/30 transition-all">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Badge variant="secondary" className="bg-blue-100/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20">
                                                    Agent
                                                </Badge>
                                                <span className="font-medium text-slate-700 dark:text-slate-200">{agent.name}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full shrink-0"
                                                onClick={() => setSelectedSubAgents(selectedSubAgents.filter(id => id !== agent.id))}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
                <DialogFooter className="mt-4 gap-2 shrink-0">
                    <Button variant="ghost" disabled={isSubmitting} onClick={resetForm} className="hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500">
                        Reset
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={
                            isSubmitting || 
                            !name.trim() || 
                            !instructions.trim() || 
                            !model.trim() || 
                            !selectedConnection ||
                            hasMissingRequiredConnections
                        }
                        className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 rounded-lg px-6"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialAgent ? "Save Changes" : "Create Agent"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

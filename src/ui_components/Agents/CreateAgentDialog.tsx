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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ChevronsUpDown, X, Key, Bot, Terminal, Plus, Upload, FileText, Palette } from "lucide-react";
import { toast } from "sonner";
import ConnectionSelector from "@/ui_components/Connections/ConnectionSelector";
import { usePieces } from "@/context/PieceContext";
import { McpToolConfig } from './McpToolConfig';
import { API_URL } from '../api/apiurl';
import type { Agent, ConnectionOption, MCPConfig } from './types';
import type { AutomationItem } from '../Automation/components/AutomationList';
import { Workflow as WorkflowIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface CreateAgentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialAgent: Agent | null; // If valid, we are editing
    userId?: string;
    connections: ConnectionOption[];
    mcpConnections?: ConnectionOption[];
    onSuccess: (agent: Agent, isEdit: boolean) => void;
    availableAgents: Agent[];
    availableWorkflows?: AutomationItem[];
}

export function CreateAgentDialog({
    open,
    onOpenChange,
    initialAgent,
    userId,
    connections,
    mcpConnections = [],
    onSuccess,
    availableAgents,
    availableWorkflows
}: CreateAgentDialogProps) {
    const { pieces } = usePieces();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ... (state definitions remain same)
    const [name, setName] = useState('');
    const [instructions, setInstructions] = useState('');
    const [model, setModel] = useState('');
    const [selectedConnection, setSelectedConnection] = useState<string>('');
    const [selectedTools, setSelectedTools] = useState<{ toolId: string; connectionId?: string }[]>([]);
    const [selectedSubAgents, setSelectedSubAgents] = useState<string[]>([]);
    const [api_key, setApiKey] = useState<string>('');
    const [mcpTools, setMcpTools] = useState<MCPConfig[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    // ... previous code ...
    const [existingFiles, setExistingFiles] = useState<{ filename: string; count: number }[]>([]);

    // Guardrails State
    const [enableGuardrails, setEnableGuardrails] = useState(false);
    // Keep internal bannedWords for Edit mode persistence if needed, but UI is hidden
    const [bannedWords, setBannedWords] = useState<string[]>([]);

    // UI Design State
    const [uiDesigns, setUiDesigns] = useState<any[]>([]); // Using any for simplicity in dialog, strictly typed in Design module
    const [selectedUiDesign, setSelectedUiDesign] = useState<string>('');

    // Fetch UI Designs
    useEffect(() => {
        if (open && userId) {
            fetch(`${API_URL}/api/v1/ui-designs?userId=${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setUiDesigns(data);
                    }
                })
                .catch(err => console.error("Error fetching UI designs:", err));
        }
    }, [open, userId]);

    // Flattened agents list for easier lookup and selection
    const allAvailableAgents = useMemo(() => {
        // Keep agents in tree format for recursive rendering
        return availableAgents;
    }, [availableAgents]);

    useEffect(() => {
        if (open) {
            if (initialAgent) {
                // Edit Mode
                setName(initialAgent.name);
                setInstructions(initialAgent.instructions);
                setModel(initialAgent.model);
                const standardTools = initialAgent.tools
                    ?.filter(t => !t.mcpConfig && t.type !== 'workflow' && t.piece && t.piece !== 'undefined')
                    .map(t => ({
                        toolId: `${t.piece}:${t.action}`,
                        connectionId: t.connectionId
                    })) || [];

                const workflowTools = initialAgent.tools
                    ?.filter(t => t.type === 'workflow')
                    .map(t => ({
                        toolId: `workflow:${t.workflowId || (t as any).workflow_id}`,
                    })) || [];

                setSelectedTools([...standardTools, ...workflowTools]);
                const subAgents = initialAgent.sub_agents || initialAgent.subagents || [];
                setSelectedSubAgents(subAgents.map(a => a.id) || []);
                setApiKey(initialAgent.api_key || '');
                setSelectedSubAgents(subAgents.map(a => a.id) || []);
                setApiKey(initialAgent.api_key || '');
                setSelectedConnection(initialAgent.connectionId || initialAgent.connection_id || '');
                setSelectedUiDesign(initialAgent.ui_design_id || ''); // Load UI Design

                // Load existing MCP tools if any
                const existingMcpTools = initialAgent.tools
                    ?.filter(t => t.mcpConfig)
                    .map(t => t.mcpConfig as MCPConfig) || [];
                setMcpTools(existingMcpTools);

                // Fetch existing files
                fetch(`${API_URL}/api/v1/agents/${initialAgent.id}/knowledge?userId=${userId || initialAgent.userId || 'anonymous'}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.documents) {
                            setExistingFiles(data.documents);
                        }
                    })
                    .catch(err => console.error("Error fetching knowledge:", err));

                // Fetch Guardrails
                // Fetch Guardrails
                fetch(`${API_URL}/api/guardrails?agentId=${initialAgent.id}`)
                    .then(res => res.json())
                    .then(data => {
                        const hasBannedWords = data.inputGuardrails?.bannedWords?.length > 0;
                        const hasOutputRules = data.outputGuardrails?.list?.length > 0 || data.outputGuardrails?.emailRedaction;
                        setBannedWords(data.inputGuardrails?.bannedWords || []);
                        setEnableGuardrails(hasBannedWords || hasOutputRules);
                    })
                    .catch(err => console.error("Error fetching guardrails:", err));

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
        setFiles([]);
        setExistingFiles([]);
        setSelectedSubAgents([]);
        setMcpTools([]);
        setFiles([]);
        setExistingFiles([]);
        setBannedWords([]);
        setSelectedUiDesign('');
    };

    // ... existing helper functions (getapikey, handleDeleteFile, etc.) ...

    // ... existing helper functions ...

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

    const handleDeleteFile = async (filename: string) => {
        if (!initialAgent) return;

        if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
            return;
        }

        const toastId = toast.loading("Deleting file...");

        try {
            const response = await fetch(`${API_URL}/api/v1/agents/${initialAgent.id}/knowledge`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId || initialAgent.userId,
                    filename
                })
            });

            if (response.ok) {
                setExistingFiles(prev => prev.filter(f => f.filename !== filename));
                toast.success("File deleted successfully");
            } else {
                const err = await response.json();
                toast.error(err.error || "Failed to delete file");
            }
        } catch (error) {
            console.error("Error deleting file:", error);
            toast.error("Failed to delete file");
        } finally {
            toast.dismiss(toastId);
        }
    };

    useEffect(() => {
        if (selectedConnection) {
            getapikey(selectedConnection).then(apiKey => setApiKey(apiKey));
        }
    }, [selectedConnection]);

    const hasMissingRequiredConnections = selectedTools.some(tool => {
        const [appId, actionId] = tool.toolId.split(':');
        const app = pieces.find(a => a.id === appId);
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
            const formattedTools = selectedTools.map(t => {
                if (t.toolId.startsWith('workflow:')) {
                    const workflowId = t.toolId.replace('workflow:', '');
                    return {
                        type: 'workflow' as const,
                        workflowId: workflowId
                    };
                } else {
                    const [piece, actionId] = t.toolId.split(':');
                    const app = pieces.find(a => a.id === piece);
                    const action = app?.actions.find(a => a.id === actionId);
                    return {
                        name: action?.name || actionId,
                        type: 'piece' as const,
                        piece: piece,
                        action: actionId,
                        connectionId: t.connectionId
                    };
                }
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
                tools: [...formattedTools, ...formattedMcpTools],
                ui_design_id: selectedUiDesign // Add to payload
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

                // Handle Guardrails Save
                // Handle Guardrails Save
                try {
                    const defaultOutputConfig = enableGuardrails ? {
                        list: [{ type: 'email', config: { replacement: '[hidden-email]' } }],
                        emailRedaction: true
                    } : { list: [], emailRedaction: false };

                    const defaultInputConfig = enableGuardrails ? {
                        bannedWords: bannedWords
                    } : { bannedWords: [] };

                    await fetch(`${API_URL}/api/guardrails`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            agentId: savedAgent.id,
                            inputGuardrails: defaultInputConfig,
                            outputGuardrails: defaultOutputConfig
                        })
                    });
                } catch (grError) {
                    console.error("Error saving guardrails:", grError);
                    toast.error("Agent saved, but Failed to save Guardrails");
                }

                // Handle File Uploads (Knowledge Base)
                if (files.length > 0) {
                    const uploader = toast.loading("Uploading knowledge base files...");
                    try {
                        const chunks = files.map(async (file) => {
                            const formData = new FormData();
                            formData.append('agentId', savedAgent.id);
                            formData.append('userId', userId || savedAgent.userId || 'anonymous');
                            formData.append('file', file);

                            const res = await fetch(`${API_URL}/api/v1/agents/${savedAgent.id}/knowledge`, {
                                method: 'POST',
                                body: formData
                            });
                            if (!res.ok) throw new Error('Upload failed');
                            return res;
                        });

                        await Promise.all(chunks);
                        toast.dismiss(uploader);
                        toast.success("Knowledge uploaded successfully");
                    } catch (error) {
                        console.error("Error uploading knowledge:", error);
                        toast.dismiss(uploader);
                        toast.error("Failed to upload knowledge files");
                    }
                }

                toast.success(initialAgent ? "Agent updated successfully" : "Agent created successfully");
                onSuccess(savedAgent, !!initialAgent);
                onOpenChange(false);
                resetForm();
            } else {
                const err = await response.json();
                toast.error(err.error || "Failed to save agent");
                return; // Stop here if agent save failed
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

    // Filter for MCP connections: Use prop if available, otherwise filter from main connections (fallback)
    const effectiveMcpConnections = mcpConnections.length > 0
        ? mcpConnections
        : connections.filter(c => c.service === 'mcp');

    const updateMcpTool = (index: number, newConfig: MCPConfig) => {
        const newTools = [...mcpTools];
        newTools[index] = newConfig;
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
                        <Label htmlFor="ui-design" className="text-slate-700 dark:text-white font-medium">Agent UI Design</Label>
                        <Select value={selectedUiDesign} onValueChange={setSelectedUiDesign}>
                            <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 focus:ring-blue-500">
                                <SelectValue placeholder="Select a UI Design (Optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none_selected">
                                    <span className="text-slate-500">Default Style</span>
                                </SelectItem>
                                {uiDesigns.map(design => (
                                    <SelectItem key={design.id} value={design.id}>
                                        <div className="flex items-center gap-2">
                                            <Palette className="h-3 w-3 text-purple-500" />
                                            <span>{design.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="knowledge" className="text-slate-700 dark:text-white font-medium flex items-center justify-between">
                            <span>Knowledge Base (RAG)</span>
                            <Badge variant="outline" className="text-[10px] font-normal">PDF, Images, Text</Badge>
                        </Label>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                                <Input
                                    id="knowledge"
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setFiles([...files, ...Array.from(e.target.files)]);
                                        }
                                    }}
                                />
                                <Label htmlFor="knowledge" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full border-dashed border-slate-300 dark:border-white/20 hover:border-blue-500 dark:hover:border-blue-400">
                                    <Upload className="mr-2 h-4 w-4" /> Choose Files
                                </Label>
                            </div>

                            {/* Existing Files */}
                            {existingFiles.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <Label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1">Current Files</Label>
                                    {existingFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 text-sm">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                                <span className="truncate max-w-[200px]">{file.filename}</span>
                                                <span className="text-xs text-muted-foreground">({file.count} chunks)</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-400 hover:text-red-500"
                                                onClick={() => handleDeleteFile(file.filename)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* New Files */}
                            {files.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <Label className="text-[10px] uppercase tracking-wider text-green-500 font-bold px-1">New Files to Upload</Label>
                                    {files.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText className="h-4 w-4 text-green-500 shrink-0" />
                                                <span className="truncate max-w-[200px]">{file.name}</span>
                                                <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-400 hover:text-red-500"
                                                onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
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
                                <Command className="border rounded-lg shadow-xl overflow-hidden bg-white dark:bg-slate-950">
                                    <CommandInput placeholder="Search available tools..." className="border-none focus:ring-0" />
                                    <Tabs defaultValue="tools" className="w-full">
                                        <div className="px-4 pt-2 pb-1 border-b dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                                            <TabsList className="grid w-full grid-cols-2 h-9 bg-slate-200/50 dark:bg-slate-800/50 p-1">
                                                <TabsTrigger
                                                    value="tools"
                                                    className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all"
                                                >
                                                    <Terminal className="h-3.5 w-3.5 mr-2" />
                                                    Tools
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="workflows"
                                                    className="text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all"
                                                >
                                                    <WorkflowIcon className="h-3.5 w-3.5 mr-2" />
                                                    Workflows
                                                </TabsTrigger>
                                            </TabsList>
                                        </div>

                                        <CommandList className="max-h-[350px] overflow-y-auto">
                                            <CommandEmpty className="py-6 text-center text-sm text-slate-500">No tools found.</CommandEmpty>

                                            <TabsContent value="tools" className="mt-0">
                                                {pieces.filter((app: any) => app.category === 'app').map((app: any) => {
                                                    const actions = app.actions.filter((action: any) => action.type === 'action' && action.id !== 'run_agent');
                                                    if (actions.length === 0) return null;

                                                    return (
                                                        <CommandGroup key={app.id} heading={app.name} className="px-2">
                                                            {actions.map((action: any) => {
                                                                const toolId = `${app.id}:${action.id}`;
                                                                const isSelected = selectedTools.some(t => t.toolId === toolId);
                                                                return (
                                                                    <CommandItem
                                                                        key={toolId}
                                                                        value={`${app.name} ${action.name}`}
                                                                        className="flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                                                        onSelect={() => {
                                                                            if (isSelected) {
                                                                                setSelectedTools(selectedTools.filter(t => t.toolId !== toolId));
                                                                            } else {
                                                                                setSelectedTools([...selectedTools, { toolId }]);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <div className={`
                                                                            w-4 h-4 rounded border flex items-center justify-center transition-all
                                                                            ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'}
                                                                        `}>
                                                                            {isSelected && <X className="h-3 w-3 rotate-45" />}
                                                                        </div>
                                                                        <span className="text-sm font-medium">{action.name}</span>
                                                                    </CommandItem>
                                                                );
                                                            })}
                                                        </CommandGroup>
                                                    );
                                                })}
                                            </TabsContent>

                                            <TabsContent value="workflows" className="mt-0">
                                                {availableWorkflows && availableWorkflows.length > 0 ? (
                                                    <CommandGroup heading="Available Workflows" className="px-2">
                                                        {availableWorkflows.map((wf: any) => {
                                                            const toolId = `workflow:${wf.id}`;
                                                            const isSelected = selectedTools.some(t => t.toolId === toolId);
                                                            return (
                                                                <CommandItem
                                                                    key={toolId}
                                                                    value={`workflow ${wf.name}`}
                                                                    className="flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                                                    onSelect={() => {
                                                                        if (isSelected) {
                                                                            setSelectedTools(selectedTools.filter(t => t.toolId !== toolId));
                                                                        } else {
                                                                            setSelectedTools([...selectedTools, { toolId }]);
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className={`
                                                                        w-4 h-4 rounded border flex items-center justify-center transition-all
                                                                        ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'}
                                                                    `}>
                                                                        {isSelected && <X className="h-3 w-3 rotate-45" />}
                                                                    </div>
                                                                    <WorkflowIcon className="h-3.5 w-3.5 text-blue-500" />
                                                                    <span className="text-sm font-medium">{wf.name}</span>
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                ) : (
                                                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                                                        <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-full">
                                                            <WorkflowIcon className="h-6 w-6 opacity-40" />
                                                        </div>
                                                        <div className="text-xs font-medium italic">No HTTP-triggered workflows found or Workflows is Not active if not active first activate workflows then try again</div>
                                                    </div>
                                                )}
                                            </TabsContent>
                                        </CommandList>
                                    </Tabs>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {/* Selected Tools List with Connection Selection */}
                        {selectedTools.length > 0 && (
                            <div className="flex flex-col gap-2 mt-2 max-h-[200px] overflow-y-auto">
                                {selectedTools.map((tool, idx) => {
                                    if (tool.toolId.startsWith('workflow:')) {
                                        const workflowId = tool.toolId.replace('workflow:', '');
                                        const wf = availableWorkflows?.find(w => String(w.id) === String(workflowId));
                                        return (
                                            <div key={tool.toolId} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 group hover:border-blue-200 dark:hover:border-blue-500/30 transition-all">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Badge variant="secondary" className="bg-purple-100/50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20">
                                                        Workflow
                                                    </Badge>
                                                    <span className="font-medium text-slate-700 dark:text-slate-200">{wf?.name || 'Unknown Workflow'}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full shrink-0"
                                                    onClick={() => setSelectedTools(selectedTools.filter(t => t.toolId !== tool.toolId))}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    }

                                    const [appId, actionId] = tool.toolId.split(':');
                                    const app = pieces.find(a => a.id === appId);
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
                                                                    const newTools = selectedTools.map((t, i) =>
                                                                        i === idx ? { ...t, connectionId: val } : t
                                                                    );
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
                                    <McpToolConfig
                                        key={idx}
                                        config={tool}
                                        connections={effectiveMcpConnections}
                                        onChange={(newConfig) => updateMcpTool(idx, newConfig)}
                                        onRemove={() => removeMcpTool(idx)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 italic text-center py-2 border border-dashed rounded-lg">
                                No external MCP servers configured
                            </div>
                        )}
                    </div>

                    {/* Guardrails Section */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                        <div className="space-y-0.5">
                            <Label className="text-base font-semibold text-slate-900 dark:text-white">Enable Guardrails</Label>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Automatically redact PII (Email, Phone) and filter content.
                            </p>
                        </div>
                        <Switch
                            checked={enableGuardrails}
                            onCheckedChange={setEnableGuardrails}
                        />
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
                                            {(() => {
                                                const renderAgentOptions = (list: Agent[], level = 0) => {
                                                    if (!list || !Array.isArray(list)) return null;
                                                    return list.map((agent: any) => {
                                                        if (agent.id === initialAgent?.id) return null; // Prevent self-selection
                                                        const isSelected = selectedSubAgents.includes(agent.id);
                                                        const subagentsList = agent.sub_agents || agent.subagents || [];

                                                        return (
                                                            <div key={agent.id}>
                                                                <CommandItem
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
                                                                        {level > 0 && (
                                                                            <div className="flex items-center">
                                                                                {[...Array(level)].map((_, i) => (
                                                                                    <div key={i} className="w-4 h-px bg-muted-foreground/30 mr-1" />
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        <div className={`
                                                                            w-4 h-4 rounded border flex items-center justify-center transition-colors
                                                                            ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'}
                                                                        `}>
                                                                            {isSelected && <X className="h-3 w-3 rotate-45" />}
                                                                        </div>
                                                                        <span className={level > 0 ? "text-slate-500" : "font-medium"}>{agent.name}</span>
                                                                        <span className="ml-auto text-xs text-muted-foreground">{agent.model}</span>
                                                                    </div>
                                                                </CommandItem>
                                                                {subagentsList.length > 0 && renderAgentOptions(subagentsList, level + 1)}
                                                            </div>
                                                        );
                                                    });
                                                };
                                                return renderAgentOptions(allAvailableAgents);
                                            })()}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {/* Selected Sub-Agents List */}
                        {selectedSubAgents.length > 0 && (
                            <div className="flex flex-col gap-2 mt-2 max-h-[150px] overflow-y-auto">
                                {selectedSubAgents.map(agentId => {
                                    // Search in tree recursively
                                    const findInTree = (list: Agent[]): Agent | undefined => {
                                        for (const a of list) {
                                            if (a.id === agentId) return a;
                                            const sub = a.sub_agents || a.subagents;
                                            if (sub) {
                                                const found = findInTree(sub);
                                                if (found) return found;
                                            }
                                        }
                                        return undefined;
                                    };
                                    const agent = findInTree(allAvailableAgents);
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
                            (() => {
                                const isDis = isSubmitting ||
                                    !name.trim() ||
                                    !instructions.trim() ||
                                    !model.trim() ||
                                    !selectedConnection ||
                                    hasMissingRequiredConnections;

                                if (isDis) {
                                    console.log("Save Disabled Reason:", {
                                        isSubmitting,
                                        noName: !name.trim(),
                                        noInst: !instructions.trim(),
                                        noModel: !model.trim(),
                                        noConnection: !selectedConnection,
                                        missingToolConn: hasMissingRequiredConnections
                                    });
                                }
                                return isDis;
                            })()
                        }
                        className="bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 rounded-lg px-6"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialAgent ? "Save Changes" : "Create Agent"}
                    </Button>
                </DialogFooter>
            </DialogContent >
        </Dialog >
    );
}

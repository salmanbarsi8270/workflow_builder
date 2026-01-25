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
import { Loader2, ChevronsUpDown, X, Key, Bot, Terminal, Plus, FileText, Palette, Search, Check, Shield, Mail, Phone, AlertTriangle, MessageSquare, MoreHorizontal, Trash2, Workflow as WorkflowIcon, RefreshCw, UserCircle } from "lucide-react";
import { toast } from "sonner";
import ConnectionSelector from "@/ui_components/Connections/ConnectionSelector";
import { usePieces } from "@/context/PieceContext";
import { McpToolConfig } from './McpToolConfig';
import { API_URL, AI_URL } from '../api/apiurl';
import type { Agent, ConnectionOption, MCPConfig } from './types';
import type { AutomationItem } from '../Automation/components/AutomationList';
import { OpenRouterModel } from '../Utility/openroutermodel';
import { Switch } from "@/components/ui/switch";
import { curatedModels, getOpenRouterModels } from '@/constants/models';

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
    onRefreshConnections?: () => void;
}

interface GuardrailItem {
    type: 'email' | 'phone' | 'sensitive' | 'profanity' | 'maxlength';
    config: Record<string, any>;
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
    availableWorkflows,
    onRefreshConnections
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

    // ... previous code ...
    const [existingFiles, setExistingFiles] = useState<{ filename: string; count: number }[]>([]);

    // Guardrails State
    const [enableGuardrails, setEnableGuardrails] = useState(false);
    const [bannedWords, setBannedWords] = useState<string[]>([]);
    const [newWord, setNewWord] = useState('');
    const [outputGuardrails, setOutputGuardrails] = useState<GuardrailItem[]>([]);
    const [inputGuardrails, setInputGuardrails] = useState<GuardrailItem[]>([]);
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedInputType, setSelectedInputType] = useState<string>('');
    const [ragEnabled, setRagEnabled] = useState(false);
    const [evalsEnabled, setEvalsEnabled] = useState(false);

    // UI Design State
    const [uiDesigns, setUiDesigns] = useState<any[]>([]); // Using any for simplicity in dialog, strictly typed in Design module
    const [selectedUiDesign, setSelectedUiDesign] = useState<string>('');
    const [instructions_library, setInstructionsLibrary] = useState<any[]>([]);
    const [selectedInstructionId, setSelectedInstructionId] = useState<string>('');

    const [showAddModelDialog, setShowAddModelDialog] = useState(false);
    const [modelOpen, setModelOpen] = useState(false);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [activeToolTab, setActiveToolTab] = useState<'connectors' | 'mcp' | 'subagents' | 'workflows'>('connectors');
    const [availableModels, setAvailableModels] = useState<any[]>([]);



    // Fetch models from OpenRouter
    useEffect(() => {
        if (open) {
            const fetchModels = async () => {
                setIsLoadingModels(true);
                try {
                    const allModels = await getOpenRouterModels(api_key);
                    setAvailableModels(allModels);
                } catch (error) {
                    console.error("Error fetching OpenRouter models:", error);
                } finally {
                    setIsLoadingModels(false);
                }
            };
            fetchModels();
        }
    }, [open, api_key]);
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

    // Fetch Instructions from Library
    useEffect(() => {
        if (open && userId) {
            fetch(`${API_URL}/api/v1/ai/personas?userId=${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setInstructionsLibrary(data);
                    }
                })
                .catch(err => console.error("Error fetching instructions library:", err));
        }
    }, [open, userId]);

    // RAG: Fetch Available Files from File Manager
    const [availableFiles, setAvailableFiles] = useState<any[]>([]);
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

    useEffect(() => {
        if (open && userId) {
            fetch(`${API_URL}/api/v1/files?userId=${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setAvailableFiles(data);
                    }
                })
                .catch(err => console.error("Error fetching available files:", err));
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
                setSelectedConnection(initialAgent.connectionId || initialAgent.connection_id || '');
                setSelectedUiDesign(initialAgent.ui_design_id || ''); // Load UI Design

                // Load existing MCP tools if any
                const existingMcpTools = initialAgent.tools
                    ?.filter(t => t.mcpConfig)
                    .map(t => t.mcpConfig as MCPConfig) || [];
                setMcpTools(existingMcpTools);

                // Fetch existing files
                fetch(`${AI_URL}/knowledge/list?agentId=${initialAgent.id}&userId=${userId || initialAgent.userId || 'anonymous'}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.documents) {
                            setExistingFiles(data.documents);
                        }
                    })
                    .catch(err => console.error("Error fetching knowledge:", err));

                // Fetch Guardrails
                fetch(`${API_URL}/api/guardrails?agentId=${initialAgent.id}&userId=${userId}`)
                    .then(res => res.json())
                    .then(data => {
                        const hasBannedWords = data.inputGuardrails?.bannedWords?.length > 0;
                        const list = data.outputGuardrails?.list || [];
                        if (data.outputGuardrails?.emailRedaction && !list.find((i: any) => i.type === 'email')) {
                            list.push({ type: 'email', config: { replacement: '[hidden-email]' } });
                        }
                        const hasOutputRules = list.length > 0;

                        setBannedWords(data.inputGuardrails?.bannedWords || []);
                        setOutputGuardrails(list);
                        setInputGuardrails(data.inputGuardrails?.list || []);

                        // Use explicit flag if available, otherwise fallback to inference
                        const flag = initialAgent.guardrails_enabled !== undefined
                            ? initialAgent.guardrails_enabled
                            : (hasBannedWords || hasOutputRules);
                        setEnableGuardrails(flag);
                        setRagEnabled(initialAgent.rag_enabled !== false);
                        setEvalsEnabled(initialAgent.evals_enabled === true);
                    })
                    .catch(err => console.error("Error fetching guardrails:", err));

            } else {
                // Create Mode
                resetForm();
            }
        }
    }, [open, initialAgent, userId]);

    const resetForm = () => {
        setName('');
        setInstructions('');
        setModel('');
        setSelectedConnection('');
        setSelectedTools([]);
        setSelectedSubAgents([]);
        setMcpTools([]);
        setExistingFiles([]);
        setBannedWords([]);
        setNewWord('');
        setOutputGuardrails([]);
        setInputGuardrails([]);
        setSelectedType('');
        setSelectedInputType('');
        setRagEnabled(false);
        setSelectedUiDesign('');
        setSelectedFileIds([]);
        setEnableGuardrails(false);
        setEvalsEnabled(false);
        setSelectedInstructionId('');
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
            const response = await fetch(`${AI_URL}/knowledge/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: initialAgent.id,
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
                guardrails_enabled: enableGuardrails,
                tools: [...formattedTools, ...formattedMcpTools],
                ui_design_id: selectedUiDesign,
                rag_enabled: ragEnabled,
                rag_file_ids: selectedFileIds, // Send selected file IDs to backend
                evals_enabled: evalsEnabled
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
                try {

                    await fetch(`${API_URL}/api/guardrails`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            agentId: savedAgent.id,
                            userId: userId,
                            inputGuardrails: {
                                bannedWords: bannedWords,
                                list: inputGuardrails
                            },
                            outputGuardrails: { list: outputGuardrails, emailRedaction: false }
                        })
                    });
                } catch (grError) {
                    console.error("Error saving guardrails:", grError);
                    toast.error("Agent saved, but Failed to save Guardrails");
                }

                // NOTE: Direct File Upload Removed in favor of Backend Ingestion via rag_file_ids

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

    // Guardrails Helpers
    const addBannedWord = () => {
        if (newWord.trim() && !bannedWords.includes(newWord.trim())) {
            setBannedWords([...bannedWords, newWord.trim()]);
            setNewWord('');
        }
    };

    const removeBannedWord = (word: string) => {
        setBannedWords(bannedWords.filter(w => w !== word));
    };

    const addOutputGuardrail = () => {
        if (!selectedType) return;
        if (outputGuardrails.find(i => i.type === selectedType)) {
            toast.error("Group already added");
            return;
        }

        const defaults: Record<string, any> = {
            email: { replacement: '[hidden-email]' },
            phone: { replacement: '[hidden-phone]' },
            sensitive: { replacement: '[hidden-number]' },
            profanity: { replacement: '[hidden-profanity]' },
            maxlength: { max: 1000 }
        };

        setOutputGuardrails([...outputGuardrails, {
            type: selectedType as any,
            config: defaults[selectedType] || {}
        }]);
        setSelectedType('');
    };

    const addInputGuardrail = () => {
        if (!selectedInputType) return;
        if (inputGuardrails.find(i => i.type === selectedInputType)) {
            toast.error("Rule already added");
            return;
        }

        const defaults: Record<string, any> = {
            email: { replacement: '[hidden-email]' },
            phone: { replacement: '[hidden-phone]' },
            sensitive: { replacement: '[hidden-number]' },
            profanity: { replacement: '[hidden-profanity]' },
            maxlength: { max: 500 }
        };

        setInputGuardrails([...inputGuardrails, {
            type: selectedInputType as any,
            config: defaults[selectedInputType] || {}
        }]);
        setSelectedInputType('');
    };

    const removeOutputGuardrail = (type: string) => {
        setOutputGuardrails(outputGuardrails.filter(i => i.type !== type));
    };

    const removeInputGuardrail = (type: string) => {
        setInputGuardrails(inputGuardrails.filter(i => i.type !== type));
    };

    const updateGuardrailConfig = (type: string, key: string, value: any) => {
        setOutputGuardrails(outputGuardrails.map(i =>
            i.type === type ? { ...i, config: { ...i.config, [key]: value } } : i
        ));
    };

    const updateInputGuardrailConfig = (type: string, key: string, value: any) => {
        setInputGuardrails(inputGuardrails.map(i =>
            i.type === type ? { ...i, config: { ...i.config, [key]: value } } : i
        ));
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[900px] border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col p-0">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 z-50" />
                    <DialogHeader className="px-6 py-4 border-b dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
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
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-slate-700 dark:text-white font-medium">Agent Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                placeholder="e.g. Support Bot"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 focus-visible:ring-blue-500 font-medium h-10"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="model" className="text-slate-700 dark:text-white font-medium">Model ID <span className="text-red-500">*</span></Label>
                            <Popover open={modelOpen} onOpenChange={setModelOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={modelOpen}
                                        className="justify-between bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 focus:ring-blue-500 text-xs font-mono h-10"
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <Bot className="h-4 w-4 text-blue-500 shrink-0" />
                                            <span className="truncate">{model || "Select model..."}</span>
                                        </div>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[450px] p-0" align="end">
                                    <Command className="bg-white dark:bg-slate-950 border dark:border-white/5 shadow-2xl">
                                        <CommandInput placeholder="Search models..." className="h-9 border-none focus:ring-0" />
                                        <CommandList className="max-h-[300px]">
                                            <CommandEmpty className="p-4 text-xs text-center text-slate-500">
                                                {isLoadingModels ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                        <span>Loading models...</span>
                                                    </div>
                                                ) : "No model found."}
                                            </CommandEmpty>
                                            <CommandGroup heading={availableModels.length > 0 ? "All Models" : "Popular Models"} className="px-2">
                                                {(availableModels.length > 0 ? availableModels : curatedModels).map((m) => {
                                                    const isSelected = model === m.id;
                                                    return (
                                                        <CommandItem
                                                            key={m.id}
                                                            value={m.id}
                                                            className="flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                                            onSelect={(currentValue) => {
                                                                setModel(currentValue);
                                                                setModelOpen(false);
                                                            }}
                                                        >
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                                                {isSelected && <Check className="h-3 w-3" />}
                                                            </div>
                                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                                <span className="text-sm font-medium truncate">{m.name}</span>
                                                                <span className="text-[10px] text-slate-500 font-mono truncate">{m.id}</span>
                                                            </div>
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                            <div className="p-3 border-t dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                                                <Label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 px-1 mb-2 block tracking-wider">Custom Model ID</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="e.g. google/gemini-2.0-flash-exp:free"
                                                        className="h-8 text-[11px] font-mono bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10"
                                                        value={model.startsWith('custom:') ? model.replace('custom:', '') : ''}
                                                        onChange={(e) => setModel(`custom:${e.target.value}`)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                const finalModel = model.replace('custom:', '');
                                                                if (finalModel.trim()) { setModel(finalModel); setModelOpen(false); }
                                                            }
                                                        }}
                                                    />
                                                    <Button size="sm" className="h-8 px-3 text-[10px] bg-blue-600 text-white" onClick={() => {
                                                        const finalModel = model.replace('custom:', '');
                                                        if (finalModel.trim()) { setModel(finalModel); setModelOpen(false); }
                                                    }}>Apply</Button>
                                                </div>
                                            </div>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="connection" className="text-slate-700 dark:text-white font-medium">AI Service Connection <span className="text-red-500">*</span></Label>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => onRefreshConnections?.()} className="h-5 px-1.5 text-[10px] text-slate-500 hover:text-blue-600" title="Refresh connections">
                                        <RefreshCw className="h-2.5 w-2.5 mr-1" /> Refresh
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setShowAddModelDialog(true)} className="h-5 px-1.5 text-[10px] text-blue-600 dark:text-blue-400">
                                        <Plus className="h-2.5 w-2.5 mr-1" /> New
                                    </Button>
                                </div>
                            </div>
                            <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                                <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 focus:ring-blue-500 h-10">
                                    <SelectValue placeholder="Select Connection" />
                                </SelectTrigger>
                                <SelectContent>
                                    {connections.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground text-center">No connections found</div>
                                    ) : (
                                        connections.map(conn => (
                                            <SelectItem key={conn.id} value={conn.id}>
                                                <div className="flex items-center gap-2">
                                                    <Key className="h-3.5 w-3.5 text-blue-500" />
                                                    <span className="truncate">{conn.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="instructions" className="text-slate-700 dark:text-white font-medium">System Instructions <span className="text-red-500">*</span></Label>
                                {instructions_library.length > 0 && (
                                    <Select 
                                        value={selectedInstructionId} 
                                        onValueChange={(id) => {
                                            setSelectedInstructionId(id);
                                            const p = instructions_library.find(inst => inst.id === id);
                                            if (p) setInstructions(p.system_prompt);
                                        }}
                                    >
                                        <SelectTrigger className="w-[200px] h-7 text-[10px] bg-slate-100 dark:bg-slate-800 border-none">
                                            <SelectValue placeholder="Use Instruction" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {instructions_library.map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    <div className="flex items-center gap-2">
                                                        <UserCircle className="h-3 w-3 text-blue-500" />
                                                        <span>{p.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <Textarea
                                id="instructions"
                                placeholder="You are a helpful assistant..."
                                className="h-32 resize-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 focus-visible:ring-blue-500 font-mono text-sm leading-relaxed rounded-xl p-4"
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="ui-design" className="text-slate-700 dark:text-white font-medium">Agent UI Design</Label>
                            <Select value={selectedUiDesign} onValueChange={setSelectedUiDesign}>
                                <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10 focus:ring-blue-500 h-10">
                                    <SelectValue placeholder="Default Style" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none_selected">
                                        <span className="text-slate-500">Default Style</span>
                                    </SelectItem>
                                    {uiDesigns.map(design => (
                                        <SelectItem key={design.id} value={design.id}>
                                            <div className="flex items-center gap-2">
                                                <Palette className="h-3.5 w-3.5 text-purple-500" />
                                                <span>{design.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>


                        <div className="grid gap-2">
                            <div className="flex items-center justify-between mb-4">
                                <Label htmlFor="evals-mode" className="text-slate-700 dark:text-white font-medium flex items-center gap-2">
                                    <span>Enable Agent Evaluations</span>
                                    <Badge variant="outline" className="text-[10px] font-normal">Auto-Score Helpfulness</Badge>
                                </Label>
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="evals-mode" className="text-xs font-medium cursor-pointer">Enable</Label>
                                    <Switch id="evals-mode" checked={evalsEnabled} onCheckedChange={setEvalsEnabled} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <Label htmlFor="knowledge" className="text-slate-700 dark:text-white font-medium flex items-center gap-2">
                                    <span>Knowledge Base (RAG)</span>
                                    <Badge variant="outline" className="text-[10px] font-normal">PDF, Images, Text</Badge>
                                </Label>
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="rag-mode" className="text-xs font-medium cursor-pointer">Enable</Label>
                                    <Switch id="rag-mode" checked={ragEnabled} onCheckedChange={setRagEnabled} />
                                </div>
                            </div>
                            {ragEnabled && (
                                <div className="flex flex-col gap-3">
                                    <Label className="text-xs text-slate-500">Select files from your Library to add to this agent's knowledge.</Label>

                                    <div className="border border-slate-200 dark:border-white/10 rounded-md max-h-[200px] overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-2 space-y-1">
                                        {availableFiles.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-slate-400 italic">
                                                No files found in File Manager. Upload files there first.
                                            </div>
                                        ) : (
                                            availableFiles.map((file) => {
                                                const isSelected = selectedFileIds.includes(file.id);
                                                const isAlreadyIngested = existingFiles.some(ef => ef.filename === file.original_name);

                                                return (
                                                    <div
                                                        key={file.id}
                                                        className={`
                                                            flex items-center gap-3 p-2 rounded-md cursor-pointer text-sm transition-colors
                                                            ${isSelected
                                                                ? 'bg-blue-100 dark:bg-blue-600/20 border-blue-200 dark:border-blue-500/30 border'
                                                                : 'hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'}
                                                            ${isAlreadyIngested ? 'opacity-50' : ''}
                                                        `}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setSelectedFileIds(current => current.filter(id => id !== file.id));
                                                            } else {
                                                                setSelectedFileIds(current => [...current, file.id]);
                                                            }
                                                        }}
                                                    >
                                                        <div className={`
                                                            w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors
                                                            ${isSelected
                                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950'}
                                                        `}>
                                                            {isSelected && <Check className="h-3 w-3" />}
                                                        </div>
                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                            <FileText className={`h-4 w-4 shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                                                            <div className="flex flex-col truncate">
                                                                <span className="truncate font-medium text-slate-700 dark:text-slate-200">{file.original_name}</span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {(file.size / 1024).toFixed(1)} KB • {new Date(file.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isAlreadyIngested && (
                                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                                                                Added
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
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
                                </div>
                            )}
                        </div>


                        {/* Unified Capabilities & Tools Section */}
                        <div className="grid gap-3 pt-4 border-t dark:border-white/5">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Terminal className="h-4 w-4 text-blue-500" />
                                    Capabilities & Toolsets
                                </Label>
                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none text-[10px]">
                                    {selectedTools.length + selectedSubAgents.length + mcpTools.length} Active
                                </Badge>
                            </div>

                            <div className="flex border rounded-2xl overflow-hidden bg-white dark:bg-slate-950 min-h-[500px] shadow-xl border-slate-200 dark:border-white/10">
                                {/* Sidebar Categories */}
                                <div className="w-[200px] bg-slate-50/80 dark:bg-slate-900/80 p-3 flex flex-col gap-2 border-r border-slate-200 dark:border-white/5">
                                    <button
                                        onClick={() => setActiveToolTab('connectors')}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${activeToolTab === 'connectors'
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 translate-x-1'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <Terminal className={`h-4 w-4 ${activeToolTab === 'connectors' ? 'text-white' : 'text-blue-500'}`} />
                                        Connectors
                                    </button>
                                    <button
                                        onClick={() => setActiveToolTab('mcp')}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${activeToolTab === 'mcp'
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 translate-x-1'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <Search className={`h-4 w-4 ${activeToolTab === 'mcp' ? 'text-white' : 'text-orange-500'}`} />
                                        MCP
                                    </button>
                                    <button
                                        onClick={() => setActiveToolTab('subagents')}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${activeToolTab === 'subagents'
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 translate-x-1'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <Bot className={`h-4 w-4 ${activeToolTab === 'subagents' ? 'text-white' : 'text-purple-500'}`} />
                                        Sub-Agents
                                    </button>
                                    <button
                                        onClick={() => setActiveToolTab('workflows')}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 ${activeToolTab === 'workflows'
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 translate-x-1'
                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <WorkflowIcon className={`h-4 w-4 ${activeToolTab === 'workflows' ? 'text-white' : 'text-emerald-500'}`} />
                                        Workflows
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950/50 relative">
                                    <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                                    <div className="relative z-10">
                                        {activeToolTab === 'connectors' && (
                                            <div className="p-4 space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="text-sm font-bold dark:text-white">Active Connectors</h3>
                                                    <p className="text-[11px] text-slate-500">Enable specialized toolkits for your agent</p>
                                                </div>

                                                <Command className="border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
                                                    <CommandInput placeholder="Search connector tools..." className="bg-transparent border-none text-sm h-10" />
                                                    <CommandList className="max-h-[250px] overflow-y-auto">
                                                        <CommandEmpty className="py-4 text-center text-xs text-slate-400 italic">No tools found matching your search.</CommandEmpty>
                                                        {pieces.filter((app: any) => app.category === 'app').map((app: any) => {
                                                            const actions = app.actions.filter((action: any) => action.type === 'action' && action.id !== 'run_agent');
                                                            if (actions.length === 0) return null;

                                                            return (
                                                                <CommandGroup key={app.id} heading={app.name} className="px-1">
                                                                    {actions.map((action: any) => {
                                                                        const toolId = `${app.id}:${action.id}`;
                                                                        const isSelected = selectedTools.some(t => t.toolId === toolId);
                                                                        return (
                                                                            <CommandItem
                                                                                key={toolId}
                                                                                value={`${app.name} ${action.name}`}
                                                                                className={`flex items-center gap-3 py-2 px-3 m-1 rounded-lg cursor-pointer transition-all ${isSelected
                                                                                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                                                                                    : 'hover:bg-slate-200 dark:hover:bg-white/5'
                                                                                    }`}
                                                                                onSelect={() => {
                                                                                    if (isSelected) {
                                                                                        setSelectedTools(selectedTools.filter(t => t.toolId !== toolId));
                                                                                    } else {
                                                                                        setSelectedTools([...selectedTools, { toolId }]);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <div className={`
                                                                                w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                                                                                ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-700 font-bold'}
                                                                            `}>
                                                                                    {isSelected && <Check className="h-2.5 w-2.5 font-bold" />}
                                                                                </div>
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-xs font-bold leading-none">{action.name}</span>
                                                                                    {action.description && <span className="text-[10px] opacity-70 truncate max-w-[250px]">{action.description}</span>}
                                                                                </div>
                                                                            </CommandItem>
                                                                        );
                                                                    })}
                                                                </CommandGroup>
                                                            );
                                                        })}
                                                    </CommandList>
                                                </Command>

                                                {/* Configured Tools Section */}
                                                {selectedTools.filter(t => !t.toolId.startsWith('workflow:')).length > 0 && (
                                                    <div className="space-y-2 pt-2">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
                                                            <Check className="h-3 w-3" />
                                                            Selected Connectors
                                                        </Label>
                                                        <div className="space-y-2">
                                                            {selectedTools.filter(t => !t.toolId.startsWith('workflow:')).map((tool) => {
                                                                const [appId, actionId] = tool.toolId.split(':');
                                                                const app = pieces.find(a => a.id === appId);
                                                                const action = app?.actions.find(a => a.id === actionId);
                                                                const actionRequiresConnection = action?.parameters?.some(p => p.type === 'connection');
                                                                const isMissing = actionRequiresConnection && !tool.connectionId;

                                                                return (
                                                                    <div key={tool.toolId} className="flex flex-col gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/40">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                <Badge variant="outline" className="h-5 px-1.5 text-[9px] uppercase font-black bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20">
                                                                                    {app?.name}
                                                                                </Badge>
                                                                                <span className="text-xs font-bold dark:text-white">{action?.name}</span>
                                                                            </div>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50/50"
                                                                                onClick={() => setSelectedTools(selectedTools.filter(t => t.toolId !== tool.toolId))}
                                                                            >
                                                                                <X className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                        {actionRequiresConnection && (
                                                                            <div className="flex flex-col gap-1 px-1">
                                                                                <Label className="text-[9px] font-bold text-slate-400 uppercase">Provider Authentication</Label>
                                                                                <ConnectionSelector
                                                                                    appName={app?.id || ''}
                                                                                    value={tool.connectionId || ''}
                                                                                    onChange={(val) => {
                                                                                        const newTools = selectedTools.map(t =>
                                                                                            t.toolId === tool.toolId ? { ...t, connectionId: val } : t
                                                                                        );
                                                                                        setSelectedTools(newTools);
                                                                                    }}
                                                                                    hasError={isMissing}
                                                                                />
                                                                                {isMissing && <span className="text-[9px] text-red-500 font-bold">* Authentication required for this tool</span>}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeToolTab === 'mcp' && (
                                            <div className="p-4 space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col gap-1">
                                                        <h3 className="text-sm font-bold dark:text-white">MCP Servers</h3>
                                                        <p className="text-[11px] text-slate-500">External Model Context Protocol integrations</p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={addMcpTool}
                                                        className="h-8 px-3 text-[11px] bg-orange-600 hover:bg-orange-700 text-white font-bold"
                                                    >
                                                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Server
                                                    </Button>
                                                </div>

                                                {mcpTools.length > 0 ? (
                                                    <div className="space-y-4">
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
                                                    <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-slate-50 dark:bg-transparent border-slate-200 dark:border-white/5 animate-pulse">
                                                        <Search className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                                                        <p className="text-xs font-bold text-slate-400 italic">No MCP Servers Configured</p>
                                                        <Button variant="ghost" className="mt-2 text-[10px] text-blue-500" onClick={addMcpTool}>
                                                            Click here to add your first server
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeToolTab === 'subagents' && (
                                            <div className="p-4 space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="text-sm font-bold dark:text-white">Sub-Agents Orchestration</h3>
                                                    <p className="text-[11px] text-slate-500">Allow this agent to delegate tasks to specialists</p>
                                                </div>

                                                <Command className="border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
                                                    <CommandInput placeholder="Search existing agents..." className="bg-transparent border-none text-sm h-10" />
                                                    <CommandList className="max-h-[300px]">
                                                        <CommandEmpty className="py-4 text-center text-xs text-slate-400 italic">No agents found.</CommandEmpty>
                                                        <CommandGroup heading="Available Specialized Agents" className="px-1">
                                                            {(() => {
                                                                const renderAgentOptions = (list: Agent[], level = 0) => {
                                                                    if (!list || !Array.isArray(list)) return null;
                                                                    return list.map((agent: any) => {
                                                                        if (agent.id === initialAgent?.id) return null;
                                                                        const isSelected = selectedSubAgents.includes(agent.id);
                                                                        const subagentsList = agent.sub_agents || agent.subagents || [];

                                                                        return (
                                                                            <div key={agent.id}>
                                                                                <CommandItem
                                                                                    value={agent.name}
                                                                                    className={`flex items-center gap-3 py-2 px-3 m-1 rounded-lg cursor-pointer transition-all ${isSelected
                                                                                        ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300'
                                                                                        : 'hover:bg-slate-200 dark:hover:bg-white/5'
                                                                                        }`}
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
                                                                                                    <div key={i} className="w-4 h-px bg-slate-300 dark:bg-slate-700 mr-1" />
                                                                                                ))}
                                                                                            </div>
                                                                                        )}
                                                                                        <div className={`
                                                                                        w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                                                                                        ${isSelected ? 'bg-purple-600 border-purple-600 text-white shadow-sm' : 'border-slate-300 dark:border-slate-700'}
                                                                                    `}>
                                                                                            {isSelected && <Check className="h-2.5 w-2.5" />}
                                                                                        </div>
                                                                                        <span className={`text-xs ${level === 0 ? "font-bold" : "font-medium opacity-80"}`}>{agent.name}</span>
                                                                                        <Badge variant="ghost" className="ml-auto text-[9px] font-mono tracking-tighter opacity-50 px-1">
                                                                                            {agent.model.split('/').pop()}
                                                                                        </Badge>
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

                                                {/* Selected Sub-Agents Summary */}
                                                {selectedSubAgents.length > 0 && (
                                                    <div className="space-y-2 pt-2">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Designated Sub-Agents</Label>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {selectedSubAgents.map(agentId => {
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
                                                                    <div key={agent.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20">
                                                                        <div className="flex items-center gap-2 shrink-0">
                                                                            <Bot className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{agent.name}</span>
                                                                        </div>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 rounded-full text-purple-400 hover:text-red-500 hover:bg-red-50/50"
                                                                            onClick={() => setSelectedSubAgents(selectedSubAgents.filter(id => id !== agent.id))}
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeToolTab === 'workflows' && (
                                            <div className="p-4 space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="text-sm font-bold dark:text-white">Workflow Automation</h3>
                                                    <p className="text-[11px] text-slate-500">Enable pre-defined automation flows as agent tools</p>
                                                </div>

                                                <Command className="border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
                                                    <CommandInput placeholder="Search workflows..." className="bg-transparent border-none text-sm h-10" />
                                                    <CommandList className="max-h-[300px]">
                                                        <CommandEmpty className="py-4 text-center text-xs text-slate-400 italic">No workflows matched your search.</CommandEmpty>
                                                        {availableWorkflows && availableWorkflows.length > 0 ? (
                                                            <CommandGroup heading="Ready Automations" className="px-1">
                                                                {availableWorkflows.map((wf: any) => {
                                                                    const toolId = `workflow:${wf.id}`;
                                                                    const isSelected = selectedTools.some(t => t.toolId === toolId);
                                                                    return (
                                                                        <CommandItem
                                                                            key={toolId}
                                                                            value={`workflow ${wf.name}`}
                                                                            className={`flex items-center gap-3 py-2.5 px-3 m-1 rounded-lg cursor-pointer transition-all ${isSelected
                                                                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                                                                : 'hover:bg-slate-200 dark:hover:bg-white/5'
                                                                                }`}
                                                                            onSelect={() => {
                                                                                if (isSelected) {
                                                                                    setSelectedTools(selectedTools.filter(t => t.toolId !== toolId));
                                                                                } else {
                                                                                    setSelectedTools([...selectedTools, { toolId }]);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <div className={`
                                                                            w-4 h-4 rounded border-2 flex items-center justify-center transition-all
                                                                            ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'border-slate-300 dark:border-slate-700'}
                                                                        `}>
                                                                                {isSelected && <Check className="h-2.5 w-2.5" />}
                                                                            </div>
                                                                            <div className="flex flex-col flex-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <WorkflowIcon className={`h-3.5 w-3.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                                                                                    <span className="text-xs font-bold leading-none">{wf.name}</span>
                                                                                </div>
                                                                                {wf.description && <span className="text-[10px] opacity-70 mt-1 line-clamp-1">{wf.description}</span>}
                                                                            </div>
                                                                        </CommandItem>
                                                                    );
                                                                })}
                                                            </CommandGroup>
                                                        ) : (
                                                            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3 grayscale opacity-60">
                                                                <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/5">
                                                                    <WorkflowIcon className="h-6 w-6" />
                                                                </div>
                                                                <div className="text-[10px] font-bold text-center px-8 text-balance">
                                                                    No active HTTP-triggered workflows were found. Please ensure your workflows are published and active.
                                                                </div>
                                                            </div>
                                                        )}
                                                    </CommandList>
                                                </Command>

                                                {/* Selected Workflows Summary */}
                                                {selectedTools.filter(t => t.toolId.startsWith('workflow:')).length > 0 && (
                                                    <div className="space-y-2 pt-2">
                                                        <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Linked Workflows</Label>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {selectedTools.filter(t => t.toolId.startsWith('workflow:')).map(tool => {
                                                                const workflowId = tool.toolId.replace('workflow:', '');
                                                                const wf = availableWorkflows?.find(w => String(w.id) === String(workflowId));
                                                                return (
                                                                    <div key={tool.toolId} className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20">
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge variant="outline" className="h-5 px-1.5 text-[9px] uppercase font-black bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20">
                                                                                Flow
                                                                            </Badge>
                                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{wf?.name || 'Unknown workflow'}</span>
                                                                        </div>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 rounded-full text-emerald-400 hover:text-red-500 hover:bg-red-50/50"
                                                                            onClick={() => setSelectedTools(selectedTools.filter(t => t.toolId !== tool.toolId))}
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>



                        {/* Guardrails Section */}
                        <div className="space-y-4 pt-2 border-t dark:border-white/5">
                            <div className="flex items-center justify-between">
                                <Label className="text-slate-700 dark:text-white font-bold flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-emerald-500" />
                                    Agent Guardrails
                                </Label>
                                <div className="flex items-center space-x-2">
                                    <Label htmlFor="guardrails-enabled" className="text-xs font-medium cursor-pointer">Enable Security</Label>
                                    <Switch id="guardrails-enabled" checked={enableGuardrails} onCheckedChange={setEnableGuardrails} />
                                </div>
                            </div>

                            {enableGuardrails && (
                                <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                                    {/* Input Guardrails */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Input Filters (Banned Words)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Add banned word..."
                                                value={newWord}
                                                onChange={(e) => setNewWord(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addBannedWord();
                                                    }
                                                }}
                                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10"
                                            />
                                            <Button type="button" onClick={addBannedWord} size="sm" className="bg-blue-600 hover:bg-blue-700">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {bannedWords.map(word => (
                                                <Badge key={word} variant="secondary" className="pl-3 pr-1 py-1 gap-1 bg-slate-100 dark:bg-slate-800 border dark:border-white/5">
                                                    {word}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4 p-0 hover:bg-transparent text-slate-400 hover:text-red-500"
                                                        onClick={() => removeBannedWord(word)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Output Guardrails */}
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Output Content Rules</Label>
                                        <div className="flex gap-2">
                                            <Select value={selectedType} onValueChange={setSelectedType}>
                                                <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10">
                                                    <SelectValue placeholder="Add New Rule..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="email">Email Redaction</SelectItem>
                                                    <SelectItem value="phone">Phone Number Redaction</SelectItem>
                                                    <SelectItem value="sensitive">Sensitive Number Redaction</SelectItem>
                                                    <SelectItem value="profanity">Profanity Check</SelectItem>
                                                    <SelectItem value="maxlength">Max Length Limit</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                onClick={addOutputGuardrail}
                                                disabled={!selectedType}
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            {outputGuardrails.map((item, idx) => (
                                                <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 relative group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-1.5 rounded-md ${item.type === 'email' ? 'bg-blue-500/10 text-blue-500' :
                                                                item.type === 'phone' ? 'bg-green-500/10 text-green-500' :
                                                                    item.type === 'sensitive' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                        item.type === 'profanity' ? 'bg-red-500/10 text-red-500' :
                                                                            'bg-purple-500/10 text-purple-500'
                                                                }`}>
                                                                {item.type === 'email' && <Mail className="h-3 w-3" />}
                                                                {item.type === 'phone' && <Phone className="h-3 w-3" />}
                                                                {item.type === 'sensitive' && <AlertTriangle className="h-3 w-3" />}
                                                                {item.type === 'profanity' && <MessageSquare className="h-3 w-3" />}
                                                                {item.type === 'maxlength' && <MoreHorizontal className="h-3 w-3" />}
                                                            </div>
                                                            <span className="text-xs font-bold capitalize text-slate-700 dark:text-slate-200">
                                                                {item.type === 'maxlength' ? 'Max Length' : item.type + ' Redaction'}
                                                            </span>
                                                        </div>
                                                        <Button variant="ghost" size="icon" onClick={() => removeOutputGuardrail(item.type)} className="h-6 w-6 text-slate-400 hover:text-red-500">
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        {['email', 'phone', 'sensitive', 'profanity'].includes(item.type) && (
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] text-slate-500 uppercase">Replacement</Label>
                                                                <Input
                                                                    value={item.config.replacement || ''}
                                                                    onChange={(e) => updateGuardrailConfig(item.type, 'replacement', e.target.value)}
                                                                    className="h-7 text-[10px] bg-white dark:bg-slate-900"
                                                                />
                                                            </div>
                                                        )}
                                                        {item.type === 'sensitive' && (
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] text-slate-500 uppercase">Min Digits</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={item.config.minimumDigits || 6}
                                                                    onChange={(e) => updateGuardrailConfig(item.type, 'minimumDigits', parseInt(e.target.value))}
                                                                    className="h-7 text-[10px] bg-white dark:bg-slate-900"
                                                                />
                                                            </div>
                                                        )}
                                                        {item.type === 'maxlength' && (
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] text-slate-500 uppercase">Limit</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={item.config.maxCharacters || 1000}
                                                                    onChange={(e) => updateGuardrailConfig(item.type, 'maxCharacters', parseInt(e.target.value))}
                                                                    className="h-7 text-[10px] bg-white dark:bg-slate-900"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {outputGuardrails.length === 0 && (
                                                <div className="text-center py-4 border border-dashed rounded-lg text-[10px] text-slate-400">
                                                    No output rules configured.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Input Redaction Rules (NEW) */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Input Redaction Rules</Label>
                                            <Badge variant="outline" className="text-[9px] uppercase font-bold border-purple-200 text-purple-600 bg-purple-50">Experimental</Badge>
                                        </div>
                                        <div className="flex gap-2">
                                            <Select value={selectedInputType} onValueChange={setSelectedInputType}>
                                                <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10">
                                                    <SelectValue placeholder="Add Input Rule..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="email">Email Masking</SelectItem>
                                                    <SelectItem value="phone">Phone Masking</SelectItem>
                                                    <SelectItem value="sensitive">Sensitive Masking</SelectItem>
                                                    <SelectItem value="profanity">Profanity Masking</SelectItem>
                                                    <SelectItem value="maxlength">Input Length Limit</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                onClick={addInputGuardrail}
                                                disabled={!selectedInputType}
                                                size="sm"
                                                className="bg-purple-600 hover:bg-purple-700"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            {inputGuardrails.map((item, idx) => (
                                                <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 relative group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-1.5 rounded-md ${item.type === 'email' ? 'bg-blue-500/10 text-blue-500' :
                                                                item.type === 'phone' ? 'bg-green-500/10 text-green-500' :
                                                                    item.type === 'sensitive' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                        item.type === 'profanity' ? 'bg-red-500/10 text-red-500' :
                                                                            'bg-purple-500/10 text-purple-500'
                                                                }`}>
                                                                {item.type === 'email' && <Mail className="h-3 w-3" />}
                                                                {item.type === 'phone' && <Phone className="h-3 w-3" />}
                                                                {item.type === 'sensitive' && <AlertTriangle className="h-3 w-3" />}
                                                                {item.type === 'profanity' && <MessageSquare className="h-3 w-3" />}
                                                                {item.type === 'maxlength' && <MoreHorizontal className="h-3 w-3" />}
                                                            </div>
                                                            <span className="text-xs font-bold capitalize text-slate-700 dark:text-slate-200">
                                                                {item.type === 'maxlength' ? 'Max Input' : item.type + ' Masking'}
                                                            </span>
                                                        </div>
                                                        <Button variant="ghost" size="icon" onClick={() => removeInputGuardrail(item.type)} className="h-6 w-6 text-slate-400 hover:text-red-500">
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        {['email', 'phone', 'sensitive', 'profanity'].includes(item.type) && (
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] text-slate-500 uppercase">Replacement</Label>
                                                                <Input
                                                                    value={item.config.replacement || ''}
                                                                    onChange={(e) => updateInputGuardrailConfig(item.type, 'replacement', e.target.value)}
                                                                    className="h-7 text-[10px] bg-white dark:bg-slate-900"
                                                                />
                                                            </div>
                                                        )}
                                                        {item.type === 'maxlength' && (
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] text-slate-500 uppercase">Limit</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={item.config.max || 500}
                                                                    onChange={(e) => updateInputGuardrailConfig(item.type, 'max', parseInt(e.target.value))}
                                                                    className="h-7 text-[10px] bg-white dark:bg-slate-900"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {inputGuardrails.length === 0 && (
                                                <div className="text-center py-4 border border-dashed rounded-lg text-[11px] text-slate-400">
                                                    No input redaction configured.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20 flex items-center justify-end gap-3 shrink-0">
                        <Button
                            variant="ghost"
                            disabled={isSubmitting}
                            onClick={resetForm}
                            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
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
                                    return isDis;
                                })()
                            }
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 font-bold shadow-lg shadow-blue-500/20 rounded-xl"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : initialAgent ? "Update Agent" : "Create Agent"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <OpenRouterModel
                open={showAddModelDialog}
                onOpenChange={setShowAddModelDialog}
                onSuccess={() => {
                    toast.success("AI Provider added. Please refresh to see it in the list if it doesn't appear.");
                    if (onRefreshConnections) {
                        setTimeout(() => {
                            onRefreshConnections();
                        }, 500);
                    }
                }}
            />
        </>
    );
}

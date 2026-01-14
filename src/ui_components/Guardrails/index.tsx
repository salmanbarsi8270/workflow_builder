import { useState, useEffect } from 'react';
import { Shield, Trash2, Plus, Mail, Lock, Loader2, Phone, X, AlertTriangle, MessageSquare, MoreHorizontal, Bot, Check, ChevronsUpDown, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { toast } from "sonner";
import axios from 'axios';
import { API_URL } from '@/ui_components/api/apiurl';
import { useUser } from '@/context/UserContext';
import { cn } from "@/lib/utils"

interface GuardrailItem {
    type: 'email' | 'phone' | 'sensitive' | 'profanity' | 'maxlength';
    config: Record<string, any>;
}

interface Agent {
    id: string;
    name: string;
    model: string;
}

export default function Guardrails() {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    // const [saving, setSaving] = useState(false); // Unused
    const [bannedWords, setBannedWords] = useState<string[]>([]);
    const [newWord, setNewWord] = useState('');
    const [outputGuardrails, setOutputGuardrails] = useState<GuardrailItem[]>([]);
    const [selectedType, setSelectedType] = useState<string>('');
    const [agentsLoading, setAgentsLoading] = useState(false);

    // Agent Selection (Multi-select)
    const [agents, setAgents] = useState<Agent[]>([]);
    // Initialize from localStorage to persist selection across reloads
    const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem('guardrails_selected_ids');
                return saved ? JSON.parse(saved) : [];
            } catch (e) {
                console.error("Failed to parse saved selection", e);
                return [];
            }
        }
        return [];
    });
    const [openAgentSelect, setOpenAgentSelect] = useState(false);

    useEffect(() => {
        if (user?.id) {
            fetchAgents();
        }
    }, [user?.id]);

    useEffect(() => {
        // Persist selection changes
        if (selectedAgentIds.length > 0) {
            localStorage.setItem('guardrails_selected_ids', JSON.stringify(selectedAgentIds));
        } else {
            localStorage.removeItem('guardrails_selected_ids');
        }

        // If single agent selected, fetch their config
        // If single agent selected, fetch their config
        if (selectedAgentIds.length === 1) {
            fetchGuardrails(selectedAgentIds[0]);
        } else if (selectedAgentIds.length > 1) {
            // Multi-select mode: Use the first agent's config as a baseline/template
            // This prevents the "It's gone" confusion where everything disappears
            fetchGuardrails(selectedAgentIds[0]);
        } else {
            // No selection: Clear formatting
            setBannedWords([]);
            setOutputGuardrails([]);
            setLoading(false);
        }
    }, [selectedAgentIds]);

    const fetchAgents = async () => {
        setAgentsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/v1/agents?userId=${user?.id}`);
            const agentList = res.data; // adjust if wrapper object
            setAgents(Array.isArray(agentList) ? agentList : res.data.agents || []);

            // Auto-select logic REMOVED as per user request
        } catch (e) {
            console.error("Failed to fetch agents", e);
        } finally {
            setAgentsLoading(false);
        }
    };

    const fetchGuardrails = async (agentId: string) => {
        setLoading(true);
        try {
            console.log(`📡 [Guardrails:UI] Fetching configuration for agent ${agentId}...`);
            const uid = user?.id || 'anonymous';
            const response = await axios.get(`${API_URL}/api/guardrails?agentId=${agentId}&userId=${uid}`);
            const data = response.data;

            setBannedWords(data.inputGuardrails?.bannedWords || []);

            // Handle migration/legacy format
            const list = data.outputGuardrails?.list || [];
            if (data.outputGuardrails?.emailRedaction && !list.find((i: any) => i.type === 'email')) {
                list.push({ type: 'email', config: { replacement: '[hidden-email]' } });
            }
            setOutputGuardrails(list);
        } catch (error) {
            console.error('❌ [Guardrails:UI] Error fetching guardrails:', error);
            toast.error("Failed to load guardrails configuration");
        } finally {
            setLoading(false);
        }
    };

    const internalSave = async (overrideBanned?: string[], overrideOutput?: GuardrailItem[]) => {
        if (selectedAgentIds.length === 0) return;

        // Don't set loading/saving state for auto-saves to avoid UI flicker, or use a subtle indicator?
        // User requested "auto-save", subtle is better.
        // But for now let's keep it simple.

        try {
            const finalBannedWords = overrideBanned || bannedWords;
            const finalOutput = overrideOutput || outputGuardrails;

            const newConfig = {
                agentIds: selectedAgentIds,
                agentId: selectedAgentIds.length === 1 ? selectedAgentIds[0] : null,
                userId: user?.id,
                inputGuardrails: { bannedWords: finalBannedWords },
                outputGuardrails: { list: finalOutput, emailRedaction: false }
            };

            await axios.post(`${API_URL}/api/guardrails`, newConfig);
            toast.success("Changes saved");
        } catch (error) {
            console.error('❌ [Guardrails:UI] Error saving:', error);
            toast.error("Failed to save changes");
        }
    };

    const addBannedWord = () => {
        if (newWord.trim() && !bannedWords.includes(newWord.trim())) {
            const newExcl = [...bannedWords, newWord.trim()];
            setBannedWords(newExcl);
            setNewWord('');
            internalSave(newExcl, undefined);
        }
    };

    const removeBannedWord = (word: string) => {
        const newExcl = bannedWords.filter(w => w !== word);
        setBannedWords(newExcl);
        internalSave(newExcl, undefined);
    };

    const addOutputGuardrail = (type: string) => {
        if (!type) return;
        let initialConfig = {};
        switch (type) {
            case 'email': initialConfig = { replacement: '[hidden-email]' }; break;
            case 'phone': initialConfig = { replacement: '[hidden-phone]' }; break;
            case 'sensitive': initialConfig = { minimumDigits: 6, replacement: '[redacted]' }; break;
            case 'profanity': initialConfig = { mode: 'redact', replacement: '[censored]' }; break;
            case 'maxlength': initialConfig = { maxCharacters: 1000, mode: 'truncate' }; break;
        }
        const newList = [...outputGuardrails, { type: type as any, config: initialConfig }];
        setOutputGuardrails(newList);
        setSelectedType('');
        internalSave(undefined, newList);
    };

    const removeOutputGuardrail = (index: number) => {
        const newList = [...outputGuardrails];
        newList.splice(index, 1);
        setOutputGuardrails(newList);
        internalSave(undefined, newList);
    };

    const updateGuardrailConfig = (index: number, key: string, value: any) => {
        const newList = [...outputGuardrails];
        newList[index] = {
            ...newList[index],
            config: { ...newList[index].config, [key]: value }
        };
        setOutputGuardrails(newList);
    };

    // New helper for onBlur auto-save
    const triggerAutoSave = () => {
        internalSave();
    };

    const toggleAgentSelection = (agentId: string) => {
        if (selectedAgentIds.includes(agentId)) {
            // Deselect
            // If it's the only one, warn or allow empty? Allow empty but UI will blank out.
            setSelectedAgentIds(selectedAgentIds.filter(id => id !== agentId));
        } else {
            // Select
            setSelectedAgentIds([...selectedAgentIds, agentId]);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <Shield className="h-8 w-8 text-emerald-500" />
                        Agent Guardrails
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Configure safety filters for specific agents.</p>
                </div>

                {/* Agent Selector */}
                <div className="w-full md:w-80">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Target Agents</Label>

                    <Popover open={openAgentSelect} onOpenChange={setOpenAgentSelect}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openAgentSelect}
                                disabled={agentsLoading}
                                className="w-full justify-between h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-sm"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <Bot className="h-4 w-4 shrink-0 opacity-50" />
                                    {selectedAgentIds.length === 0 ? "Select agents..." :
                                        selectedAgentIds.length === 1 ? agents.find(a => a.id === selectedAgentIds[0])?.name || "Unknown Agent" :
                                            `${selectedAgentIds.length} agents selected`}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput placeholder="Search agent..." />
                                <CommandList>
                                    <CommandEmpty>No agent found.</CommandEmpty>
                                    <CommandGroup>
                                        {agents.map((agent) => (
                                            <CommandItem
                                                key={agent.id}
                                                value={agent.name}
                                                onSelect={() => toggleAgentSelection(agent.id)}
                                            >
                                                <div
                                                    className={cn(
                                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                        selectedAgentIds.includes(agent.id)
                                                            ? "bg-primary text-primary-foreground"
                                                            : "opacity-50 [&_svg]:invisible"
                                                    )}
                                                >
                                                    <Check className={cn("h-4 w-4")} />
                                                </div>
                                                {agent.name}
                                                <span className="ml-auto text-xs text-muted-foreground truncate max-w-[80px]">
                                                    {agent.model}
                                                </span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {selectedAgentIds.length > 1 && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                    <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <div>
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Multi-Edit Mode Active</p>
                        <p className="text-xs text-amber-700 dark:text-amber-400/80">
                            You are editing {selectedAgentIds.length} agents simultaneously.
                            <strong> Saving will overwrite the banned words list for ALL selected agents.</strong>
                        </p>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                    <p className="text-slate-400 font-bold animate-pulse">Loading Configuration...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Guardrails */}
                    <Card className="border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl h-fit rounded-2xl overflow-hidden ring-1 ring-slate-900/5">
                        <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Lock className="h-5 w-5 text-blue-500" />
                                Input Guardrails
                            </CardTitle>
                            <CardDescription>Block specific words (Exact Match) from user inputs.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add banned word..."
                                    value={newWord}
                                    onChange={(e) => setNewWord(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addBannedWord()}
                                    className="h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-sm"
                                    disabled={selectedAgentIds.length === 0}
                                />
                                <Button onClick={addBannedWord} disabled={selectedAgentIds.length === 0} className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white p-0 shadow-lg shadow-blue-500/20">
                                    <Plus className="h-6 w-6" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 min-h-[100px] content-start">
                                {bannedWords.map(word => (
                                    <div key={word} className="group flex items-center gap-2 pl-4 pr-2 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm font-bold shadow-sm hover:border-red-500/30 transition-all">
                                        <span>{word}</span>
                                        <button onClick={() => removeBannedWord(word)} className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                                {bannedWords.length === 0 && (
                                    <div className="w-full flex flex-col items-center justify-center py-8 text-slate-300 dark:text-slate-700">
                                        <Shield className="h-10 w-10 mb-2 opacity-20" />
                                        <p className="font-bold text-sm">
                                            {selectedAgentIds.length === 0 ? "Select an agent above to configure guardrails" :
                                                selectedAgentIds.length > 1 ? "Start adding words to apply to all selected agents" : "No banned words configured"}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {/* Auto-save enabled, no button needed */}
                        </CardContent>
                    </Card>

                    {/* Output Guardrails */}
                    <Card className={`border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden ring-1 ring-slate-900/5`}>
                        {/* Enabled for multi-select */}
                        <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Shield className="h-5 w-5 text-emerald-500" />
                                Output Guardrails
                            </CardTitle>
                            <CardDescription>
                                {selectedAgentIds.length > 1 ? "Configure rules for all selected agents (Overrides existing)." : "Redact sensitive info from agent responses."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex gap-2">
                                <Select value={selectedType} onValueChange={setSelectedType} disabled={selectedAgentIds.length === 0}>
                                    <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-sm">
                                        <SelectValue placeholder={selectedAgentIds.length === 0 ? "Select Agent First..." : "Add New Rule..."} />
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
                                    onClick={() => addOutputGuardrail(selectedType)}
                                    disabled={!selectedType}
                                    className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20"
                                >
                                    Add
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {outputGuardrails.map((item, idx) => (
                                    <div key={idx} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 relative group shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${item.type === 'email' ? 'bg-blue-500/10 text-blue-500' :
                                                    item.type === 'phone' ? 'bg-green-500/10 text-green-500' :
                                                        item.type === 'sensitive' ? 'bg-yellow-500/10 text-yellow-500' :
                                                            item.type === 'profanity' ? 'bg-red-500/10 text-red-500' :
                                                                'bg-purple-500/10 text-purple-500'
                                                    }`}>
                                                    {item.type === 'email' && <Mail className="h-4 w-4" />}
                                                    {item.type === 'phone' && <Phone className="h-4 w-4" />}
                                                    {item.type === 'sensitive' && <AlertTriangle className="h-4 w-4" />}
                                                    {item.type === 'profanity' && <MessageSquare className="h-4 w-4" />}
                                                    {item.type === 'maxlength' && <MoreHorizontal className="h-4 w-4" />}
                                                </div>
                                                <span className="font-bold text-sm capitalize text-slate-700 dark:text-slate-200">
                                                    {item.type === 'maxlength' ? 'Max Length' : item.type + ' Redaction'}
                                                </span>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => removeOutputGuardrail(idx)} className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {['email', 'phone', 'sensitive', 'profanity'].includes(item.type) && (
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Replacement</Label>
                                                    <Input
                                                        value={item.config.replacement || ''}
                                                        onChange={(e) => updateGuardrailConfig(idx, 'replacement', e.target.value)}
                                                        onBlur={triggerAutoSave}
                                                        className="h-9 text-xs bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5"
                                                    />
                                                </div>
                                            )}
                                            {item.type === 'sensitive' && (
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Min Digits</Label>
                                                    <Input
                                                        type="number"
                                                        value={item.config.minimumDigits || 6}
                                                        onChange={(e) => updateGuardrailConfig(idx, 'minimumDigits', parseInt(e.target.value))}
                                                        onBlur={triggerAutoSave}
                                                        className="h-9 text-xs bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {outputGuardrails.length === 0 && (
                                    <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl">
                                        {selectedAgentIds.length === 0 ? "Select an agent to configure output rules." : "No output rules active."}
                                    </div>
                                )}
                            </div>
                            {/* Auto-save enabled, no button needed */}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

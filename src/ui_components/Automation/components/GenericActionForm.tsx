import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type ActionParameter } from "@/ui_components/Automation/metadata"
import { usePieces } from "@/context/PieceContext";
import ConnectionSelector from "@/ui_components/Connections/ConnectionSelector"
import { useState, useEffect } from "react";
import { type Node, type Edge } from "@xyflow/react";
import { VariablePicker } from "@/ui_components/Automation/components/VariablePicker";
import { useUser } from "@/context/UserContext";
import { API_URL } from "@/ui_components/api/apiurl";
import axios from "axios";


import { Plus, Trash2, Pencil, List } from "lucide-react";
import { Button } from "@/components/button"
import { Switch } from "@/components/ui/switch"

// Robust String Array Input
const StringArrayInput = ({ value, onChange, placeholder, disabled }: { value: any, onChange: (val: any) => void, placeholder?: string, disabled?: boolean }) => {
    // Parse value into array of strings
    const parseValue = (val: any): string[] => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
            try { return JSON.parse(val.replace(/'/g, '"')); } catch { return []; }
        }
        return [];
    };

    const [items, setItems] = useState<string[]>(parseValue(value));

    // Sync from parent props
    useEffect(() => {
        const parsed = parseValue(value);
        if (JSON.stringify(parsed) !== JSON.stringify(items)) {
            setItems(parsed);
        }
    }, [value]);

    const handleUpdate = (newItems: string[]) => {
        setItems(newItems);
        onChange(newItems);
    };

    const addItem = () => {
        const newItems = [...items, `Branch ${items.length + 1}`];
        handleUpdate(newItems);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        handleUpdate(newItems);
    };

    const updateItem = (index: number, val: string) => {
        const newItems = [...items];
        newItems[index] = val;
        handleUpdate(newItems);
    };

    return (
        <div className="flex flex-col gap-2">
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <Input
                        value={item}
                        onChange={(e) => updateItem(index, e.target.value)}
                        placeholder={`Item ${index + 1}`}
                        disabled={disabled}
                        required
                        className="flex-1 h-8 text-xs"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(index)}
                        disabled={disabled}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            ))}
            <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs border-dashed gap-2 text-muted-foreground"
                onClick={addItem}
                disabled={disabled}
            >
                <Plus className="h-3 w-3" />
                Add Item
            </Button>
            <p className="text-[10px] text-muted-foreground italic mt-1">
                {placeholder}
            </p>
        </div>
    );
};

interface GenericActionFormProps {
    data: any;
    params: any;
    onChange: (params: any) => void;
    parameters: ActionParameter[];
    disabled?: boolean;
    nodes: Node[];
    edges?: any[]; // added edges
    errors?: Record<string, string>;
    nodeId?: string;
}


const DynamicSelect = ({
    param,
    value,
    onChange,
    disabled,
    userId,
    connectionId,
    allParams,
    service,
    nodes,
    edges,
    nodeId
}: {
    param: ActionParameter,
    value: any,
    onChange: (val: any) => void,
    disabled?: boolean,
    userId: string,
    connectionId: string,
    allParams: any,
    service: string,
    nodes: Node[],
    edges?: Edge[],
    nodeId?: string
}) => {
    const [options, setOptions] = useState<{ label: string, value: any }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isManual, setIsManual] = useState(false);

    const dynamicOptions = param.dynamicOptions!;

    // Determine if we have all required dependencies
    const dependencies = dynamicOptions.dependsOn || [];
    const missingDependencies = dependencies.some(dep => !allParams[dep]);

    // Create a stable key for dependencies
    const depsKey = JSON.stringify(dependencies.map(dep => allParams[dep]));

    useEffect(() => {
        const fetchOptions = async () => {
            if (!userId || !service || !dynamicOptions.action || !connectionId || missingDependencies) {
                setOptions([]);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                let res;
                if (dependencies.length > 0) {
                    const context: Record<string, any> = {};
                    dependencies.forEach(dep => {
                        context[dep] = allParams[dep];
                    });

                    res = await axios.post(`${API_URL}/api/v1/pieces/options/${dynamicOptions.action}`, {
                        userId,
                        service,
                        connectionId,
                        context
                    });
                } else {
                    res = await axios.get(`${API_URL}/api/v1/pieces/options/${dynamicOptions.action}`, {
                        params: { userId, service, connectionId }
                    });
                }

                if (res.data && res.data.success && Array.isArray(res.data.options)) {
                    setOptions(res.data.options);
                    // If current value is not in options and not empty, default to manual
                    const val = String(value);
                    if (val && !res.data.options.find((opt: any) => String(opt.value) === val)) {
                        setIsManual(true);
                    }
                } else if (Array.isArray(res.data)) {
                    setOptions(res.data);
                    const val = String(value);
                    if (val && !res.data.find((opt: any) => String(opt.value) === val)) {
                        setIsManual(true);
                    }
                } else {
                    setError(res.data?.error || "Failed to load options");
                }
            } catch (err: any) {
                setError(err.response?.data?.error || err.message || "Failed to load options");
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, [userId, connectionId, service, dynamicOptions.action, depsKey, missingDependencies]);

    const handleVariableSelect = (v: string) => {
        const currentValue = value || '';
        onChange(currentValue + v);
    };

    if (!connectionId) return <div className="text-[10px] text-muted-foreground italic p-2 border rounded-md bg-muted/20">Please select a connection first</div>;
    if (missingDependencies) return <div className="text-[10px] text-muted-foreground italic p-2 border rounded-md bg-muted/20">Please select {dependencies.join(' and ')} first</div>;

    return (
        <div className="flex flex-col gap-1.5 w-full">
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    {isManual ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-medium uppercase text-muted-foreground/50">
                                    Manual ID
                                </Label>
                                <VariablePicker
                                    nodes={nodes}
                                    edges={edges || []}
                                    onSelect={handleVariableSelect}
                                    currentNodeId={nodeId}
                                />
                            </div>
                            <Input
                                value={value || ''}
                                onChange={(e) => onChange(e.target.value)}
                                disabled={disabled}
                                placeholder={`Enter ${param.label} ID manually...`}
                                className="bg-background"
                            />
                        </div>
                    ) : (
                        <Select
                            value={value || ''}
                            onValueChange={onChange}
                            disabled={disabled || loading}
                            required
                        >
                            <SelectTrigger className={error ? "border-red-500" : ""}>
                                <SelectValue placeholder={loading ? "Loading..." : (param.description || `Select ${param.label}`)} />
                            </SelectTrigger>
                            <SelectContent>
                                {options.length === 0 && !loading && (
                                    <div className="p-2 text-center text-xs text-muted-foreground">No options found</div>
                                )}
                                {options.map(opt => (
                                    <SelectItem key={opt.value} value={String(opt.value)}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setIsManual(!isManual)}
                    title={isManual ? "Switch to Selection" : "Enter ID Manually"}
                >
                    {isManual ? <List className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </Button>
            </div>
            {error && !isManual && <p className="text-[10px] text-red-500">{error}</p>}
        </div>
    );
};

const AgentSelector = ({
    value,
    onChange,
    disabled
}: {
    value: string,
    onChange: (val: string) => void,
    disabled?: boolean
}) => {
    const [agents, setAgents] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useUser();

    useEffect(() => {
        const fetchAgents = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                const res = await axios.get(`${API_URL}/api/v1/agents?userId=${user?.id}&tree=true`);
                if (Array.isArray(res.data)) {
                    setAgents(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch agents", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAgents();
    }, [user?.id]);

    const renderAgentItems = (list: any[], level = 0) => {
        if (!list || !Array.isArray(list)) return null;
        return list.map(agent => (
            <div key={agent.id}>
                <SelectItem value={String(agent.id)}>
                    <div className="flex items-center gap-2">
                        {level > 0 && (
                            <div className="flex items-center">
                                {[...Array(level)].map((_, i) => (
                                    <div key={i} className="w-4 h-px bg-muted-foreground/30 mr-1" />
                                ))}
                            </div>
                        )}
                        <span className={level > 0 ? "text-muted-foreground" : "font-medium"}>
                            {agent.name}
                        </span>
                    </div>
                </SelectItem>
            </div>
        ));
    };

    return (
        <Select
            value={value || ""}
            onValueChange={(val) => onChange(val)}
            disabled={disabled || loading}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder={loading ? "Loading agents..." : "Select an Agent"} />
            </SelectTrigger>
            <SelectContent>
                {agents.length === 0 && !loading && (
                    <div className="p-2 text-center text-xs text-muted-foreground italic">
                        No agents found. Create one in AI Agents tab first.
                    </div>
                )}
                {renderAgentItems(agents)}
            </SelectContent>
        </Select>
    );
};

export default function GenericActionForm({ data, params = {}, onChange, parameters, disabled, nodes, edges = [], errors = {}, nodeId }: GenericActionFormProps) {
    const { user } = useUser();
    const userId = user?.id || '';

    const handleChange = (field: string, value: any) => {
        const updated = { ...params, [field]: value };

        // Clear dependent fields if the parent changes
        parameters.forEach(p => {
            if (p.dynamicOptions?.dependsOn?.includes(field)) {
                delete updated[p.name];
            }
        });

        onChange(updated);
    };

    const handleVariableSelect = (field: string, variable: string) => {
        const currentValue = params[field] || '';
        handleChange(field, currentValue + variable);
    };

    const { piecesMap } = usePieces();
    const appName = data.appName || 'App';
    const service = data.icon || data.appName?.toLowerCase().replace(/\s+/g, '') || '';

    const checkIsTrigger = () => {
        const actionId = data.actionId;
        const appDef = piecesMap[data.piece] || piecesMap[data.icon] || piecesMap[appName];
        const actionDef = appDef?.actions.find(a => a.id === actionId);
        return actionDef?.type === 'trigger';
    };

    const isTrigger = checkIsTrigger();

    return (
        <div className="flex flex-col gap-4">
            {parameters.map((param: any) => {
                // Check conditional visibility
                if (param.dependsOn) {
                    const dependentValue = params[param.dependsOn.field];
                    if (dependentValue !== param.dependsOn.value) {
                        return null;
                    }
                }

                return (
                    <div key={param.name} className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                                {param.label} <span className="text-red-500">*</span>
                            </Label>
                            {(param.type === 'string' || param.type === 'number' || param.type === 'array' || param.type === 'object' || param.type === 'select') && !isTrigger && (
                                <VariablePicker
                                    nodes={nodes}
                                    edges={edges}
                                    onSelect={(v) => handleVariableSelect(param.name, v)}
                                    currentNodeId={nodeId}
                                />
                            )}
                        </div>

                        {param.type === 'connection' && (
                            <ConnectionSelector
                                appName={param.label?.toLowerCase().includes('gmail') ? 'Gmail' :
                                    param.label?.toLowerCase().includes('drive') ? 'Google Drive' :
                                        param.label?.toLowerCase().includes('docs') ? 'Google Docs' :
                                            param.label?.toLowerCase().includes('sheets') ? 'Google Sheets' :
                                                ['googledocs', 'docs'].includes(appName.toLowerCase()) ? 'Google Docs' :
                                                    ['googlesheets', 'sheets'].includes(appName.toLowerCase()) ? 'Google Sheets' :
                                                        ['googledrive', 'drive'].includes(appName.toLowerCase()) ? 'Google Drive' :
                                                            appName === 'Agent' ? 'OpenRouter' :
                                                                appName}
                                value={params[param.name] || ''}
                                onChange={(val) => handleChange(param.name, val)}
                                disabled={disabled}
                            />
                        )}

                        {param.type === 'agent' && (
                            <AgentSelector
                                value={params[param.name] || ''}
                                onChange={(val) => handleChange(param.name, val)}
                                disabled={disabled}
                            />
                        )}

                        {param.type === 'dynamic-select' && (
                            <DynamicSelect
                                param={param}
                                value={params[param.name] || ''}
                                onChange={(val) => handleChange(param.name, val)}
                                disabled={disabled}
                                userId={userId}
                                connectionId={params['connection'] || params['authId'] || ''}
                                allParams={params}
                                service={data.piece || data.icon || (data.appName ? data.appName.toLowerCase().replace(/\s+/g, '') : '')}
                                nodes={nodes}
                                edges={edges as Edge[]}
                                nodeId={nodeId}
                            />
                        )}

                        {param.type === 'select' && (
                            <Select
                                value={params[param.name] || param.default || ''}
                                onValueChange={(val) => handleChange(param.name, val)}
                                disabled={disabled}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={param.description || "Select an option"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {param.options?.map((opt: any) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {param.type === 'string' && (
                            ['body', 'description', 'text', 'input', 'prompt', 'messages'].includes(param.name) ? (
                                <Textarea
                                    value={params[param.name] || param.default || ''}
                                    onChange={(e) => handleChange(param.name, e.target.value)}
                                    placeholder={param.description}
                                    className="min-h-[100px]"
                                    disabled={disabled}
                                    required
                                />
                            ) : (
                                <Input
                                    value={params[param.name] || param.default || ''}
                                    onChange={(e) => handleChange(param.name, e.target.value)}
                                    placeholder={param.description}
                                    disabled={disabled}
                                    required
                                />
                            )
                        )}

                        {param.type === 'number' && (
                            <Input
                                type="text" // Changed to text to support {{vars}}
                                value={params[param.name] || param.default || ''}
                                onChange={(e) => handleChange(param.name, e.target.value)}
                                placeholder={param.description}
                                disabled={disabled}
                                required
                            />
                        )}

                        {param.type === 'boolean' && (
                            <div className="flex items-center space-x-2 h-10">
                                <Switch
                                    checked={!!(params[param.name] || param.default)}
                                    onCheckedChange={(checked) => handleChange(param.name, checked)}
                                    disabled={disabled}
                                    id={`switch-${param.name}`}
                                />
                                <Label htmlFor={`switch-${param.name}`} className="font-normal text-muted-foreground cursor-pointer">
                                    {param.description || (params[param.name] ? 'True' : 'False')}
                                </Label>
                            </div>
                        )}

                        {(param.type === 'object' || param.type === 'json') && (
                            <div className="flex flex-col gap-1">
                                <Textarea
                                    value={typeof params[param.name] === 'object' ? JSON.stringify(params[param.name], null, 2) : (params[param.name] || param.default || '')}
                                    onChange={(e) => handleChange(param.name, e.target.value)}
                                    placeholder={param.description || "{ \"key\": \"value\" }"}
                                    className="font-mono text-xs min-h-[100px]"
                                    disabled={disabled}
                                />
                                <p className="text-[10px] text-muted-foreground italic">
                                    Enter JSON object or key-value pairs.
                                </p>
                            </div>
                        )}

                        {param.type === 'array' && (
                            <StringArrayInput
                                value={params[param.name]}
                                onChange={(val) => handleChange(param.name, val)}
                                placeholder={param.description + " (e.g. [\"data1\", \"data2\"])"}
                                disabled={disabled}
                            />
                        )}
                        {errors[param.name] && <p className="text-[10px] text-red-500 font-medium">{errors[param.name]}</p>}
                    </div>
                );
            })}
        </div>
    );
}

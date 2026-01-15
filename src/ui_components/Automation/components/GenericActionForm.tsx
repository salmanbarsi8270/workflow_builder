import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePieces } from "@/context/PieceContext";
import ConnectionSelector from "@/ui_components/Connections/ConnectionSelector"
import { useState, useEffect, useCallback, useRef } from "react";
import { type Node, type Edge } from "@xyflow/react";
import { VariablePicker } from "@/ui_components/Automation/components/VariablePicker";
import { useUser } from "@/context/UserContext";
import { getPieceOptions, getExcelWorkbooks } from "@/ui_components/api/pieces";
import { API_URL } from "@/ui_components/api/apiurl";


import { cn } from "@/lib/utils";
import { Plus, Trash2, Pencil, List, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ConditionBuilder } from "@/ui_components/Automation/components/ConditionBuilder";


// Robust String Array Input
const StringArrayInput = ({ value, onChange, placeholder, disabled, isBranches, nodeType }: { value: any, onChange: (val: any) => void, placeholder?: string, disabled?: boolean, isBranches?: boolean, nodeType?: string }) => {
    // Parse value into array of strings
    const parseValue = (val: any): string[] => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
            try { return JSON.parse(val.replace(/'/g, '"')); } catch { return []; }
        }
        return [];
    };

    const [items, setItems] = useState<string[]>(parseValue(value));

    // Helper to recount and re-label "Branch" paths correctly
    const rebalanceConditionLabels = (newItems: string[]) => {
        if (nodeType !== 'condition') return newItems;

        return newItems.map((_item, index) => {
            if (index === newItems.length - 1 && newItems.length > 1) return 'Otherwise';
            return `Branch ${index + 1}`;
        });
    };

    // Sync from parent props
    useEffect(() => {
        const parsed = parseValue(value);
        if (JSON.stringify(parsed) !== JSON.stringify(items)) {
            setItems(parsed);
        }
    }, [value]);

    const handleUpdate = (newItems: string[]) => {
        const balancedItems = rebalanceConditionLabels(newItems);
        setItems(balancedItems);
        onChange(balancedItems);
    };

    const addItem = () => {
        let newItems;
        const isCondition = nodeType === 'condition';
        if (isBranches && isCondition && items.length > 0 && items[items.length - 1].toLowerCase() === 'else') {
            // Insert before else
            newItems = [...items.slice(0, -1), 'Else If', items[items.length - 1]];
        } else if (isBranches && nodeType === 'parallel') {
            newItems = [...items, `Branch ${items.length + 1}`];
        } else {
            newItems = [...items, `Item ${items.length + 1}`];
        }
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
            {items.map((item, index) => {
                const isCondition = nodeType === 'condition';
                const lowerItem = item.toLowerCase();
                const isProtected = isBranches && isCondition && (lowerItem === 'if' || lowerItem === 'else' || index === 0 || index === items.length - 1);

                return (
                    <div key={index} className="flex items-center gap-2">
                        <Input
                            value={item}
                            onChange={(e) => updateItem(index, e.target.value)}
                            placeholder={`Item ${index + 1}`}
                            disabled={disabled || isProtected}
                            required
                            className={cn(
                                "flex-1 h-8 text-xs",
                                isProtected && "bg-muted/50 font-medium"
                            )}
                        />
                        {!isProtected && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => removeItem(index)}
                                disabled={disabled}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        )}
                        {isProtected && (
                            <div className="h-8 w-8 flex items-center justify-center opacity-30">
                                <Plus className="h-3 w-3 rotate-45" />
                            </div>
                        )}
                    </div>
                );
            })}
            <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs border-dashed gap-2 text-muted-foreground"
                onClick={addItem}
                disabled={disabled}
            >
                <Plus className="h-3 w-3" />
                {isBranches ? 'Add Branch' : 'Add Item'}
            </Button>
            <p className="text-[10px] text-muted-foreground italic mt-1">
                {placeholder}
            </p>
        </div>
    );
};

const DictionaryInput = ({ value, onChange, placeholder, disabled, nodes, edges, nodeId }: { value: any, onChange: (val: any) => void, placeholder?: string, disabled?: boolean, nodes: Node[], edges: any[], nodeId?: string }) => {
    // Parse value into array of {key, value}
    const parseValue = (val: any): { key: string, value: string }[] => {
        try {
            if (typeof val === 'string') {
                const parsed = JSON.parse(val);
                return Object.entries(parsed).map(([k, v]) => ({ key: k, value: String(v) }));
            }
            if (typeof val === 'object' && val !== null) {
                return Object.entries(val).map(([k, v]) => ({ key: k, value: String(v) }));
            }
        } catch { }
        return [];
    };

    const [items, setItems] = useState<{ key: string, value: string }[]>(parseValue(value));
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync from parent props if changed externally
    useEffect(() => {
        // If user is typing inside this component, don't overwrite with potential stale props
        if (containerRef.current?.contains(document.activeElement)) {
            return;
        }

        const parsed = parseValue(value);
        // Deep compare to avoid loops (simple JSON stringify is sufficient here)
        if (JSON.stringify(parsed) !== JSON.stringify(items)) {
            setItems(parsed);
        }
    }, [value]);

    const handleUpdate = (newItems: { key: string, value: string }[]) => {
        setItems(newItems);
        // Serialize to object
        const obj: Record<string, string> = {};
        newItems.forEach(item => {
            if (item.key) obj[item.key] = item.value;
        });
        onChange(obj);
    };

    const addItem = () => {
        handleUpdate([...items, { key: '', value: '' }]);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        handleUpdate(newItems);
    };

    const updateItem = (index: number, field: 'key' | 'value', val: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: val };
        handleUpdate(newItems);
    };

    const handleVariableSelect = (index: number, v: string) => {
        const currentVal = items[index].value || '';
        updateItem(index, 'value', currentVal + v);
    };

    return (
        <div className="flex flex-col gap-2" ref={containerRef}>
            <div className="border rounded-md overflow-hidden bg-background/50">
                {/* Items */}
                <div className="divide-y max-h-[300px] overflow-auto">
                    {items.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground text-[10px] italic">
                            No properties defined. Click add below.
                        </div>
                    )}
                    {items.map((item, index) => (
                        <div key={index} className="flex flex-col gap-2 p-3 group hover:bg-muted/20 transition-colors bg-card/30">
                            {/* Key Row */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase opacity-70 w-8">Key</span>
                                <Input
                                    value={item.key}
                                    onChange={(e) => updateItem(index, 'key', e.target.value)}
                                    placeholder="key_name"
                                    className="flex-1 h-7 text-xs font-medium font-mono border shadow-sm bg-background/50 focus:bg-background"
                                    disabled={disabled}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground/50 hover:text-red-500 shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={() => removeItem(index)}
                                    disabled={disabled}
                                    title="Remove Property"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            {/* Value Row */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase opacity-70 w-8">Val</span>
                                <div className="flex-1 flex items-center gap-1">
                                    <Input
                                        value={item.value}
                                        onChange={(e) => updateItem(index, 'value', e.target.value)}
                                        placeholder="Value"
                                        className="flex-1 h-7 text-xs border shadow-sm bg-background/50 focus:bg-background min-w-0"
                                        disabled={disabled}
                                    />
                                    <VariablePicker
                                        nodes={nodes}
                                        edges={edges}
                                        onSelect={(v) => handleVariableSelect(index, v)}
                                        currentNodeId={nodeId}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer/Add Action */}
                <div className="p-2 border-t bg-muted/20">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-xs gap-2 text-primary hover:text-primary hover:bg-primary/5"
                        onClick={addItem}
                        disabled={disabled}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Property
                    </Button>
                </div>
            </div>

            {placeholder && (
                <p className="text-[10px] text-muted-foreground italic px-1">
                    {placeholder}
                </p>
            )}
        </div>
    );
};

interface GenericActionFormProps {
    data: any;
    params: any;
    onChange: (params: any) => void;
    parameters: any[];
    disabled?: boolean;
    nodes: Node[];
    edges?: any[]; // added edges
    errors?: Record<string, string>;
    nodeId?: string;
    nodeType?: string;
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
    param: any,
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
    const missingDependencies = dependencies.some((dep: string) => !allParams[dep]);

    // Create a stable key for dependencies
    const depsKey = JSON.stringify(dependencies.map((dep: string) => allParams[dep]));

    useEffect(() => {
        const fetchOptions = async () => {
            if (!userId || !service || !dynamicOptions.action || !connectionId || missingDependencies) {
                setOptions([]);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const context: Record<string, any> = {};
                dependencies.forEach((dep: string) => {
                    context[dep] = allParams[dep];
                });

                let res;
                if ((service === 'microsoft_excel' || service === 'excel') && dynamicOptions.action === 'listWorkbooks') {
                    const data = await getExcelWorkbooks(userId);
                    res = {
                        success: true,
                        options: (data.value || data.files || []).map((f: any) => ({
                            label: f.name,
                            value: f.id
                        }))
                    };
                } else {
                    res = await getPieceOptions({
                        userId,
                        service,
                        actionName: dynamicOptions.action,
                        connectionId,
                        context
                    });
                }

                if (res.success && Array.isArray(res.options)) {
                    setOptions(res.options);
                    // If current value is not in options and not empty, default to manual
                    const val = String(value);
                    if (val && !res.options.find((opt: any) => String(opt.value) === val)) {
                        setIsManual(true);
                    }
                } else {
                    setError(res.error || "Failed to load options");
                    setOptions([]);
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load options");
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
                                <SelectValue placeholder={param.description || `Select ${param.label}`}>
                                    {loading ? (
                                        <div className="flex items-center gap-2 text-muted-foreground/70 italic">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            <span>Loading options...</span>
                                        </div>
                                    ) : (
                                        value ? options.find(o => String(o.value) === String(value))?.label || value : (param.description || `Select ${param.label}`)
                                    )}
                                </SelectValue>
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
                const response = await fetch(`${API_URL}/api/v1/agents?userId=${user?.id}&tree=true`);
                const data = await response.json();
                if (Array.isArray(data)) {
                    setAgents(data);
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
                <SelectValue placeholder="Select an Agent">
                    {loading ? (
                        <div className="flex items-center gap-2 text-muted-foreground/70 italic">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Loading agents...</span>
                        </div>
                    ) : (
                        agents.find(a => String(a.id) === String(value))?.name || "Select an Agent"
                    )}
                </SelectValue>
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

const StepSelector = ({ value, onChange, nodes, currentNodeId, placeholder, disabled }: {
    value: string,
    onChange: (val: string) => void,
    nodes: Node[],
    currentNodeId?: string,
    placeholder?: string,
    disabled?: boolean
}) => {
    // Extract step ID from value like {{steps.ID.data...}}
    const getStepId = (val: string) => {
        const match = val?.match(/\{\{steps\.(.+?)\.data/);
        return match ? match[1] : '';
    };

    const currentStepId = getStepId(value);

    // Filter available nodes (Build Object or Update Object)
    const availableNodes = nodes.filter(n =>
        n.id !== currentNodeId &&
        n.type !== 'end' &&
        (n.data?.actionId === 'buildObject' || n.data?.actionId === 'updateObject')
    );

    const handleSelect = (stepId: string) => {
        // Construct the variable reference.
        // We default to the root data object for maximum compatibility with the 'data' piece spreading.
        const ref = `{{steps.${stepId}.data}}`;
        onChange(ref);
    };

    return (
        <Select
            value={currentStepId}
            onValueChange={handleSelect}
            disabled={disabled}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder || "Select an Object step"}>
                    {currentStepId ? (
                        (() => {
                            const n = nodes.find(node => node.id === currentStepId);
                            return n ? `${n.data.label || n.id}` : currentStepId;
                        })()
                    ) : (placeholder || "Select an Object step")}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {availableNodes.length === 0 && (
                    <div className="p-2 text-center text-xs text-muted-foreground italic">
                        No 'Build Object' steps found.
                    </div>
                )}
                {availableNodes.map((node: any) => (
                    <SelectItem key={node.id} value={node.id}>
                        <div className="flex flex-col text-left">
                            <span className="font-medium">{node.data.label || node.id}</span>
                            <span className="text-[10px] text-muted-foreground">{node.data.appName || node.data.piece}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default function GenericActionForm({ data, params = {}, onChange, parameters, disabled, nodes, edges = [], errors = {}, nodeId, nodeType }: GenericActionFormProps) {
    const { user } = useUser();
    const userId = user?.id || '';

    // Auto-fill logic for updateObject
    useEffect(() => {
        if (data.actionId === 'updateObject' && params.sourceObject) {
            // Extract node ID and optionally sub-path from {{steps.NODE_ID.data...}}
            const match = params.sourceObject.match(/\{\{steps\.(.+?)\.data(?:\.(.+?))?\}\}/);
            const sourceNodeId = match ? match[1] : null;
            const subPath = match ? match[2] : null; // 'object' or 'updatedObject'

            if (sourceNodeId) {
                // Find node by ID (1 is trigger)
                const sourceNode = nodes.find(n => n.id === sourceNodeId || (sourceNodeId === 'trigger' && n.id === '1'));

                if (sourceNode) {
                    let sourceProps: Record<string, any> = {};
                    const nodeParams = (sourceNode.data?.params as any) || {};

                    // Collect properties from buildObject or local dictionary
                    if (nodeParams.properties) {
                        try {
                            sourceProps = typeof nodeParams.properties === 'string'
                                ? JSON.parse(nodeParams.properties)
                                : nodeParams.properties;
                        } catch (e) { }
                    }

                    // Also merge from updates if it was an updateObject step
                    if (nodeParams.updates) {
                        try {
                            const upds = typeof nodeParams.updates === 'string'
                                ? JSON.parse(nodeParams.updates)
                                : nodeParams.updates;
                            sourceProps = { ...sourceProps, ...upds };
                        } catch (e) { }
                    }

                    const currentUpdates = params.updates || {};
                    const newUpdates: Record<string, string> = { ...currentUpdates };
                    let changed = false;

                    const mappingPrefix = `steps.${sourceNodeId}.data${subPath ? '.' + subPath : ''}`;

                    Object.keys(sourceProps).forEach(key => {
                        if (key && !newUpdates.hasOwnProperty(key)) {
                            // Automatically map to the source property
                            newUpdates[key] = `{{${mappingPrefix}.${key}}}`;
                            changed = true;
                        }
                    });

                    if (changed) {
                        onChange({ ...params, updates: newUpdates });
                    }
                }
            }
        }
    }, [params.sourceObject, nodes, data.actionId, params, onChange]);

    const handleChange = useCallback((field: string, value: any) => {
        const updated = { ...params, [field]: value };

        // Clear dependent fields if the parent changes
        parameters.forEach(p => {
            if (p.dynamicOptions?.dependsOn?.includes(field)) {
                delete updated[p.name];
            }
        });

        onChange(updated);
    }, [params, parameters, onChange]);

    const handleVariableSelect = (field: string, variable: string) => {
        const currentValue = params[field] || '';
        handleChange(field, currentValue + variable);
    };

    const { piecesMap } = usePieces();
    const appName = data.appName || 'App';


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
                                                            appName.toLowerCase() === 'agent' ? 'OpenRouter' :
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

                        {(param.type === 'dictionary') && (
                            <DictionaryInput
                                value={params[param.name]}
                                onChange={(val) => handleChange(param.name, val)}
                                placeholder={param.description}
                                disabled={disabled}
                                nodes={nodes}
                                edges={edges}
                                nodeId={nodeId}
                            />
                        )}

                        {/* Improved Step Selector for Object Actions */}
                        {(param.type === 'step-select') && (
                            <StepSelector
                                value={params[param.name]}
                                onChange={(val) => handleChange(param.name, val)}
                                nodes={nodes}
                                currentNodeId={nodeId}
                                placeholder={param.description}
                                disabled={disabled}
                            />
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
                                isBranches={param.name === 'branches'}
                                nodeType={nodeType}
                            />
                        )}

                        {param.type === 'condition-builder' && (
                            <ConditionBuilder
                                value={params[param.name]}
                                onChange={(val) => handleChange(param.name, val)}
                                nodes={nodes}
                                edges={edges || []}
                                nodeId={nodeId}
                                disabled={disabled}
                                branches={params['branches']}
                            />
                        )}

                        {errors[param.name] && <p className="text-[10px] text-red-500 font-medium">{errors[param.name]}</p>}
                    </div>
                );
            })}
        </div>
    );
}

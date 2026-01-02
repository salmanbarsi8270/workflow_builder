import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type ActionParameter, APP_DEFINITIONS } from "./ActionDefinitions"
import ConnectionSelector from "../Connections/ConnectionSelector"
import { useState, useEffect } from "react";
import { type Node } from "@xyflow/react";
import { usePiecesMetadata } from "./usePiecesMetadata";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Database, Search, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GenericActionFormProps {
    data: any;
    params: any;
    onChange: (params: any) => void;
    parameters: ActionParameter[];
    disabled?: boolean;
    nodes: Node[];
    errors?: Record<string, string>;
}

export const VariablePicker = ({ onSelect, nodes, currentNodeId }: { onSelect: (val: string) => void, nodes: Node[], currentNodeId?: string }) => {
    const { pieces } = usePiecesMetadata();
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const toggle = (id: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    // Filter: 
    // 1. Not placeholder
    // 2. Not the end node
    // 3. Not the CURRENT node (user can't use data from the node they are currently configuring)
    const normalizedCurrentNodeId = currentNodeId ? String(currentNodeId) : null;

    const checkIsTrigger = (node: Node) => {
        const appName = node.data?.appName;
        const actionId = node.data?.actionId;
        const appDef = APP_DEFINITIONS.find(a => a.name === appName || a.id === node.data?.icon);
        const actionDef = appDef?.actions.find(a => a.id === actionId);
        return actionDef?.type === 'trigger';
    };

    // Find the current node to get its position
    const currentNode = normalizedCurrentNodeId
        ? nodes.find(n => String(n.id) === normalizedCurrentNodeId)
        : null;

    const availableNodes = nodes.filter(n => {
        const nodeId = String(n.id);

        // Always exclude the node being currently configured and the end node
        if (nodeId === normalizedCurrentNodeId || nodeId === 'end') return false;

        const isTrigger = checkIsTrigger(n);

        // Special Case: Always allow the Trigger
        if (isTrigger) return true;

        // Exclude placeholders otherwise
        if (n.data?.isPlaceholder) return false;

        // Only show nodes that appear BEFORE the current node (smaller Y position)
        // This ensures proper data flow: each step can only access data from previous steps
        if (currentNode && n.position.y >= currentNode.position.y) {
            return false;
        }

        return true;
    });

    const handleSelect = (val: string) => {
        onSelect(val);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 ml-2 text-[10px] gap-1 px-2 border-primary/20 hover:border-primary/50 text-primary bg-primary/5">
                    <Database className="h-3 w-3" />
                    Select Data
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center border-b px-3">
                    <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                    <Input
                        placeholder="Search variables..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border-0 focus-visible:ring-0 h-10 px-0 text-sm"
                    />
                </div>
                <div className="max-h-[300px] overflow-auto p-2">
                    {availableNodes.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                            {nodes.length <= 1 ? "Add more steps to use their data here." : "No previous steps with data found."}
                        </div>
                    ) : (
                        availableNodes.map(node => {
                            const icon = node.data.icon as string;
                            const actionId = node.data.actionId as string;
                            const isTrigger = checkIsTrigger(node);
                            const pathNodeId = isTrigger ? 'trigger' : node.id;

                            const piece = pieces[icon];
                            const actionType = isTrigger ? 'triggers' : 'actions';
                            const schema = piece?.metadata?.[actionType]?.[actionId]?.outputSchema || [];

                            const nodeLabel = (node.data.label as string) || '';
                            const lowerSearch = search.toLowerCase();
                            const matchesNodeLabel = nodeLabel.toLowerCase().includes(lowerSearch);

                            const filteredSchema = schema.filter((prop: any) => {
                                if (!search) return true;
                                return matchesNodeLabel ||
                                    prop.name.toLowerCase().includes(lowerSearch) ||
                                    prop.type.toLowerCase().includes(lowerSearch);
                            });

                            if (!matchesNodeLabel && filteredSchema.length === 0 && search) return null;

                            const isExpanded = expanded.has(node.id) || (!!search && filteredSchema.length > 0);

                            return (
                                <div key={node.id} className="mb-2 border rounded-md overflow-hidden bg-background">
                                    <div
                                        className="px-3 py-2 text-xs font-medium bg-muted/30 hover:bg-muted/50 cursor-pointer flex items-center justify-between transition-colors"
                                        onClick={() => toggle(node.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                                            <span className="truncate max-w-[150px]">{nodeLabel || 'Step'}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[8px] h-3 px-1 ml-2 shrink-0">ID: {node.id}</Badge>
                                    </div>

                                    {isExpanded && (
                                        <div className="divide-y border-t bg-card/50">
                                            {filteredSchema.length === 0 ? (
                                                <button
                                                    onClick={() => handleSelect(`{{steps.${pathNodeId}.data}}`)}
                                                    className="w-full text-left px-8 py-2 text-xs hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between"
                                                >
                                                    <span>Full Object</span>
                                                    <span className="text-[10px] text-muted-foreground">any</span>
                                                </button>
                                            ) : (
                                                filteredSchema.map((prop: any) => (
                                                    <button
                                                        key={prop.name}
                                                        onClick={() => handleSelect(`{{steps.${pathNodeId}.data.${prop.name}}}`)}
                                                        className="w-full text-left px-8 py-2 text-xs hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between group"
                                                    >
                                                        <span className="truncate">{prop.name}</span>
                                                        <span className="text-[10px] text-muted-foreground/70 group-hover:text-muted-foreground capitalize shrink-0 ml-2">{prop.type}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

import { Plus, Trash2 } from "lucide-react";

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
    errors?: Record<string, string>;
    nodeId?: string;
}

import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/context/UserContext";
import { API_URL } from "../api/apiurl";
import axios from "axios";

const DynamicSelect = ({
    param,
    value,
    onChange,
    disabled,
    userId,
    connectionId,
    allParams,
    service
}: {
    param: ActionParameter,
    value: any,
    onChange: (val: any) => void,
    disabled?: boolean,
    userId: string,
    connectionId: string,
    allParams: any,
    service: string
}) => {
    const [options, setOptions] = useState<{ label: string, value: any }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const dynamicOptions = param.dynamicOptions!;

    // Determine if we have all required dependencies
    const dependencies = dynamicOptions.dependsOn || [];
    const missingDependencies = dependencies.some(dep => !allParams[dep]);

    useEffect(() => {
        if (!userId || !connectionId || missingDependencies) {
            setOptions([]);
            return;
        }

        const fetchOptions = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await axios.post(`${API_URL}/api/pieces/options`, {
                    userId,
                    service,
                    actionName: dynamicOptions.action,
                    params: {
                        authId: connectionId,
                        ...allParams
                    }
                });

                if (res.data.success) {
                    setOptions(res.data.options);
                } else {
                    setError(res.data.error || "Failed to load options");
                }
            } catch (err: any) {
                setError(err.message || "Failed to load options");
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, [userId, connectionId, service, dynamicOptions.action, ...dependencies.map(dep => allParams[dep])]);

    if (!connectionId) return <div className="text-[10px] text-muted-foreground italic p-2 border rounded-md bg-muted/20">Please select a connection first</div>;
    if (missingDependencies) return <div className="text-[10px] text-muted-foreground italic p-2 border rounded-md bg-muted/20">Please select {dependencies.join(' and ')} first</div>;

    return (
        <Select
            value={value || ''}
            onValueChange={onChange}
            disabled={disabled || loading}
        >
            <SelectTrigger className={error ? "border-red-500" : ""}>
                <SelectValue placeholder={loading ? "Loading..." : (param.description || `Select ${param.label}`)} />
            </SelectTrigger>
            <SelectContent>
                {options.length === 0 && !loading && (
                    <div className="p-2 text-center text-xs text-muted-foreground">No options found</div>
                )}
                {options.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
            {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
        </Select>
    );
};

export default function GenericActionForm({ data, params = {}, onChange, parameters, disabled, nodes, errors = {}, nodeId }: GenericActionFormProps) {
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

    const appName = data.appName || 'App';
    const service = data.icon || data.appName?.toLowerCase().replace(/\s+/g, '') || '';

    const checkIsTrigger = () => {
        const actionId = data.actionId;
        const appDef = APP_DEFINITIONS.find(a => a.name === appName || a.id === data.icon);
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
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                                {param.label} {param.required && <span className="text-red-500">*</span>}
                            </Label>
                            {(param.type === 'string' || param.type === 'number' || param.type === 'array' || param.type === 'object' || param.type === 'select') && !isTrigger && (
                                <VariablePicker
                                    nodes={nodes}
                                    onSelect={(v) => handleVariableSelect(param.name, v)}
                                    currentNodeId={nodeId}
                                />
                            )}
                        </div>

                        {param.type === 'connection' && (
                            <ConnectionSelector
                                appName={param.label?.includes('Gmail') ? 'Gmail' :
                                    param.label?.includes('Drive') ? 'Google Drive' :
                                        param.label?.includes('Docs') ? 'Google Docs' :
                                            param.label?.includes('Sheets') ? 'Google Sheets' :
                                                appName}
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
                                service={service}
                            />
                        )}

                        {param.type === 'select' && (
                            <Select
                                value={params[param.name] || param.default || ''}
                                onValueChange={(val) => handleChange(param.name, val)}
                                disabled={disabled}
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
                            param.name === 'body' || param.name === 'description' || param.name === 'text' ? (
                                <Textarea
                                    value={params[param.name] || param.default || ''}
                                    onChange={(e) => handleChange(param.name, e.target.value)}
                                    placeholder={param.description}
                                    className="min-h-[100px]"
                                    disabled={disabled}
                                />
                            ) : (
                                <Input
                                    value={params[param.name] || param.default || ''}
                                    onChange={(e) => handleChange(param.name, e.target.value)}
                                    placeholder={param.description}
                                    disabled={disabled}
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
                            />
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

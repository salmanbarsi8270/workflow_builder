import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { type ActionParameter } from "./ActionDefinitions"
import ConnectionSelector from "../Connections/ConnectionSelector"
import { useState, useEffect } from "react";
import { type Node } from "@xyflow/react";
import { usePiecesMetadata } from "./usePiecesMetadata";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Database, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

    // Filter: 
    // 1. Not placeholder
    // 2. Not the end node
    // 3. Not the CURRENT node (user can't use data from the node they are currently configuring)
    const availableNodes = nodes.filter(n =>
        !n.data.isPlaceholder &&
        n.id !== 'end' &&
        n.id !== currentNodeId
    );

    const handleSelect = (val: string) => {
        onSelect(val);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 px-2 border-primary/20 hover:border-primary/50 text-primary bg-primary/5">
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
                            const nodeId = node.id === '1' ? 'trigger' : node.id;
                            const isTrigger = node.id === '1';

                            const piece = pieces[icon];
                            const actionType = isTrigger ? 'triggers' : 'actions';
                            const schema = piece?.metadata?.[actionType]?.[actionId]?.outputSchema || [];

                            const nodeLabel = (node.data.label as string) || '';
                            if (search && !nodeLabel.toLowerCase().includes(search.toLowerCase())) return null;

                            return (
                                <div key={node.id} className="mb-2">
                                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                        {nodeLabel || 'Step'}
                                        <Badge variant="outline" className="ml-auto text-[8px] h-3 px-1">ID: {node.id}</Badge>
                                    </div>
                                    <div className="space-y-0.5">
                                        {schema.length === 0 ? (
                                            <button
                                                onClick={() => handleSelect(`{{steps.${nodeId}.data}}`)}
                                                className="w-full text-left px-4 py-1.5 text-xs hover:bg-muted rounded transition-colors flex items-center justify-between"
                                            >
                                                <span>Full Object</span>
                                                <span className="text-[10px] text-muted-foreground">any</span>
                                            </button>
                                        ) : (
                                            schema.map((prop: any) => (
                                                <button
                                                    key={prop.name}
                                                    onClick={() => handleSelect(`{{steps.${nodeId}.data.${prop.name}}}`)}
                                                    className="w-full text-left px-4 py-1.5 text-xs hover:bg-muted rounded transition-colors flex items-center justify-between group"
                                                >
                                                    <span className="group-hover:text-primary transition-colors">{prop.name}</span>
                                                    <span className="text-[10px] text-muted-foreground capitalize">{prop.type}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    <Separator className="mt-2 opacity-50" />
                                </div>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

const ArrayInput = ({ value, onChange, placeholder, disabled }: { value: any, onChange: (val: any) => void, placeholder?: string, disabled?: boolean }) => {
    const [localValue, setLocalValue] = useState(Array.isArray(value) ? JSON.stringify(value) : (value || ''));

    // Sync if value changes from outside (e.g. from a different node selection)
    useEffect(() => {
        const strValue = Array.isArray(value) ? JSON.stringify(value) : (value || '');
        if (strValue !== localValue) {
            try {
                // Only update if the parsed local value is truly different
                const parsedLocal = JSON.parse(localValue);
                if (JSON.stringify(parsedLocal) !== strValue) {
                    setLocalValue(strValue);
                }
            } catch {
                setLocalValue(strValue);
            }
        }
    }, [value]);

    const handleBlur = () => {
        try {
            const parsed = JSON.parse(localValue);
            onChange(parsed);
        } catch {
            onChange(localValue);
        }
    };

    return (
        <Input
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
        />
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

export default function GenericActionForm({ data, params = {}, onChange, parameters, disabled, nodes, errors = {}, nodeId }: GenericActionFormProps) {
    const handleChange = (field: string, value: any) => {
        onChange({ ...params, [field]: value });
    };

    const handleVariableSelect = (field: string, variable: string) => {
        const currentValue = params[field] || '';
        handleChange(field, currentValue + variable);
    };

    const appName = data.appName || 'App';

    return (
        <div className="flex flex-col gap-4">
            {parameters.map(param => {
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
                            {(param.type === 'string' || param.type === 'number') && (
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
                                    {param.options?.map(opt => (
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
                            <ArrayInput
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

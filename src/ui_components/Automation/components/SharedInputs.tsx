import { useState, useEffect, useRef } from "react";
import { type Node } from "@xyflow/react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VariablePicker } from "./VariablePicker";

// Robust String Array Input
export const StringArrayInput = ({ value, onChange, placeholder, disabled, isBranches, nodeType }: { value: any, onChange: (val: any) => void, placeholder?: string, disabled?: boolean, isBranches?: boolean, nodeType?: string }) => {
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
            {placeholder && (
                <p className="text-[10px] text-muted-foreground italic mt-1">
                    {placeholder}
                </p>
            )}
        </div>
    );
};

export const DictionaryInput = ({ value, onChange, placeholder, disabled, nodes, edges, nodeId }: { value: any, onChange: (val: any) => void, placeholder?: string, disabled?: boolean, nodes: Node[], edges: any[], nodeId?: string }) => {
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

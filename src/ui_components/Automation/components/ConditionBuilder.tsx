import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, ListFilter, Type, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Split } from "lucide-react";
import { VariablePicker } from "./VariablePicker";
import { cn } from "@/lib/utils";
import { type Node, type Edge } from "@xyflow/react";

interface ConditionRule {
    id: string;
    left: string;
    operator: string;
    right: string;
    dataType?: 'text' | 'number' | 'boolean';
}

interface ConditionGroup {
    id: string;
    type: 'group';
    logicalOperator: 'AND' | 'OR';
    children: (ConditionRule | ConditionGroup)[];
}

interface ConditionBuilderProps {
    value?: any; // Now { [branchIndex: string]: ConditionGroup }
    onChange: (value: any) => void;
    nodes: Node[];
    edges: Edge[];
    nodeId?: string;
    disabled?: boolean;
    branches?: string[];
}

const OPERATORS = [
    { label: 'Equals', value: 'eq', symbol: '=' },
    { label: 'Does not equal', value: 'neq', symbol: '≠' },
    { label: 'Contains', value: 'contains', symbol: '⊃' },
    { label: 'Does not contain', value: 'not_contains', symbol: '⊅' },
    { label: 'Greater than', value: 'gt', symbol: '>' },
    { label: 'Less than', value: 'lt', symbol: '<' },
    { label: 'Greater or equal', value: 'gte', symbol: '≥' },
    { label: 'Less or equal', value: 'lte', symbol: '≤' },
    { label: 'Starts with', value: 'starts_with', symbol: 'A*' },
    { label: 'Ends with', value: 'ends_with', symbol: '*Z' },
    { label: 'Is empty', value: 'empty', symbol: '∅' },
    { label: 'Is not empty', value: 'not_empty', symbol: '≠∅' },
    { label: 'Exists', value: 'exists', symbol: '✓' },
    { label: 'Does not exist', value: 'not_exists', symbol: '✗' },
];

const DATA_TYPES = [
    { label: 'Text', value: 'text' },
    { label: 'Number', value: 'number' },
    { label: 'Boolean', value: 'boolean' },
];

function XIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    )
}

function createDefaultGroup(): ConditionGroup {
    return {
        id: Math.random().toString(36).substr(2, 9),
        type: 'group',
        logicalOperator: 'AND',
        children: [{ id: Math.random().toString(36).substr(2, 9), left: '', operator: 'eq', right: '', dataType: 'text' }]
    };
}

export const ConditionBuilder = ({ value, onChange, nodes, edges, nodeId, disabled, branches = ['If', 'Else'] }: ConditionBuilderProps) => {
    const branchesArr = Array.isArray(branches) ? branches : [];

    // Value: { 0: ConditionGroup, 1: ConditionGroup, ... }
    const [configs, setConfigs] = useState<Record<string, ConditionGroup>>(value || {});
    const [expandedBranches, setExpandedBranches] = useState<Set<number>>(new Set([0]));
    const [prevBranches, setPrevBranches] = useState<string[]>(branchesArr);
    
    // Track last value from parent to avoid loops
    const lastValueRef = useRef<any>(value);
    const isInternalChangeRef = useRef<boolean>(false);

    // Sync configs when branches change (e.g. insertion/deletion/reorder)
    useEffect(() => {
        const currentBranches = Array.isArray(branches) ? branches : [];
        if (!currentBranches.length) return;
        
        // Detect additions/deletions/shifts to avoid losing logic data
        if (JSON.stringify(currentBranches) !== JSON.stringify(prevBranches)) {
            const newConfigs = { ...configs };
            
            if (currentBranches.length > prevBranches.length) {
                // Addition detected - shift configs forward from insertion point
                const insertIdx = currentBranches.findIndex((b, i) => b !== prevBranches[i]);
                if (insertIdx !== -1 && insertIdx < currentBranches.length - 1) {
                    for (let i = currentBranches.length - 2; i >= insertIdx; i--) {
                        if (newConfigs[i]) newConfigs[i + 1] = newConfigs[i];
                        else delete newConfigs[i + 1];
                    }
                    delete newConfigs[insertIdx]; // Fresh start for the new branch
                }
            } else if (currentBranches.length < prevBranches.length) {
                // Deletion detected - shift configs back from deletion point
                const deleteIdx = prevBranches.findIndex((b, i) => b !== currentBranches[i]);
                if (deleteIdx !== -1) {
                    for (let i = deleteIdx; i < prevBranches.length - 1; i++) {
                        if (newConfigs[i + 1]) newConfigs[i] = newConfigs[i + 1];
                        else delete newConfigs[i];
                    }
                    delete newConfigs[prevBranches.length - 2]; 
                }
            }
            isInternalChangeRef.current = true;
            setConfigs(newConfigs);
            setPrevBranches(currentBranches);
        }

        // Also sync if 'value' came from prop (e.g. external save/load)
        if (value && JSON.stringify(value) !== JSON.stringify(lastValueRef.current)) {
            const valStr = JSON.stringify(value);
            const configsStr = JSON.stringify(configs);
            
            if (valStr !== configsStr) {
                lastValueRef.current = value;
                isInternalChangeRef.current = false;
                setConfigs(value);
            }
        }
    }, [branches, value, prevBranches]); // Removed configs as dependency to avoid re-triggering on local state change

    useEffect(() => {
        if (isInternalChangeRef.current) {
            isInternalChangeRef.current = false; // Reset to stop loop
            onChange(configs);
            lastValueRef.current = configs;
        }
    }, [configs, onChange]);

    const updateBranchConfig = (index: number, newConfig: ConditionGroup) => {
        isInternalChangeRef.current = true;
        setConfigs(prev => ({ ...prev, [index]: newConfig }));
    };

    const toggleBranch = (index: number) => {
        setExpandedBranches(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const lastBranch = branchesArr.length > 0 ? branchesArr[branchesArr.length - 1] : '';
    const isLastElse = typeof lastBranch === 'string' && lastBranch.toLowerCase() === 'else';
    const conditionalBranches = branchesArr.slice(0, isLastElse ? -1 : undefined);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Split className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider">Router Settings</span>
                </div>
                <Badge variant="outline" className="text-[9px] uppercase font-bold text-primary border-primary/20">
                    {conditionalBranches.length} {conditionalBranches.length === 1 ? 'Path' : 'Paths'}
                </Badge>
            </div>

            <div className="space-y-3">
                {conditionalBranches.map((branchName, index) => {
                    const branchConfig = configs[index] || createDefaultGroup();
                    const isExpanded = expandedBranches.has(index);

                    return (
                        <div key={index} className="border rounded-lg overflow-hidden bg-card/30">
                            <div 
                                className={cn(
                                    "px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-accent/10 transition-colors",
                                    isExpanded && "border-b bg-accent/5"
                                )}
                                onClick={() => toggleBranch(index)}
                            >
                                <div className="flex items-center gap-2">
                                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                    <span className="text-xs font-semibold">Branch {index + 1}</span>
                                </div>
                                {!isExpanded && (
                                     <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                         {branchConfig.children.length} rules
                                     </span>
                                )}
                            </div>

                            {isExpanded && (
                                <div className="p-3 bg-background/20">
                                    <div className="mb-3 flex items-center gap-2 px-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Execute If</span>
                                        <div className="h-px flex-1 bg-border/50" />
                                    </div>
                                    <ConditionGroupRenderer
                                        group={branchConfig}
                                        onChange={(newConfig) => updateBranchConfig(index, newConfig)}
                                        nodes={nodes}
                                        edges={edges}
                                        nodeId={nodeId}
                                        disabled={disabled}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}

                {conditionalBranches.length === 0 && (
                    <div className="p-8 text-center border border-dashed rounded-lg bg-muted/20">
                        <AlertCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Add branches to configure logic.</p>
                    </div>
                )}
                
                {isLastElse && (
                    <div className="mt-6 border-t pt-4">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Otherwise</span>
                            </div>
                            <Badge variant="secondary" className="text-[9px] uppercase font-bold opacity-50">Fallback Path</Badge>
                        </div>
                        <div className="mt-2 p-3 bg-muted/5 rounded-lg border border-dashed border-border/50 text-[10px] text-muted-foreground flex items-center gap-2">
                            <AlertCircle className="h-3 w-3" />
                            Executed if no other branch conditions are met.
                        </div>
                    </div>
                )}
            </div>

            <p className="text-[10px] text-muted-foreground italic leading-tight">
                Branches are evaluated in order. The first branch whose condition is met will be executed.
            </p>
        </div>
    );
};

interface ConditionGroupRendererProps {
    group: ConditionGroup;
    onChange: (group: ConditionGroup) => void;
    nodes: Node[];
    edges: Edge[];
    nodeId?: string;
    disabled?: boolean;
    depth?: number;
    parentGroup?: ConditionGroup;
    onRemove?: (id: string) => void;
}

const ConditionGroupRenderer = ({ group, onChange, nodes, edges, nodeId, disabled, depth = 0, onRemove }: ConditionGroupRendererProps) => {

    const addRule = () => {
        const newRule: ConditionRule = {
            id: Math.random().toString(36).substr(2, 9),
            left: '',
            operator: 'eq',
            right: '',
            dataType: 'text'
        };
        onChange({ ...group, children: [...group.children, newRule] });
    };

    const addGroup = () => {
        const newGroup: ConditionGroup = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'group',
            logicalOperator: 'AND',
            children: [{ id: Math.random().toString(36).substr(2, 9), left: '', operator: 'eq', right: '', dataType: 'text' }]
        };
        onChange({ ...group, children: [...group.children, newGroup] });
    };

    const removeChild = (childId: string) => {
        onChange({ ...group, children: group.children.filter(c => c.id !== childId) });
    };

    const updateChild = (childId: string, updates: any) => {
        onChange({
            ...group,
            children: group.children.map(c => c.id === childId ? { ...c, ...updates } : c)
        });
    };

    const toggleOperator = () => {
        onChange({ ...group, logicalOperator: group.logicalOperator === 'AND' ? 'OR' : 'AND' });
    };

    return (
        <div className={cn(
            "rounded-lg border bg-card/50 p-3 space-y-3 relative overflow-hidden",
            depth > 0 && "ml-4 border-l-4 border-l-primary/30",
            group.logicalOperator === 'OR' ? "border-amber-500/30" : "border-primary/30"
        )}>
            {/* Visual Logic Label */}
            <div className="absolute top-0 right-0 p-1">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                        "h-5 text-[9px] font-bold uppercase tracking-wider px-1.5 rounded-bl-md",
                        group.logicalOperator === 'OR' ? "bg-amber-500/10 text-amber-600" : "bg-primary/10 text-primary"
                    )}
                    onClick={toggleOperator}
                >
                    {group.logicalOperator}
                </Button>
            </div>

            <div className="flex items-center justify-between gap-2 border-b border-border/30 pb-2 mb-2">
                <div className="flex items-center gap-1">
                   <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Match</span>
                   <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "h-6 px-1.5 text-[10px] font-bold",
                            group.logicalOperator === 'AND' ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary"
                        )}
                        onClick={() => group.logicalOperator !== 'AND' && toggleOperator()}
                    >
                        ALL
                    </Button>
                    <span className="text-[10px] text-muted-foreground/30">/</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "h-6 px-1.5 text-[10px] font-bold",
                            group.logicalOperator === 'OR' ? "text-amber-600 bg-amber-500/5" : "text-muted-foreground hover:text-amber-600"
                        )}
                        onClick={() => group.logicalOperator !== 'OR' && toggleOperator()}
                    >
                        ANY
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold gap-1 px-1 text-primary hover:bg-primary/5" onClick={addRule} disabled={disabled}>
                        <Plus className="h-3 w-3" /> AND Rule
                    </Button>
                    {depth === 0 && (
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold gap-1 px-1 text-amber-600 hover:bg-amber-500/5" onClick={addGroup} disabled={disabled}>
                            <Plus className="h-3 w-3" /> OR Group
                        </Button>
                    )}
                    {onRemove && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/50 hover:text-destructive" onClick={() => onRemove(group.id)} disabled={disabled}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {group.children.map((child, index) => (
                    <div key={child.id} className="relative">
                        {index > 0 && (
                            <div className="absolute -top-3 left-3 h-3 w-px bg-border flex items-center justify-center">
                                <span className="text-[8px] bg-card px-1 font-bold text-muted-foreground/60">{group.logicalOperator}</span>
                            </div>
                        )}

                        {'type' in child && child.type === 'group' ? (
                            <ConditionGroupRenderer
                                group={child}
                                onChange={(newChild) => updateChild(child.id, newChild)}
                                nodes={nodes}
                                edges={edges}
                                nodeId={nodeId}
                                disabled={disabled}
                                depth={depth + 1}
                                onRemove={removeChild}
                            />
                        ) : (
                            <div className="group/rule relative p-3 rounded-lg border bg-card/50 transition-all">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border shadow-sm text-muted-foreground hover:text-destructive opacity-0 group-hover/rule:opacity-100 transition-opacity z-10"
                                    onClick={() => removeChild(child.id)} 
                                    disabled={disabled}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>

                                <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3 items-end">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest flex items-center gap-1">
                                                Left Operand
                                            </span>
                                            <VariablePicker
                                                nodes={nodes}
                                                edges={edges}
                                                onSelect={(v) => updateChild(child.id, { left: ((child as ConditionRule).left || '') + v })}
                                                currentNodeId={nodeId}
                                            />
                                        </div>
                                        <Input
                                            value={(child as ConditionRule).left}
                                            onChange={(e) => updateChild(child.id, { left: e.target.value })}
                                            placeholder="{{variable}} or value"
                                            className="h-8 text-xs font-mono bg-background/50"
                                            disabled={disabled}
                                        />
                                    </div>

                                    <div className="w-32 space-y-1.5">
                                        <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest block mb-1.5">
                                            Operator
                                        </span>
                                        <Select
                                            value={(child as ConditionRule).operator}
                                            onValueChange={(val) => updateChild(child.id, { operator: val })}
                                            disabled={disabled}
                                        >
                                            <SelectTrigger className="h-8 text-[11px] px-2 font-medium">
                                                <SelectValue>
                                                    <span className="font-mono text-sm">
                                                        {OPERATORS.find(op => op.value === (child as ConditionRule).operator)?.symbol || '='}
                                                    </span>
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent position="item-aligned">
                                                {OPERATORS.map(op => (
                                                    <SelectItem key={op.value} value={op.value}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-sm w-6 text-center">{op.symbol}</span>
                                                            <span>{op.label}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={(child as ConditionRule).dataType || 'text'}
                                            onValueChange={(val) => updateChild(child.id, { dataType: val as any })}
                                            disabled={disabled}
                                        >
                                            <SelectTrigger className="h-7 text-[10px] px-2 bg-muted/30">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DATA_TYPES.map(dt => (
                                                    <SelectItem key={dt.value} value={dt.value}>
                                                        {dt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {!['empty', 'not_empty', 'exists', 'not_exists'].includes((child as ConditionRule).operator) ? (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest flex items-center gap-1">
                                                    Right Operand
                                                </span>
                                                <VariablePicker
                                                    nodes={nodes}
                                                    edges={edges}
                                                    onSelect={(v) => updateChild(child.id, { right: ((child as ConditionRule).right || '') + v })}
                                                    currentNodeId={nodeId}
                                                />
                                            </div>
                                            <Input
                                                value={(child as ConditionRule).right}
                                                onChange={(e) => updateChild(child.id, { right: e.target.value })}
                                                placeholder="Value..."
                                                className="h-8 text-xs font-mono bg-background/50"
                                                disabled={disabled}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-8 flex items-center px-4 bg-muted/20 rounded border border-dashed text-[10px] text-muted-foreground italic">
                                            Univariate Operator
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {group.children.length === 0 && (
                    <div className="text-center py-4 border border-dashed rounded-md bg-muted/20">
                        <p className="text-[10px] text-muted-foreground italic">No rules in this group.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

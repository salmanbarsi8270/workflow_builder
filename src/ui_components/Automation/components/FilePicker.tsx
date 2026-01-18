import React, { useRef } from "react";
import { type Node } from "@xyflow/react";
import { Upload, File as FileIcon, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { VariablePicker } from "./VariablePicker";

interface FilePickerProps {
    value: any;
    onChange: (val: any) => void;
    disabled?: boolean;
    nodes: Node[];
    edges?: any[];
    nodeId?: string;
    placeholder?: string;
}

export const FilePicker = ({ value, onChange, disabled, nodes, edges, nodeId, placeholder }: FilePickerProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Helper to identify steps that likely provide files
    // Helper to identify steps that likely provide files
    const isFileSource = (node: any) => {
        const piece = (node.data?.piece || node.data?.appName || node.data?.icon || node.data?.label || '').toLowerCase();
        
        // Identify if this is a trigger (usually node '1' or has no incoming edges)
        const isTrigger = node.id === '1' || node.id === 'trigger' || !edges?.some((e: any) => e.target === node.id);
        
        if (isTrigger) {
            return (
                piece.includes('http') || 
                piece.includes('webhook') ||
                piece.includes('globe') ||
                piece.includes('mail') ||
                node.data?.trigger === 'webhook' ||
                piece.includes('gmail') || 
                piece.includes('outlook')
            );
        }
        
        // Actions are hidden per user request: "attachments only show the trigger file only"
        return false;
    };

    // Extract step ID from value like {{steps.ID.data...}}
    const getStepId = (val: string) => {
        if (typeof val !== 'string') return '';
        const match = val?.match(/\{\{steps\.(.+?)\.data/);
        return match ? match[1] : '';
    };

    const currentStepId = getStepId(value);

    // List nodes that are likely to provide files
    const availableNodes = nodes.filter(n =>
        n.id !== nodeId &&
        n.type !== 'end' &&
        isFileSource(n)
    );

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            const parts = result.split(',');
            const content = parts[1];
            const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';

            onChange({
                content,
                fileName: file.name,
                contentType: mime,
                size: file.size
            });
        };
        reader.readAsDataURL(file);
    };

    const handleStepSelect = (stepId: string) => {
        onChange(`{{steps.${stepId}.data.file}}`);
    };

    const isVariable = typeof value === 'string' && value.startsWith('{{');
    const hasFile = value && typeof value === 'object' && value.content;

    return (
        <div className="flex flex-col gap-2">
            <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                disabled={disabled}
            />
            
            <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                    {hasFile ? (
                        <div className="flex items-center gap-2 p-2 border rounded-md bg-primary/5 border-primary/20 h-9">
                            <FileIcon className="h-4 w-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{value.fileName}</p>
                            </div>
                        </div>
                    ) : (isVariable || (availableNodes.length > 0)) ? (
                        <Select
                            value={currentStepId || (isVariable ? 'variable' : '')}
                            onValueChange={handleStepSelect}
                            disabled={disabled}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={placeholder || "Select File Source"}>
                                    {currentStepId ? (
                                        (() => {
                                            const n = nodes.find(node => node.id === currentStepId);
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span>{n ? `${n.data.label || n.id}` : currentStepId}</span>
                                                </div>
                                            );
                                        })()
                                    ) : isVariable ? (
                                         <div className="flex items-center gap-2">
                                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="truncate">{value}</span>
                                        </div>
                                    ) : (placeholder || "Select File Source")}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <div className="text-[10px] font-semibold text-muted-foreground/50 uppercase px-3 py-1 tracking-wider">
                                    File Sources
                                </div>
                                {availableNodes.map((node: any) => (
                                    <SelectItem key={node.id} value={node.id}>
                                        <div className="flex flex-col text-left">
                                            <span className="font-medium">{node.data.label || node.id}</span>
                                            <span className="text-[10px] text-muted-foreground">{node.data.appName || node.data.piece}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                                <div 
                                    className="flex items-center gap-2 p-2 px-3 mt-1 text-xs font-medium text-primary cursor-pointer hover:bg-primary/5 transition-colors border-t"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                    }}
                                >
                                    <Upload className="h-3.5 w-3.5" />
                                    <span>Upload Local File...</span>
                                </div>
                            </SelectContent>
                        </Select>
                    ) : (
                        <div 
                            className={cn(
                                "flex items-center justify-center p-3 border-2 border-dashed rounded-md bg-background/50 cursor-pointer hover:bg-muted/10 transition-colors h-24",
                                disabled && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => !disabled && fileInputRef.current?.click()}
                        >
                            <div className="flex flex-col items-center gap-1.5 text-center">
                                <Upload className="h-5 w-5 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{placeholder || "Click to upload a file"}</span>
                            </div>
                        </div>
                    )}
                </div>
                {!hasFile && !isVariable && availableNodes.length > 0 && (
                    <div className="flex items-center gap-1.5">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors border-primary/20"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    <p className="text-xs">Upload from computer</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <VariablePicker
                            nodes={nodes}
                            edges={edges || []}
                            onSelect={(v) => onChange(v)}
                            currentNodeId={nodeId}
                        />
                    </div>
                )}
                {(hasFile || isVariable) && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={() => onChange(null)}
                        disabled={disabled}
                        title="Clear Selection"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
};

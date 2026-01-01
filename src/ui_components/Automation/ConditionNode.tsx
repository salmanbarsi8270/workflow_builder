
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

import { cn } from "@/lib/utils";
import { Split, Check, X } from "lucide-react";


// Status Colors same as CustomNode for consistency
const StatusColors = {
    pending: "border-border",
    success: "border-green-500",
    error: "border-red-500",
    running: "border-blue-500",
} as const;

const ConditionNode = ({ data, selected }: NodeProps) => {
    const status = (data.status as keyof typeof StatusColors) || 'pending';
    const label = (data.label as string) || "Logic"; // Default to "Logic"
    const subLabel = (data.subLabel as string) || "Check condition";

    return (
        <div className="relative group">
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!w-3 !h-3 !top-[-6px] !border-2 !border-background !bg-muted-foreground/30"
            />

            <div
                className={cn(
                    "w-[280px] p-4 shadow-sm border rounded-xl bg-card transition-all duration-300 relative z-10 group-hover:shadow-md",
                    selected ? "border-amber-500 ring-1 ring-amber-500" : StatusColors[status]
                )}
            >
                {/* Header with Icon and Title - Restored per user request */}
                <div className="flex items-start gap-4">
                    {/* Icon Container */}
                    <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                        <Split className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold truncate leading-tight">{label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate mb-2">{subLabel}</span>
                    </div>
                </div>
            </div>


            {/* Output Handles - Tabs merged with card */}
            {/* Accepted (True) Handle */}
            <div className="absolute -bottom-[22px] left-1/4 -translate-x-1/2 flex flex-col items-center z-50">
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id="true"
                    className="!w-3 !h-3 !relative !transform-none !left-auto !top-auto !bg-transparent !border-0 opacity-0 z-50"
                />
                <div className="flex items-center gap-1 -mt-2 px-2 py-0.5 rounded-b-md rounded-t-none bg-card border border-t-0 border-border/50 shadow-sm">
                    <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <span className="text-[10px] font-medium text-muted-foreground">Accepted</span>
                </div>
            </div>

            {/* Rejected (False) Handle */}
            <div className="absolute -bottom-[22px] left-3/4 -translate-x-1/2 flex flex-col items-center z-50">
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id="false"
                    className="!w-3 !h-3 !relative !transform-none !left-auto !top-auto !bg-transparent !border-0 opacity-0 z-50"
                />
                <div className="flex items-center gap-1 -mt-2 px-2 py-0.5 rounded-b-md rounded-t-none bg-card border border-t-0 border-border/50 shadow-sm">
                    <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                    <span className="text-[10px] font-medium text-muted-foreground">Rejected</span>
                </div>
            </div>

        </div>
    );
};

export default memo(ConditionNode);



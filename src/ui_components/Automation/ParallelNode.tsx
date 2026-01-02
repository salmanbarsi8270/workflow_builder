import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from "@/lib/utils";
import { GitFork } from "lucide-react";

// Status Colors same as CustomNode for consistency
const StatusColors = {
    pending: "border-border",
    success: "border-green-500",
    error: "border-red-500",
    running: "border-blue-500",
    skipped: "border-zinc-200 opacity-70",
} as const;

const ParallelNode = ({ data, selected }: NodeProps) => {
    const status = (data.status as keyof typeof StatusColors) || 'pending';
    const label = (data.label as string) || "Parallel";
    const subLabel = (data.subLabel as string) || "Execute in parallel";

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
                {/* Header with Icon and Title */}
                <div className="flex items-start gap-4">
                    {/* Icon Container */}
                    <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                        <GitFork className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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

            {/* Output Handle - specifically named 'parallel-output' matching user logs */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="parallel-output"
                className="!w-3 !h-3 !bottom-[-6px] !border-2 !border-background !bg-muted-foreground/30"
            />
        </div>
    );
};

export default memo(ParallelNode);

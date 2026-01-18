
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
} as const;

const ParallelNode = ({ data, selected }: NodeProps) => {
    const status = (data.status as keyof typeof StatusColors) || 'pending';
    const label = (data.label as string) || "Parallel";
    const subLabel = (data.subLabel as string) || "Execute in parallel";

    // Branch rendering is now handled by the edges in AutomationEditor logic.
    // ParallelNode serves as the visual anchor.

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
                    <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                        <GitFork className="h-6 w-6 text-amber-600 dark:text-amber-400" />
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


            {/* Branch Label Helpers */}
            <div className="absolute -bottom-10 left-0 right-0 h-10 pointer-events-none">
                {(() => {
                    const branchesArr = (data.params as any)?.branches || (data.branches as string[]) || ['Branch 1', 'Branch 2'];
                    return branchesArr.map((b: string, i: number) => {
                        return (
                            <div 
                                key={i} 
                                className="absolute flex flex-col items-center"
                                style={{ 
                                    left: `${((i + 1) / (branchesArr.length + 1)) * 100}%`,
                                    transform: 'translateX(-50%)'
                                }}
                            >
                                <div className={cn(
                                    "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shadow-xs transition-all duration-300 whitespace-nowrap bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
                                )}>
                                    {b}
                                </div>
                            </div>
                        );
                    });
                })()}
            </div>

            {/* Output Handles - Dynamic based on branches */}
            {(() => {
                const branchesArr = (data.params as any)?.branches || (data.branches as string[]) || ['Branch 1', 'Branch 2'];
                return branchesArr.map((_: any, i: number) => {
                    const handleId = String(i);
                    return (
                        <Handle
                            key={i}
                            type="source"
                            position={Position.Bottom}
                            id={handleId}
                            style={{
                                background: '#f59e0b',
                                width: 8,
                                height: 8,
                                bottom: -4,
                                left: `${((i + 1) / (branchesArr.length + 1)) * 100}%`,
                                transform: 'translateX(-50%)',
                                border: '1px solid white',
                                zIndex: 50,
                                opacity: 0.8
                            }}
                        />
                    );
                });
            })()}

            {/* Legacy Compatibility Handle (Invisible) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="parallel-output"
                style={{ opacity: 0, pointerEvents: 'none', left: '50%' }}
            />
        </div>
    );
};

export default memo(ParallelNode);

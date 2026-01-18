import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Split, Loader2, Slash, CheckCircle2 } from "lucide-react";
import { AppLogoMap } from '../utils/Applogo';
import { memo } from 'react';

// Matches CustomNode StatusColors
const StatusColors = {
  pending: {
    border: "border-border",
    bg: "bg-muted/50",
    text: "text-muted-foreground",
    icon: "text-muted-foreground",
    glow: "",
    shadow: ""
  },
  running: {
    border: "border-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    icon: "text-blue-600 dark:text-blue-400",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
    shadow: "shadow-blue-500/10"
  },
  success: {
    border: "border-green-500",
    bg: "bg-green-100 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
    icon: "text-green-600 dark:text-green-400",
    glow: "shadow-[0_0_15px_rgba(34,197,94,0.2)]",
    shadow: "shadow-green-500/10"
  },
  error: {
    border: "border-red-500",
    bg: "bg-red-100 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    icon: "text-red-600 dark:text-red-400",
    glow: "shadow-[0_0_15px_rgba(239,68,68,0.2)]",
    shadow: "shadow-red-500/10"
  },
  skipped: {
    border: "border-zinc-300 dark:border-zinc-700",
    bg: "bg-zinc-100 dark:bg-zinc-800/50",
    text: "text-zinc-500 dark:text-zinc-400",
    icon: "text-zinc-400 dark:text-zinc-500",
    glow: "",
    shadow: ""
  }
} as const;

const ConditionNode = ({ data, selected }: NodeProps) => {
    const status = (data.status as keyof typeof StatusColors) || 'pending';
    const label = (data.label as string) || "Router";
    const subLabel = (data.subLabel as string) || "Branching Logic";
    const colorConfig = StatusColors[status];

    const iconKey = (data.icon as string) || (data.piece as string) || 'condition';
    const logoUrl = AppLogoMap[iconKey];

    return (
        <div className="relative group">
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3! h-3! top-[-6px]! border-2! border-background! bg-muted-foreground/30!"
            />

            <Card
                className={cn(
                    "w-[280px] p-4 shadow-lg border-2 transition-all duration-300 relative z-10 backdrop-blur-sm",
                    "bg-card/95 hover:bg-card",
                    selected ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : colorConfig.border,
                    colorConfig.shadow,
                    status === 'running' && "ring-2 ring-blue-500/20"
                )}
                style={{
                    boxShadow: status !== 'pending' && status !== 'skipped' ? colorConfig.glow : undefined
                }}
            >
                <div className="flex items-start gap-4">
                    {/* Icon Container */}
                    <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110",
                        status === 'pending' ? "bg-primary/10" : colorConfig.bg
                    )}>
                        {status === 'running' ? (
                             <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        ) : status === 'skipped' ? (
                             <Slash className={cn("h-6 w-6", colorConfig.icon)} />
                        ) : (
                             logoUrl ? (
                                <img src={logoUrl} alt={iconKey} className={cn("h-6 w-6 object-contain", ['wait', 'delay', 'utility', 'agent'].includes(iconKey) && "invert dark:invert-0")} />
                             ) : (
                                <Split className={cn(
                                    "h-6 w-6 text-primary", 
                                    status !== 'pending' && colorConfig.icon
                                 )} />
                             )
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold truncate leading-tight">{label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground truncate mb-2">
                            {status === 'success' && (data.output as any)?.branch ? (
                                <span className="text-primary font-bold flex items-center gap-1 uppercase tracking-tighter">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {(data.output as any).branch === 'else' ? 'Otherwise' : (data.output as any).branch}
                                </span>
                            ) : subLabel}
                        </span>
                    </div>
                </div>
            </Card>

            {/* Branch Label Helpers */}
            <div className="absolute -bottom-10 left-0 right-0 h-10 pointer-events-none">
                {(() => {
                    const branchesArr = (data.params as any)?.branches || (data.branches as string[]) || ['If', 'Else'];
                    return branchesArr.map((b: string, i: number) => {
                        const isElse = i === branchesArr.length - 1 && branchesArr.length > 1;
                        const labelText = isElse ? 'Otherwise' : (branchesArr.length > 2 ? `Branch ${i + 1}` : b);
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
                                    "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shadow-xs transition-all duration-300 whitespace-nowrap",
                                    isElse ? "bg-muted text-muted-foreground border-border" : "bg-purple-100 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
                                )}>
                                    {labelText}
                                </div>
                            </div>
                        );
                    });
                })()}
            </div>

            {(() => {
                const branchesArr = (data.params as any)?.branches || (data.branches as string[]) || ['If', 'Else'];
                return branchesArr.map((_: any, i: number) => {
                    const handleId = String(i);
                    return (
                        <Handle
                            key={i}
                            type="source"
                            position={Position.Bottom}
                            id={handleId}
                            style={{
                                background: i === 0 ? '#22c55e' : (i === branchesArr.length - 1 ? '#ef4444' : '#6366f1'),
                                width: 8,
                                height: 8,
                                bottom: -4,
                                left: `${((i + 1) / (branchesArr.length + 1)) * 100}%`,
                                transform: 'translateX(-50%)',
                                border: '1px solid white',
                                zIndex: 50,
                                opacity: 0.8 // Increased opacity for visibility
                            }}
                        />
                    );
                });
            })()}

            {/* Legacy Compatibility Handles (Invisible) - Keeps old edges from breaking */}
            <Handle type="source" position={Position.Bottom} id="true" style={{ opacity: 0, pointerEvents: 'none', left: '25%' }} />
            <Handle type="source" position={Position.Bottom} id="false" style={{ opacity: 0, pointerEvents: 'none', left: '75%' }} />

            {/* Legacy/Default Parallel Handle for backward compatibility or parallel nodes using this component */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="parallel-output"
                style={{
                    background: '#6366f1',
                    width: 12,
                    height: 12,
                    bottom: -6,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    border: '2px solid white',
                    boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)',
                    zIndex: 49,
                    opacity: 0
                }}
            />
            
            {/* Main Visual "Dot" to represent the source of branches */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background shadow-sm z-50" />
        </div>
    );
};

export default memo(ConditionNode);

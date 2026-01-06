import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, Loader2, Check, X, Slash, ChevronDown } from "lucide-react";
import { AppLogoMap } from '../utils/Applogo';

// Enhanced Status Color System (Synced with CustomNode)
const StatusColors = {
  pending: {
    border: "border-border",
    bg: "bg-muted/50",
    text: "text-muted-foreground",
    icon: "text-muted-foreground",
    glow: "",
    handle: "bg-muted-foreground/30",
    shadow: ""
  },
  running: {
    border: "border-blue-500",
    bg: "bg-blue-100 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    icon: "text-blue-600 dark:text-blue-400",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]",
    handle: "bg-blue-500",
    shadow: "shadow-blue-500/10"
  },
  waiting: {
    border: "border-orange-500",
    bg: "bg-orange-100 dark:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
    icon: "text-orange-600 dark:text-orange-400",
    glow: "shadow-[0_0_15px_rgba(249,115,22,0.3)]",
    handle: "bg-orange-500",
    shadow: "shadow-orange-500/10"
  },
  success: {
    border: "border-green-500",
    bg: "bg-green-100 dark:bg-green-900/20",
    text: "text-green-600 dark:text-green-400",
    icon: "text-green-600 dark:text-green-400",
    glow: "shadow-[0_0_15px_rgba(34,197,94,0.2)]",
    handle: "bg-green-500",
    shadow: "shadow-green-500/10"
  },
  error: {
    border: "border-red-500",
    bg: "bg-red-100 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
    icon: "text-red-600 dark:text-red-400",
    glow: "shadow-[0_0_15px_rgba(239,68,68,0.2)]",
    handle: "bg-red-500",
    shadow: "shadow-red-500/10"
  },
  skipped: {
    border: "border-zinc-300 dark:border-zinc-700",
    bg: "bg-zinc-100 dark:bg-zinc-800/50",
    text: "text-zinc-500 dark:text-zinc-400",
    icon: "text-zinc-400 dark:text-zinc-500",
    glow: "",
    handle: "bg-zinc-400",
    shadow: ""
  }
} as const;

type StatusType = keyof typeof StatusColors;

const StatusIcon = ({ status, size = "sm" }: { status: StatusType; size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  switch (status) {
    case 'running':
      return <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />;
    case 'waiting':
      return <Clock className={`${sizeClasses[size]} animate-pulse text-orange-500`} />;
    case 'success':
      return (
        <div className={`${sizeClasses[size]} rounded-full bg-green-500 flex items-center justify-center`}>
          <Check className="h-2/3 w-2/3 text-white" strokeWidth={4} />
        </div>
      );
    case 'error':
      return (
        <div className={`${sizeClasses[size]} rounded-full bg-red-500 flex items-center justify-center`}>
          <X className="h-2/3 w-2/3 text-white" strokeWidth={4} />
        </div>
      );
    case 'skipped':
      return (
        <div className={`${sizeClasses[size]} rounded-full bg-zinc-400 flex items-center justify-center`}>
          <Slash className="h-2/3 w-2/3 text-white" strokeWidth={3} />
        </div>
      );
    default:
      return null;
  }
};

const WaitNode = ({ data, selected }: NodeProps) => {
    const nodeData = data as any;
    const label = nodeData.label as string || 'Wait';
    const waitType = nodeData.params?.waitType || 'delay';
    const subLabel = nodeData.subLabel as string || (waitType === 'approval' ? 'Wait for Approval' : 'Time Delay');
    const status = (nodeData.status as StatusType) || 'pending';
    const colorConfig = StatusColors[status] || StatusColors.pending;

    const iconKey = (nodeData.icon as string) || (nodeData.piece as string) || 'wait';
    const logoUrl = AppLogoMap[iconKey];
    
    // Fix for white icons being invisible in light mode
    const isWhiteIcon = ['wait', 'delay', 'utility'].includes(iconKey);

    return (
        <div className="relative group">
            {/* Node Glow Effect */}
            {colorConfig.glow && (
                <div className={cn(
                    "absolute -inset-2 rounded-xl blur-xl opacity-30 transition-opacity",
                    colorConfig.glow
                )} />
            )}

            <Card
                className={cn(
                    "w-[280px] p-4 shadow-lg border-2 transition-all duration-300 relative z-10 backdrop-blur-sm",
                    selected ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : colorConfig.border,
                    colorConfig.shadow,
                    "bg-card/95 hover:bg-card"
                )}
            >
                {/* Header with Icon and Title */}
                <div className="flex items-start gap-4">
                    {/* Icon Container */}
                    <div
                        className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110",
                            colorConfig.bg
                        )}
                    >
                        {logoUrl ? (
                            <img 
                                src={logoUrl} 
                                alt={iconKey} 
                                className={cn(
                                    "h-6 w-6 object-contain",
                                    isWhiteIcon && "invert dark:invert-0"
                                )} 
                            />
                        ) : (
                            <Clock
                                className={cn(
                                    "h-6 w-6 transition-all duration-300",
                                    status === 'running' || status === 'waiting' ? "animate-pulse" : "",
                                    colorConfig.icon
                                )}
                            />
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                        {/* Title and Status */}
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold truncate leading-tight">
                                {label}
                            </span>
                            <div className="flex items-center gap-2">
                                <StatusIcon status={status} size="sm" />
                                <ChevronDown className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer" />
                            </div>
                        </div>

                        {/* Subtitle */}
                        <span className="text-xs text-muted-foreground truncate mb-2">
                            {subLabel}
                            {waitType === 'delay' && nodeData.params?.delayDuration && (
                                <span className="ml-1 font-semibold text-primary/80">
                                    ({nodeData.params.delayDuration} {nodeData.params.delayUnit || 's'})
                                </span>
                            )}
                        </span>
                    </div>
                </div>

                {/* Handles */}
                <Handle
                    type="target"
                    position={Position.Top}
                    className={cn(
                        "w-3! h-3! top-[-6px]! border-2! border-background! transition-all duration-300",
                        colorConfig.handle ? `${colorConfig.handle}!` : ""
                    )}
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className={cn(
                        "w-3! h-3! bottom-[-6px]! border-2! border-background! transition-all duration-300",
                        colorConfig.handle ? `${colorConfig.handle}!` : ""
                    )}
                />
            </Card>
        </div>
    );
};

export default memo(WaitNode);

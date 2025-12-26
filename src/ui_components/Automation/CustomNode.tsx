import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Zap, Monitor, Mail, FileText, ChevronDown, PlusIcon, Clock, HardDrive, Loader2, Check, X, AlertCircle, Pause, AlertTriangle, MessageSquare, Smartphone, Bell, Upload, Download, Database, Globe } from "lucide-react"; 
import { calculateNodeProgress, shouldShowProgress as getShouldShowProgress } from './nodeUtils';
import { AppLogoMap } from './Applogo';

// Extended Icon Map with more service icons
const IconMap: Record<string, any> = {
  // Triggers
  'trigger': Zap,
  'webhook': Zap,
  'schedule': Clock,
  'form': FileText,
  
  // Actions
  'action': Monitor,
  'send': Mail,
  'notify': AlertCircle,
  'delay': Clock,
  'condition': AlertTriangle,
  
  // Google Services
  'gmail': Mail,
  'sheets': FileText,
  'docs': FileText,
  'drive': HardDrive,
  'calendar': Clock,
  
  // Communication
  'email': Mail,
  'slack': MessageSquare,
  'sms': Smartphone,
  'notification': Bell,
  
  // File Operations
  'file': FileText,
  'document': FileText,
  'upload': Upload,
  'download': Download,
  
  // Database
  'database': Database,
  'api': Globe,
  'web': Globe,
  
  // Default fallback
  'default': Zap
};

// Enhanced Status Color System
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
  warning: {
    border: "border-amber-500",
    bg: "bg-amber-100 dark:bg-amber-900/20",
    text: "text-amber-600 dark:text-amber-400",
    icon: "text-amber-600 dark:text-amber-400",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    handle: "bg-amber-500",
    shadow: "shadow-amber-500/10"
  },
  paused: {
    border: "border-purple-500",
    bg: "bg-purple-100 dark:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
    icon: "text-purple-600 dark:text-purple-400",
    glow: "shadow-[0_0_15px_rgba(168,85,247,0.2)]",
    handle: "bg-purple-500",
    shadow: "shadow-purple-500/10"
  },
  queued: {
    border: "border-cyan-500",
    bg: "bg-cyan-100 dark:bg-cyan-900/20",
    text: "text-cyan-600 dark:text-cyan-400",
    icon: "text-cyan-600 dark:text-cyan-400",
    glow: "shadow-[0_0_15px_rgba(6,182,212,0.2)]",
    handle: "bg-cyan-500",
    shadow: "shadow-cyan-500/10"
  }
} as const;

// Type for better type safety
type StatusType = keyof typeof StatusColors;

// Status Icon Components
const StatusIcon = ({ status, size = "sm" }: { status: StatusType; size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };
  
  switch (status) {
    case 'running':
      return <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />;
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
    case 'warning':
      return (
        <div className={`${sizeClasses[size]} rounded-full bg-amber-500 flex items-center justify-center`}>
          <AlertTriangle className="h-2/3 w-2/3 text-white" strokeWidth={2} />
        </div>
      );
    case 'paused':
      return (
        <div className={`${sizeClasses[size]} rounded-full bg-purple-500 flex items-center justify-center`}>
          <Pause className="h-2/3 w-2/3 text-white" strokeWidth={4} />
        </div>
      );
    default:
      return null;
  }
};

// Progress indicator component
const ProgressIndicator = ({ progress }: { progress?: number }) => {
  if (progress === undefined) return null;
  
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-muted-foreground">Progress</span>
        <span className="text-xs font-medium">{progress}%</span>
      </div>
    </div>
  );
};

const CustomNode = ({ data, selected }: NodeProps) => {
  const iconKey = (data.icon as string) || (data.piece as string) || 'default';
  const logoUrl = AppLogoMap[iconKey];
  const Icon = IconMap[iconKey] || Zap;
  const isPlaceholder = data.isPlaceholder as boolean;
  const status = (data.status as StatusType) || 'pending';
  const customColor = data.customColor as string;
  const progress = calculateNodeProgress(data);
  const showProgress = getShouldShowProgress(data);
  
  // Get color configuration
  const colorConfig = StatusColors[status] || StatusColors.pending;

  const getCustomStyles = () => {
    if (!customColor) return {};
    return {
      border: { borderColor: customColor },
      bg: { backgroundColor: `${customColor}1a` }, // 10% opacity
      text: { color: customColor },
      icon: { color: customColor },
      glow: { boxShadow: `0 0 15px ${customColor}4d` }, // 30% opacity
      handle: { backgroundColor: customColor },
      shadow: { boxShadow: `0 4px 6px -1px ${customColor}1a` } // shadow-lg equivalent
    };
  };

  const customStyles = getCustomStyles();


  if (isPlaceholder) {
    return (
      <div className="relative group">
        <div 
          className={cn(
            "w-[280px] h-[86px] flex items-center justify-center border-2 border-dashed rounded-xl bg-gradient-to-br from-muted/20 to-muted/40 hover:from-muted/30 hover:to-muted/50 transition-all cursor-pointer backdrop-blur-sm",
            selected 
              ? "border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10" 
              : "border-muted-foreground/30 hover:border-primary/50"
          )}
        >
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-medium group-hover:scale-105 transition-transform">
            <PlusIcon className="h-5 w-5" />
            <span>Select Trigger</span>
          </div>
        </div>
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className="!w-3 !h-3 !bg-muted-foreground/30 !-bottom-1.5 !border-2 !border-background" 
        />
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Node Glow Effect */}
      {colorConfig.glow && !customColor && (
        <div className={cn(
          "absolute -inset-2 rounded-xl blur-xl opacity-30 transition-opacity",
          colorConfig.glow
        )} />
      )}
      {customColor && (
        <div 
          className="absolute -inset-2 rounded-xl blur-xl opacity-30 transition-opacity"
          style={customStyles.glow}
        />
      )}
      
      <Card 
        className={cn(
          "w-[280px] p-4 shadow-lg border-2 transition-all duration-300 relative z-10 backdrop-blur-sm",
          selected ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : (!customColor && colorConfig.border),
          !customColor && colorConfig.shadow,
          "bg-card/95 hover:bg-card"
        )}
        style={{
          ...(selected ? {} : customStyles.border),
          ...customStyles.shadow
        }}
      >

        {/* Header with Icon and Title */}
        <div className="flex items-start gap-4">
          {/* Icon Container */}
          <div 
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110",
              !customColor && colorConfig.bg
            )}
            style={customStyles.bg}
          >
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={iconKey} 
                className={cn(
                  "h-6 w-6 object-contain transition-all duration-300",
                  status === 'running' ? "animate-pulse" : ""
                )} 
              />
            ) : (
              <Icon 
                className={cn(
                  "h-6 w-6 transition-all duration-300",
                  status === 'running' ? "animate-pulse" : "",
                  !customColor && colorConfig.icon
                )} 
                style={customStyles.icon}
              />
            )}
          </div>

          
          {/* Content */}
          <div className="flex flex-col overflow-hidden flex-1 min-w-0">
            {/* Title and Status */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold truncate leading-tight">
                {data.label as string || "Untitled Step"}
              </span>
              <div className="flex items-center gap-2">
                <StatusIcon status={status} size="sm" />
                <ChevronDown className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer" />
              </div>
            </div>
            
            {/* Subtitle */}
            <span className="text-xs text-muted-foreground truncate mb-2">
              {data.subLabel as string || "Configure this step"}
            </span>
            
            {/* Tags/Categories */}
            {Array.isArray(data.tags) && data.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {(data.tags as string[]).slice(0, 2).map((tag, index) => (
                  <span 
                    key={index}
                    className="px-1.5 py-0.5 text-[10px] rounded-md bg-muted/50 text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
                {(data.tags as string[]).length > 2 && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-muted/50 text-muted-foreground">
                    +{(data.tags as string[]).length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Progress Bar (conditional) */}
        {showProgress && <ProgressIndicator progress={progress} />}
        
        {/* Execution Time */}
        {!!data.duration && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Duration: {String(data.duration)}</span>
            </div>
          </div>
        )}
        
        {/* Handles */}
        <Handle 
          type="target" 
          position={Position.Top} 
          className={cn(
            "!w-3 !h-3 !top-[-6px] !border-2 !border-background transition-all duration-300",
            !customColor && `!${colorConfig.handle}`
          )} 
          style={customStyles.handle}
        />
        <Handle 
          type="source" 
          position={Position.Bottom} 
          className={cn(
            "!w-3 !h-3 !bottom-[-6px] !border-2 !border-background transition-all duration-300",
            !customColor && `!${colorConfig.handle}`
          )} 
          style={customStyles.handle}
        />

        
        {/* Right-side handle for branching */}
        {!!data.hasBranch && (
          <Handle 
            type="source" 
            position={Position.Right} 
            id="branch"
            className={cn(
              "!w-3 !h-3 !right-[-6px] !border-2 !border-background transition-all duration-300",
              !customColor && `!${colorConfig.handle}`
            )} 
            style={customStyles.handle}
          />
        )}

      </Card>
    </div>
  );
};

export default memo(CustomNode);

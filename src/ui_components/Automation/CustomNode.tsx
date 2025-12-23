import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Zap, Monitor, Mail, FileText, ChevronDown, PlusIcon, Clock } from "lucide-react"; 

const IconMap: Record<string, any> = {
  'trigger': Zap,
  'action': Monitor,
  'email': Mail,
  'doc': FileText,
  'schedule': Clock as any, 
  'delay': Clock as any,
  'gmail': Mail,
  'google_sheets': FileText,
  'default': Zap
};

const CustomNode = ({ data, selected }: NodeProps) => {
  const Icon = IconMap[(data.icon as string) || 'default'] || Zap;
  const isPlaceholder = data.isPlaceholder as boolean;

  if (isPlaceholder) {
    return (
        <div className="relative group">
            <div 
                className={cn(
                    "w-[280px] h-[86px] flex items-center justify-center border-2 border-dashed rounded-xl bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer",
                    selected ? "border-primary ring-2 ring-primary/20" : "border-muted-foreground/30"
                )}
            >
                <div className="flex items-center gap-2 text-violet-600 font-medium">
                    <PlusIcon className="h-5 w-5" />
                    <span>Select Trigger</span>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-muted-foreground/30 !-bottom-1.5" />
        </div>
    );
  }

  return (
    <div className="relative group">
      <Card 
        className={cn(
          "w-[280px] p-3 shadow-md border-2 transition-all duration-200",
          selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
          "bg-card"
        )}
      >
        <div className="flex items-start gap-4">
            <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                "bg-muted"
            )}>
                <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex flex-col overflow-hidden flex-1">
                <div className="flex items-center justify-between">
                     <span className="text-sm font-semibold truncate leading-none mb-1">
                        {data.label as string || "Untitled Step"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
                </div>
                <span className="text-xs text-muted-foreground truncate">
                    {data.subLabel as string || "Configure this step"}
                </span>
            </div>
        </div>
        
        <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-muted-foreground/30 !-top-1.5" />
        <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-muted-foreground/30 !-bottom-1.5" />
      </Card>
    </div>
  );
};

export default memo(CustomNode);

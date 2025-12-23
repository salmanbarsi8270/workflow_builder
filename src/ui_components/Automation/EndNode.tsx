import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from "@/lib/utils";

const EndNode = ({ selected }: NodeProps) => {
  return (
    <div className="relative flex flex-col items-center">
      <div 
        className={cn(
          "px-4 py-2 rounded-lg shadow-sm border border-border bg-background text-sm font-medium transition-all duration-200",
          selected ? "border-primary ring-2 ring-primary/20" : "border-border"
        )}
      >
        End
      </div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-muted-foreground/30 !-top-1.5" />
    </div>
  );
};

export default memo(EndNode);

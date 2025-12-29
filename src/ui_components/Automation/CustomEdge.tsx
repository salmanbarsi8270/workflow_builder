import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getSmoothStepPath, useNodes } from '@xyflow/react';
import { Plus, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAutomationContext } from './AutomationContext';
import { cn } from "@/lib/utils";

// Edge Status Colors
const EdgeStatusColors = {
  pending: {
    stroke: '#94a3b8',
    width: 2,
    dasharray: '5,5',
    glow: ''
  },
  running: {
    stroke: '#3b82f6',
    width: 3,
    dasharray: 'none',
    glow: 'drop-shadow(0_0_8px_rgba(59,130,246,0.6))'
  },
  success: {
    stroke: '#22c55e',
    width: 3,
    dasharray: 'none',
    glow: 'drop-shadow(0_0_8px_rgba(34,197,94,0.4))'
  },
  error: {
    stroke: '#ef4444',
    width: 3,
    dasharray: 'none',
    glow: 'drop-shadow(0_0_8px_rgba(239,68,68,0.4))'
  },
  warning: {
    stroke: '#f59e0b',
    width: 2.5,
    dasharray: 'none',
    glow: 'drop-shadow(0_0_8px_rgba(245,158,11,0.4))'
  },
  conditional: {
    stroke: '#8b5cf6',
    width: 2,
    dasharray: '10,5',
    glow: 'drop-shadow(0_0_8px_rgba(139,92,246,0.3))'
  }
} as const;

// Edge Type Colors
const EdgeTypeColors = {
  default: '#94a3b8',
  data: '#0ea5e9',
  control: '#8b5cf6',
  conditional: '#d946ef',
  parallel: '#f59e0b'
} as const;

export default function CustomEdge({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data
}: EdgeProps) {
  const { onAddNode, onEdgeClick } = useAutomationContext();
  const nodes = useNodes();

  const sourceNode = nodes.find(n => n.id === source);

  const status = sourceNode?.data?.status as keyof typeof EdgeStatusColors || 'pending';
  const edgeType = data?.type as keyof typeof EdgeTypeColors || 'default';
  const hasError = data?.hasError as boolean;
  const label = data?.label as string;

  // Get SmoothStepPath with 0 border radius for sharp orthogonal straight lines
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0
  });

  // Calculate edge style based on status and type
  const edgeStyle = {
    ...style,
    stroke: hasError ? '#ef4444' : (EdgeTypeColors[edgeType] || EdgeStatusColors[status].stroke),
    strokeWidth: EdgeStatusColors[status].width,
    strokeDasharray: EdgeStatusColors[status].dasharray,
    filter: EdgeStatusColors[status].glow,
    opacity: 1,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer'
  };

  const handleAddNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddNode(id);
  };

  const handleEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdgeClick) {
      onEdgeClick(id);
    }
  };

  const isPlaceholder = sourceNode?.data?.isPlaceholder;

  return (
    <>
      {/* Main Edge */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...edgeStyle,
          opacity: isPlaceholder ? 0.5 : 1
        }}
        onClick={handleEdgeClick}
        className={cn(
          selected && "ring-2 ring-primary/30",
          hasError && "animate-pulse"
        )}
      />

      {/* Edge Interaction UI */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all'
          }}
          className="nodrag nopan group"
        >
          <div className={cn(
            "flex items-center gap-1 transition-all duration-300",
            selected ? "opacity-100 scale-100" : "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"
          )}>
            <div className="flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-lg border-2 border-primary/20">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full transition-all"
                onClick={handleAddNode}
                title="Add node"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Edge Label */}
            {label && (
              <div className="px-2 py-1 rounded-md bg-background/90 backdrop-blur-sm border shadow-sm text-xs font-medium min-w-[60px] text-center">
                {label}
              </div>
            )}
          </div>
        </div>

        {/* Edge Status Indicator */}
        {status !== 'pending' && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px,${(sourceY + targetY) / 2}px)`,
              pointerEvents: 'none'
            }}
          >
            <div className={cn(
              "h-4 w-4 rounded-full flex items-center justify-center border-2 border-background shadow-sm",
              status === 'running' && "bg-blue-500 animate-pulse",
              status === 'success' && "bg-green-500",
              status === 'error' && "bg-red-500",
              status === 'warning' && "bg-amber-500"
            )}>
              {status === 'running' && <Zap className="h-2 w-2 text-white" />}
              {status === 'error' && <AlertCircle className="h-2 w-2 text-white" />}
            </div>
          </div>
        )}
      </EdgeLabelRenderer>

      {/* Edge Selection Outline for easier clicking */}
      {selected && (
        <BaseEdge
          path={edgePath}
          style={{
            stroke: 'transparent',
            strokeWidth: 20,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            pointerEvents: 'stroke',
            cursor: 'pointer'
          }}
          onClick={handleEdgeClick}
        />
      )}
    </>
  );
}
import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getSmoothStepPath, useNodes } from '@xyflow/react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAutomationContext } from '../context/AutomationContext';
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
  },
  skipped: {
    stroke: '#e4e4e7', // zinc-200
    width: 2,
    dasharray: '5,5',
    glow: ''
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
  target,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,

}: EdgeProps) {
  const { onAddNode, onEdgeClick } = useAutomationContext();
  const nodes = useNodes();

  const sourceNode = nodes.find(n => n.id === source);
  const targetNode = nodes.find(n => n.id === target);

  const status = sourceNode?.data?.status as keyof typeof EdgeStatusColors || 'pending';
  const edgeType = data?.type as keyof typeof EdgeTypeColors || 'default';
  const hasError = data?.hasError as boolean;
  const label = data?.label as string;

  // Calculate Path
  let [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0
  });

  // CUSTOM PATH: For nodes entering a Merge Node (Convergence Point)
  // We force a "Merge Bus" line at targetY - 40 to ensure symmetry
  const isTargetMerge = targetNode?.data?.isMergeNode;
  if (isTargetMerge) {
    const mergeY = targetY - 40; // Consistent horizontal level for all branches
    edgePath = `M ${sourceX},${sourceY} L ${sourceX},${mergeY} L ${targetX},${mergeY} L ${targetX},${targetY}`;

    // Position label/button on the vertical segment coming from source
    // Use dynamic offset to ensure we never hit the "elbow" (at offset 40)
    const verticalSegmentLength = Math.max(0, (targetY - 40) - sourceY);
    labelX = sourceX;
    labelY = sourceY + Math.min(25, verticalSegmentLength * 0.7);
  }

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

  // Override Label Position logic - ONLY for branching nodes (Parallel/Condition)
  // These need specialized placement (+75) to sit inside the branch column.
  // Sequential steps return to their "old place" (Centered).
  let finalLabelX = labelX;
  let finalLabelY = labelY;

  if (sourceNode?.type === 'parallel' || sourceNode?.type === 'condition') {
    finalLabelX = targetX;
    finalLabelY = sourceY + 65;
  }

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
  const distanceY = Math.abs(targetY - sourceY);

  // Don't show add button if the edge is too short (prevents "collapse" aka overlap with nodes)
  // OR if either side is a Branch Placeholder (the "Add Step" cards inside branches).
  // This allows buttons on edges leading to Merge Points or End Nodes while avoiding
  // redundancy on the construction cards.
  const isBranchPlaceholder = sourceNode?.data?.isBranchPlaceholder || targetNode?.data?.isBranchPlaceholder;

  // --- LOOP BYPASS VISUAL FIX ---
  // If this is the "Bypass" line for a Loop, we want a wider bracket.
  // The default edge path might be too tight to the loop body.
  const isLoopBypass = (data as any)?.sourceHandle === 'loop-bypass' || (sourceNode?.type === 'loop' && targetNode?.data?.isMergeNode && !label);

  // FIXED: Removed targetNode?.data?.isMergeNode check so users can add nodes before Merge nodes (end of branch/loop).
  // ALSO: Hide if source is Placeholder (redundant) or Loop Bypass.
  const showAddButton = distanceY > 45 && !isBranchPlaceholder && !isLoopBypass && !isPlaceholder;

  if (isLoopBypass) {
    // Force a "wide bracket" shape
    // Go LEFT from Source (Loop Node Left Handle), then DOWN, then RIGHT to Target (Merge Node Top Handle)

    // Gap: How far left to push the line
    // Use dynamic bypassX from layout if available (to clear inner content), otherwise default gap.
    // Default fallback: sourceX (Center) - NodeHalfWidth (140) - Padding (40) = sourceX - 180
    const verticalX = (sourceNode?.data?.bypassX as number) ?? (sourceX - 180);

    // Simplified rectilinear for now
    const mergeY = targetY - 40; // Same merge bus level as others
    edgePath = `M ${sourceX},${sourceY} L ${verticalX},${sourceY} L ${verticalX},${mergeY} L ${targetX},${mergeY} L ${targetX},${targetY}`;
  }

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
            transform: `translate(-50%, -50%) translate(${finalLabelX}px,${finalLabelY}px)`,
            pointerEvents: 'all'
          }}
          className="nodrag nopan group flex flex-col items-center gap-1"
        >
          {/* Edge Label - Always Visible */}
          {label && (
            <div className={cn(
              "px-2 py-0.5 rounded-md bg-background border shadow-sm text-[10px] font-medium text-muted-foreground whitespace-nowrap transition-all",
              "border-border/50"
            )}>
              {label}
            </div>
          )}

          {/* Add Button - Visible on Hover/Select logic */}
          {showAddButton && (
            <div className={cn(
              "transition-all duration-200",
              selected ? "opacity-100 scale-100" : "opacity-50 scale-90 group-hover:opacity-100 group-hover:scale-100",
              !label && "opacity-50 scale-90 group-hover:opacity-100 group-hover:scale-100"
            )}>
              <div className="flex items-center gap-1 bg-secondary/90 backdrop-blur-sm rounded-full p-1 shadow-sm border border-muted-foreground/40">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={handleAddNode}
                  title={`Insert step before ${targetNode?.data?.label || 'next node'}`}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Edge Status Indicator - REMOVED to reduce clutter (Lighting Problem) */}
        {/* status !== 'pending' && (
          <div ... > ... </div>
      ) */}
      </EdgeLabelRenderer>

      {/* Edge Selection Outline for easier clicking - Reduced width */}
      {selected && (
        <BaseEdge
          path={edgePath}
          style={{
            stroke: 'transparent',
            strokeWidth: 12, // Reduced from 20 to prevent overlap
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            pointerEvents: 'stroke',
            cursor: 'pointer' // Keeping pointer cursor for clickability
          }}
          onClick={handleEdgeClick}
        />
      )}
    </>
  );
}
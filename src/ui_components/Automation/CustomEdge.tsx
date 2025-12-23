import { BaseEdge, EdgeLabelRenderer, type EdgeProps, getBezierPath, useNodes } from '@xyflow/react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAutomationContext } from './AutomationContext';

export default function CustomEdge({ id, source, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd }: EdgeProps) {
  const { onAddNode } = useAutomationContext();
  const nodes = useNodes();
  const sourceNode = nodes.find(n => n.id === source);
  const isPlaceholder = sourceNode?.data?.isPlaceholder;

  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  const onEdgeClick = () => {
    onAddNode(id);
  };

  if (isPlaceholder) {
      return <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />;
  }

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all', }} className="nodrag nopan">
          <Button variant="outline" size="icon" className="h-6 w-6 rounded-full border-dashed border-2 hover:border-solid hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all" onClick={onEdgeClick}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

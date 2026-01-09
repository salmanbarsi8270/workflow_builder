
import { useMemo } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    type Node,
    type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from "@/components/ui/button";
import { X, Calendar } from "lucide-react";
import CustomNode from '@/ui_components/Automation/nodes/CustomNode';
import CustomEdge from '@/ui_components/Automation/edges/CustomEdge';
import ConditionNode from '@/ui_components/Automation/nodes/ConditionNode';
import ParallelNode from '@/ui_components/Automation/nodes/ParallelNode';
import EndNode from '@/ui_components/Automation/nodes/EndNode';
import WaitNode from '@/ui_components/Automation/nodes/WaitNode';
import LoopNode from '@/ui_components/Automation/nodes/LoopNode';

// Reuse node types
const nodeTypes = {
    custom: CustomNode,
    condition: ConditionNode,
    parallel: ParallelNode,
    end: EndNode,
    wait: WaitNode,
    loop: LoopNode,
};

const edgeTypes = {
    custom: CustomEdge,
};

interface RunHistoryViewerProps {
    run: any; // The flow run object
    initialNodes: Node[];
    initialEdges: Edge[];
    onClose: () => void;
    theme?: 'dark' | 'light' | 'system';
}

export default function RunHistoryViewer({ run, initialNodes, initialEdges, onClose, theme }: RunHistoryViewerProps) {
    // Parse the result
    const runMap = useMemo(() => {
        if (!run || !run.result) return {};
        try {
            return typeof run.result === 'string' ? JSON.parse(run.result) : run.result;
        } catch (e) {
            return {};
        }
    }, [run]);

    // Compute simple skipped status for nodes not in result
    const nodesWithStatus = useMemo(() => {
        return initialNodes.map(node => {
            // Logic to find status in runMap
            // 1. Direct ID match
            let stepData = runMap[node.id];

            // 2. Fallback for triggers/actions if not keyed by UUID
            if (!stepData) {
                const triggerKeys = ['schedule', 'newEmail', 'newRow', 'webhook', 'trigger', 'form', 'runAgent'];
                const foundKey = triggerKeys.find(k => runMap[k]);
                if (foundKey && ((node.type === 'trigger') || (node.data.actionId === foundKey) || node.id === '1')) {
                    stepData = runMap[foundKey];
                }
            }

            // 3. Status determination
            let status = 'skipped';
            let duration = 0;
            let output = null;

            if (stepData) {
                status = stepData.status || 'success';
                duration = stepData.duration || 0;
                output = stepData.data || stepData.output;
            } else if (node.type === 'end' || node.data.isPlaceholder) {
                status = undefined as any; // No status needed
            }

            // Return new node object with injected status
            return {
                ...node,
                data: {
                    ...node.data,
                    status: status,
                    duration: duration,
                    output: output, // Optional: if we want to show output on click
                    // Force read-only visuals if needed
                },
                // Disable interactivity
                draggable: false,
                selectable: true, // Allow clicking to see output if we build that
            };
        });
    }, [initialNodes, runMap]);

    // Edges (static)
    const edges = useMemo(() => {
        return initialEdges.map(e => ({
            ...e,
            animated: false, // Turn off animation for history? Or keep it if 'running' (unlikely in history)
            style: { ...e.style, stroke: '#64748b' } // Neutral color or let CustomEdge handle it? CustomEdge handles it.
        }));
    }, [initialEdges]);

    // We can use a simplified CustomEdge that doesn't show "Add Button"
    // Or just use the existing one but pass a prop? 
    // Existing CustomEdge checks for `data.label`. "Add Node" buttons are separate nodes or overlay?
    // In AutomationEditor, "Add Node" logic is on edges or handles.
    // The nodes here are `nodesWithStatus`.

    // Actually, CustomEdge renders the "Add" button unless we hide it.
    // We might need to hide it via CSS or a prop.
    // Let's rely on `nodesConnectable={false}` prop in ReactFlow which might propagate.

    return (
        <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-background/50">
                <div className="flex items-center gap-4">
                    <div className={`h-3 w-3 rounded-full ${run.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            Run History
                            <span className="text-muted-foreground text-sm font-normal">#{run.id.slice(0, 8)}</span>
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(run.created_at).toLocaleString()}</span>
                            {/* <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDuration(run.duration)}</span> */}
                        </div>
                    </div>
                </div>

                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                    <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Read-Only Canvas */}
            <div className="flex-1 relative">
                <ReactFlowProvider>
                    <ReactFlow
                        nodes={nodesWithStatus}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={true}
                        zoomOnScroll={true}
                        panOnScroll={true}
                        proOptions={{ hideAttribution: true }}
                        colorMode={theme === 'dark' ? 'dark' : 'light'}
                    >
                        <Background gap={12} size={1} />
                        <Controls showInteractive={false} />
                        <MiniMap zoomable pannable inversePan />
                    </ReactFlow>
                </ReactFlowProvider>

                {/* Overlay to prevent interaction with edge buttons if any exist? */}
                {/* Actually, if we pass `nodesConnectable={false}`, CustomEdge might still render the button if it's hardcoded. */}
                {/* We can use CSS to hide .react-flow__edge-custom-button or similar if needed. */}
                <style>{`
                    .react-flow__edge-interaction { display: none !important; }
                    .nodrag { cursor: default !important; }
                `}</style>
            </div>
        </div>
    );
}

import { useCallback, useState } from 'react';
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, RefreshCcw, SaveIcon } from "lucide-react"
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Node,
    type Edge,
    ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import RightGenericSidebar from './RightGenericSidebar';
import CustomNode from './CustomNode';
import EndNode from './EndNode';
import CustomEdge from './CustomEdge';
import AutomationContext from './AutomationContext';
import StepSelector from './StepSelector';

// Define custom types
const nodeTypes = {
  custom: CustomNode,
  end: EndNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

interface AutomationEditorProps {
    automationName: string;
    initialNodes: Node[];
    initialEdges: Edge[];
    onBack: () => void;
    onSave: (nodes: Node[], edges: Edge[]) => void;
    theme: 'dark' | 'light' | 'system';
}

const NODE_HEIGHT = 100;
const NODE_GAP = 100;

export default function AutomationEditor({
    automationName,
    initialNodes,
    initialEdges,
    onBack,
    onSave,
    theme
}: AutomationEditorProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const [addingNodeOnEdgeId, setAddingNodeOnEdgeId] = useState<string | null>(null);
    const [rfInstance, setRfInstance] = useState<any>(null);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'custom' }, eds)),
        [setEdges],
    );

    const onNodeClick = (_event: React.MouseEvent, node: Node) => {
        if (node.type === 'end') return;

        if (node.data.isPlaceholder) {
            setAddingNodeOnEdgeId('PLACEHOLDER_MODE'); // Hacky flag or use separate state
            setSelectedNodeId(node.id); // Track which node to update
        } else {
            setSelectedNodeId(node.id);
            setAddingNodeOnEdgeId(null); 
        }
    };

    const onPaneClick = () => {
        setSelectedNodeId(null);
        setAddingNodeOnEdgeId(null);
    }

    const handleUpdateNode = (label: string, data?: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNodeId) {
                    return { ...node, data: { ...node.data, ...data, label: label } };
                }
                return node;
            })
        );
    };

    const handleDeleteNode = () => {
        if (!selectedNodeId) return;

        // Auto-healing logic
        const incomingEdge = edges.find(e => e.target === selectedNodeId);
        const outgoingEdge = edges.find(e => e.source === selectedNodeId);

        // Check if Start Node (no incoming edges, essentially the first one, or explicitly checking position/id logic if standard)
        // Here we assume if no incoming edge and it's not the end node, it's the start node.
        if (!incomingEdge) {
             // It's the start node! Reset it.
             setNodes((nds) => 
                nds.map(node => {
                    if (node.id === selectedNodeId) {
                        return {
                            ...node,
                            data: { label: 'Select Trigger', isPlaceholder: true }
                        }
                    }
                    return node;
                })
             );
             setSelectedNodeId(null);
             return;
        }

        let newEdges = edges.filter(e => e.target !== selectedNodeId && e.source !== selectedNodeId);

        if (incomingEdge && outgoingEdge) {
            newEdges.push({ 
                id: `e-${incomingEdge.source}-${outgoingEdge.target}`, 
                source: incomingEdge.source, 
                target: outgoingEdge.target, 
                type: 'custom' 
            });
        }

        setEdges(newEdges);
        setNodes(nodes.filter(n => n.id !== selectedNodeId));
        setSelectedNodeId(null);
    };

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    // --- Node Insertion Logic ---

    // 1. User clicks "+" -> Layout calculates -> We store edgeId -> Show Selector
    const handleAddClick = (edgeId: string) => {
        setAddingNodeOnEdgeId(edgeId);
        setSelectedNodeId(null);
    };

    // 2. User selects App -> We insert node
    const handleAppSelect = (app: any) => {
        // Mode 1: Replacing a Placeholder (Start Node)
        if (addingNodeOnEdgeId === 'PLACEHOLDER_MODE' && selectedNodeId) {
             setNodes((nds) => nds.map(n => {
                 if (n.id === selectedNodeId) {
                     return {
                         ...n,
                         data: {
                             label: app.name,
                             subLabel: app.description,
                             icon: app.name.toLowerCase() === 'google sheets' ? 'doc' : 'email',
                             appName: app.name,
                             ...app,
                             isPlaceholder: false // No longer placeholder
                         }
                     }
                 }
                 return n;
             }));
             setAddingNodeOnEdgeId(null);
             setSelectedNodeId(null); // Deselect or keep selected to show sidebar? Let's deselect to show updated view.
             return;
        }

        // Mode 2: Inserting between nodes
        if (!addingNodeOnEdgeId) return;

        const edgeId = addingNodeOnEdgeId;
        const edge = edges.find(e => e.id === edgeId);
        if (!edge) return;

        const sourceNode = nodes.find(n => n.id === edge.source);
        
        if (!sourceNode) return;

        const newNodeId = Math.random().toString(36).substr(2, 9);
        const newNodeY = sourceNode.position.y + NODE_HEIGHT + NODE_GAP;
        const shiftAmount = NODE_HEIGHT + NODE_GAP;

        const newNode: Node = {
            id: newNodeId,
            position: { x: sourceNode.position.x, y: newNodeY },
            data: { 
                label: app.name, 
                subLabel: app.description, 
                icon: app.name.toLowerCase() === 'google sheets' ? 'doc' : 'email', // Simple mapping
                appName: app.name, // Store app name for form lookup
                ...app // Store other app details
            },
            type: 'custom'
        };

        const newEdges = [
            { id: `e-${sourceNode.id}-${newNodeId}`, source: sourceNode.id, target: newNodeId, type: 'custom' },
            { id: `e-${newNodeId}-${edge.target}`, source: newNodeId, target: edge.target, type: 'custom' }
        ];

        // Shift nodes
        const updatedNodes = nodes.map(node => {
            if (node.id === sourceNode.id) return node; 
            if (node.position.y > sourceNode.position.y) {
                 return { ...node, position: { ...node.position, y: node.position.y + shiftAmount } };
            }
            return node;
        });

        setNodes([...updatedNodes, newNode]);
        setEdges(edges.filter(e => e.id !== edgeId).concat(newEdges));
        setAddingNodeOnEdgeId(null); // Close selector
    };


    const onLayout = useCallback(() => {
        // Simple vertical layout
        const startNode = nodes.find(n => !edges.some(e => e.target === n.id));
        if (!startNode) return;
        
        const visited = new Set<string>();
        const sortedIds: string[] = [];
        
        const processNode = (nodeId: string) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);
            sortedIds.push(nodeId);
            
            const outgoing = edges.filter(e => e.source === nodeId);
            outgoing.forEach(e => processNode(e.target));
        }
        
        processNode(startNode.id);
        
        setNodes((nds) => 
            nds.map(n => {
                const index = sortedIds.indexOf(n.id);
                if (index === -1) return n;
                return {
                    ...n,
                    position: { x: 0, y: index * (NODE_HEIGHT + NODE_GAP) }
                };
            })
        );
        
        setTimeout(() => {
             rfInstance?.fitView({ padding: 0.2, maxZoom: 1 });
        }, 50);

    }, [nodes, edges, rfInstance, setNodes]);

    return (
        <AutomationContext.Provider value={{ onAddNode: handleAddClick }}>
            <div className="flex flex-col h-[calc(100vh-8rem)]">
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeftIcon className="h-5 w-5" />
                        </Button>
                        <div>
                            <h2 className="text-xl font-bold">{automationName}</h2>
                            <p className="text-xs text-muted-foreground">Workflow Editor</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                            <Button variant="outline" onClick={() => { onLayout(); rfInstance?.fitView({ padding: 0.2, maxZoom: 1 }); }}>
                                <RefreshCcw />
                            </Button>
                            <Button variant="outline" onClick={onBack}>Cancel</Button>
                            <Button onClick={() => onSave(nodes, edges)}><SaveIcon className="mr-2 h-4 w-4"/> Save</Button>
                    </div>
                </div>

                <div className="flex flex-1 border rounded-lg overflow-hidden bg-background relative">
                    <div className="flex-1 relative">
                        <ReactFlowProvider>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                onNodeClick={onNodeClick}
                                onPaneClick={onPaneClick}
                                onInit={setRfInstance}
                                fitView
                                fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
                                colorMode={theme === 'dark' ? 'dark' : 'light'}
                                nodeTypes={nodeTypes}
                                edgeTypes={edgeTypes}
                            >
                                <Controls />
                                <Background gap={12} size={1} />
                            </ReactFlow>
                        </ReactFlowProvider>
                    </div>

                    {selectedNodeId && selectedNode && !selectedNode.data.isPlaceholder && (
                        <RightGenericSidebar
                            selectedNode={selectedNode}
                            onUpdateNode={handleUpdateNode}
                            onDeleteNode={handleDeleteNode}
                            onClose={() => setSelectedNodeId(null)}
                        />
                    )}

                    {addingNodeOnEdgeId && (
                        <StepSelector 
                            onSelect={handleAppSelect} 
                            onClose={() => setAddingNodeOnEdgeId(null)} 
                        />
                    )}
                </div>
            </div>
        </AutomationContext.Provider>
    );
}

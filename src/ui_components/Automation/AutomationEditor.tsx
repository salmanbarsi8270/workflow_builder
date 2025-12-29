import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, RefreshCcw, HistoryIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
// import { toast } from "sonner"
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
import RunSidebar from './RunSidebar';

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
    automationStatus: boolean;
    onBack: () => void;
    onAutoSave: (nodes: Node[], edges: Edge[]) => void;
    onToggleStatus: () => void;
    onPublish: () => void;
    theme: 'dark' | 'light' | 'system';
    isLoading?: boolean;
    socket?: any;
    flowId?: string;
}

export type StepStatus = 'pending' | 'running' | 'success' | 'error';

export interface StepResult {
    nodeId: string;
    status: StepStatus;
    output: any;
    duration: number;
}


const NODE_HEIGHT = 100;
const NODE_GAP = 100;

export default function AutomationEditor({ automationName, initialNodes, initialEdges, automationStatus, onBack, onAutoSave, onToggleStatus, theme, isLoading, socket, flowId }: AutomationEditorProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const [addingNodeOnEdgeId, setAddingNodeOnEdgeId] = useState<string | null>(null);
    const [rfInstance, setRfInstance] = useState<any>(null);
    const [isRunSidebarOpen, setIsRunSidebarOpen] = useState(false);
    const [results, setResults] = useState<Record<string, StepResult>>({});


    // Synchronize nodes and edges when initialProps change (e.g. after fetch completes)
    useEffect(() => {
        if (initialNodes.length > 0 || initialEdges.length > 0) {
            setNodes(initialNodes);
            setEdges(initialEdges);
        }
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    const handleRunClick = () => {
        setIsRunSidebarOpen(true);
    };

    const handleRunToggle = (checked: boolean) => {
        onToggleStatus();
        if (checked) {
            setIsRunSidebarOpen(true);
        } else {
            // Clear results when turning off? Or keep them? 
            // Usually good to clear if we're stopping the flow
            setResults({});
        }
    };

    const nodesRef = useRef(nodes);
    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    // Socket listeners for run progress
    useEffect(() => {
        if (socket) {
            const handleStepStart = (data: any) => {
                setResults(prev => {
                    const sortedNodes = [...nodesRef.current].sort((a, b) => a.position.y - b.position.y).filter(n => n.type !== 'end' && !n.data.isPlaceholder);
                    const isFirstNode = sortedNodes[0]?.id === data.nodeId;
                    const noActiveResults = Object.keys(prev).length === 0;

                    if (isFirstNode || noActiveResults) {
                        return {
                            [data.nodeId]: {
                                nodeId: data.nodeId,
                                status: 'running',
                                output: null,
                                duration: 0
                            }
                        };
                    }
                    return {
                        ...prev,
                        [data.nodeId]: {
                            nodeId: data.nodeId,
                            status: 'running',
                            output: null,
                            duration: 0
                        }
                    };
                });
            };

            const handleStepFinish = (data: any) => {
                setResults(prev => ({
                    ...prev,
                    [data.nodeId]: {
                        nodeId: data.nodeId,
                        status: data.status,
                        output: data.output,
                        duration: data.duration
                    }
                }));
            };

            const handleRunComplete = () => {
                // Clear results after 2.5 seconds so user sees final state briefly
                setTimeout(() => {
                    setResults({});
                }, 2500);
            };

            socket.on('step-run-start', handleStepStart);
            socket.on('step-run-finish', handleStepFinish);
            socket.on('run-complete', handleRunComplete);

            return () => {
                socket.off('step-run-start', handleStepStart);
                socket.off('step-run-finish', handleStepFinish);
                socket.off('run-complete', handleRunComplete);
            };
        }
    }, [socket]);

    // Update node data when results change to trigger re-renders in CustomNode
    useEffect(() => {
        setNodes(nds => nds.map(node => {
            const result = results[node.id];
            // If result exists and status changed, update it
            if (result && node.data.status !== result.status) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        status: result.status
                    }
                };
            }
            // If result doesn't exist (cleared) but node has a status, reset it
            if (!result && node.data.status) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        status: undefined
                    }
                };
            }
            return node;
        }));
    }, [results, setNodes]);



    // Auto-Save Effect
    useEffect(() => {
        if (isLoading || nodes.length === 0) return; // Don't auto-save while still loading or if data is missing

        const timeoutId = setTimeout(() => {
            onAutoSave(nodes, edges);
        }, 1000); // 1s debounce
        return () => clearTimeout(timeoutId);
    }, [nodes, edges, onAutoSave, isLoading]);

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

    const handleUpdateNode = (label: string, data?: any, immediate: boolean = false) => {
        setNodes((nds) => {
            const updatedNodes = nds.map((node) => {
                if (node.id === selectedNodeId) {
                    return { ...node, data: { ...node.data, ...data, label: label } };
                }
                return node;
            });

            if (immediate) {
                // Trigger immediate save
                onAutoSave(updatedNodes, edges);
            }

            return updatedNodes;
        });
    };

    const handleDeleteNode = () => {
        if (!selectedNodeId) return;

        // 1. Calculate incoming/outgoing edges
        const incomingEdge = edges.find(e => e.target === selectedNodeId);
        const outgoingEdge = edges.find(e => e.source === selectedNodeId);

        // Case: Start Node (ID '1')
        if (selectedNodeId === '1') {
            const nextNodes = nodes.map(node => {
                if (node.id === '1') {
                    return { ...node, data: { label: 'Select Trigger', isPlaceholder: true } }
                }
                return node;
            });

            // Apply layout to these next nodes
            const layoutedNodes = onLayout(nextNodes, edges);
            setNodes(layoutedNodes);
            setSelectedNodeId(null);

            setTimeout(() => {
                rfInstance?.fitView({ padding: 0.2, maxZoom: 1 });
            }, 50);
            return;
        }

        // Case: Other nodes
        let nextEdges = edges.filter(e => e.target !== selectedNodeId && e.source !== selectedNodeId);
        if (incomingEdge && outgoingEdge) {
            nextEdges.push({
                id: `e-${incomingEdge.source}-${outgoingEdge.target}`,
                source: incomingEdge.source,
                target: outgoingEdge.target,
                type: 'custom'
            });
        }

        const nextNodes = nodes.filter(n => n.id !== selectedNodeId);

        // Calculate layout on the future state
        const layoutedNodes = onLayout(nextNodes, nextEdges);

        setEdges(nextEdges);
        setNodes(layoutedNodes);
        setSelectedNodeId(null);

        setTimeout(() => {
            rfInstance?.fitView({ padding: 0.2, maxZoom: 1 });
        }, 50);
    };

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    // --- Node Insertion Logic ---

    // 1. User clicks "+" -> Layout calculates -> We store edgeId -> Show Selector
    const handleAddClick = (edgeId: string) => {
        setAddingNodeOnEdgeId(edgeId);
        setSelectedNodeId(null);
    };

    const handleDeleteEdge = (edgeId: string) => {
        setEdges(eds => eds.filter(e => e.id !== edgeId));
    };

    const handleEdgeClick = (edgeId: string) => {
        console.log("Edge clicked:", edgeId);
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


    const onLayout = useCallback((passedNodes?: Node[], passedEdges?: Edge[]) => {
        const layoutNodes = passedNodes || nodes;
        const layoutEdges = passedEdges || edges;

        // Simple vertical layout
        const startNode = layoutNodes.find(n => !layoutEdges.some(e => e.target === n.id));
        if (!startNode) return layoutNodes;

        const visited = new Set<string>();
        const sortedIds: string[] = [];

        const processNode = (nodeId: string) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);
            sortedIds.push(nodeId);

            const outgoing = layoutEdges.filter(e => e.source === nodeId);
            outgoing.forEach(e => processNode(e.target));
        }

        processNode(startNode.id);

        const updatedNodes = layoutNodes.map(n => {
            const index = sortedIds.indexOf(n.id);
            if (index === -1) return n;
            return {
                ...n,
                position: { x: 0, y: index * (NODE_HEIGHT + NODE_GAP) }
            };
        });

        if (!passedNodes) {
            setNodes(updatedNodes);
            setTimeout(() => {
                rfInstance?.fitView({ padding: 0.2, maxZoom: 1 });
            }, 50);
        }

        return updatedNodes;
    }, [nodes, edges, rfInstance, setNodes]);

    return (
        <AutomationContext.Provider value={{
            onAddNode: handleAddClick,
            onDeleteEdge: handleDeleteEdge,
            onEdgeClick: handleEdgeClick
        }}>

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
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => { onLayout(); rfInstance?.fitView({ padding: 0.2, maxZoom: 1 }); }}>
                            <RefreshCcw className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="text-violet-600 border-violet-200 hover:bg-violet-50" onClick={handleRunClick}>
                            <HistoryIcon className="mr-2 h-4 w-4" /> Runs
                        </Button>
                        <div className="flex items-center gap-2 mr-2">
                            <span className="text-sm font-medium text-muted-foreground">Run</span>
                            <Switch checked={automationStatus} onCheckedChange={handleRunToggle} />
                        </div>
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
                                nodesDraggable={true}
                            >
                                <Controls />
                                <Background gap={12} size={1} />
                            </ReactFlow>
                        </ReactFlowProvider>
                    </div>

                    {selectedNodeId && selectedNode && !selectedNode.data.isPlaceholder && (
                        <RightGenericSidebar
                            key={selectedNode.id}
                            selectedNode={selectedNode}
                            nodes={nodes}
                            onUpdateNode={handleUpdateNode}
                            onDeleteNode={handleDeleteNode}
                            onClose={() => setSelectedNodeId(null)}
                            nodeStatus={(selectedNode.data as any).status}
                        />
                    )}

                    {addingNodeOnEdgeId && (
                        <StepSelector
                            onSelect={handleAppSelect}
                            onClose={() => setAddingNodeOnEdgeId(null)}
                            mode={addingNodeOnEdgeId === 'PLACEHOLDER_MODE' ? 'trigger' : 'action'}
                        />
                    )}


                    <RunSidebar
                        isOpen={isRunSidebarOpen}
                        onClose={() => setIsRunSidebarOpen(false)}
                        nodes={nodes}
                        socket={socket}
                        flowId={flowId}
                    />



                </div>
            </div>
        </AutomationContext.Provider>
    );
}

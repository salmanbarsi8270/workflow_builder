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
    ReactFlowProvider,
    Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import RightGenericSidebar from './RightGenericSidebar';
import CustomNode from './CustomNode';
import EndNode from './EndNode';
import CustomEdge from './CustomEdge';
import ConditionNode from './ConditionNode';
import ParallelNode from './ParallelNode';
import AutomationContext from './AutomationContext';
import StepSelector from './StepSelector';
import RunSidebar from './RunSidebar';
import NodeContextMenu from './NodeContextMenu';

// Define custom types
const nodeTypes = {
    custom: CustomNode,
    condition: ConditionNode,
    end: EndNode,
    parallel: ParallelNode, 
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

export type StepStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped';

export interface StepResult {
    nodeId: string;
    status: StepStatus;
    output: any;
    duration: number;
}


const NODE_HEIGHT = 100;
const NODE_WIDTH = 280; // Needed for centered tree layout
const NODE_GAP_Y = 100;
const NODE_GAP_X = 50;





export default function AutomationEditor({ automationName, initialNodes, initialEdges, automationStatus, onBack, onAutoSave, onToggleStatus, theme, isLoading, socket, flowId }: AutomationEditorProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const [addingNodeOnEdgeId, setAddingNodeOnEdgeId] = useState<string | null>(null);
    const [rfInstance, setRfInstance] = useState<any>(null);
    const [isRunSidebarOpen, setIsRunSidebarOpen] = useState(false);
    const [results, setResults] = useState<Record<string, StepResult>>({});
    const [menu, setMenu] = useState<{ x: number, y: number, nodeId: string } | null>(null);
    const [swappingNodeId, setSwappingNodeId] = useState<string | null>(null);


    // Synchronize nodes and edges when initialProps change (e.g. after fetch completes)
    // We merge existing transient status to prevent auto-save from wiping colors
    useEffect(() => {
        if (initialNodes.length > 0 || initialEdges.length > 0) {
            setNodes(prevNodes => {
                return initialNodes.map(newNode => {
                    const existingNode = prevNodes.find(n => n.id === newNode.id);
                    if (existingNode && existingNode.data) {
                        return {
                            ...newNode,
                            data: {
                                ...newNode.data,
                                status: existingNode.data.status,
                                duration: existingNode.data.duration
                            }
                        };
                    }
                    return newNode;
                });
            });
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
                // Mark nodes that didn't run as skipped
                setResults(prev => {
                    const next = { ...prev };
                    const allNodes = nodesRef.current;
                    
                    allNodes.forEach(node => {
                        if (node.type === 'end' || node.data.isPlaceholder) return;
                        
                        if (!next[node.id]) {
                            next[node.id] = {
                                nodeId: node.id,
                                status: 'skipped',
                                output: null,
                                duration: 0
                            };
                        }
                    });
                    return next;
                });

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
        setMenu(null);
    }

    const onNodeContextMenu = useCallback(
        (event: React.MouseEvent, node: Node) => {
            event.preventDefault();
            if (node.type === 'end') return;

            setMenu({
                x: event.clientX,
                y: event.clientY,
                nodeId: node.id,
            });
        },
        [setMenu]
    );

    const handleSwapNode = (nodeId: string) => {
        setSwappingNodeId(nodeId);
        // We also need to know if it's a trigger or action for the selector mode
        // But for now, we'll let StepSelector handle it or default to action
    };

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

    const handleDeleteNode = (targetId?: string) => {
        const idToDelete = targetId || selectedNodeId;
        if (!idToDelete) return;

        // Special handling: Start Node cannot be fully deleted, just reset
        if (idToDelete === '1') {
            const nextNodes = nodes.map(node => {
                if (node.id === '1') {
                    return { ...node, data: { label: 'Select Trigger', isPlaceholder: true, hasBranch: false } }
                }
                return node;
            });
            setNodes(onLayout(nextNodes, edges));
            if (selectedNodeId === idToDelete) setSelectedNodeId(null);
            return;
        }

        // --- General Node Deletion Logic ---

        let newEdges = [...edges];
        let newNodes = [...nodes];
        const nodeToDelete = nodes.find(n => n.id === idToDelete);

        // DIAMOND DELETION LOGIC for Condition Nodes
        if (nodeToDelete?.type === 'condition') {
            const outgoingParams = edges.filter(e => e.source === idToDelete);
            const incomingParams = edges.filter(e => e.target === idToDelete);
            const parentId = incomingParams[0]?.source;

            // Find children (True/False nodes)
            const trueEdge = outgoingParams.find(e => e.sourceHandle === 'true');
            const falseEdge = outgoingParams.find(e => e.sourceHandle === 'false');

            const trueNodeId = trueEdge?.target;
            const falseNodeId = falseEdge?.target;

            if (trueNodeId && falseNodeId) {
                // Helper: Get all descendants until we hit a node that is reachable from BOTH paths (Merge Node)
                // Actually, simplest way: Get all descendants of True, All descendants of False.
                // Intersection is the Merge Node(s).

                const getDescendants = (startId: string): Set<string> => {
                    const descendants = new Set<string>();
                    const queue = [startId];
                    while (queue.length > 0) {
                        const curr = queue.shift()!;
                        if (descendants.has(curr)) continue;
                        descendants.add(curr);
                        const children = edges.filter(e => e.source === curr).map(e => e.target);
                        queue.push(...children);
                    }
                    return descendants;
                };

                const trueDescendants = getDescendants(trueNodeId);
                const falseDescendants = getDescendants(falseNodeId);

                // Find intersection: The first node present in BOTH sets is the Merge Node
                // (Topologically, there could be many, but the first one encountered in a clean diamond is the merge)
                const intersection = new Set([...trueDescendants].filter(x => falseDescendants.has(x)));

                // If we have an loop or complex graph, this might be tricky, but for Diamond it's clear.
                // We need to identify the "Entry" to the shared path.
                // The merge node is the node in `intersection` that doesn't have any ancestors in `intersection`?
                // Or simply, we treat ALL intersection nodes as "Outside the branches" (Post-Merge).

                // So, nodes to DELETE are: (TrueDescendants - Intersection) + (FalseDescendants - Intersection) + ConditionNode

                const branchNodesToDelete = new Set([
                    ...[...trueDescendants].filter(x => !intersection.has(x)),
                    ...[...falseDescendants].filter(x => !intersection.has(x))
                ]);

                // Also check if we should delete the Merge Node itself
                // We assume the TOPMOST node in intersection is the Merge Node.
                let mergeNodeId: string | undefined;

                // Simple heuristic to find the merge node: it's a node in intersection that is a direct child of a nodeToDELETE
                // OR it is the start of the intersection.
                // Let's use the layout/edges.
                // Find node in intersection that is target of a node in `branchNodesToDelete`?
                // Or just: it's the target of the last nodes in the branches.

                intersection.forEach(id => {
                    // This is a candidate. Pick the one that is closest.
                    // Actually, if we just keep all intersection nodes, we are safe.
                    // But we need to know WHICH one to connect to.
                    mergeNodeId = id; // Just take one? We need the *first* one.
                });

                // Better way to find Merge Node: Iterate intersection, find one that has incoming edges from NON-intersection nodes (i.e. from branches)
                const potentialMergeNodes = [...intersection].filter(id => {
                    const incomers = edges.filter(e => e.target === id).map(e => e.source);
                    return incomers.some(src => branchNodesToDelete.has(src) || src === trueNodeId || src === falseNodeId);
                });
                mergeNodeId = potentialMergeNodes[0]; // Good enough?


                // Decide if we delete the Merge Node
                const mergeNode = nodes.find(n => n.id === mergeNodeId);
                const isMergePlaceholder = mergeNode?.data?.isPlaceholder; // Check general placeholder or specific flag

                const nodesToDeleteIds = [idToDelete, ...branchNodesToDelete];

                let targetToConnectTo: string | undefined = mergeNodeId;

                if (mergeNodeId && isMergePlaceholder) {
                    // Delete Merge Node too
                    nodesToDeleteIds.push(mergeNodeId);
                    // Next target is the child of Merge Node
                    targetToConnectTo = edges.find(e => e.source === mergeNodeId)?.target;
                }

                // Execute Deletion
                newNodes = newNodes.filter(n => !nodesToDeleteIds.includes(n.id));
                newEdges = newEdges.filter(e => !nodesToDeleteIds.includes(e.source) && !nodesToDeleteIds.includes(e.target));

                // Reconnect ConditionParent -> targetToConnectTo
                if (parentId && targetToConnectTo) {
                    newEdges.push({
                        id: `e-${parentId}-${targetToConnectTo}`,
                        source: parentId,
                        target: targetToConnectTo,
                        sourceHandle: incomingParams[0].sourceHandle || null,
                        type: 'custom'
                    });
                } else if (parentId && mergeNodeId && !isMergePlaceholder && !targetToConnectTo) {
                    // Keep Merge but it's end of flow
                    newEdges.push({
                        id: `e-${parentId}-${mergeNodeId}`,
                        source: parentId,
                        target: mergeNodeId,
                        sourceHandle: incomingParams[0].sourceHandle || null,
                        type: 'custom'
                    });
                }

                const layoutedNodes = onLayout(newNodes, newEdges);
                setNodes(layoutedNodes);
                setEdges(newEdges);
                if (selectedNodeId === idToDelete) setSelectedNodeId(null);
                return;
            }
        }

        // 1. Identify incoming edge(s)
        const incomingEdges = edges.filter(e => e.target === idToDelete);

        // 2. Identify outgoing edges
        const outgoingEdges = edges.filter(e => e.source === idToDelete);

        // 3. Remove the node

        // SPECIAL CASE: Deleting a populated Merge Node should REVERT it to a Placeholder
        // (User wants to "go to old merge selector button" instead of deleting the merge point)
        if (incomingEdges.length > 1) {
            const nodeToDelete = nodes.find(n => n.id === idToDelete);
            if (nodeToDelete && !nodeToDelete.data.isPlaceholder) {
                // Check if it's truly a merge node (diamond bottom)
                // We reuse the ID to preserve all existing connections (Incoming Branches + Outgoing Flow)
                const revertedNode: Node = {
                    ...nodeToDelete,
                    data: {
                        label: 'Add Step',
                        subLabel: 'Merge',
                        isPlaceholder: true,
                        isMergePlaceholder: true,
                    },
                    type: 'custom'
                };

                const updatedNodes = nodes.map(n => n.id === idToDelete ? revertedNode : n);

                // Re-apply layout to ensure clean positioning
                const layoutedNodes = onLayout(updatedNodes, edges);
                setNodes(layoutedNodes);
                if (selectedNodeId === idToDelete) setSelectedNodeId(null);
                return; // STOP here. Do not delete connections.
            }
        }

        newNodes = newNodes.filter(n => n.id !== idToDelete);

        // 4. Remove connected edges
        newEdges = newEdges.filter(e => e.target !== idToDelete && e.source !== idToDelete);

        // 5. Reconnection Strategy
        // If it was a linear node (1 in, 1 out), we can try to bridge the gap.
        // If it was a branch node (1 in, 2 out), we probably shouldn't auto-reconnect to avoid mess, 
        // OR we could connect source to *both* children? No, that's invalid in some flows.
        // Let's stick to: Bridge if only 1 outgoing. If multiple, just leave them disconnected.

        if (incomingEdges.length >= 1 && outgoingEdges.length === 1) {
            const target = outgoingEdges[0].target;
            const isMergeNode = edges.filter(e => e.target === target).length > 1; // Check if target is ALREADY a merge node (before our new connections)
            // Note: If we connect multiple sources to it, it WILL become a merge node.

            incomingEdges.forEach(incoming => {
                const source = incoming.source;
                const sourceHandle = incoming.sourceHandle;

                // Condition Branch Emptying Logic (Only applies if we are bridging a SINGLE linear path from a Condition)
                // If we have multiple incoming, we are likely deleting an existing Merge Node, so we just want to bridge.
                // The "Restore Placeholder" logic is strictly for "Condition -> Node -> Merge" collapsing to "Condition -> Merge".

                const sourceNode = nodes.find(n => n.id === source);
                // Check if this specific path is effectively emptying a branch
                // We only restore placeholder if:
                // 1. Source is Condition
                // 2. We are connecting to a Merge Node (or creating one)
                // 3. We are bridging a single step (implied by incomingEdges loop but we need to context check)

                // Actually, simpler logic:
                // If Source is Condition AND Target will become a Merge Node ( >1 incoming total)...
                // We typically restore a placeholder to avoid "Condition -> Merge" direct connection.

                // However, for "Delete Merge Node" scenarios (incomingEdges.length > 1), we are moving the merge point.
                // We typically don't need to insert placeholders here unless the branches themselves were empty?
                // If we delete Merge, we have: Cond -> True -> Merge -> End.
                // Delete Merge => Cond -> True -> End.
                // If True was placeholder? It stays.

                // So, just standard bridging for multiple incoming is usually safe.

                // But we must preserve the SINGLE connection logic for the "Emptying Branch" case.

                if (incomingEdges.length === 1 && sourceNode?.type === 'condition' && isMergeNode) {
                    // ... (Existing Placeholder Restoration Logic) ...
                    const placeholderId = Math.random().toString(36).substring(7);
                    const placeholderNode: Node = {
                        id: placeholderId,
                        type: 'custom',
                        data: {
                            label: 'Add Step',
                            subLabel: sourceHandle === 'true' ? 'True Path' : 'False Path',
                            isPlaceholder: true,
                            isBranchPlaceholder: true,
                        },
                        position: { x: sourceNode?.position.x || 0, y: (sourceNode?.position.y || 0) + 150 }
                    };
                    newNodes.push(placeholderNode);

                    // Connect Condition -> Placeholder
                    newEdges.push({
                        id: `e-${source}-${placeholderId}`,
                        source,
                        target: placeholderId,
                        sourceHandle: sourceHandle || null,
                        type: 'custom'
                    });

                    // Connect Placeholder -> Target
                    newEdges.push({
                        id: `e-${placeholderId}-${target}`,
                        source: placeholderId,
                        target,
                        type: 'custom'
                    });

                } else {
                    // Standard Bridge (for 1..N incoming edges)
                    newEdges.push({
                        id: `e-${source}-${target}`,
                        source,
                        target,
                        sourceHandle: sourceHandle || null, // Preserve handle!
                        type: 'custom'
                    });
                }
            });
        }

        // If it was a branch node, we simply remove it. The children become orphans (new roots or sub-roots). 
        // The user will have to reconnect them manually to something else.
        // BUT for a better UX, if we delete a node inside a branch, we should maintain the chain.


        // Apply Layout
        const layoutedNodes = onLayout(newNodes, newEdges);

        setNodes(layoutedNodes);
        setEdges(newEdges);
        if (selectedNodeId === idToDelete) setSelectedNodeId(null);
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
                            icon: app.piece || app.icon || 'default',
                            appName: app.name,
                            ...app,
                            isPlaceholder: false // No longer placeholder
                        }
                    }
                }
                return n;
            }));
            setAddingNodeOnEdgeId(null);
            setSelectedNodeId(null);
            return;
        }

        // Mode 3: Swapping an existing node
        if (swappingNodeId) {
            setNodes((nds) => nds.map(n => {
                if (n.id === swappingNodeId) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            label: app.name,
                            subLabel: app.description,
                            icon: app.piece || app.icon || 'default',
                            appName: app.name,
                            ...app,
                            isPlaceholder: false
                        }
                    }
                }
                return n;
            }));
            setSwappingNodeId(null);
            return;
        }

        // Mode 2: Inserting between nodes
        if (!addingNodeOnEdgeId) return;

        const edgeId = addingNodeOnEdgeId;
        const edge = edges.find(e => e.id === edgeId);
        if (!edge) return;

        const sourceNode = nodes.find(n => n.id === edge.source);
        if (!sourceNode) return;

        const isCondition = app.actionId === 'condition';

        const newNodeId = Math.random().toString(36).substr(2, 9);

        // Initial position (will be fixed by layout)
        const newNodePosition = { x: sourceNode.position.x, y: sourceNode.position.y + 100 };

        const newNode: Node = {
            id: newNodeId,
            position: newNodePosition,
            data: {
                label: app.name,
                subLabel: app.description,
                icon: app.id || app.icon || 'default',
                appName: app.name,
                ...app
            },
            type: isCondition ? 'condition' : 'custom'
        };

        const newEdges = [];

        // 1. Edge from Source -> New Node (Condition)
        newEdges.push({
            id: `e-${sourceNode.id}-${newNodeId}`,
            source: sourceNode.id,
            target: newNodeId,
            sourceHandle: edge.sourceHandle, // Preserve branch handle if exists
            type: 'custom'
        });

        // 2. Diamond Logic for Condition Node
        if (isCondition) {
            const targetId = edge.target;

            // Create Placeholder Nodes for True and False branches
            const trueNodeId = Math.random().toString(36).substr(2, 9);
            const falseNodeId = Math.random().toString(36).substr(2, 9);

            const trueNode: Node = {
                id: trueNodeId,
                position: { x: newNodePosition.x - 100, y: newNodePosition.y + 150 }, // Initial offset
                data: {
                    label: 'Add Step',
                    subLabel: 'True Path',
                    isPlaceholder: true,
                    isBranchPlaceholder: true, // Helper flag if needed
                },
                type: 'custom'
            };

            const falseNode: Node = {
                id: falseNodeId,
                position: { x: newNodePosition.x + 100, y: newNodePosition.y + 150 }, // Initial offset
                data: {
                    label: 'Add Step',
                    subLabel: 'False Path',
                    isPlaceholder: true,
                    isBranchPlaceholder: true,
                },
                type: 'custom'
            };

            const mergeNodeId = Math.random().toString(36).substr(2, 9);
            const mergeNode: Node = {
                id: mergeNodeId,
                position: { x: newNodePosition.x, y: newNodePosition.y + 300 },
                data: {
                    label: 'Add Step',
                    subLabel: 'Merge',
                    isPlaceholder: true,
                    isMergePlaceholder: true,
                },
                type: 'custom'
            };

            // Add placeholders to nodes list
            // We can't push to `updatedNodes` yet as it's defined later, so we'll concat.
            // We'll add them to a local array to merge later.
            var additionalNodes = [trueNode, falseNode, mergeNode];

            // Connect Condition -> True Placeholder
            newEdges.push({
                id: `e-${newNodeId}-${trueNodeId}`,
                source: newNodeId,
                target: trueNodeId,
                sourceHandle: 'true',
                type: 'custom'
            });

            // Connect Condition -> False Placeholder
            newEdges.push({
                id: `e-${newNodeId}-${falseNodeId}`,
                source: newNodeId,
                target: falseNodeId,
                sourceHandle: 'false',
                type: 'custom'
            });

            // Connect Placeholders -> Merge Node
            newEdges.push({
                id: `e-${trueNodeId}-${mergeNodeId}`,
                source: trueNodeId,
                target: mergeNodeId,
                type: 'custom'
            });

            newEdges.push({
                id: `e-${falseNodeId}-${mergeNodeId}`,
                source: falseNodeId,
                target: mergeNodeId,
                type: 'custom'
            });


            // Connect Merge Node -> Original Target (Converge)
            if (targetId) {
                newEdges.push({
                    id: `e-${mergeNodeId}-${targetId}`,
                    source: mergeNodeId,
                    target: targetId,
                    type: 'custom'
                });
            }

        } else {
            // Standard single node insertion
            var additionalNodes: Node[] = []; // Empty for non-condition
            const targetId = edge.target;
            newEdges.push({
                id: `e-${newNodeId}-${targetId}`,
                source: newNodeId,
                target: targetId,
                type: 'custom'
            });
        }

        const updatedEdges = edges.filter(e => e.id !== edgeId).concat(newEdges);
        const updatedNodes = [...nodes, newNode, ...additionalNodes]; // Layout will sort positions

        // Apply Layout
        const layoutedNodes = onLayout(updatedNodes, updatedEdges);

        setNodes(layoutedNodes);
        setEdges(updatedEdges);
        setAddingNodeOnEdgeId(null); // Close selector
    };


    // --- Tree Layout Algorithm (Expanded for Diamonds) ---
    const onLayout = useCallback((passedNodes?: Node[], passedEdges?: Edge[]) => {
        const layoutNodes = passedNodes || nodes;
        const layoutEdges = passedEdges || edges;

        if (layoutNodes.length === 0) return layoutNodes;

        // 1. Identify Merge Nodes & Check Topology
        const incomingCount: Record<string, number> = {};
        layoutEdges.forEach(e => {
            incomingCount[e.target] = (incomingCount[e.target] || 0) + 1;
        });

        const mergeNodeIds = new Set(Object.keys(incomingCount).filter(id => incomingCount[id] > 1));

        // Topological Sort (Kahn's Algorithm) to determine correct Stitching Order
        // We must process M2 before M1 if M2 -> ... -> M1
        const sortedNodeIds: string[] = [];
        const inDegree: Record<string, number> = {};

        layoutNodes.forEach(n => inDegree[n.id] = 0);
        layoutEdges.forEach(e => inDegree[e.target] = (inDegree[e.target] || 0) + 1);

        const queue: string[] = [];
        layoutNodes.forEach(n => {
            if (inDegree[n.id] === 0) queue.push(n.id);
        });

        while (queue.length > 0) {
            const u = queue.shift()!;
            sortedNodeIds.push(u);

            const children = layoutEdges.filter(e => e.source === u).map(e => e.target);
            children.forEach(v => {
                inDegree[v]--;
                if (inDegree[v] === 0) queue.push(v);
            });
        }

        // Filter for Merge Nodes, maintaining topological order
        const sortedMergeNodes = sortedNodeIds.filter(id => mergeNodeIds.has(id));


        // 2. Build Graph Structure with CUTS at Merge Nodes
        // Adjacency for LAYOUT (skips pointing TO merge nodes)
        const adjacency: Record<string, string[]> = {};
        const reverseAdjacency: Record<string, string> = {};

        layoutNodes.forEach(n => adjacency[n.id] = []);

        layoutEdges.forEach(e => {
            // CRITICAL: If target is a merge node, DO NOT add it to parent's adjacency for layout recursion
            // This treats the parent as a "leaf" for the layout engine, and the merge node as a new "root"
            if (mergeNodeIds.has(e.target)) {
                // Skip adding to adjacency[e.source]
            } else {
                if (adjacency[e.source]) {
                    adjacency[e.source].push(e.target);
                }
                reverseAdjacency[e.target] = e.source;
            }
        });

        // SORT ADJACENCY: Ensure 'true' (Left) comes before 'false' (Right)
        Object.keys(adjacency).forEach(nodeId => {
            adjacency[nodeId].sort((a, b) => {
                const edgeA = layoutEdges.find(e => e.source === nodeId && e.target === a);
                const edgeB = layoutEdges.find(e => e.source === nodeId && e.target === b);

                const handleA = edgeA?.sourceHandle;
                const handleB = edgeB?.sourceHandle;

                if (handleA === 'true') return -1;
                if (handleB === 'true') return 1;
                if (handleA === 'false') return 1; // False goes right
                if (handleB === 'false') return -1;
                return 0;
            });
        });

        // 3. Find Roots (nodes with no parents in the CUT DAG)
        // This will include regular start nodes AND the Merge Nodes
        const layoutRoots = layoutNodes.filter(n => !reverseAdjacency[n.id]);

        // 4. Recursive Position Calculation (Standard Tree)
        const positions: Record<string, { x: number, y: number }> = {};

        const getSubtreeWidth = (nodeId: string, d: number): number => {
            const children = adjacency[nodeId] || [];
            if (children.length === 0) return NODE_WIDTH + NODE_GAP_X;
            let width = 0;
            children.forEach(childId => width += getSubtreeWidth(childId, d + 1));
            return width;
        };

        const setPositions = (nodeId: string, d: number, startX: number) => {
            const children = adjacency[nodeId] || [];
            const y = d * (NODE_HEIGHT + NODE_GAP_Y);

            if (children.length === 0) {
                positions[nodeId] = { x: startX + (NODE_GAP_X / 2), y };
                return;
            }

            let childCursorX = startX;
            children.forEach(childId => {
                const w = getSubtreeWidth(childId, d + 1);
                setPositions(childId, d + 1, childCursorX);
                childCursorX += w;
            });

            // Center parent
            if (children.length > 0) {
                const childrenStart = positions[children[0]].x;
                const childrenEnd = positions[children[children.length - 1]].x;
                positions[nodeId] = { x: (childrenStart + childrenEnd) / 2, y };
            }
        };

        // Run Layout for all detached trees
        // Roots that are Merge Nodes likely start at X=0, we will move them later
        let rootCursorX = 0;
        layoutRoots.forEach(root => {
            const treeWidth = getSubtreeWidth(root.id, 0);
            setPositions(root.id, 0, rootCursorX);
            // If it's a merge node, we don't really care about its initial X, 
            // but we increment rootCursorX to avoid overlap if we didn't stitch (safety)
            rootCursorX += treeWidth + NODE_GAP_X;
        });

        // 4.5. STITCHING HELPERS & CENTERING PASS
        // We define this early for Centering
        const shiftSubtree = (nodeId: string, dx: number, dy: number) => {
            if (positions[nodeId]) {
                positions[nodeId].x += dx;
                positions[nodeId].y += dy;
            }
            const children = adjacency[nodeId] || [];
            children.forEach(childId => shiftSubtree(childId, dx, dy));
        };

        // CENTERING PASS (Fix Main Root to X=210)
        // This ensures the "Spine" stays at 210
        const mainRoot = layoutRoots.find(n => n.id === '1') || layoutRoots[0];
        if (mainRoot && positions[mainRoot.id]) {
            const currentRootX = positions[mainRoot.id].x;
            const centerOffset = 210 - currentRootX; // <--- CHANGED TO 210
            // Shift the Main Root's tree to align Root with X=210
            shiftSubtree(mainRoot.id, centerOffset, 0);
        } // Merge trees are still at original X, but Stitching below will align them relative to parents


        // 5. STITCHING PASS
        // Move Merge Trees to align with their true parents

        sortedMergeNodes.forEach(mergeId => {
            if (!positions[mergeId]) return;

            // Find parents in actual graph
            const incoming = layoutEdges.filter(e => e.target === mergeId);
            const parentIds = incoming.map(e => e.source);

            // Calculate Target Center
            // If parents are aligned (True/False), their center is the Condition Node's center
            // We just average all parent X positions
            let sumX = 0;
            let maxY = 0;
            let validParents = 0;

            parentIds.forEach(pid => {
                if (positions[pid]) {
                    sumX += positions[pid].x;
                    if (positions[pid].y > maxY) maxY = positions[pid].y;
                    validParents++;
                }
            });

            if (validParents > 0) {
                const targetX = sumX / validParents;
                const targetY = maxY + NODE_HEIGHT + NODE_GAP_Y;

                const currentIs = positions[mergeId];
                const dx = targetX - currentIs.x;
                const dy = targetY - currentIs.y;

                shiftSubtree(mergeId, dx, dy);
            }
        });


        // 6. Apply Positions
        const finalNodes = layoutNodes.map(n => {
            const pos = positions[n.id];
            if (!pos) return n;
            return {
                ...n,
                position: { x: pos.x, y: pos.y },
                targetPosition: Position.Top,
                sourcePosition: Position.Bottom
            };
        });

        // Immediate fit view if explicit or initially
        if (!passedNodes) {
            // No-op
        }

        return finalNodes;
    }, [nodes, edges]);

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
                        <Button variant="outline" onClick={() => {
                            const laidOut = onLayout();
                            setNodes(laidOut);
                            setTimeout(() => rfInstance?.fitView({ padding: 0.2, maxZoom: 1 }), 50);
                        }}>
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
                                onNodeContextMenu={onNodeContextMenu}
                                onPaneClick={onPaneClick}
                                onInit={setRfInstance}
                                fitView
                                fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
                                colorMode={theme === 'dark' ? 'dark' : 'light'}
                                nodeTypes={nodeTypes}
                                edgeTypes={edgeTypes}
                                nodesDraggable={true}
                                zoomOnScroll={false}
                                panOnScroll={true}
                                zoomOnPinch={true}
                                zoomActivationKeyCode="Control"
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
                            mode={
                                addingNodeOnEdgeId === 'PLACEHOLDER_MODE'
                                    ? (selectedNodeId === '1' ? 'trigger' : 'action')
                                    : 'action'
                            }
                        />
                    )}

                    {swappingNodeId && (
                        <StepSelector
                            onSelect={handleAppSelect}
                            onClose={() => setSwappingNodeId(null)}
                            mode={swappingNodeId === '1' ? 'trigger' : 'action'}
                        />
                    )}

                    {menu && (
                        <NodeContextMenu
                            {...menu}
                            onSwap={() => handleSwapNode(menu.nodeId)}
                            onDelete={() => handleDeleteNode(menu.nodeId)}
                            onClose={() => setMenu(null)}
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

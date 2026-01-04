import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, RefreshCcw, HistoryIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Upload } from "lucide-react"
import {
    ReactFlow,
    Controls,
    MiniMap,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Node as Node,
    type Edge as Edge,
    ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import RightGenericSidebar from './RightGenericSidebar';
import CustomNode from '@/ui_components/Automation/nodes/CustomNode';
import EndNode from '@/ui_components/Automation/nodes/EndNode';
import CustomEdge from '@/ui_components/Automation/edges/CustomEdge';
import ConditionNode from '@/ui_components/Automation/nodes/ConditionNode';
import ParallelNode from '@/ui_components/Automation/nodes/ParallelNode';
import LoopNode from '@/ui_components/Automation/nodes/LoopNode';
import WaitNode from '@/ui_components/Automation/nodes/WaitNode';
import AutomationContext from '../context/AutomationContext';
import StepSelector from './StepSelector';
import RunSidebar from './RunSidebar';
import RunHistoryViewer from './RunHistoryViewer';
import NodeContextMenu from './NodeContextMenu';
import { calculateLayout } from '../utils/layoutEngine';
import { API_URL } from '@/ui_components/api/apiurl';

// Define custom types
const nodeTypes = {
    custom: CustomNode,
    condition: ConditionNode,
    parallel: ParallelNode,
    loop: LoopNode,
    wait: WaitNode,
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

export type StepStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped';

export interface StepResult {
    nodeId: string;
    status: StepStatus;
    output: any;
    duration: number;
}




export default function AutomationEditor({ automationName, initialNodes, initialEdges, automationStatus, onBack, onAutoSave, onToggleStatus, theme, isLoading, socket, flowId }: AutomationEditorProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [viewingRun, setViewingRun] = useState<any | null>(null);

    const [addingNodeOnEdgeId, setAddingNodeOnEdgeId] = useState<string | null>(null);
    const [rfInstance, setRfInstance] = useState<any>(null);
    const [isRunSidebarOpen, setIsRunSidebarOpen] = useState(false);
    const [results, setResults] = useState<Record<string, StepResult>>({});
    const [menu, setMenu] = useState<{ x: number, y: number, nodeId: string } | null>(null);
    const [swappingNodeId, setSwappingNodeId] = useState<string | null>(null);

    // Publish Template State
    const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [templateDescription, setTemplateDescription] = useState("");
    const [isPublishing, setIsPublishing] = useState(false);


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
                                duration: existingNode.data.duration,
                                isPlaceholder: !!newNode.data.piece ? false : newNode.data.isPlaceholder
                            }
                        };
                    }
                    // Even if not matching existing, if it has a piece, it shouldn't be a placeholder
                    if (newNode.data.piece && newNode.data.isPlaceholder) {
                        return { ...newNode, data: { ...newNode.data, isPlaceholder: false } };
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
            const normalizeId = (id: string) => {
                const triggerIds = ['webhook', 'trigger', 'schedule', 'form'];
                if (triggerIds.includes(id)) return '1';
                return id;
            };

            const handleStepStart = (data: any) => {
                const nodeId = normalizeId(data.nodeId);
                setResults(prev => {
                    const sortedNodes = [...nodesRef.current].sort((a, b) => a.position.y - b.position.y).filter(n => n.type !== 'end' && !n.data.isPlaceholder);
                    const isFirstNode = sortedNodes[0]?.id === nodeId;
                    const noActiveResults = Object.keys(prev).length === 0;

                    if (isFirstNode || noActiveResults) {
                        return {
                            [nodeId]: {
                                nodeId: nodeId,
                                status: 'running',
                                output: null,
                                duration: 0
                            }
                        };
                    }
                    return {
                        ...prev,
                        [nodeId]: {
                            nodeId: nodeId,
                            status: 'running',
                            output: null,
                            duration: 0
                        }
                    };
                });
            };

            const handleStepFinish = (data: any) => {
                const nodeId = normalizeId(data.nodeId);
                setResults(prev => ({
                    ...prev,
                    [nodeId]: {
                        nodeId: nodeId,
                        status: data.status,
                        output: data.output,
                        duration: data.duration
                    }
                }));
            };

            const handleRunComplete = () => {
                console.log("Run complete auto");
                setResults({});
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
                // (Wait, actually user might want to see it? Let's leave it unless they run again)
                // Existing code had timeout logic in RunSidebar, here we just keep results?
            };

            const handleFlowFailed = () => {
                // handle flow failure if needed
            };

            socket.on('step-run-start', handleStepStart);
            socket.on('step-run-finish', handleStepFinish);
            socket.on('run-complete', handleRunComplete);
            socket.on('flow-failed', handleFlowFailed);

            return () => {
                socket.off('step-run-start', handleStepStart);
                socket.off('step-run-finish', handleStepFinish);
                socket.off('run-complete', handleRunComplete);
                socket.off('flow-failed', handleFlowFailed);
            };
        }
    }, [socket]); // Removed dependency on nodes/results to avoid recycles, logic uses prev state

    // --- CRITICAL FIX: Sync Results to Node Status for Canvas Visualization ---
    // The nodes on the canvas need to know their status to change color.
    useEffect(() => {
        if (Object.keys(results).length === 0) {
            // checking if we need to clear statuses
            setNodes(nds => nds.map(n => {
                if (n.data.status) {
                    return { ...n, data: { ...n.data, status: undefined, duration: undefined } };
                }
                return n;
            }));
            return;
        }

        setNodes(nds => nds.map(node => {
            const res = results[node.id];
            // Only update if status is different to avoid infinite loops
            if (res && (node.data.status !== res.status || node.data.duration !== res.duration)) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        status: res.status,
                        duration: res.duration,
                        output: res.output
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

    // Helper: Safely parse branches from string or array
    const safeParseBranches = (input: any): string[] => {
        if (Array.isArray(input)) return input;
        if (typeof input === 'string') {
            try {
                // customized loose parsing: replace single quotes if parse fails
                const result = JSON.parse(input);
                if (Array.isArray(result)) return result;
            } catch (e) {
                try {
                    // Try replacing single quotes with double quotes (simple fix)
                    const result = JSON.parse(input.replace(/'/g, '"'));
                    if (Array.isArray(result)) return result;
                } catch (e2) {
                    return [];
                }
            }
        }
        return [];
    };

    // Helper: Reconcile Parallel Branches (Add/Remove placeholders based on config)
    const reconcileParallelBranches = (
        parallelNode: Node,
        rawBranches: any,
        currentNodes: Node[],
        currentEdges: Edge[]
    ) => {
        const newBranches = safeParseBranches(rawBranches);
        const parentId = parallelNode.id;
        let nextNodes = [...currentNodes];
        let nextEdges = [...currentEdges];

        // Find existing edges from the single "parallel-output" handle
        // We filter by source === parentId AND handle === 'parallel-output'
        // If legacy edges exist (branch-0), we might want to clean them up too, but let's focus on new logic.
        const existingBranchEdges = nextEdges.filter(e =>
            e.source === parentId &&
            (e.sourceHandle === 'parallel-output' || e.sourceHandle?.startsWith('branch-'))
        );

        // Helper to find the Merge Node by following the first branch to its "end"
        const findMergeNodeDeep = (startNodeId: string): string | null => {
            let currId = startNodeId;
            const visited = new Set<string>();
            while (currId && !visited.has(currId)) {
                visited.add(currId);
                // The merge node is the first node that has more than one incoming edge
                // or is explicitly marked as a merge node
                const node = nextNodes.find(n => n.id === currId);
                if (node?.data?.isMergePlaceholder || node?.data?.isMergeNode) return currId;

                const incoming = nextEdges.filter(e => e.target === currId);
                if (incoming.length > 1) return currId;

                const outgoing = nextEdges.filter(e => e.source === currId);
                if (outgoing.length === 0) break;
                // Follow the primary path (usually just one for actions)
                currId = outgoing[0].target;
            }
            return null;
        };

        const firstBranchEdge = existingBranchEdges[0];
        let mergeNodeId: string | null = firstBranchEdge ? findMergeNodeDeep(firstBranchEdge.target) : null;

        if (!mergeNodeId) return { nextNodes, nextEdges };

        const targetCount = newBranches.length;
        if (targetCount === 0) return { nextNodes, nextEdges };

        // 1. Identify and Sort Branch Heads
        const branchTargets = existingBranchEdges.map(e => {
            const node = nextNodes.find(n => n.id === e.target);
            return { edge: e, node };
        })
            .filter(item => item.node)
            .sort((a, b) => {
                const diff = (a.node!.position.x - b.node!.position.x);
                if (diff !== 0) return diff;
                return a.node!.id.localeCompare(b.node!.id); // Stable fallback
            });

        // 1. Remove Extraneous Branches
        if (branchTargets.length > targetCount) {
            const toRemove = branchTargets.slice(targetCount);
            toRemove.forEach(({ edge, node }) => {
                nextEdges = nextEdges.filter(e => e.id !== edge.id);
                if (node) {
                    // If it's a placeholder, remove it safely
                    // If it's a real node, we also remove it because the user explicitly reduced the branch count.
                    // Ideally we should warn, but for now we follow the config.
                    // We need to recursively remove downstream if we want to be clean,
                    // but basic removal of the head node disconnects the branch.
                    // For now, let's just remove the edge and the head node if it's a placeholder/branch head.
                    // Actually, if we just remove the edge, the node becomes orphaned.
                    // Let's reuse handleDeleteNode logic if possible? No, too complex here.
                    // We will remove the node if it is a placeholder. If real, we disconnect it.
                    // Better: Just disconnect the edge. The user can clean up the orphaned node.
                    // BUT, if it's a placeholder, we SHOULD delete it to keep it clean.
                    if (node.data.isBranchPlaceholder) {
                        nextNodes = nextNodes.filter(n => n.id !== node.id);
                        nextEdges = nextEdges.filter(e => e.source !== node.id);
                    } else {
                        // Real node: Just disconnect (edge removed above)
                    }
                }
            });
        }

        // 2. Add New Branches or Update Existing
        for (let i = 0; i < targetCount; i++) {
            const branchName = newBranches[i];

            if (i < branchTargets.length) {
                // Update Existing
                const { node } = branchTargets[i];
                // Only update label if it's a placeholder. real nodes keep their own names.
                if (node && node.data.isBranchPlaceholder && node.data.subLabel !== branchName) {
                    nextNodes = nextNodes.map(n => {
                        if (n.id === node.id) {
                            return { ...n, data: { ...n.data, subLabel: branchName } };
                        }
                        return n;
                    });
                }
                // Update Existing - Edge Label
                // Ensure edge label matches branch name
                const { edge } = branchTargets[i];
                if (edge.data?.label !== branchName) {
                    nextEdges = nextEdges.map(e => {
                        if (e.id === edge.id) return { ...e, data: { ...e.data, label: branchName } };
                        return e;
                    });
                }

                // Ensure edge uses new handle if it was legacy
                if (edge.sourceHandle !== 'parallel-output') {
                    nextEdges = nextEdges.map(e => {
                        if (e.id === edge.id) return { ...e, sourceHandle: 'parallel-output', data: { ...e.data, label: branchName } };
                        return e;
                    });
                }

            } else {
                // Create New Branch
                const placeholderId = Math.random().toString(36).substr(2, 9);
                const placeholder: Node = {
                    id: placeholderId,
                    position: { x: parallelNode.position.x + (i * 100), y: parallelNode.position.y + 150 },
                    data: {
                        label: 'Add Step',
                        subLabel: branchName,
                        isPlaceholder: true,
                        isBranchPlaceholder: true,
                    },
                    type: 'custom'
                };
                nextNodes.push(placeholder);

                // Edge: Parallel (Single Handle) -> Placeholder
                nextEdges.push({
                    id: `e-${parentId}-${placeholderId}`,
                    source: parentId,
                    target: placeholderId,
                    sourceHandle: 'parallel-output',
                    data: { label: branchName }, // Add Label
                    type: 'custom'
                });

                // Edge: Placeholder -> Merge
                nextEdges.push({
                    id: `e-${placeholderId}-${mergeNodeId}`,
                    source: placeholderId,
                    target: mergeNodeId,
                    type: 'custom'
                });
            }
        }

        return { nextNodes, nextEdges };
    };

    const handleUpdateNode = (label: string, data?: any, immediate: boolean = false) => {
        let currentNodes = nodes;
        let currentEdges = edges;
        let structureChanged = false;

        const targetNode = nodes.find(n => n.id === selectedNodeId);

        // --- Parallel Branch Reconciliation ---
        const incomingBranches = data?.params?.branches || data?.branches;

        if ((targetNode?.type === 'parallel' || targetNode?.type === 'loop') && incomingBranches) {
            const oldBranchesRaw = (targetNode.data.params as any)?.branches || (targetNode.data.branches as string[]) || [];
            // Parse everything to compare arrays, not strings
            const oldBranches = safeParseBranches(oldBranchesRaw);
            const newBranches = safeParseBranches(incomingBranches);

            if (JSON.stringify(oldBranches) !== JSON.stringify(newBranches)) {
                // Pass RAW incoming because safeParseBranches is called inside too (or we can pass parsed)
                const { nextNodes, nextEdges } = reconcileParallelBranches(targetNode, newBranches, currentNodes, currentEdges);
                currentNodes = nextNodes;
                currentEdges = nextEdges;
                structureChanged = true;
            }
        }

        const updatedNodes = currentNodes.map((node) => {
            if (node.id === selectedNodeId) {
                return { ...node, data: { ...node.data, ...data, label: label, isPlaceholder: false } };
            }
            return node;
        });

        // If structure changed (reconcile added/removed nodes), run layout.
        // Otherwise just update the specific node.
        const finalNodes = structureChanged ? onLayout(updatedNodes, currentEdges) : updatedNodes;

        setNodes(finalNodes);
        if (structureChanged) setEdges(currentEdges);

        if (immediate) {
            onAutoSave(finalNodes, currentEdges);
        }
    };

    const handleDeleteNode = (targetId?: string) => {
        const idToDelete = targetId || selectedNodeId;
        if (!idToDelete) return;

        // 1. Initial Local State
        let nextNodes = [...nodes];
        let nextEdges = [...edges];
        const nodeToDelete = nodes.find(n => n.id === idToDelete);
        if (!nodeToDelete) return;

        // 2. Compute deletion scope
        let nodesToRemove = new Set<string>([idToDelete]);
        const mergeNodeId = nodeToDelete.data?.mergeNodeId as string | undefined;

        // CRITICAL FIX: Only attempt block deletion if the merge node ACTUALLY exists.
        // If the merge node was deleted manually, the loop node might still hold a stale ID.
        // In that case, we should fall back to simple deletion to avoid deleting the entire downstream flow.
        const mergeNodeExists = mergeNodeId ? nodes.some(n => n.id === mergeNodeId) : false;

        if (mergeNodeId && mergeNodeExists) {
            // Block Starter Deletion: Remove the whole block including children
            const queue = [idToDelete];
            while (queue.length > 0) {
                const currentId = queue.shift()!;
                if (currentId !== idToDelete && nodesToRemove.has(currentId)) continue;
                nodesToRemove.add(currentId);

                // If we reach the merge node, we stop traversing DOWN from it, 
                // but the merge node itself is already in nodesToRemove.
                if (currentId === mergeNodeId) continue;

                const children = edges.filter(e => e.source === currentId).map(e => e.target);
                children.forEach(childId => {
                    if (!nodesToRemove.has(childId)) queue.push(childId);
                });
            }
        }

        const incomingEdges = edges.filter(e => e.target === idToDelete);
        const outgoingEdges = edges.filter(e => e.source === (mergeNodeId || idToDelete));

        // 3. Strategy: Reset or Remove
        const isStartNode = idToDelete === '1';
        const isPopulatedMerge = incomingEdges.length > 1 && !nodeToDelete.data.isPlaceholder;
        const isPopulatedLinear = !mergeNodeId && incomingEdges.length <= 1 && outgoingEdges.length <= 1 && !nodeToDelete.data.isPlaceholder;

        if (isStartNode || isPopulatedMerge || isPopulatedLinear) {
            // "RESET" to Placeholder
            nextNodes = nextNodes.map(n => {
                if (n.id === idToDelete) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            label: isStartNode ? 'Select Trigger' : 'Add Step',
                            subLabel: isPopulatedMerge ? 'Merge' : '',
                            icon: undefined,
                            isPlaceholder: true,
                            appId: undefined,
                            actionId: undefined,
                            params: undefined,
                        }
                    };
                }
                return n;
            });
            // Update UI
            setNodes(onLayout(nextNodes, nextEdges));
            if (selectedNodeId === idToDelete) setSelectedNodeId(null);
            return;
        }

        // 4. "TRUE DELETE" with Bridging
        // Remove nodes and edges in scope
        nextNodes = nextNodes.filter(n => !nodesToRemove.has(n.id));
        nextEdges = nextEdges.filter(e => !nodesToRemove.has(e.source) && !nodesToRemove.has(e.target));

        // Create bridge edges
        if (incomingEdges.length > 0 && outgoingEdges.length > 0) {
            incomingEdges.forEach(inEdge => {
                outgoingEdges.forEach(outEdge => {
                    nextEdges.push({
                        id: `e-${inEdge.source}-${outEdge.target}-${Math.random().toString(36).substr(2, 4)}`,
                        source: inEdge.source,
                        target: outEdge.target,
                        sourceHandle: inEdge.sourceHandle,
                        type: 'custom'
                    });
                });
            });
        }

        // Handle "Empty Branch" restoration
        // If we just deleted a node and those branches now point directly to a merge node,
        // or have no outgoing path, restore a placeholder if the source is a Logic Node.
        incomingEdges.forEach(inEdge => {
            const sourceNode = nodes.find(n => n.id === inEdge.source);
            const isLogic = sourceNode?.type === 'condition' || sourceNode?.type === 'parallel' || sourceNode?.type === 'loop';

            // Check if this branch is now empty (pointing directly to something that was already there but is now a direct neighbor)
            const currentEdgesForBranch = nextEdges.filter(e => e.source === inEdge.source && e.sourceHandle === inEdge.sourceHandle);
            if (isLogic && currentEdgesForBranch.length > 0) {
                const targetId = currentEdgesForBranch[0].target;
                const targetNode = nextNodes.find(n => n.id === targetId);
                const targetIsMerge = targetNode?.data?.isMergePlaceholder || targetNode?.data?.isMergeNode;

                if (targetIsMerge) {
                    // Inject a placeholder
                    const placeholderId = `node-${Math.random().toString(36).substring(7)}`;
                    const placeholder: Node = {
                        id: placeholderId,
                        type: 'custom',
                        data: {
                            label: 'Add Step',
                            subLabel: sourceNode?.type === 'condition' ? (inEdge.sourceHandle === 'true' ? 'True Path' : 'False Path') : 'Branch Step',
                            isPlaceholder: true,
                            isBranchPlaceholder: true,
                        },
                        position: { x: sourceNode?.position.x || 0, y: (sourceNode?.position.y || 0) + 150 }
                    };
                    nextNodes.push(placeholder);

                    // Replace the bridge with Placeholder chain
                    nextEdges = nextEdges.filter(e => e.id !== currentEdgesForBranch[0].id);
                    nextEdges.push(
                        { id: `e-${inEdge.source}-${placeholderId}`, source: inEdge.source, target: placeholderId, sourceHandle: inEdge.sourceHandle, type: 'custom' },
                        { id: `e-${placeholderId}-${targetId}`, source: placeholderId, target: targetId, type: 'custom' }
                    );
                }
            }
        });

        // 5. Atomic Update with Layout
        const finalNodes = onLayout(nextNodes, nextEdges);
        setNodes(finalNodes);
        setEdges(nextEdges);
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
        const isCondition = app.actionId === 'condition';
        const isParallel = app.actionId === 'parallel';
        const isLoop = app.actionId === 'loop';
        const isWait = app.actionId === 'wait';

        // --- Local State for this execution ---
        let isPlaceholderLogicMode = false;
        let placeholderTargetId: string | undefined = undefined;
        let activeEdgeId = addingNodeOnEdgeId;

        // --- Mode 1: Replacing a Placeholder (Start Node or Branch Step) ---
        if (activeEdgeId === 'PLACEHOLDER_MODE' && selectedNodeId) {
            // Find incoming edge to this placeholder to mimic "Edge Insertion"
            const incomingEdge = edges.find(e => e.target === selectedNodeId);

            if (incomingEdge && (isCondition || isParallel || isLoop)) {
                // If replacing with Logic, we treat it as an insertion ON the incoming edge,
                // but we also need to handle the placeholder's outgoing edge.
                const outgoingEdge = edges.find(e => e.source === selectedNodeId);
                placeholderTargetId = outgoingEdge?.target;
                isPlaceholderLogicMode = true;
                activeEdgeId = incomingEdge.id; // Override locally for Mode 2
                // Continue to Mode 2 logic below...
            } else {
                // Standard Replacement (Simple Action)
                const updatedNodes = nodes.map(n => {
                    if (n.id === selectedNodeId) {
                        return {
                            ...n,
                            data: {
                                ...n.data, // Preserve existing data
                                label: app.name,
                                subLabel: app.description,
                                icon: app.piece || app.icon || 'default',
                                appName: app.name,
                                ...app,
                                branches: isParallel ? (app.parameters?.find((p: any) => p.name === 'branches')?.default || ['Branch 1', 'Branch 2']) : undefined,
                                isPlaceholder: false
                            },
                            type: isWait ? 'wait' : n.type // Check if we should update type too for replacement
                        }
                    }
                    return n;
                });

                // CRITICAL: We changed a node from Placeholder to Real.
                // We MUST re-run layout to update loop bypass lines and centering.
                const layoutedNodes = onLayout(updatedNodes, edges);
                setNodes(layoutedNodes);

                setAddingNodeOnEdgeId(null);
                setSelectedNodeId(null);
                return;
            }
        }

        // --- Mode 3: Swapping an existing node ---
        if (swappingNodeId) {
            // ... (Swapping logic stays same)
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
                            branches: isParallel ? (app.parameters?.find((p: any) => p.name === 'branches')?.default || ['Branch 1', 'Branch 2']) : undefined,
                            isPlaceholder: false
                        },
                        type: isWait ? 'wait' : n.type // Update type if swapping to wait
                    }
                }
                return n;
            }));
            setSwappingNodeId(null);
            return;
        }

        // --- Mode 2: Inserting between nodes (Normal Edge or Placeholder Replacement) ---
        if (!activeEdgeId || activeEdgeId === 'PLACEHOLDER_MODE') return;

        const edge = edges.find(e => e.id === activeEdgeId);
        if (!edge) return;

        const sourceNode = nodes.find(n => n.id === edge.source);
        if (!sourceNode) return;

        // Determine the TRUE target for after the logic block/node
        // If we are replacing a placeholder, the block should connect to whatever was AFTER that placeholder.
        const originalTargetId = isPlaceholderLogicMode ? placeholderTargetId : edge.target;

        // Detect if replacing a Merge Node (reconnect all parents)
        const replacingMergeNodeId = (isPlaceholderLogicMode && selectedNodeId && nodes.find(n => n.id === selectedNodeId)?.data?.isMergePlaceholder)
            ? selectedNodeId
            : null;

        const newNodeId = Math.random().toString(36).substr(2, 9);
        const newNodePosition = { x: sourceNode.position.x, y: sourceNode.position.y + 100 };

        const newNode: Node = {
            id: newNodeId,
            position: newNodePosition,
            data: {
                label: app.name,
                subLabel: app.description,
                icon: app.id || app.icon || 'default',
                appName: app.name,
                ...app,
                branches: isParallel ? (app.parameters?.find((p: any) => p.name === 'branches')?.default || ['Branch 1', 'Branch 2']) : undefined
            },
            type: isCondition ? 'condition' : isParallel ? 'parallel' : isLoop ? 'loop' : isWait ? 'wait' : 'custom'
        };

        const newEdges: any[] = [];
        let additionalNodes: Node[] = [];

        // 1. Edge from Source -> New Node
        newEdges.push({
            id: `e-${sourceNode.id}-${newNodeId}`,
            source: sourceNode.id,
            target: newNodeId,
            sourceHandle: edge.sourceHandle,
            type: 'custom'
        });

        // 1.5 Handle Additional Parents if replacing Merge Node (Fan-in)
        if (replacingMergeNodeId) {
            const otherIncomingEdges = edges.filter(e => e.target === replacingMergeNodeId && e.id !== activeEdgeId);
            otherIncomingEdges.forEach(otherEdge => {
                newEdges.push({
                    id: `e-${otherEdge.source}-${newNodeId}`,
                    source: otherEdge.source,
                    target: newNodeId,
                    type: 'custom',
                    sourceHandle: otherEdge.sourceHandle,
                    data: otherEdge.data
                });
            });
        }

        if (isCondition) {
            const trueNodeId = Math.random().toString(36).substr(2, 9);
            const falseNodeId = Math.random().toString(36).substr(2, 9);
            const mergeNodeId = Math.random().toString(36).substr(2, 9);

            const trueNode: Node = {
                id: trueNodeId,
                position: { x: newNodePosition.x - 100, y: newNodePosition.y + 150 },
                data: { label: 'Add Step', subLabel: 'True Path', isPlaceholder: true, isBranchPlaceholder: true },
                type: 'custom'
            };

            const falseNode: Node = {
                id: falseNodeId,
                position: { x: newNodePosition.x + 100, y: newNodePosition.y + 150 },
                data: { label: 'Add Step', subLabel: 'False Path', isPlaceholder: true, isBranchPlaceholder: true },
                type: 'custom'
            };

            const mergeNode: Node = {
                id: mergeNodeId,
                position: { x: newNodePosition.x, y: newNodePosition.y + 300 },
                data: { label: 'Add Step', subLabel: 'Merge', isPlaceholder: true, isMergePlaceholder: true },
                type: 'custom'
            };

            newNode.data = { ...newNode.data, mergeNodeId: mergeNodeId };
            additionalNodes = [trueNode, falseNode, mergeNode];

            newEdges.push(
                { id: `e-${newNodeId}-${trueNodeId}`, source: newNodeId, target: trueNodeId, sourceHandle: 'true', type: 'custom' },
                { id: `e-${newNodeId}-${falseNodeId}`, source: newNodeId, target: falseNodeId, sourceHandle: 'false', type: 'custom' },
                { id: `e-${trueNodeId}-${mergeNodeId}`, source: trueNodeId, target: mergeNodeId, type: 'custom' },
                { id: `e-${falseNodeId}-${mergeNodeId}`, source: falseNodeId, target: mergeNodeId, type: 'custom' }
            );

            if (originalTargetId) {
                newEdges.push({ id: `e-${mergeNodeId}-${originalTargetId}`, source: mergeNodeId, target: originalTargetId, type: 'custom' });
            }

        } else if (isParallel) {
            const branches = (newNode.data.branches as string[]) || ['Branch 1', 'Branch 2'];
            const mergeNodeId = Math.random().toString(36).substr(2, 9);
            const mergeNode: Node = {
                id: mergeNodeId,
                position: { x: newNodePosition.x, y: newNodePosition.y + 300 },
                data: { label: 'Add Step', subLabel: 'Merge', isPlaceholder: true, isMergePlaceholder: true },
                type: 'custom'
            };
            newNode.data = { ...newNode.data, mergeNodeId: mergeNodeId };

            const branchPlaceholders: Node[] = [];
            branches.forEach((branchName, index) => {
                const placeholderId = Math.random().toString(36).substr(2, 9);
                const placeholder: Node = {
                    id: placeholderId,
                    position: { x: newNodePosition.x + (index * 100), y: newNodePosition.y + 150 },
                    data: { label: 'Add Step', subLabel: branchName, isPlaceholder: true, isBranchPlaceholder: true },
                    type: 'custom'
                };
                branchPlaceholders.push(placeholder);

                newEdges.push(
                    { id: `e-${newNodeId}-${placeholderId}`, source: newNodeId, target: placeholderId, sourceHandle: 'parallel-output', data: { label: branchName }, type: 'custom' },
                    { id: `e-${placeholderId}-${mergeNodeId}`, source: placeholderId, target: mergeNodeId, type: 'custom' }
                );
            });

            additionalNodes = [...branchPlaceholders, mergeNode];
            if (originalTargetId) {
                newEdges.push({ id: `e-${mergeNodeId}-${originalTargetId}`, source: mergeNodeId, target: originalTargetId, type: 'custom' });
            }

        } else if (isLoop) {
            const mergeNodeId = Math.random().toString(36).substr(2, 9);
            const mergeNode: Node = {
                id: mergeNodeId,
                position: { x: newNodePosition.x, y: newNodePosition.y + 300 },
                data: { label: 'Add Step', subLabel: 'Merge', isPlaceholder: true, isMergePlaceholder: true },
                type: 'custom'
            };
            newNode.data = { ...newNode.data, mergeNodeId: mergeNodeId };

            const placeholderId = Math.random().toString(36).substr(2, 9);
            const placeholder: Node = {
                id: placeholderId,
                position: { x: newNodePosition.x, y: newNodePosition.y + 150 },
                data: { label: 'Add Step', subLabel: 'Loop Body', isPlaceholder: true, isBranchPlaceholder: true },
                type: 'custom'
            };

            additionalNodes = [placeholder, mergeNode];
            newEdges.push(
                { id: `e-${newNodeId}-${placeholderId}`, source: newNodeId, target: placeholderId, sourceHandle: 'loop-output', data: { label: 'Do' }, type: 'custom' },
                { id: `e-${newNodeId}-${mergeNodeId}`, source: newNodeId, target: mergeNodeId, sourceHandle: 'loop-bypass', type: 'custom' },
                { id: `e-${placeholderId}-${mergeNodeId}`, source: placeholderId, target: mergeNodeId, type: 'custom' }
            );

            if (originalTargetId) {
                newEdges.push({ id: `e-${mergeNodeId}-${originalTargetId}`, source: mergeNodeId, target: originalTargetId, type: 'custom' });
            }

        } else {
            // Standard single node insertion
            if (originalTargetId) {
                newEdges.push({
                    id: `e-${newNodeId}-${originalTargetId}`,
                    source: newNodeId,
                    target: originalTargetId,
                    type: 'custom'
                });
            }
        }

        let updatedEdges = edges.filter(e => e.id !== activeEdgeId).concat(newEdges);
        let updatedNodes = [...nodes, newNode, ...additionalNodes];

        // Cleanup: If we were replacing a placeholder, remove it and its dangling edges
        if (isPlaceholderLogicMode && selectedNodeId) {
            updatedNodes = updatedNodes.filter(n => n.id !== selectedNodeId);
            updatedEdges = updatedEdges.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId);
        }

        // Apply Layout
        const layoutedNodes = onLayout(updatedNodes, updatedEdges);

        setNodes(layoutedNodes);
        setEdges(updatedEdges);
        setAddingNodeOnEdgeId(null); // Close selector
        setSelectedNodeId(null);
    };


    // --- Tree Layout Algorithm (Expanded for Diamonds) ---
    const onLayout = useCallback((passedNodes?: Node[], passedEdges?: Edge[]) => {
        const layoutNodes = passedNodes || nodes;
        const layoutEdges = passedEdges || edges;

        return calculateLayout(layoutNodes, layoutEdges);
    }, [nodes, edges]);

    // AUTO-ADJUST VIEWPORT & CLEANUP ON CHANGE
    useEffect(() => {
        if (nodes.length > 0) {
            // 1. Safety: Remove Orphaned Edges (fixes "stuck lines")
            const activeNodeIds = new Set(nodes.map(n => n.id));
            const validEdges = edges.filter(e => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));

            if (validEdges.length !== edges.length) {
                console.log("Cleaning up orphaned edges...");
                setEdges(validEdges);
                // Return here to allow next render to process clean state
                return;
            }

            // 2. Auto-Layout/Fit View
            const timer = setTimeout(() => {
                rfInstance?.fitView({ padding: 0.2, duration: 300 });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [nodes.length, edges.length, rfInstance]);

    const handleDeleteKeyboard = useCallback((deletedNodes: Node[]) => {
        // Intercept keyboard delete and route through our logic to bridge connections
        deletedNodes.forEach(n => {
            handleDeleteNode(n.id);
        });
    }, [handleDeleteNode]);

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
                        <Button 
                            variant="default" 
                            className="bg-violet-600 hover:bg-violet-700 text-white" 
                            onClick={() => {
                                setTemplateName(automationName || "");
                                setIsPublishDialogOpen(true);
                            }}
                        >
                            <Upload className="mr-2 h-4 w-4" /> Publish
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
                                onNodesDelete={handleDeleteKeyboard} // Intercept Keyboard Delete
                                onInit={setRfInstance}
                                fitView
                                fitViewOptions={{ padding: { top: 80, right: 80, bottom: 500, left: 80 }, maxZoom: 1 }}
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
                                <MiniMap zoomable pannable inversePan />
                                <Background gap={12} size={1} />
                            </ReactFlow>
                        </ReactFlowProvider>
                    </div>

                    {selectedNodeId && selectedNode && !selectedNode.data.isPlaceholder && (
                        <RightGenericSidebar
                            key={selectedNode.id}
                            selectedNode={selectedNode}
                            nodes={nodes}
                            edges={edges}
                            onUpdateNode={handleUpdateNode}
                            onDeleteNode={handleDeleteNode}
                            onClose={() => setSelectedNodeId(null)}
                            nodeStatus={(selectedNode.data as any).status}
                            isLocked={automationStatus}
                            flowId={flowId}
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
                        edges={edges}
                        socket={socket}
                        flowId={flowId}
                        onViewRun={(run) => {
                            setViewingRun(run);
                            // Optionally close sidebar or keep it open?
                            // User said 'separate reactflow open show history'
                            // Let's keep sidebar or overlay? Overlay is better.
                        }}
                    />

                    {viewingRun && (
                        <RunHistoryViewer
                            run={viewingRun}
                            initialNodes={nodes}
                            initialEdges={edges}
                            onClose={() => setViewingRun(null)}
                            theme={theme}
                        />
                    )}



                </div>

                <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Publish as Template</DialogTitle>
                            <DialogDescription>
                                Share this automation as a template for others to use.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Template Name</Label>
                                <Input
                                    id="name"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="e.g. Daily Report Generator"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={templateDescription}
                                    onChange={(e) => setTemplateDescription(e.target.value)}
                                    placeholder="Briefly describe what this automation does..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPublishDialogOpen(false)}>Cancel</Button>
                            <Button 
                                onClick={async () => {
                                    if (!templateName.trim()) {
                                        toast.error("Template name is required");
                                        return;
                                    }
                                    setIsPublishing(true);
                                    try {
                                        // TODO: Import axios if not available, or use fetch
                                        const response = await fetch(`${API_URL}/api/templates/publish`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                name: templateName,
                                                description: templateDescription,
                                                definition: JSON.stringify({ nodes, edges }), // Ensure serialized
                                                uidefinition: JSON.stringify({ nodes, edges }), // Sending duplicate for now as requested
                                                created_at: new Date().toISOString()
                                            })
                                        });
                                        const result = await response.json();
                                        if (result.success) {
                                            toast.success("Template published successfully!");
                                            setIsPublishDialogOpen(false);
                                        } else {
                                            toast.error("Failed to publish template", { description: result.error });
                                        }
                                    } catch (error: any) {
                                        console.error("Publish error:", error);
                                        toast.error("Failed to publish template");
                                    } finally {
                                        setIsPublishing(false);
                                    }
                                }} 
                                disabled={isPublishing}
                            >
                                {isPublishing ? "Publishing..." : "Publish Template"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AutomationContext.Provider>
    );
}

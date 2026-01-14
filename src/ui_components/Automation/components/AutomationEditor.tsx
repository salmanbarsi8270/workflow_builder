import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon, RefreshCcw, HistoryIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload } from "lucide-react"
import { ReactFlow, Controls, MiniMap, Background, useNodesState, useEdgesState, addEdge, type Connection, type Node as Node, type Edge as Edge, ReactFlowProvider } from '@xyflow/react';
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
import { calculateLayout, findMergeNodeForBlock, getNodesInBlock } from '../utils/layoutEngine';
import { API_URL } from '@/ui_components/api/apiurl';



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

export type StepStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped' | 'waiting';

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

    // --- Memoized Node & Edge Types to avoid re-render warnings ---
    const nodeTypes = React.useMemo(() => ({
        custom: CustomNode,
        condition: ConditionNode,
        parallel: ParallelNode,
        loop: LoopNode,
        wait: WaitNode,
        end: EndNode,
    }), []);

    const edgeTypes = React.useMemo(() => ({
        custom: CustomEdge,
    }), []);
    const [swappingNodeId, setSwappingNodeId] = useState<string | null>(null);

    // Publish Template State
    const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [templateDescription, setTemplateDescription] = useState("");
    const [isPublishing, setIsPublishing] = useState(false);

    // --- Tree Layout Algorithm (Expanded for Diamonds) ---
    const onLayout = useCallback((passedNodes?: Node[], passedEdges?: Edge[]) => {
        const layoutNodes = passedNodes || nodes;
        const layoutEdges = passedEdges || edges;
        return calculateLayout(layoutNodes, layoutEdges);
    }, [nodes, edges]);


    // Synchronize nodes and edges when initialProps change (e.g. after fetch completes)
    useEffect(() => {
        if (initialNodes.length > 0 || initialEdges.length > 0) {
            const cleanNode = (n: any) => ({
                id: n.id,
                type: n.type,
                position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
                data: {
                    ...n.data,
                    status: undefined,
                    duration: undefined,
                    output: undefined
                },
                width: undefined, // Ignore layout measurements
                height: undefined,
                measured: undefined,
                selected: undefined,
                dragging: undefined
            });

            const currentNodesStr = JSON.stringify(nodes.map(cleanNode));
            const incomingNodesStr = JSON.stringify(initialNodes.map(cleanNode));
            
            if (currentNodesStr !== incomingNodesStr) {
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
                        return newNode;
                    });
                });
            }

            const currentEdgesStr = JSON.stringify(edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle })));
            const incomingEdgesStr = JSON.stringify(initialEdges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle })));
            
            if (currentEdgesStr !== incomingEdgesStr) {
                setEdges(initialEdges);
            }
        }
    }, [initialNodes, initialEdges, nodes, edges, setNodes, setEdges]);

    // --- Automatic Migration of Edge Handles ---
    // This ensures that stale flows (using 'parallel-output' handle for condition nodes)
    // are automatically updated to 'true'/'false' for the engine to work.
    useEffect(() => {
        if (nodes.length === 0 || edges.length === 0) return;

        let edgesChanged = false;
        const migratedEdges = edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            if (!sourceNode) return edge;

            if (sourceNode.type === 'condition' || sourceNode.type === 'parallel') {
                const branches = (sourceNode.data.params as any)?.branches || (sourceNode.data.branches as string[]) || [];
                const label = edge.data?.label as string;
                if (!label || branches.length === 0) return edge;

                let expectedHandleId = 'parallel-output';
                if (sourceNode.type === 'condition') {
                    expectedHandleId = label.toLowerCase();
                    if (expectedHandleId === 'if') expectedHandleId = 'true';
                    if (expectedHandleId === 'else') expectedHandleId = 'false';
                }

                if (edge.sourceHandle !== expectedHandleId) {
                    edgesChanged = true;
                    return { ...edge, sourceHandle: expectedHandleId };
                }
            }
            return edge;
        });

        if (edgesChanged) {
            console.log("Migrating stale edge handles...");
            setEdges(migratedEdges);
            // Persist the migration to backend
            onAutoSave?.(nodes, migratedEdges);
        }
    }, [nodes, edges, onAutoSave]); // Run when nodes/edges are set

    const handleRunClick = () => {
        setIsRunSidebarOpen(true);
    };
    
    // Store the results of the LAST run to show in Sidebar even after canvas clears
    const [lastRunResults, setLastRunResults] = useState<Record<string, StepResult>>({});

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
            const normalizeId = (id: any) => {
                const idStr = String(id);
                const triggerIds = ['webhook', 'trigger', 'schedule', 'form', 'runAgent'];
                if (triggerIds.includes(idStr)) return '1';
                return idStr;
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
                console.log("Socket update success: Run Complete");
                
                // 1. Calculate the final state including skipped steps
                let finalResults: Record<string, StepResult> = {};
                
                setResults(prev => {
                    const next = { ...prev };
                    const allNodes = nodesRef.current;

                    allNodes.forEach(node => {
                        if (node.type === 'end' || node.data.isPlaceholder) return;
                        const current = next[node.id];

                        if (!current) {
                            next[node.id] = {
                                nodeId: node.id,
                                status: 'skipped',
                                output: null,
                                duration: 0
                            };
                        } else if (current.status === 'running' || current.status === 'waiting') {
                            next[node.id] = {
                                ...current,
                                status: 'success'
                            };
                        }
                    });
                    
                    finalResults = next; // Capture for LastRun
                    return next;
                });

                // 2. Persist to LastRunResults (so sidebar keeps showing data)
                setLastRunResults(finalResults);

                // 3. Clear Canvas Status after 30 seconds (longer so user can see it)
                setTimeout(() => {
                    setResults({}); 
                }, 30000);
            };

            const handleRunWaiting = (data: any) => {
                const nodeId = normalizeId(data.nodeId);
                setResults(prev => ({
                    ...prev,
                    [nodeId]: {
                        nodeId: nodeId,
                        status: 'waiting',
                        output: data.output || null,
                        duration: data.duration || 0
                    }
                }));
            };

            const handleFlowFailed = () => {
                console.log("Socket update: Flow Failed");
                setResults(prev => {
                    const next = { ...prev };
                    const allNodes = nodesRef.current;

                    allNodes.forEach(node => {
                        if (node.type === 'end' || node.data.isPlaceholder) return;
                        const current = next[node.id];

                        if (!current) {
                            next[node.id] = {
                                nodeId: node.id,
                                status: 'skipped',
                                output: null,
                                duration: 0
                            };
                        } else if (current.status === 'running' || current.status === 'waiting') {
                            next[node.id] = {
                                ...current,
                                status: 'error'
                            };
                        }
                    });
                    return next;
                });
            };

            socket.on('step-run-start', handleStepStart);
            socket.on('step-run-finish', handleStepFinish);
            socket.on('run-waiting', handleRunWaiting);
            socket.on('run-complete', handleRunComplete);
            socket.on('flow-failed', handleFlowFailed);

            return () => {
                socket.off('step-run-start', handleStepStart);
                socket.off('step-run-finish', handleStepFinish);
                socket.off('run-waiting', handleRunWaiting);
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
        // Disable interaction for Merge Nodes
        if (node.data.isMergeNode || node.data.isMergePlaceholder) return;

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
    const safeParseBranches = useCallback((input: any): string[] => {
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
    }, []);

    // Helper: Reconcile Parallel Branches (Add/Remove placeholders based on config)
    const reconcileParallelBranches = (
        parallelNode: Node,
        rawBranches: any,
        currentNodes: Node[],
        currentEdges: Edge[]
    ) => {
        const isParallel = parallelNode.type === 'parallel';
        const isCondition = parallelNode.type === 'condition';

        if (!isParallel && !isCondition) return { nextNodes: currentNodes, nextEdges: currentEdges };

        let newBranches = safeParseBranches(rawBranches);
        if (isCondition && newBranches.length > 0) {
            let elseIfCount = 0;
            newBranches = newBranches.map((_item, index) => {
                if (index === 0) return 'If';
                if (index === newBranches.length - 1 && newBranches.length > 1) return 'Else';
                elseIfCount++;
                return `Else If ${elseIfCount}`;
            });
        }
        const parentId = parallelNode.id;
        let mergeNodeId: string | null = parallelNode.data?.mergeNodeId as string;
        let nextNodes = [...currentNodes];
        let nextEdges = [...currentEdges];

        // Find existing edges from the node.
        // We catch ALL edges so we can clean up any "ghost" lines that don't belong to a branch.
        const existingBranchEdges = nextEdges.filter(e => e.source === parentId);

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
        if (!mergeNodeId && firstBranchEdge) {
            mergeNodeId = findMergeNodeDeep(firstBranchEdge.target);
        }

        // If no merge node found, we can still add/remove branches.
        // Branches without a merge node will just be "dangling" paths.

        // 1. Identify and Sort Branch Heads
        const branchTargets = existingBranchEdges.map(e => {
            const node = nextNodes.find(n => n.id === e.target);
            return { edge: e, node };
        })
            .filter(item => item.node)
            .sort((a, b) => {
                // If Condition Node, sort by canonical order for stability in standard branches
                if (isCondition) {
                    const labelA = a.edge.data?.label || '';
                    const labelB = b.edge.data?.label || '';
                    if (labelA === 'If' && labelB !== 'If') return -1;
                    if (labelB === 'If' && labelA !== 'If') return 1;
                    if (labelA === 'Else' && labelB !== 'Else') return 1;
                    if (labelB === 'Else' && labelA !== 'Else') return -1;
                    // For Else If branches, try to respect their order on canvas via X
                }
                const diff = (a.node!.position.x - b.node!.position.x);
                if (diff !== 0) return diff;
                return a.node!.id.localeCompare(b.node!.id); // Stable fallback
            });

        const targetCount = newBranches.length;
        const oldCount = branchTargets.length;
        if (targetCount === 0 && oldCount === 0) return { nextNodes, nextEdges };

        // --- SHIFT-AWARE MATCHING ---
        // Match existing branches to new labels to preserve subtrees during middle insertion
        const pool = [...branchTargets];
        const assignedTargets: (any | null)[] = new Array(targetCount).fill(null);

        // First Pass: Match by Label
        for (let i = 0; i < targetCount; i++) {
            const name = newBranches[i];
            const targetIdx = pool.findIndex(t => t.edge.data?.label === name);
            if (targetIdx !== -1) {
                assignedTargets[i] = pool[targetIdx];
                pool.splice(targetIdx, 1);
            }
        }

        // Second Pass: Match Remaining by Index (Renames)
        // If we have unmatched branches from the pool, they might be renames.
        // We only do this if it's likely a rename (e.g., oldCount == targetCount)
        if (pool.length > 0) {
            for (let i = 0; i < targetCount; i++) {
                if (!assignedTargets[i] && pool.length > 0) {
                    assignedTargets[i] = pool.shift();
                }
            }
        }
        
        // At this point:
        // - assignedTargets[i] contains the branch that should go at index i.
        // - Any EXTRAS in the original branchTargets (that weren't assigned) should be DELETED.
        
        // 1. Remove Extraneous Branches (Orphaned ones not in assignedTargets)
        const allOriginalIds = new Set(branchTargets.map(t => t.edge.id));
        const keptIds = new Set(assignedTargets.filter(t => t).map(t => t.edge.id));
        const idsToRemove = [...allOriginalIds].filter(id => !keptIds.has(id));

        for (const edgeId of idsToRemove) {
            const toRemove = branchTargets.find(t => t.edge.id === edgeId);
            if (toRemove) {
                const { edge, node } = toRemove;
                nextEdges = nextEdges.filter(e => e.id !== edge.id);

                if (node && node.type !== 'end') {
                    // Cascade Delete: Remove all nodes in this branch
                    const branchScope = getNodesInBlock(nextNodes, nextEdges, node.id, mergeNodeId as string, false);
                    branchScope.add(node.id);

                    nextNodes = nextNodes.filter(n => n.type === 'end' || !branchScope.has(n.id));
                    nextEdges = nextEdges.filter(e => {
                        const sourceInScope = branchScope.has(e.source);
                        const targetInScope = branchScope.has(e.target);
                        if (mergeNodeId && e.target === mergeNodeId) return !sourceInScope;
                        return !sourceInScope && !targetInScope;
                    });
                }
            }
        }

        // 2. Add New Branches or Update Existing
        for (let i = 0; i < targetCount; i++) {
            const branchName = newBranches[i];
            const existing = assignedTargets[i];

            if (existing) {
                const { node, edge } = existing;
                // Update placeholder if needed
                if (node && node.data.isBranchPlaceholder && node.data.subLabel !== branchName) {
                    nextNodes = nextNodes.map(n => {
                        if (n.id === node.id) return { ...n, data: { ...n.data, subLabel: branchName } };
                        return n;
                    });
                }
                
                // Ensure correct handle
                let expectedHandleId = 'parallel-output';
                if (isCondition) {
                    const lowerLabel = branchName.toLowerCase();
                    if (lowerLabel === 'if') expectedHandleId = 'true';
                    else if (lowerLabel === 'else') expectedHandleId = 'false';
                    else expectedHandleId = lowerLabel;
                }

                if (edge.sourceHandle !== expectedHandleId || edge.data?.label !== branchName) {
                    nextEdges = nextEdges.map(e => {
                        if (e.id === edge.id) return { ...e, sourceHandle: expectedHandleId, data: { ...e.data, label: branchName } };
                        return e;
                    });
                }
                
                // If it was pointed to merge, ensure that edge exists and is clean
                if (mergeNodeId) {
                    const hasMergeEdge = nextEdges.some(e => e.source === node.id && e.target === mergeNodeId);
                    if (!hasMergeEdge && node.data.isBranchPlaceholder) {
                        nextEdges.push({
                            id: `e-${node.id}-${mergeNodeId}`,
                            source: node.id,
                            target: mergeNodeId,
                            type: 'custom'
                        });
                    }
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

                // Determine Source Handle ID based on node type and branch name
                let handleId = 'parallel-output';
                if (isCondition) {
                    const lowerId = branchName.toLowerCase();
                    if (lowerId === 'if') handleId = 'true';
                    else if (lowerId === 'else') handleId = 'false';
                    else handleId = lowerId;
                }

                // Edge: Source -> Placeholder
                nextEdges.push({
                    id: `e-${parentId}-${placeholderId}`,
                    source: parentId,
                    target: placeholderId,
                    sourceHandle: handleId,
                    data: { label: branchName }, // Add Label
                    type: 'custom'
                });

                // Edge: Placeholder -> Merge (Only if merge node exists)
                if (mergeNodeId) {
                    nextEdges.push({
                        id: `e-${placeholderId}-${mergeNodeId}`,
                        source: placeholderId,
                        target: mergeNodeId,
                        type: 'custom'
                    });
                }
            }
        }

        return { nextNodes, nextEdges, mergeNodeId, normalizedBranches: newBranches };
    };

    const handleUpdateNode = useCallback((label: string, data?: any, immediate: boolean = false) => {
        setNodes(prevNodes => {
            let currentNodes = prevNodes;
            let currentEdges = edges; // Note: using edges from outer scope, usually safe in these effects
            let structureChanged = false;

            const targetNode = currentNodes.find(n => n.id === selectedNodeId);
            if (!targetNode) return prevNodes;

            // --- Parallel/Condition Branch Reconciliation ---
            const incomingBranches = data?.params?.branches || data?.branches;

            if ((targetNode.type === 'parallel' || targetNode.type === 'loop' || targetNode.type === 'condition')) {
                const currentBranchesRaw = incomingBranches || (targetNode.data.params as any)?.branches || (targetNode.data.branches as string[]) || [];
                const branchesArr = safeParseBranches(currentBranchesRaw);

                const { nextNodes: reconciledNodes, nextEdges: reconciledEdges, mergeNodeId: recoveredMergeId, normalizedBranches } = reconcileParallelBranches(targetNode, branchesArr, currentNodes, currentEdges);
                
                if (JSON.stringify(currentNodes) !== JSON.stringify(reconciledNodes) || JSON.stringify(edges) !== JSON.stringify(reconciledEdges) || JSON.stringify(branchesArr) !== JSON.stringify(normalizedBranches)) {
                    currentNodes = reconciledNodes;
                    currentEdges = reconciledEdges;
                    structureChanged = true;
                    
                    // Persist recovered mergeNodeId if it was missing 
                    if (recoveredMergeId && !targetNode.data.mergeNodeId) {
                        data = { ...data, mergeNodeId: recoveredMergeId };
                    }
                    if (normalizedBranches && targetNode.type === 'condition') {
                        const updatedParams = { ...(data?.params || targetNode.data.params || {}), branches: normalizedBranches };
                        data = { ...data, params: updatedParams, branches: normalizedBranches };
                    }
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

            if (structureChanged) setEdges(currentEdges);

            if (immediate) {
                // Use a timeout or queue to avoid updating during render if possible, 
                // but handleUpdateNode is usually called from user events.
                onAutoSave(finalNodes, currentEdges);
            }
            return finalNodes;
        });
    }, [selectedNodeId, edges, onLayout, onAutoSave, setNodes, setEdges]);

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





        // CRITICAL FIX: Only attempt block deletion if the merge node ACTUALLY exists (for Logic Nodes)
        // (This block handles when we delete the Logic Node itself)
        const mergeNodeExists = mergeNodeId ? nodes.some(n => n.id === mergeNodeId) : false;

        if (mergeNodeId && mergeNodeExists) {
            // Block Starter Deletion: Use Graph Helper
            const scope = getNodesInBlock(nodes, edges, idToDelete, mergeNodeId);
            scope.forEach(id => nodesToRemove.add(id));
        } else if ((nodeToDelete.type === 'condition' || nodeToDelete.type === 'parallel' || nodeToDelete.type === 'loop')) {
            console.log("[Delete] Attempting dynamic block deletion for", idToDelete);
            // Fallback: Try to find the merge node dynamically if ID is missing
            const dynamicMergeId = findMergeNodeForBlock(nodes, edges, idToDelete);
            console.log("[Delete] Found dynamic merge node:", dynamicMergeId);
            if (dynamicMergeId) {
                const queue = [idToDelete];
                while (queue.length > 0) {
                    const currentId = queue.shift()!;
                    if (currentId !== idToDelete && nodesToRemove.has(currentId)) continue;
                    nodesToRemove.add(currentId);

                    if (currentId === dynamicMergeId) continue;

                    const children = edges.filter(e => e.source === currentId).map(e => e.target);
                    children.forEach(childId => {
                        if (!nodesToRemove.has(childId)) queue.push(childId);
                    });
                }
                console.log("[Delete] Nodes to remove (Block):", Array.from(nodesToRemove));
            } else {
                console.warn("[Delete] Could not find merge node for block", idToDelete);
            }
        }

        const incomingEdges = edges.filter(e => e.target === idToDelete);
        const outgoingEdges = edges.filter(e => e.source === (mergeNodeId || idToDelete));

        // 3. Strategy: Reset or Remove
        const isStartNode = idToDelete === '1';
        const isLogicNode = (nodeToDelete.type === 'condition' || nodeToDelete.type === 'parallel' || nodeToDelete.type === 'loop');
        const isPopulatedMerge = (nodeToDelete.data?.isMergeNode || incomingEdges.length > 1) && !nodeToDelete.data.isPlaceholder && !isLogicNode;
        // FIX: Removed isPopulatedLinear check. We WANT to delete linear nodes, not reset them.
        // const isPopulatedLinear = !mergeNodeId && incomingEdges.length <= 1 && outgoingEdges.length <= 1 && !nodeToDelete.data.isPlaceholder;

        // Strategy: Soft Delete (Reset to Placeholder) vs Hard Delete (Remove & Bridge)
        // Soft Delete: Start Node, Populated Merge Nodes, and Standard Actions (User wants "swap to placeholder")
        // Hard Delete: Logic Blocks (Heads) and existing Placeholders
        const shouldSoftDelete = isStartNode || isPopulatedMerge || (!isLogicNode && !nodeToDelete.data.isPlaceholder);

        if (shouldSoftDelete) {
            // "RESET" to Placeholder: Strictly clean data to ensure "Complete Deletion" of settings
            nextNodes = nextNodes.map(n => {
                if (n.id === idToDelete) {
                    // Preserve only structural flags
                    const { mergeNodeId, isMergeNode, isMergePlaceholder } = n.data;
                    return {
                        ...n,
                        data: {
                            // Re-apply structural flags if they existed (though usually Start Node has none)
                            ...(mergeNodeId ? { mergeNodeId } : {}),
                            ...(isMergeNode ? { isMergeNode } : {}),
                            ...(isMergePlaceholder ? { isMergePlaceholder } : {}),

                            label: isStartNode ? 'Select Trigger' : 'Add Step',
                            subLabel: isPopulatedMerge ? 'Merge' : 'Configure this step', // Default placeholder subLabel
                            isPlaceholder: true,
                            // Ensure no other data persists
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
        console.log("[Delete] True Delete. Removing:", Array.from(nodesToRemove));
        // Remove nodes and edges in scope
        nextNodes = nextNodes.filter(n => !nodesToRemove.has(n.id));
        nextEdges = nextEdges.filter(e => !nodesToRemove.has(e.source) && !nodesToRemove.has(e.target));

        // Create bridge edges
        // Create bridge edges OR Placeholder Replacement
        if (incomingEdges.length > 0 && outgoingEdges.length > 0) {
            // Standard Bridging (Directly connect Parents to Followers)
            // This prevents "Ghost Placeholders" from appearing when deleting logic blocks
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

        // Handle "Empty Branch" restoration - Restored based on user requirement: "delete means swap to old placeholder"
        // But if we delete a PLACEHOLDER, we want it to go to "Initial Custom + Node" (Empty Edge).
        // So only restore if we deleted a REAL node.
        if (!nodeToDelete.data.isPlaceholder) {
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
        }

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
                branches: isCondition ? ['If', 'Else'] : isParallel ? ['Branch 1', 'Branch 2'] : undefined
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

        if (isCondition || isParallel) {
            const branches = (newNode.data.branches as string[]) || (isCondition ? ['if', 'else'] : ['Branch 1', 'Branch 2']);
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

                // Determine Handle ID
                let handleId = 'parallel-output';
                if (isCondition) {
                    const lowerBranch = branchName.toLowerCase();
                    if (lowerBranch === 'if') handleId = 'true';
                    else if (lowerBranch === 'else') handleId = 'false';
                    else handleId = branchName.toLowerCase();
                }

                newEdges.push(
                    { id: `e-${newNodeId}-${placeholderId}`, source: newNodeId, target: placeholderId, sourceHandle: handleId, data: { label: branchName }, type: 'custom' },
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



    // AUTO-ADJUST VIEWPORT & CLEANUP ON CHANGE
    useEffect(() => {
        if (nodes.length > 0) {
            // 1. Safety: Remove Orphaned Edges (fixes "stuck lines")
            const activeNodeIds = new Set(nodes.map(n => n.id));
            const validEdges = edges.filter(e => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));

            // 2. Structural Integrity: Ensure logic branches converge & use correct handles
            let structureFixed = false;
            let nextEdges = [...validEdges];
            let nextNodes = [...nodes];

            nodes.forEach(node => {
                const isLogic = node.type === 'condition' || node.type === 'parallel';
                if (isLogic) {
                    const branches = safeParseBranches((node.data.params as any)?.branches || node.data.branches || (node.type === 'condition' ? ['If', 'Else'] : []));
                    if (branches.length > 0) {
                        const { nextNodes: rNodes, nextEdges: rEdges, mergeNodeId: recoveredId, normalizedBranches } = reconcileParallelBranches(node, branches, nextNodes, nextEdges);
                        
                        if (JSON.stringify(nextEdges) !== JSON.stringify(rEdges) || (recoveredId && !node.data.mergeNodeId) || (normalizedBranches && JSON.stringify(branches.map((b: string) => b.toLowerCase())) !== JSON.stringify(normalizedBranches.map((b: string) => b.toLowerCase())))) {
                             nextEdges = rEdges;
                             nextNodes = rNodes.map(n => {
                                 if (n.id === node.id) {
                                     let updatedNode = { ...n };
                                     if (recoveredId) updatedNode.data = { ...updatedNode.data, mergeNodeId: recoveredId };
                                     if (normalizedBranches) {
                                         const updatedParams = { ...(updatedNode.data.params || {}), branches: normalizedBranches };
                                         updatedNode.data = { ...updatedNode.data, params: updatedParams, branches: normalizedBranches };
                                     }
                                     return updatedNode;
                                 }
                                 return n;
                             });
                             structureFixed = true;
                        }
                    }
                }
            });

            if (structureFixed) {
                setNodes(onLayout(nextNodes, nextEdges));
                setEdges(nextEdges);
                return;
            }

            // 3. Auto-Layout/Fit View
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
 
            <div className="flex flex-col h-[calc(100vh-8rem)] bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <div className="flex items-center justify-between mb-4 px-1 mt-4">
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
                        <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-white/10 dark:hover:bg-white/5" onClick={handleRunClick}>
                            <HistoryIcon className="mr-2 h-4 w-4" /> Runs
                        </Button>
                        <Button
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
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

                <div className="flex flex-1 border rounded-lg overflow-hidden bg-background relative bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
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
                                nodesConnectable={false}
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
                            isLocked={false}
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
                        flowId={flowId}
                        results={Object.keys(results).length > 0 ? results : lastRunResults}
                        onViewRun={(run) => {
                            setViewingRun(run);
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

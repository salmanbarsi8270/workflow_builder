import { type Node, type Edge, Position } from '@xyflow/react';

const NODE_HEIGHT = 100;
const NODE_WIDTH = 280;
const NODE_GAP_Y = 100; 
const NODE_GAP_X = 60; 

/**
 * Calculates the auto-layout for the workflow graph.
 * Uses a tree-based layout algorithm with special handling for:
 * - Merge Nodes (converging branches)
 * - Loop Bypasses (visual routing around loops)
 * - Dynamic Branch Sorting
 */


/**
 * Helper to find the "closing" merge node for a block (Logic Node).
 * Useful for deletion logic to identify the scope of a block.
 */
export const findMergeNodeForBlock = (nodes: Node[], edges: Edge[], startNodeId: string): string | undefined => {
    const node = nodes.find(n => n.id === startNodeId);
    if (node?.data?.mergeNodeId) return node.data.mergeNodeId as string;

    // Build Adjacency
    const adjacency: Record<string, string[]> = {};
    edges.forEach(e => {
        if (!adjacency[e.source]) adjacency[e.source] = [];
        adjacency[e.source].push(e.target);
    });

    const isLogicNode = (id: string) => {
        const n = nodes.find(x => x.id === id);
        return n && (n.type === 'condition' || n.type === 'parallel' || n.type === 'loop');
    };
    
    const isMergeNode = (id: string) => {
        const n = nodes.find(x => x.id === id);
        return n && (n.data?.isMergePlaceholder || n.data?.isMergeNode);
    }

    // DFS with Depth Tracking
    // We only need ONE valid path to the merge node.
    // We assume the graph is structured such that all paths converge.
    
    // Stack: { id, currentDepth }
    // However, depth is path-dependent. 
    // We just walk ONE PATH.
    // If we hit a dead end, backtrack?
    // A simple DFS works.
    
    const stack = [{ id: startNodeId, depth: 0 }];
    const visited = new Set<string>();
    
    // Safety limit
    let iterations = 0;
    
    while(stack.length > 0 && iterations < 1000) {
        iterations++;
        const { id, depth } = stack.pop()!;
        
        let newDepth = depth;
        // Logic Node -> Increment Nesting
        // (But checking StartNode itself: When we START, depth is 0. 
        // processing StartNode makes it 1.
        // processing Closer makes it 0. -> Return CLOSER.
        
        // Wait, if we pop 'startNode' (depth 0).
        // It IS logic. newDepth = 1.
        // Push children with depth 1.
        // Pop child.
        // If child is merge -> newDepth = 0. Found! matches.
        
        if (isLogicNode(id)) newDepth++;
        if (isMergeNode(id)) newDepth--;
        
        // Check finding condition:
        // If we found a merge node AND it brought us back to initial level (or below if start was included)
        // Actually, start node increases depth.
        // So we are looking for the node that brings balance back to 0.
        // But we incremented at Start.
        // So balance 0 is correct.
        
        if (newDepth === 0 && isMergeNode(id)) {
            // Found it!
            return id;
        }
        
        // If depth drops below 0? partial graph? ignore.
        if (newDepth < 0) continue; 
        
        if (visited.has(id)) continue; 
        visited.add(id);

        const children = adjacency[id] || [];
        // DFS: Push children
        // We push reversed to traverse first child first? Doesn't matter.
        children.forEach(child => {
            stack.push({ id: child, depth: newDepth });
        });
        
        // Optional optimization: If we found a path, break?
        // But we returned above.
    }

    return undefined;
};

/**
 * Calculates the set of Node IDs that belong to a Logic Block.
 * Includes: The Start Node, The Merge Node, and ALL nodes in between (Branches).
 * Stops traversing downstream when the Merge Node is reached.
 */
export const getNodesInBlock = (nodes: Node[], edges: Edge[], startNodeId: string, mergeNodeId: string, includeMergeNode: boolean = true): Set<string> => {
    const nodesToRemove = new Set<string>();
    nodesToRemove.add(startNodeId);
    
    // If the merge node exists and we requested to include it, add it
    if (includeMergeNode && nodes.some(n => n.id === mergeNodeId)) {
        nodesToRemove.add(mergeNodeId);
    }

    const queue = [startNodeId];
    const visited = new Set<string>([startNodeId]);

    // Safety
    let iterations = 0;

    while (queue.length > 0 && iterations < 5000) {
        iterations++;
        const currentId = queue.shift()!;

        // If this is the merge node, we DO NOT traverse its children (that would go outside the block)
        if (currentId === mergeNodeId) continue;

        // Find outgoing edges
        const children = edges.filter(e => e.source === currentId).map(e => e.target);
        
        children.forEach(childId => {
            if (!visited.has(childId)) {
                visited.add(childId);
                nodesToRemove.add(childId);
                queue.push(childId);
            }
        });
    }

    return nodesToRemove;
};
export const findBlockStarter = (nodes: Node[], edges: Edge[], mergeNodeId: string): string | undefined => {
    // Reverse Adjacency (Target -> Source)
    const reverseAdjacency: Record<string, string[]> = {};
    edges.forEach(e => {
        if (!reverseAdjacency[e.target]) reverseAdjacency[e.target] = [];
        reverseAdjacency[e.target].push(e.source);
    });

    const isLogicNode = (id: string) => {
        const n = nodes.find(x => x.id === id);
        return n && (n.type === 'condition' || n.type === 'parallel' || n.type === 'loop');
    };
    
    const isMergeNode = (id: string) => {
        const n = nodes.find(x => x.id === id);
        // We consider it a merge if it is marked as one (layout) or placeholder
        return n && (n.data?.isMergePlaceholder || n.data?.isMergeNode);
    }

    let balance = 0; 
    const visited = new Set<string>();
    visited.add(mergeNodeId);

    const parents = reverseAdjacency[mergeNodeId];
    // Start from the parent of the merge node
    // Note: Merge node might have multiple parents. Any path upwards should lead to the Logic Node.
    let ptr = parents && parents.length > 0 ? parents[0] : null;
    
    let safety = 0;
    while (ptr && safety < 1000) {
        safety++;
        if (visited.has(ptr)) break; 
        visited.add(ptr);
        
        if (isMergeNode(ptr)) {
            balance++;
        } else if (isLogicNode(ptr)) {
            balance--;
        }

        if (balance < 0) return ptr;

        const nextParents = reverseAdjacency[ptr];
        if (nextParents && nextParents.length > 0) {
            ptr = nextParents[0];
        } else {
            ptr = null; // Dead end
        }
    }

    return undefined;
}


export const calculateLayout = (nodes: Node[], edges: Edge[]): Node[] => {
    if (nodes.length === 0) return nodes;

    const layoutNodes = [...nodes];
    const layoutEdges = [...edges];

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
        // ONLY add to adjacency if it's NOT a merge node.
        // (Merge Nodes are "Roots" of their own fragments in the CUT graph)
        if (adjacency[e.source] && !mergeNodeIds.has(e.target)) {
            adjacency[e.source].push(e.target);
        }
        
        if (!mergeNodeIds.has(e.target)) {
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

            // Priority 1: Handle Type (True Left, False Right)
            const getSortIndex = (h: string | null | undefined) => {
                if (h === 'true') return -1;
                if (h === 'false') return 9999;
                return 0;
            };

            const scoreA = getSortIndex(handleA);
            const scoreB = getSortIndex(handleB);

            if (scoreA !== scoreB) return scoreA - scoreB;

            // Priority 2: Parallel Branch Order
            // If it's a Parallel Node, we trust the 'branches' array order over X position
            // because new nodes might have unsynced X positions (e.g. 0 or default), causing them to jump to the left.
            const sourceNode = layoutNodes.find(n => n.id === nodeId);
            if (sourceNode?.type === 'parallel' || sourceNode?.type === 'loop') {
                if (sourceNode.type === 'loop') {
                    if (edgeA?.target === edgeB?.target) return 0; // Pointing to same?
                    // We want Body branch to the LEFT (or center) and Merge branch to the RIGHT?
                    // Actually, for Loop, we can just rely on default order or force it.
                    return 0;
                }
                const branches = (sourceNode.data.params as any)?.branches || (sourceNode.data.branches as string[]) || [];
                const labelA = edgeA?.data?.label;
                const labelB = edgeB?.data?.label;

                const indexA = branches.indexOf(labelA);
                const indexB = branches.indexOf(labelB);

                if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB;
                }
            }

            // Priority 3: Tie-breaker using X position (Standard)
            const nodeA = layoutNodes.find(n => n.id === a);
            const nodeB = layoutNodes.find(n => n.id === b);
            return (nodeA?.position.x || 0) - (nodeB?.position.x || 0);
        });
    });

    // 3. Find Roots (nodes with no parents in the CUT DAG)
    // This will include regular start nodes AND the Merge Nodes
    const layoutRoots = layoutNodes.filter(n => !reverseAdjacency[n.id]);

    // 3.5. Calculate Loop Nesting Depths (for Dynamic Padding)
    // We need to know how deep a loop is to reserve extra padding.
    const loopNestDepths: Record<string, number> = {};

    const getMaxLoopDepth = (nodeId: string, visited: Set<string>): number => {
        if (visited.has(nodeId)) return 0;
        visited.add(nodeId);

        // STOP recursion at Merge Nodes for Depth Calculation too (Safety)
        if (mergeNodeIds.has(nodeId) && visited.size > 1) return 0;

        const children = adjacency[nodeId] || [];
        let maxChildDepth = 0;

        children.forEach(childId => {
            const d = getMaxLoopDepth(childId, new Set(visited));
            if (d > maxChildDepth) maxChildDepth = d;
        });

        const node = layoutNodes.find(n => n.id === nodeId);
        if (node?.type === 'loop') {
            const depth = maxChildDepth + 1;
            loopNestDepths[nodeId] = depth;
            return depth;
        }
        return maxChildDepth;
    };

    // Run Depth Calc from Roots
    layoutRoots.forEach(root => getMaxLoopDepth(root.id, new Set()));

    // 4. Recursive Position Calculation (Standard Tree)
    const positions: Record<string, { x: number, y: number }> = {};

    // Helper: partial traversal to find the "closing" merge node for a block
    const getClosestMergeNode = (nodeId: string): string | undefined => {
        const node = layoutNodes.find(n => n.id === nodeId);
        // Optimized: Use explicit mergeNodeId if provided by the editor
        if (node?.data?.mergeNodeId) return node.data.mergeNodeId as string;

        const children = adjacency[nodeId] || [];
        if (children.length === 0) return undefined;
        
        // Fallback to BFS for legacy/unstructured graphs
        const queue0 = [children[0]];
        const visited0 = new Set<string>();
        const potentialClosers = layoutNodes.filter(n => n.data?.isMergePlaceholder).map(n => n.id);
        
        while(queue0.length > 0){
             const current = queue0.shift()!;
             if(visited0.has(current)) continue;
             visited0.add(current);
             
             if (potentialClosers.includes(current)) return current;
             
             const outgoing = layoutEdges.filter(e => e.source === current).map(e => e.target);
             outgoing.forEach(n => queue0.push(n));
        }

        return undefined;
    };

    const getEffectiveBranches = (nodeId: string): (string | null)[] => {
        const node = layoutNodes.find(n => n.id === nodeId);
        if (!node) return [];

        const outgoing = layoutEdges.filter(e => e.source === nodeId);
        
        if (node.type === 'condition') {
             // Expect True/False
             const trueEdge = outgoing.find(e => e.sourceHandle === 'true' || e.data?.label === 'true');
             const falseEdge = outgoing.find(e => e.sourceHandle === 'false' || e.data?.label === 'false');
             
             // If connection exists (even to Merge), it counts as a branch.
             // If no connection, we generally don't reserve big space, but standard condition implies 2 paths.
             // Let's rely on CONNECTED branches.
             const branches: (string|null)[] = [];
             if (trueEdge) branches.push(trueEdge.target);
             if (falseEdge) branches.push(falseEdge.target);
             
             // Fix for "Single Branch" condition (rare but possible):
             // If only one exists, we might want to still center? 
             // But layout collapse usually happens when both exist but one is "invisible".
             return branches;
        }
        
        if (node.type === 'parallel') {
             // Use edge counting or params?
             // Best to use Edges to match topology.
             // Group by handle?
             // Parallel outgoing usually have unique handles or just mapped.
             return outgoing.map(e => e.target);
        }
        
        return adjacency[nodeId] || []; // Default linear
    };

    const getSubtreeWidth = (nodeId: string, d: number, visited: Set<string> = new Set()): number => {
        if (visited.has(nodeId)) return NODE_WIDTH + NODE_GAP_X;
        visited.add(nodeId);

        const node = layoutNodes.find(n => n.id === nodeId);
        const children = adjacency[nodeId] || [];
        
        const isLoop = node?.type === 'loop';
        const isParallel = node?.type === 'parallel';
        const isCondition = node?.type === 'condition';

        // Base case: Leaf node (visually)
        // If Logic Node has NO outgoing edges at all -> leaf.
        // If it has edges to Merges -> Not leaf in width sense.
        const effectiveBranches = (isParallel || isCondition) ? getEffectiveBranches(nodeId) : children;
        
        if (effectiveBranches.length === 0) {
             const depth = loopNestDepths[nodeId] || 1;
             const LOOP_PADDING = 80 + (depth * 40);
             return NODE_WIDTH + NODE_GAP_X + (isLoop ? LOOP_PADDING : 0);
        }

        // --- Recursive Width Calculation ---
        let width = 0;

        if (isParallel || isCondition) {
             // For logic blocks, we sum the widths of individual branches.
             // This allows for variable width branches (e.g., one wide, one narrow).
             effectiveBranches.forEach(targetId => {
                 if (!targetId || mergeNodeIds.has(targetId)) {
                     // Empty/Merge Branch Width (minimum space for a connection)
                     width += (NODE_WIDTH + NODE_GAP_X);
                 } else {
                     // Real Branch
                     const bw = getSubtreeWidth(targetId, d + 1, new Set(visited));
                     width += bw;
                 }
             });
        } else {
             // Standard Linear path or Loop
             children.forEach(childId => {
                 width += getSubtreeWidth(childId, d + 1, new Set(visited));
             });
             
             if (isLoop) {
                 const depth = loopNestDepths[nodeId] || 1;
                 const LOOP_PADDING = 80 + (depth * 40);
                 width += LOOP_PADDING;
             }
        }

        const mergeId = getClosestMergeNode(nodeId);
        let tailWidth = 0;
        if (mergeId) {
            tailWidth = getSubtreeWidth(mergeId, 0, new Set(visited));
        }

        return Math.max(width, tailWidth);
    };

    const setPositions = (nodeId: string, d: number, startX: number, visited: Set<string> = new Set()) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const node = layoutNodes.find(n => n.id === nodeId);
        const isEndNode = node?.type === 'end';
        // Reduced gap for End Node (40px reduction = 60px visual gap, enough for button)
        const y = d * (NODE_HEIGHT + NODE_GAP_Y) - (isEndNode ? 40 : 0);
        
        // STOP RECURSION at Merge Nodes
        if (mergeNodeIds.has(nodeId) && d > 0) return;

        const isLoop = node?.type === 'loop';
        const isParallel = node?.type === 'parallel';
        const isCondition = node?.type === 'condition';

        const effectiveBranches = (isParallel || isCondition) ? getEffectiveBranches(nodeId) : (adjacency[nodeId] || []);

        if (effectiveBranches.length === 0) {
            const totalWidth = getSubtreeWidth(nodeId, d);
            positions[nodeId] = { x: startX + (totalWidth / 2) - (NODE_WIDTH / 2), y };
            return;
        }

        // Child Positioning Cursor
        const depth = loopNestDepths[nodeId] || 1;
        const LOOP_PADDING = 80 + (depth * 40);
        let childCursorX = startX + (isLoop ? (LOOP_PADDING / 2) : 0);

        // Branch Width Calculation (match getSubtreeWidth logic - Variable Width)
        // No pre-calculation needed, we just iterate and consume ACTUAL width

        effectiveBranches.forEach(targetId => {
            const w = getSubtreeWidth(targetId!, d + 1, new Set(visited));
            
            // If Target is a Node (not Merge), set its position
            if (targetId && !mergeNodeIds.has(targetId)) {
                setPositions(targetId, d + 1, childCursorX, new Set(visited));
            }
            // If target is Merge or Null (Empty), we just skip setting position but consume space
            
            childCursorX += w;
        });

        // Center parent
        const totalWidth = getSubtreeWidth(nodeId, d);
        const centerX = startX + (totalWidth / 2);
        positions[nodeId] = { x: centerX - (NODE_WIDTH / 2), y };
    };
    
    // Run Layout for all detached trees
    // Roots that are Merge Nodes likely start at X=0, we will move them later
    let rootCursorX = 0;
    layoutRoots.forEach(root => {
        const treeWidth = getSubtreeWidth(root.id, 0, new Set());
        setPositions(root.id, 0, rootCursorX, new Set());
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
            // Align Node with "Merge Bus" High (maxY + 120 = Bottom + 20px gap)
            const targetY = maxY + 120;

            const currentIs = positions[mergeId];
            const dx = targetX - currentIs.x;
            const dy = targetY - currentIs.y;

            shiftSubtree(mergeId, dx, dy);
        }
    });


    // 5.5. CALCULATE LOOP BYPASS OFFSETS
    // Ensure bypass line clears the widest part of the loop body (min X of subtree)
    // 5.5. CALCULATE LOOP BYPASS OFFSETS (Recursive for Nesting)
    const loopBypassOffsets: Record<string, number> = {};

    // Helper to solve bypass X recursively (Memoized)
    const solveBypassX = (loopId: string, visitedStack: Set<string> = new Set()): number => {
        if (loopBypassOffsets[loopId] !== undefined) return loopBypassOffsets[loopId];
        if (visitedStack.has(loopId)) return positions[loopId]?.x - 50; // Cycle safety

        visitedStack.add(loopId);
        const loopNode = layoutNodes.find(n => n.id === loopId);
        if (!loopNode || !positions[loopId]) return 0;

        let contentMinX = positions[loopId].x;

        // Identify Exit Node to scope the traversal
        const bypassEdge = layoutEdges.find(e => e.source === loopId && e.sourceHandle === 'loop-bypass');
        const exitMergeId = bypassEdge?.target;

        // BFS Traversal of the Body
        const queue = [loopId];
        const visited = new Set<string>();
        const childLoops: string[] = [];

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            if (visited.has(currentId)) continue;
            visited.add(currentId);

            const pos = positions[currentId];
            if (pos && pos.x < contentMinX) contentMinX = pos.x;

            // Collect nested loops to enforce hierarchy
            // (Skip self)
            const node = layoutNodes.find(n => n.id === currentId);
            if (currentId !== loopId && node?.type === 'loop') {
                childLoops.push(currentId);
            }

            // Follow Outgoing Edges
            const childrenIds = layoutEdges
                .filter(e => e.source === currentId)
                .map(e => e.target);

            childrenIds.forEach(childId => {
                if (childId === exitMergeId) return; // Stop at Exit
                if (!visited.has(childId)) queue.push(childId);
            });
        }

        // Calculate Base X based on content
        let calculatedX = contentMinX;

        // Push out if we have nested loops (Recursive Step)
        // Outer Loop line must be to the left of Inner Loop line
        childLoops.forEach(childLoopId => {
            const childBypassX = solveBypassX(childLoopId, new Set(visitedStack));
            if (childBypassX < calculatedX) {
                calculatedX = childBypassX;
            }
        });

        // Final Result: Padding from the leftist element found (content or child line)
        const result = calculatedX - 40; // 40px padding per nesting level
        loopBypassOffsets[loopId] = result;
        return result;
    };

    // Trigger calculation for all loops
    layoutNodes.forEach(n => {
        if (n.type === 'loop') {
            solveBypassX(n.id);
        }
    });


    // 6. Apply Positions
    const finalNodes = layoutNodes.map(n => {
        const pos = positions[n.id];
        if (!pos) return n;

        // Mark Merge Nodes so Edges can handle symmetry
        const isMerge = mergeNodeIds.has(n.id);
        const bypassX = loopBypassOffsets[n.id]; // Inject calculated bypass X

        return {
            ...n,
            position: { x: pos.x, y: pos.y + 70 }, // Increased from 50 to 70 for more breathing room
            data: { ...n.data, isMergeNode: isMerge, bypassX: bypassX },
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom
        };
    });

    return finalNodes;
};

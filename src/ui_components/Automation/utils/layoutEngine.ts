import { type Node, type Edge, Position } from '@xyflow/react';

const NODE_HEIGHT = 100;
const NODE_WIDTH = 280;
const NODE_GAP_Y = 100;
const NODE_GAP_X = 100; // Increased to prevent connection overlap

/**
 * Calculates the auto-layout for the workflow graph.
 * Uses a tree-based layout algorithm with special handling for:
 * - Merge Nodes (converging branches)
 * - Loop Bypasses (visual routing around loops)
 * - Dynamic Branch Sorting
 */
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
        // ALWAYS add to adjacency so we can sort/position branches correctly (Visual Children)
        if (adjacency[e.source]) {
            adjacency[e.source].push(e.target);
        }
        
        // But only treat as a Layout Parent if it's NOT a merge node
        // (Merge Nodes are "Roots" of their own fragments)
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
    const getClosestMergeNode = (nodeId: string): string | null => {
        const node = layoutNodes.find(n => n.id === nodeId);
        // 0. Explicit Link (Robust)
        if (node?.data?.mergeNodeId) {
            return node.data.mergeNodeId as string;
        }

        // Look at direct outgoing edges
        const children = layoutEdges.filter(e => e.source === nodeId).map(e => e.target);
        if (children.length === 0) return null;

        // If only 1 child? (Shouldn't happen for logic blocks, but if so, naive BFS is fine)
        if (children.length === 1) {
            // ... (Same traversal as before for single path)
             const queue = [...children];
             const visited = new Set<string>(queue);
             while (queue.length > 0) {
                 const current = queue.shift()!;
                 if (mergeNodeIds.has(current)) return current;
                 const outgoing = layoutEdges.filter(e => e.source === current);
                 outgoing.forEach(e => {
                     if (!visited.has(e.target)) {
                         visited.add(e.target);
                         queue.push(e.target);
                     }
                 });
             }
             return null;
        }

        // 1. Finding Reachable Merges for EACH branch
        const branchMergeMap: Set<string>[] = children.map(childStart => {
            const reachableMerges = new Set<string>();
            const queue = [childStart];
            const visited = new Set<string>();
            
            while (queue.length > 0) {
                const current = queue.shift()!;
                if (visited.has(current)) continue;
                visited.add(current);

                if (mergeNodeIds.has(current)) {
                    reachableMerges.add(current);
                    // Don't stop? We might need to find deeper common ones? 
                    // Actually, usually the first common one is the closer.
                    // But if we have nested, we might pass through one.
                    // Let's continue traversal to find ALL downstream merges.
                }

                const outgoing = layoutEdges.filter(e => e.source === current).map(e => e.target);
                outgoing.forEach(next => queue.push(next));
            }
            return reachableMerges;
        });

        // 2. Find Intersection (Common Merges)
        if (branchMergeMap.length === 0) return null;
        
        // Start with Set 0
        const potentialClosers = Array.from(branchMergeMap[0]).filter(mId => {
            // It must be present in ALL other sets
            return branchMergeMap.every(set => set.has(mId));
        });

        if (potentialClosers.length === 0) return null;

        // 3. Select the "Shallowness" / First one (Topological?)
        // The closer is the one closest to the start.
        // We can sort potentialClosers by their topological index or simply pick one.
        // In our DAG, generally the first one we encountered in BFS is the shallowest.
        // But since we did full traversal, we just have a list.
        
        // Let's rely on Valid Parents heuristic:
        // The true closing merge node is usually the first one that is common.
        // Let's pick the one with the smallest Y? No, positions not calculated.
        // Let's pick the one that has valid paths from all branches. 
        // We already did that.
        
        // Return the first one provided by the first branch's BFS order?
        // (Assuming BFS order in Set initialization was preserved? No Set iteration order is reliable-ish but let's be safe).
        // Let's re-verify topological order if possible, or just take the first.
        // In a structured block, there is usually only ONE immediate enclosing merge.
        // Deeper common merges are merges of the Parent's Parent.
        
        // Since we want the Immediate Closer, we want the one that is "closest".
        // A simple distance check or just picking the first one found by Branch 0's BFS (if we kept order) works.
        // Re-run simple BFS on Branch 0 to find the first match from potentialClosers
        
        const queue0 = [children[0]];
        const visited0 = new Set<string>();
        while(queue0.length > 0){
             const current = queue0.shift()!;
             if(visited0.has(current)) continue;
             visited0.add(current);
             
             if (potentialClosers.includes(current)) return current;
             
             const outgoing = layoutEdges.filter(e => e.source === current).map(e => e.target);
             outgoing.forEach(n => queue0.push(n));
        }

        return potentialClosers[0]; // Fallback
    };

    const getSubtreeWidth = (nodeId: string, d: number): number => {
        const children = adjacency[nodeId] || [];
        const node = layoutNodes.find(n => n.id === nodeId);
        const isLoop = node?.type === 'loop';

        // DYNAMIC PADDING: Base 80 + (Depth * 40)
        const depth = loopNestDepths[nodeId] || 1;
        const LOOP_PADDING = 80 + (depth * 40);

        // STOP RECURSION at Merge Nodes (They are leaves for the Top Tree)
        if (mergeNodeIds.has(nodeId) && d > 0) {
             // It's a "Stub" in this tree. Reserve standard width.
             return NODE_WIDTH + NODE_GAP_X;
        }

        // Calculate Merge Subtree Width (if this node starts a block that closes at a merge)
        let mergeWidth = 0;
        // Optimization: Only check for "Block Starters" that might have a merge
        if (children.length > 0 || isLoop) {
             const mergeId = getClosestMergeNode(nodeId);
             if (mergeId) {
                 // Calculate width of the merge tree (starting from d + 1 effectively, but it's relative)
                 // We pass 'd' just for recursion depth if needed, but width is width.
                 // CRITICAL: We DO NOT recurse `getSubtreeWidth` on mergeId here?
                 // No, mergeWidth usually determines the MINIMUM width of the block.
                 // But wait, if we are now treating Merge Links as children, they contribute to `width`.
                 // So `width` (sum of branches) should strictly be >= mergeWidth usually.
                 // `mergeWidth` is mostly relevant for calculating the Merge Node's Own Children width,
                 // to ensure the branches don't overlap with the Merge's future children?
                 // Let's keep it but ensure recursion safety.
                 mergeWidth = getSubtreeWidth(mergeId, 0); // Reset depth?
             }
        }

        if (children.length === 0) {
             const baseWidth = NODE_WIDTH + NODE_GAP_X + (isLoop ? LOOP_PADDING : 0);
             return Math.max(baseWidth, mergeWidth);
        }

        let width = 0;
        children.forEach(childId => width += getSubtreeWidth(childId, d + 1));

        if (isLoop) width += LOOP_PADDING;

        // The effective width is the Max of the Branches and the Continuation
        return Math.max(width, mergeWidth);
    };

    const setPositions = (nodeId: string, d: number, startX: number) => {
        const children = adjacency[nodeId] || [];
        const y = d * (NODE_HEIGHT + NODE_GAP_Y);

        const node = layoutNodes.find(n => n.id === nodeId);
        const isLoop = node?.type === 'loop';
        const depth = loopNestDepths[nodeId] || 1;
        const LOOP_PADDING = 80 + (depth * 40);

        // STOP RECURSION at Merge Nodes
        if (mergeNodeIds.has(nodeId) && d > 0) {
             // We DO NOT set positions for Merge Nodes here (handled in Stitching Pass).
             // But we consumed space in the parent's layout, which is correct.
             return;
        }

        if (children.length === 0) {
            // Fix: Center the node within its allocated subtree width
            const totalWidth = getSubtreeWidth(nodeId, d);
            // ReactFlow Position is Top-Left. 
            positions[nodeId] = { x: startX + (totalWidth / 2) - (NODE_WIDTH / 2), y };
            return;
        }

        // If Loop, shift children to the right by half padding (Left Gutter)
        let childCursorX = startX + (isLoop ? (LOOP_PADDING / 2) : 0);

        children.forEach(childId => {
            const w = getSubtreeWidth(childId, d + 1);
            setPositions(childId, d + 1, childCursorX);
            childCursorX += w;
        });

        // Center parent
        if (children.length > 0) {
            // We need to find the "Center of the Branches"
            // Start of First Child (Visual) is `startX + loopPadding`.
            // End of Last Child (Visual) is `childCursorX`.
            // Average?
            // Wait, `startX` is the left-most edge allocated to us.
            // `childCursorX` is the right-most edge used.
            // Center = (startX + childCursorX) / 2 ?
            // Yes, roughly. But children might be loops with padding.
            // Let's use the actual assigned X of children?
            // But some children (Merges) don't have assigned X yet!
            // So relying on `positions[child]` is unsafe if child is Merge.
            
            // Better to center based on the allocated SPAN.
            // Span Center = startX + (TotalWidth / 2).
            // This is robust.
            
            const totalWidth = getSubtreeWidth(nodeId, d);
            const centerX = startX + (totalWidth / 2);
            positions[nodeId] = { x: centerX - (NODE_WIDTH / 2), y };
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

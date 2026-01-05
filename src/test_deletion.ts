
// Mock Types
interface Node { id: string;  type?: string; data: any; }
interface Edge { source: string; target: string; sourceHandle?: string; }

const findBlockStarter = (nodes: Node[], edges: Edge[], mergeNodeId: string): string | undefined => {
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
        return n && (n.data?.isMergePlaceholder || n.data?.isMergeNode);
    }

    let balance = 0; 
    const visited = new Set<string>();
    visited.add(mergeNodeId);

    const parents = reverseAdjacency[mergeNodeId];
    // Start from the parent of the merge node
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
            ptr = null;
        }
    }

    return undefined;
}

// Paste the function to test
const findMergeNodeForBlock = (nodes: Node[], edges: Edge[], startNodeId: string): string | undefined => {
    const node = nodes.find(n => n.id === startNodeId);
    if (node?.data?.mergeNodeId) return node.data.mergeNodeId as string;

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

    const stack = [{ id: startNodeId, depth: 0 }];
    const visited = new Set<string>();
    
    let iterations = 0;
    
    while(stack.length > 0 && iterations < 1000) {
        iterations++;
        const { id, depth } = stack.pop()!;
        
        let newDepth = depth;
        if (isLogicNode(id)) newDepth++;
        if (isMergeNode(id)) newDepth--;
        
        if (newDepth === 0 && isMergeNode(id)) {
            return id;
        }
        
        if (newDepth < 0) continue; 
        
        if (visited.has(id)) continue; 
        visited.add(id);

        const children = adjacency[id] || [];
        children.forEach(child => {
            stack.push({ id: child, depth: newDepth });
        });
    }

    return undefined;
}

// Tests
const nodes1: Node[] = [
    { id: 'start', data: {} },
    { id: 'cond', data: { isMergePlaceholder: false } }, // Target to delete (Start of block)
    { id: 'true1', data: {} },
    { id: 'false1', data: {} },
    { id: 'merge', data: { isMergePlaceholder: true } },
    { id: 'end', data: {} }
];

const edges1: Edge[] = [
    { source: 'start', target: 'cond' },
    { source: 'cond', target: 'true1' },
    { source: 'cond', target: 'false1' },
    { source: 'true1', target: 'merge' },
    { source: 'false1', target: 'merge' },
    { source: 'merge', target: 'end' }
];

console.log("Test 1 (Simple Block):", findMergeNodeForBlock(nodes1, edges1, 'cond')); 
// Expected: 'merge'

const nodes2: Node[] = [
    { id: 'cond', data: {} },
    { id: 'p1', data: {} }, 
    { id: 'nested_cond', data: {} }, 
    { id: 'n_t', data: {} }, 
    { id: 'n_f', data: {} }, 
    { id: 'nested_merge', data: { isMergePlaceholder: true } }, 
    { id: 'merge', data: { isMergePlaceholder: true } }
];

const edges2: Edge[] = [
    { source: 'cond', target: 'p1' }, // Branch 1
    { source: 'cond', target: 'nested_cond' }, // Branch 2
    { source: 'nested_cond', target: 'n_t' },
    { source: 'nested_cond', target: 'n_f' },
    { source: 'n_t', target: 'nested_merge' },
    { source: 'n_f', target: 'nested_merge' },
    { source: 'nested_merge', target: 'merge' }, // Nested connects to Outer Merge
    { source: 'p1', target: 'merge' } // Branch 1 connects to Outer Merge
];

console.log("Test 2 (Nested Block):", findMergeNodeForBlock(nodes2, edges2, 'cond'));

// Test 3: Unbalanced Nested Block (BFS Failure Case)
// Outer Cond -> Branch 1 (Long): Step 1 -> Step 2 -> Outer Merge
// Outer Cond -> Branch 2 (Short Nested): Nested Cond -> Nested Merge -> Outer Merge
// BFS would find Nested Merge (dist 2) or Outer Merge via Nested path (dist 3)
// vs Outer Merge via Long path (dist 3).
// Wait, if Nested Merge is 2 steps away, BFS finds it. 
// Nested Merge is a Merge Node.
// Naive BFS returns Nested Merge.
// DFS Depth Counting should skip Nested Merge (depth 1) and find Outer Merge (depth 0).

const nodes3: Node[] = [
    { id: 'cond', type: 'condition', data: {} },
    { id: 'step1', data: {} },
    { id: 'step2', data: {} },
    { id: 'nested_cond', type: 'condition', data: {} },
    { id: 'nested_merge', data: { isMergePlaceholder: true } },
    { id: 'merge', data: { isMergePlaceholder: true } }
];

const edges3: Edge[] = [
    // Branch 1 (Long)
    { source: 'cond', target: 'step1' },
    { source: 'step1', target: 'step2' },
    { source: 'step2', target: 'merge' },
    
    // Branch 2 (Nested)
    { source: 'cond', target: 'nested_cond' },
    { source: 'nested_cond', target: 'nested_merge' }, // Short-circuit nested block
    { source: 'nested_merge', target: 'merge' }
];

// NOTE: Since my DFS follows ONE path, order matters slightly for performance but not correctness.
// If it follows Branch 2: Cond(1) -> Nested(2) -> NestedMerge(1) -> Merge(0). Correct.
// If it follows Branch 1: Cond(1) -> Step1(1) -> Step2(1) -> Merge(0). Correct.

console.log("Test 3 (Real Merge Node):", findMergeNodeForBlock(nodes3, edges3, 'cond'));

// Test 4: Logic Node appearing AT the Merge Point (Populated Merge)
// Condition 1 -> (True) -> Step A -> Condition 2 (Merge)
// Condition 1 -> (False) -> Step B -> Condition 2 (Merge)
// If we run findBlockStarter(Condition 2), it should returned Condition 1.

const nodes4: Node[] = [
    { id: 'start', data: {} },
    { id: 'c1', type: 'condition', data: {} },
    { id: 'stepA', data: {} },
    { id: 'stepB', data: {} },
    { id: 'c2', type: 'condition', data: { isMergeNode: true } } // Identified as Merge by Layout
];

const edges4: Edge[] = [
    { source: 'start', target: 'c1' },
    { source: 'c1', target: 'stepA', sourceHandle: 'true' },
    { source: 'c1', target: 'stepB', sourceHandle: 'false' },
    { source: 'stepA', target: 'c2' },
    { source: 'stepB', target: 'c2' },
];

// Note: layoutEngine.ts export was named 'findBlockStarter'
// We need to import it or paste it here if we are mocking. 
// Since we are running this file standalone with tsx, we need the function definition here.
// I will assume I need to copy `findBlockStarter` implementation here for the test context.

console.log("Test 4 (Find Block Starter for Populated Merge):", findBlockStarter(nodes4, edges4, 'c2'));
// Expected: 'c1'




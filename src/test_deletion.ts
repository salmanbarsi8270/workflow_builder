
// Mock Types
interface Node { id: string;  type?: string; data: any; }
interface Edge { source: string; target: string; }

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

console.log("Test 3 (Unbalanced Nested):", findMergeNodeForBlock(nodes3, edges3, 'cond'));
// Expected: 'merge'.



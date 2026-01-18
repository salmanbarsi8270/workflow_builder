import { type Edge, type Node } from "@xyflow/react"; // Updated import
import { findMergeNodeForBlock, getNodesInBlock } from "../utils/layoutEngine";
import { usePiecesMetadata } from "../hooks/usePiecesMetadata";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Database, Search, ChevronRight, ChevronDown, Zap, Code, Variable, Copy, Hash, List, Type, Calendar, Clock, Mail, User, FileText, Image, DollarSign, Globe, CheckCircle2, X, BoxSelect } from "lucide-react"; // Added BoxSelect
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useMemo, useState } from "react";

interface VariablePickerProps {
  onSelect: (val: string) => void;
  nodes: Node[];
  edges: Edge[];
  currentNodeId?: string;
}

export const VariablePicker = ({ onSelect, nodes, edges, currentNodeId }: VariablePickerProps) => {
  const { pieces } = usePiecesMetadata();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const normalizedCurrentNodeId = currentNodeId ? String(currentNodeId) : null;

  const checkIsTrigger = (node: Node) => {
    // Strict Input Check: Only Node "1" or explicit "trigger" ID is the trigger
    if (node.id === '1' || node.id === 'trigger' || node.id === 'webhook') return true;

    // If the node has a randomly generated ID (usually 9 chars) or uuid, it is an action.
    // Triggers in this system are strictly single-root and normalized to '1' or 'trigger'.
    return false;

    /* 
       LEGACY / DANGEROUS LOGIC REMOVED:
       The following logic causes false positives for 'http_request' because 'request' is aliased as a trigger
       in the HTTP piece metadata. Since we can rely on ID in this builder, we disable this check.
       
    const appName = node.data?.appName;
    const actionId = node.data?.actionId as string;
    const icon = node.data?.icon as string;

    // Use dynamic pieces metadata
    const piece = pieces[icon] || Object.values(pieces).find(p => p.name === appName);

    if (!piece || !actionId) return false;

    // Check if it is listed in triggers
    if (piece.triggers?.includes(actionId)) return true;
    if (piece.metadata?.triggers?.[actionId]) return true;

    return false; 
    */
  };

  // Graph Traversal for Scoping
  const availableNodes = useMemo(() => {
    if (!normalizedCurrentNodeId || !nodes || !edges) return [];
    if (normalizedCurrentNodeId === '1' || normalizedCurrentNodeId === 'trigger') return [];

    const ancestorIds = new Set<string>();
    const loopScopes = new Set<string>();
    const bypassedLoopIds = new Set<string>(); // Tracks loops where we are strictly "after" (via bypass/merge)
    const queue = [normalizedCurrentNodeId];
    const visited = new Set<string>();

    // Pre-compute incoming edges map
    // Key: Target Node ID -> List of Incoming Edges
    const incomingSdk = new Map<string, Edge[]>();
    edges.forEach(e => {
      if (!e.target || !e.source) return;
      if (!incomingSdk.has(e.target)) incomingSdk.set(e.target, []);
      incomingSdk.get(e.target)!.push(e);
    });

    while (queue.length > 0) {
      const currId = queue.shift()!;
      if (visited.has(currId)) continue;
      visited.add(currId);

      const incoming = incomingSdk.get(currId) || [];
      incoming.forEach(e => {
        const sourceId = e.source;
        const sourceNode = nodes.find(n => n.id === sourceId);

        if (sourceNode) {
          // Loop Detection Logic
          if (sourceNode.type === 'loop') {
            // If we reached the loop via its "bypass" handle, we are OUTSIDE/AFTER the loop.
            if (e.sourceHandle === 'loop-bypass') {
              bypassedLoopIds.add(sourceId);
            }
            // If we reached via "output" handle, it MIGHT be inside.
            // But if we ALSO found a bypass edge (or find one later), the bypass flag takes precedence.
            if (e.sourceHandle === 'loop-output' || e.sourceHandle === 'loop-body') {
              loopScopes.add(sourceId);
            }
          }

          // If we haven't visited this source yet, add to queue
          // We add to ancestorIds immediately
          if (!visited.has(sourceId)) {
            ancestorIds.add(sourceId);
            queue.push(sourceId);
          }
        }
      });
    }

    return nodes.filter(n => {
      // Exclude self, end, placeholders
      if (n.id === normalizedCurrentNodeId || n.id === 'end' || n.data?.isPlaceholder) return false;

      // Always include Trigger (Node 1)
      if (n.id === '1' || checkIsTrigger(n)) return true;

      return ancestorIds.has(n.id);
    }).map(n => ({
      ...n,
      isLoopScope: loopScopes.has(n.id) && !bypassedLoopIds.has(n.id)
    })).sort((a, b) => a.position.y - b.position.y); // visual sort

  }, [nodes, edges, normalizedCurrentNodeId]);

  const handleSelect = (val: string) => {
    onSelect(val);
    setOpen(false);
  };

  const clearSearch = () => setSearch("");

  const getNodeIcon = (icon: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'mail': <Mail className="h-3.5 w-3.5" />,
      'user': <User className="h-3.5 w-3.5" />,
      'file': <FileText className="h-3.5 w-3.5" />,
      'image': <Image className="h-3.5 w-3.5" />,
      'dollar': <DollarSign className="h-3.5 w-3.5" />,
      'globe': <Globe className="h-3.5 w-3.5" />,
      'calendar': <Calendar className="h-3.5 w-3.5" />,
      'clock': <Clock className="h-3.5 w-3.5" />,
    };
    return iconMap[icon] || <Zap className="h-3.5 w-3.5" />;
  };

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'string': <Type className="h-3 w-3" />,
      'number': <Hash className="h-3 w-3" />,
      'boolean': <CheckCircle2 className="h-3 w-3" />,
      'array': <List className="h-3 w-3" />,
      'object': <Database className="h-3 w-3" />,
    };
    return iconMap[type] || <Variable className="h-3 w-3" />;
  };

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2 px-3 border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-primary shadow-sm hover:shadow">
                <Database className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Insert Variable</span>
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] font-bold">
                  {availableNodes.length}
                </Badge>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Insert data from previous steps</p>
          </TooltipContent>
        </Tooltip>

        <PopoverContent className="w-96 p-0 border-2 shadow-xl" align="end">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-end">
                <button onClick={() => setOpen(false)} className="bg-red-500/20 p-1 rounded-full">
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Available Variables
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Select data from previous workflow steps
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('list')}>
                    <List className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setViewMode('grid')}>
                    <Database className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search variables by name or type..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm bg-background/50" />
                {search && (
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6" onClick={clearSearch} >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="h-[250px] overflow-auto p-2">
                <AnimatePresence>
                  {availableNodes.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                        <Database className="h-6 w-6 text-primary/60" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">No variables available</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {nodes.length <= 1 ? "Add more workflow steps to use their data here." : "Configure previous steps to expose data for use."}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    availableNodes.map((node) => {
                      const icon = node.data.icon as string;
                      const actionId = node.data.actionId as string;
                      const isTrigger = checkIsTrigger(node);
                      const pathNodeId = isTrigger ? 'trigger' : node.id;

                      const piece = pieces[icon];
                      const actionType = isTrigger ? 'triggers' : 'actions';
                      const schema = piece?.metadata?.[actionType]?.[actionId]?.outputSchema || [];

                      const nodeLabel = (node.data.label as string) || node.id;
                      const lowerSearch = search.toLowerCase();
                      const matchesNodeLabel = nodeLabel.toLowerCase().includes(lowerSearch);

                      const getDiscoveredSchema = () => {
                        let finalSchema = [...schema];

                        const discoverFromParams = (params: any, schemaObj: any[]) => {
                          // Extract from properties (buildObject)
                          if (params.properties) {
                            try {
                              const props = typeof params.properties === 'string' ? JSON.parse(params.properties) : params.properties;
                              Object.keys(props).forEach(key => {
                                const exists = schemaObj.find(s => s.name === key || s.name === `object.${key}` || s.name === `updatedObject.${key}`);
                                if (!exists) {
                                  const rawType = typeof props[key];
                                  const type = (['string', 'number', 'boolean', 'object'].includes(rawType) ? rawType : 'string') as any;
                                  schemaObj.push({ name: key, type });
                                }
                              });
                            } catch (e) { }
                          }

                          // Extract from updates (updateObject)
                          if (params.updates) {
                            try {
                              const upds = typeof params.updates === 'string' ? JSON.parse(params.updates) : params.updates;
                              Object.keys(upds).forEach(key => {
                                const exists = schemaObj.find(s => s.name === key);
                                if (!exists) {
                                  const rawType = typeof upds[key];
                                  const type = (['string', 'number', 'boolean', 'object'].includes(rawType) ? rawType : 'string') as any;
                                  schemaObj.push({ name: key, type });
                                }
                              });
                            } catch (e) { }
                          }
                        };

                        // Aggregate internal schemas for logic blocks
                        if (node.type === 'parallel' || node.type === 'loop' || node.type === 'condition') {
                          const mergeId = findMergeNodeForBlock(nodes, edges, node.id);
                          if (mergeId) {
                            const internalIds = getNodesInBlock(nodes, edges, node.id, mergeId, false);
                            internalIds.forEach(id => {
                              if (id === node.id) return;
                              const internalNode = nodes.find(n => n.id === id);
                              if (internalNode && !internalNode.data?.isPlaceholder) {
                                const internalIcon = internalNode.data.icon as string;
                                const internalActionId = internalNode.data.actionId as string;
                                const internalPiece = pieces[internalIcon];
                                const internalSchema = internalPiece?.metadata?.actions?.[internalActionId]?.outputSchema || [];

                                internalSchema.forEach(prop => {
                                  if (!finalSchema.some(s => s.name === prop.name)) {
                                    finalSchema.push(prop);
                                  }
                                });
                                discoverFromParams(internalNode.data?.params || {}, finalSchema);
                              }
                            });
                          }
                        }

                        const nodeParams = (node.data?.params as any) || {};
                        discoverFromParams(nodeParams, finalSchema);

                        // Specific properties for logic pieces
                        if (node.type === 'condition') {
                          finalSchema.push({ name: 'result', type: 'boolean' });
                          finalSchema.push({ name: 'branch', type: 'string' });
                        }
                        if (node.type === 'loop') {
                          finalSchema.push({ name: 'iterations', type: 'number' });
                          finalSchema.push({ name: 'results', type: 'array' });
                        }

                        return finalSchema;
                      };

                      const discoveredSchema = getDiscoveredSchema();
                      const filteredSchema = discoveredSchema.filter((prop: any) => {
                        if (!search) return true;
                        return matchesNodeLabel ||
                          prop.name.toLowerCase().includes(lowerSearch) ||
                          prop.type.toLowerCase().includes(lowerSearch);
                      });

                      if (!matchesNodeLabel && filteredSchema.length === 0 && search) return null;

                      const isExpanded = expanded.has(node.id) || (!!search && filteredSchema.length > 0);

                      return (
                        <motion.div key={node.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mb-2 border rounded-lg overflow-hidden bg-linear-to-br from-card to-card/50 hover:from-accent/5 hover:to-accent/5 transition-all duration-200">
                          <div className="px-3 py-2.5 hover:bg-accent/20 cursor-pointer flex items-center justify-between transition-all" onClick={() => toggle(node.id)}>
                            <div className="flex items-center gap-3">
                              <div className={cn("p-1.5 rounded-md", isTrigger ? "bg-linear-to-br from-amber-500/10 to-amber-500/5" : "bg-linear-to-br from-primary/10 to-primary/5")}>
                                {getNodeIcon(icon)}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium truncate max-w-[120px]">
                                    {nodeLabel}
                                  </span>
                                  {isTrigger && (
                                    <Badge variant="outline" className="text-[8px] h-4 px-1.5 bg-amber-500/10 text-amber-600 border-amber-200">
                                      Trigger
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <span className="flex items-center gap-0.5">
                                    <Code className="h-2.5 w-2.5" />
                                    {discoveredSchema.length} props
                                  </span>
                                  <span>•</span>
                                  <span>ID: {node.id}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[8px] h-5 px-1.5 font-medium bg-primary/10 text-primary">
                                {filteredSchema.length || discoveredSchema.length} vars
                              </Badge>
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t bg-linear-to-b from-background/50 to-background/20">
                                <div className="p-1.5">
                                  <div className="mb-2 px-2">
                                    {(node as any).isLoopScope && (
                                      <div className="mb-2 pb-2 border-b border-border/50">
                                        <span className="text-[10px] font-medium text-amber-600 mb-1.5 block flex items-center gap-1">
                                          <BoxSelect className="h-3 w-3" /> LOOP CONTEXT
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="w-full justify-start h-8 text-xs hover:bg-amber-500/10 text-amber-700 font-medium"
                                          onClick={() => handleSelect(`{{loop_item}}`)}
                                        >
                                          <Zap className="h-3 w-3 mr-2" />
                                          Current Item
                                          <Badge variant="outline" className="ml-auto text-[9px] border-amber-200 bg-amber-50 text-amber-700">Object</Badge>
                                        </Button>
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                        Available Properties
                                      </span>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleSelect(`{{steps.${pathNodeId}.data}}`)}>
                                            <Copy className="h-2.5 w-2.5" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left">
                                          <p className="text-xs">Copy full object</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>

                                  {filteredSchema.length === 0 ? (
                                    <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-xs hover:bg-primary/10" onClick={() => handleSelect(`{{steps.${pathNodeId}.data}}`)}>
                                      <Database className="h-3 w-3 mr-2" />
                                      Insert Full Data Object
                                      <Badge variant="outline" className="ml-auto text-[10px]">any</Badge>
                                    </Button>
                                  ) : (
                                    filteredSchema.map((prop: any, idx: number) => {
                                      // Determine mapping path
                                      let mappingPath = prop.name;

                                      // Handle cases where outputSchema has 'object.xxx' but we want to map directly or via 'data.object.xxx'
                                      // If it's buildObject, we usually want steps.ID.data.object.key OR steps.ID.data.key (due to my spread fix)
                                      // VariablePicker usually maps steps.ID.data.PROP

                                      const mapping = `{{steps.${pathNodeId}.data.${mappingPath}}}`;

                                      return (
                                        <Button key={`${prop.name}-${idx}`} variant="ghost" size="sm" className="w-full justify-start h-8 text-xs hover:bg-primary/10 group mb-0.5 last:mb-0" onClick={() => handleSelect(mapping)}>
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="p-1 rounded bg-primary/5 group-hover:bg-primary/10">
                                              {getTypeIcon(prop.type)}
                                            </div>
                                            <span className="truncate font-medium">{prop.name}</span>
                                          </div>
                                          <div className="flex items-center gap-2 ml-auto">
                                            <Badge variant="outline" className="text-[10px] capitalize font-normal opacity-70 group-hover:opacity-100">{prop.type}</Badge>
                                            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </div>
                                        </Button>
                                      );
                                    })
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};

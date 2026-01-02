
import { useState, useEffect, useMemo, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Check, X, ChevronRight, ChevronDown, ArrowLeft, History as HistoryIcon, RefreshCcw, Play, Slash, GitFork, GitMerge, Clock, AlertTriangle } from "lucide-react";
import { type Node, type Edge } from '@xyflow/react';
import { cn } from "@/lib/utils";
import { API_URL } from '../api/apiurl';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface RunSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    nodes: Node[];
    edges: Edge[];
    socket?: any;
    flowId?: string;
    onViewRun?: (run: FlowRun) => void;
}

type StepStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped' | 'waiting' | 'rejected';

interface StepResult {
    nodeId: string;
    status: StepStatus;
    output: any;
    duration: number;
}

interface FlowRun {
    id: string;
    status: string;
    logs: string[];
    result: any;
    created_at: string;
}

export default function RunSidebar({ isOpen, onClose, nodes, edges, socket, flowId, onViewRun }: RunSidebarProps) {
    const [results, setResults] = useState<Record<string, StepResult>>({});
    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

    // Track active run status
    const [hasActiveRun, setHasActiveRun] = useState(false);
    const [runStartTime, setRunStartTime] = useState<Date | null>(null);
    const [runDuration, setRunDuration] = useState<number>(0);
    const resultsRef = useRef<Record<string, StepResult>>({});

    // Keep ref in sync
    useEffect(() => {
        resultsRef.current = results;
    }, [results]);

    // History State
    const [view, setView] = useState<'live' | 'history' | 'detail'>('live');
    const [runHistory, setRunHistory] = useState<FlowRun[]>([]);
    const [selectedRun, setSelectedRun] = useState<FlowRun | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [liveRun, setliveRun] = useState(false);
    const [runSummaryStatus, setRunSummaryStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

    // --- FLAT LIST BUILDER ---
    // Simple topological sort approximation using Y position
    const visualSteps = useMemo(() => {
        if (!nodes || nodes.length === 0) return [];
        return [...nodes]
            .filter(n => !n.data.isPlaceholder && n.id !== '1' && n.type !== 'end') // Filter out placeholders and trigger/end
            .sort((a, b) => {
                // Sort by Y first, then X (for parallel branches on same row)
                if (Math.abs(a.position.y - b.position.y) > 50) {
                    return a.position.y - b.position.y;
                }
                return a.position.x - b.position.x;
            });
    }, [nodes]);

    // Track active run status
    useEffect(() => {
        const isRunning = Object.values(results).some(r => r.status === 'running');
        setHasActiveRun(isRunning);

        // Track run duration
        if (isRunning && !runStartTime) {
            setRunStartTime(new Date());
        }
    }, [results]);

    // Update run duration timer
    useEffect(() => {
        let interval: any;
        if (runStartTime && hasActiveRun) {
            interval = setInterval(() => {
                const now = new Date();
                const duration = now.getTime() - runStartTime.getTime();
                setRunDuration(duration);
            }, 100);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [runStartTime, hasActiveRun]);

    const handleRunClick = (run: FlowRun) => {
        setSelectedRun(run);
        setView('detail');
        setRunSummaryStatus('idle');
    };

    const handleViewChange = (newView: 'live' | 'history' | 'detail') => {
        setView(newView);
        if (newView !== 'live') setRunSummaryStatus('idle');
    };

    // Derived results for rendering
    const displayResults = useMemo(() => {
        if (view === 'detail' && selectedRun) {
            const mapped: Record<string, StepResult> = {};
            const runRes = typeof selectedRun.result === 'string' ? JSON.parse(selectedRun.result) : selectedRun.result;

            nodes.forEach(node => {
                // Try specific lookup
                let stepData = runRes && runRes[node.id];

                // Trigger fallback
                if (!stepData && runRes) {
                    const triggerKeys = ['schedule', 'newEmail', 'newRow', 'webhook', 'trigger'];
                    const foundKey = triggerKeys.find(k => runRes[k]);
                    // Check if this node is the trigger?
                    if (foundKey && (node.type === 'trigger' || (node.data.actionId === foundKey) || node.id === '1')) {
                        stepData = runRes[foundKey];
                    }
                }

                if (stepData) {
                    mapped[node.id] = {
                        nodeId: node.id,
                        status: stepData.status || 'success',
                        output: stepData.data || stepData.output || stepData, // Handles varied backend formats
                        duration: stepData.duration || 0
                    };
                } else {
                    mapped[node.id] = {
                        nodeId: node.id,
                        status: 'skipped',
                        output: null,
                        duration: 0
                    };
                }
            });
            return mapped;
        }
        return results;
    }, [view, selectedRun, results, nodes]);

    useEffect(() => {
        if (socket) {
            const handleStepStart = (data: any) => {
                setliveRun(true);
                
                // If this is the trigger node (usually first node) or we have no results, start fresh
                const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y).filter(n => n.type !== 'end' && !n.data.isPlaceholder);
                const isFirstNode = sortedNodes[0]?.id === data.nodeId;
                const noActiveResults = Object.keys(resultsRef.current).length === 0;

                if (isFirstNode || noActiveResults) {
                    setResults({});
                    setRunStartTime(new Date());
                    setRunDuration(0);
                    setRunSummaryStatus('idle');
                    console.log("Run started fresh");
                }

                if (view !== 'live') setView('live');

                setResults(prev => ({
                    ...prev,
                    [data.nodeId]: {
                        nodeId: data.nodeId,
                        status: 'running',
                        output: null,
                        duration: 0
                    }
                }));
            };

            const handleStepFinish = (data: any) => {
                console.log("run finish");
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
                console.log("run complete");

                // Mark nodes that didn't run as skipped
                setResults(prev => {
                    const next = { ...prev };
                    nodes.forEach(node => {
                        if (node.type === 'end' || node.data.isPlaceholder) return;
                        if (!next[node.id]) {
                            next[node.id] = {
                                nodeId: node.id,
                                status: 'skipped', // Type cast if needed, but StepStatus now includes skipped
                                output: null,
                                duration: 0
                            } as any; // Cast to avoid strict type issues if local StepStatus def is outdated 
                        }
                    });
                    return next;
                });
                
                // Determine summary status based on results
                const hasError = Object.values(resultsRef.current as Record<string, StepResult>).some(r => r.status === 'error');
                const newStatus = hasError ? 'error' : 'success';
                
                // Only set summary status if we're in live view
                if (view === 'live') {
                    setRunSummaryStatus(newStatus);
                }

                setTimeout(() => {
                    setRunStartTime(null);
                    setliveRun(false);
                    setTimeout(() => {
                        if (view === 'live') {
                            setRunSummaryStatus('idle');
                        }
                    }, 5000);
                }, 1000);
            };

            const handleFlowFailed = (data: any) => {
                setRunSummaryStatus('error');
                setliveRun(false);
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
    }, [socket, view, nodes]);


    const fetchHistory = async () => {
        if (!flowId) return;
        setIsLoadingHistory(true);
        try {
            const res = await fetch(`${API_URL}/api/flows/${flowId}/runs`);
            const data = await res.json();
            if (data.success) {
                setRunHistory(data.runs);
            }
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    };

    const getDescriptionText = () => {
        if (view === 'detail' && selectedRun) {
            return (
                <div className="flex items-center justify-between w-full">
                    <span>Run Details • {new Date(selectedRun.created_at).toLocaleString()}</span>
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => onViewRun?.(selectedRun)}>
                        View
                    </Button>
                </div>
            );
        }
        if (view === 'history') return "View past executions";
        if (runSummaryStatus === 'success') return <span className="text-green-500 font-semibold flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Run Successful</span>;
        if (runSummaryStatus === 'error') return <span className="text-red-500 font-semibold flex items-center gap-1.5"><X className="h-3.5 w-3.5" /> Run Failed</span>;
        if (hasActiveRun) return `Running for ${formatDuration(runDuration)}`;
        return "Ready for execution";
    };

    const toggleStep = (id: string) => {
        setExpandedSteps(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    const renderStep = (node: Node, index: number) => {
        const result = displayResults[node.id];
        const status = result?.status || 'pending';
        const isExpanded = expandedSteps.has(node.id);
        const label = node.data.label as string || node.id;
        // Icons could be determined by node type, kept simple here

        return (
            <div key={node.id} className="relative mb-3">
                <div className="absolute top-3 bottom-0 left-[11px] w-px bg-border -z-10 last:hidden" />

                <div className="group">
                    {/* Status Badge */}
                    <div className={cn(
                        "absolute left-0 top-2 h-6 w-6 rounded-full border-2 flex items-center justify-center bg-background z-10 transition-colors",
                        status === 'pending' && "border-muted text-muted-foreground bg-muted/10",
                        status === 'running' && "border-blue-500 text-blue-500 bg-blue-50",
                        status === 'success' && "border-green-500 bg-green-500 text-white",
                        status === 'error' && "border-red-500 bg-red-500 text-white",
                        status === 'skipped' && "border-zinc-300 bg-zinc-100 text-zinc-400 opacity-50",
                        status === 'waiting' && "border-amber-500 bg-amber-500 text-white animate-pulse"
                    )}>
                        {status === 'pending' && <span className="text-[10px]">{index + 1}</span>}
                        {status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
                        {status === 'success' && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        {status === 'error' && <X className="h-3.5 w-3.5" strokeWidth={3} />}
                        {status === 'skipped' && <Slash className="h-3 w-3" />}
                        {status === 'waiting' && <span className="text-[10px]">||</span>}
                    </div>

                    <div className="ml-9 space-y-2">
                        {/* Main Step Card */}
                        <div
                            className={cn(
                                "flex items-center justify-between p-3 rounded-lg border bg-card transition-all cursor-pointer",
                                isExpanded && "ring-1 ring-primary border-primary bg-accent/5",
                                status === 'skipped' && "opacity-60 bg-muted/20 hover:border-border cursor-default",
                                status === 'running' && "border-blue-200 shadow-sm"
                            )}
                            onClick={() => status !== 'skipped' && toggleStep(node.id)}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className={cn("font-medium text-sm truncate", status === 'skipped' && "line-through text-muted-foreground")}>
                                    {label}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {status === 'success' && <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(result.duration)}</span>}
                                {status === 'waiting' && <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">WAITING</Badge>}
                                {status !== 'skipped' && (
                                    isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>
                        </div>

                        {/* Expanded Content (Output) */}
                        {isExpanded && (
                            <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                                {(result?.output || status === 'running' || status === 'pending') && (
                                    <div className="rounded-lg bg-muted/50 p-3 text-xs font-mono overflow-auto max-h-[300px]">
                                        <div className="mb-2 font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Output Payload</div>
                                        {status === 'running' ? (
                                            <div className="flex items-center gap-2 text-blue-600"><Loader2 className="h-3 w-3 animate-spin" /> Executing...</div>
                                        ) : status === 'pending' ? (
                                            <span className="text-muted-foreground italic">Waiting to start...</span>
                                        ) : (
                                            <pre>{JSON.stringify(result?.output, null, 2) || '{}'}</pre>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="left" className="w-full sm:max-w-md p-0 flex flex-col gap-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <SheetHeader className="p-6 border-b shrink-0">
                    <SheetTitle className="text-xl flex items-center gap-2">
                        {view === 'detail' && (
                            <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8 mr-1" onClick={() => handleViewChange('history')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        Workflow Activity
                        {liveRun && <Badge variant="destructive" className="animate-pulse px-1.5 h-5 text-[10px]">LIVE</Badge>}
                    </SheetTitle>
                    <SheetDescription>{getDescriptionText()}</SheetDescription>

                    {view !== 'detail' && (
                        <div className="flex gap-2 mt-4">
                            <Button variant={view === 'live' ? 'secondary' : 'ghost'} size="sm" onClick={() => handleViewChange('live')} className="flex-1">
                                <RefreshCcw className={cn("h-3.5 w-3.5 mr-2", liveRun && "animate-spin")} /> Current
                            </Button>
                            <Button variant={view === 'history' ? 'secondary' : 'ghost'} size="sm" onClick={() => { handleViewChange('history'); fetchHistory(); }} className="flex-1">
                                <HistoryIcon className="h-3.5 w-3.5 mr-2" /> History
                            </Button>
                        </div>
                    )}
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-8rem)] px-6 py-6">
                    {view === 'history' ? (
                        <div className="space-y-3">
                            {isLoadingHistory && <div className="text-center py-8 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Loading...</div>}
                            {!isLoadingHistory && runHistory.length === 0 && <div className="text-center py-8 text-muted-foreground">No run history found.</div>}
                            {runHistory.map((run, i) => (
                                <div key={run.id} onClick={() => handleRunClick(run)} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("h-2 w-2 rounded-full", run.status === 'success' ? 'bg-green-500' : 'bg-red-500')} />
                                        <div className="grid gap-0.5">
                                            <span className="text-sm font-medium">Run #{runHistory.length - i}</span>
                                            <span className="text-xs text-muted-foreground">{new Date(run.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="relative pb-12">
                            {visualSteps.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Play className="h-10 w-10 mx-auto opacity-20 mb-3" />
                                    <p>Ready to run.</p>
                                </div>
                            ) : (
                                visualSteps.map((node, idx) => renderStep(node, idx))
                            )}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
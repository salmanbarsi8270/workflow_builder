
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Sheet, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ResizableSheetContent } from "../../Utility/ResizableSheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Check, X, ChevronRight, ChevronDown, ArrowLeft, History as HistoryIcon, RefreshCcw, Play, Slash } from "lucide-react";
import { type Node, type Edge } from '@xyflow/react';
import { cn } from "@/lib/utils";
import { API_URL } from '../../api/apiurl';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";
import { Clock } from "lucide-react";
import { useUser } from "@/context/UserContext";


interface RunSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    nodes: Node[];
    edges: Edge[];
    flowId?: string;
    results: Record<string, StepResult>; // Received from parent
    onViewRun?: (run: FlowRun) => void;
}

type StepStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped' | 'waiting' | 'rejected';

interface StepResult {
    nodeId: string;
    status: StepStatus;
    output: unknown;
    duration: number;
}

interface FlowRun {
    id: string;
    status: string;
    logs: string[];
    result: string | Record<string, unknown>;
    created_at: string;
    current_context?: any;
}

interface AgentResponse {
    text?: string;
    output?: string;
    _output?: string;
}

export default function RunSidebar({ isOpen, onClose, nodes, flowId, results, onViewRun }: RunSidebarProps) {
    const { user } = useUser();
    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

    // Track active run status
    const [runStartTime, setRunStartTime] = useState<Date | null>(null);
    const [runDuration, setRunDuration] = useState<number>(0);
    const prevHasActiveRun = useRef(false);

    // Derived Run State
    const hasActiveRun = useMemo(() => 
        Object.values(results).some(r => r.status === 'running' || r.status === 'waiting'),
    [results]);

    const liveRun = hasActiveRun;

    const runSummaryStatus = useMemo(() => {
        const values = Object.values(results);
        if (values.length === 0) return 'idle';
        if (hasActiveRun) return 'running';
        
        const hasError = values.some(r => r.status === 'error');
        const hasSuccess = values.some(r => r.status === 'success');
        
        if (hasError) return 'error';
        if (hasSuccess) return 'success';
        return 'idle';
    }, [results, hasActiveRun]);

    // History State
    const [view, setView] = useState<'live' | 'history' | 'detail' | 'waiting'>('live');
    const [runHistory, setRunHistory] = useState<FlowRun[]>([]);
    const [selectedRun, setSelectedRun] = useState<FlowRun | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Approval Action State
    const [approvingRun, setApprovingRun] = useState<FlowRun | null>(null);
    const [isActioning, setIsActioning] = useState(false);


    // --- FLAT LIST BUILDER ---
    // Simple topological sort approximation using Y position
    const visualSteps = useMemo(() => {
        if (!nodes || nodes.length === 0) return [];
        return [...nodes]
            .filter(n => !n.data.isPlaceholder && n.type !== 'end') // Include node '1' (trigger)
            .sort((a, b) => {
                // Sort by Y first, then X (for parallel branches on same row)
                if (Math.abs(a.position.y - b.position.y) > 50) {
                    return a.position.y - b.position.y;
                }
                return a.position.x - b.position.x;
            });
    }, [nodes]);

    const handleApprovalAction = async (action: 'resume' | 'reject') => {
        if (!approvingRun || !flowId) return;
        setIsActioning(true);
        try {
            await axios.post(`${API_URL}/api/v1/flows/${flowId}/runs/${approvingRun.id}/${action}`, {
                approver: user?.email || 'unknown',
                source: 'run-sidebar'
            });
            toast.success(action === 'resume' ? "Workflow approved" : "Workflow rejected");
            setApprovingRun(null);
            fetchHistory(); // Refresh
        } catch (error) {
            console.error(error);
            toast.error("Action failed");
        } finally {
            setIsActioning(false);
        }
    };

    // Track run duration start
    useEffect(() => {
        if (hasActiveRun && !prevHasActiveRun.current) {
            // Fresh run detected (transition from idle to running)
            setRunStartTime(new Date());
            setRunDuration(0);
        }
        prevHasActiveRun.current = hasActiveRun;
    }, [hasActiveRun]);

    // Update run duration timer
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
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
    };

    const handleViewChange = (newView: 'live' | 'history' | 'detail' | 'waiting') => {
        setView(newView);
    };

    // Derived results for rendering
    const displayResults = useMemo(() => {
        // 1. If there's an active live run, always prefer showing it
        if (hasActiveRun) return results;

        // 2. If viewing a specific run from history
        if (view === 'detail' && selectedRun) {
            const mapped: Record<string, StepResult> = {};
            let runRes: Record<string, unknown>;
            try {
                runRes = typeof selectedRun.result === 'string' ? JSON.parse(selectedRun.result) : selectedRun.result;
            } catch {
                runRes = {};
            }

            nodes.forEach(node => {
                // Try specific lookup
                let stepData = runRes && (runRes[node.id] as any);

                // Trigger and Action Fallbacks
                if (!stepData && runRes) {
                    // 1. Trigger lookup
                    const triggerKeys = ['schedule', 'newEmail', 'newRow', 'webhook', 'trigger', 'form', 'runAgent', 'http_webhook'];
                    const foundTriggerKey = triggerKeys.find(k => runRes[k]);
                    if (foundTriggerKey && (node.type === 'trigger' || node.id === '1')) {
                        stepData = runRes[foundTriggerKey];
                    }

                    // 2. Action ID, App Name, or Combined match
                    if (!stepData) {
                        const appName = (node.data as any)?.appName;
                        const actionId = (node.data as any)?.actionId || (node.data as any)?.id;
                        const label = (node.data as any)?.label;
                        
                        // Try matching by actionId first, then appName, then combined, then label
                        stepData = (actionId && runRes[actionId]) || 
                                   (appName && runRes[appName]) || 
                                   (appName && actionId && (runRes[`${appName}_${actionId}`] || runRes[`${appName}-${actionId}`])) ||
                                   (label && runRes[label]);
                    }
                }

                if (stepData) {
                    mapped[node.id] = {
                        nodeId: node.id,
                        status: stepData.status || 'success',
                        output: stepData.data || stepData.output || stepData,
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

        // 3. FALLBACK: If view is live but results are empty, show the latest run from history
        if (view === 'live' && Object.keys(results).length === 0 && runHistory.length > 0) {
            const latestRun = runHistory[0];
            const mapped: Record<string, StepResult> = {};
            let runRes: Record<string, unknown>;
            try {
                runRes = typeof latestRun.result === 'string' ? JSON.parse(latestRun.result) : latestRun.result;
            } catch {
                runRes = {};
            }

            nodes.forEach(node => {
                let stepData = runRes && (runRes[node.id] as any);
                if (!stepData && runRes) {
                    const triggerKeys = ['schedule', 'newEmail', 'newRow', 'webhook', 'trigger', 'form', 'runAgent', 'http_webhook'];
                    const foundTriggerKey = triggerKeys.find(k => runRes[k]);
                    if (foundTriggerKey && (node.type === 'trigger' || node.id === '1')) stepData = runRes[foundTriggerKey];
                    if (!stepData) {
                        const appName = (node.data as any)?.appName;
                        const actionId = (node.data as any)?.actionId || (node.data as any)?.id;
                        const label = (node.data as any)?.label;
                        stepData = (actionId && runRes[actionId]) || (appName && runRes[appName]) || (label && runRes[label]);
                    }
                }

                if (stepData) {
                    mapped[node.id] = {
                        nodeId: node.id,
                        status: stepData.status || 'success',
                        output: stepData.data || stepData.output || stepData,
                        duration: stepData.duration || 0
                    };
                } else {
                    mapped[node.id] = { nodeId: node.id, status: 'skipped', output: null, duration: 0 };
                }
            });
            return mapped;
        }

        return results;
    }, [view, selectedRun, results, nodes, hasActiveRun, runHistory]);

    // Auto-switch to live view when a run starts
    useEffect(() => {
        if (hasActiveRun && view !== 'live') {
            setView('live');
        }
    }, [hasActiveRun, view]);

    // -- Moved above useEffect --
    const fetchHistory = useCallback(async () => {
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
    }, [flowId]);

    // Auto-refresh history when a run completes
    const prevActive = useRef(false);
    useEffect(() => {
        if (!hasActiveRun && prevActive.current) {
            fetchHistory();
        }
        prevActive.current = hasActiveRun;
    }, [hasActiveRun, fetchHistory]);

    // Socket listeners for run progress - REMOVED redundant internal state management
    // results are now passed as props from AutomationEditor.tsx
    useEffect(() => {
        // Reset local timer if results are cleared
        if (Object.keys(results).length === 0) {
            setRunStartTime(null);
            setRunDuration(0);
        }
    }, [results]);



    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    };

    const getDescriptionText = () => {
        if (view === 'detail' && selectedRun) {
            const status = selectedRun.status?.toLowerCase();
            return (
                <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">Run Details</span>
                            {status === 'running' && <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-200 h-5 px-1.5 gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Running</Badge>}
                            {status === 'waiting' && <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-amber-200 h-5 px-1.5 gap-1 animate-pulse">Waiting</Badge>}
                            {status === 'success' && <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/25 border-green-200 h-5 px-1.5 gap-1"><Check className="h-3 w-3"/> Success</Badge>}
                            {(status === 'error' || status === 'failed') && <Badge className="bg-red-500/15 text-red-600 hover:bg-red-500/25 border-red-200 h-5 px-1.5 gap-1"><X className="h-3 w-3"/> Failed</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(selectedRun.created_at).toLocaleString()}</span>
                    </div>
                </div>
            );
        }
        if (view === 'history') return "View past executions";
        if (runSummaryStatus === 'success') return <span className="text-green-500 font-semibold flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Run Successful</span>;
        if (runSummaryStatus === 'error') return <span className="text-red-500 font-semibold flex items-center gap-1.5"><X className="h-3.5 w-3.5" /> Run Failed</span>;
        if (hasActiveRun) return `Running for ${formatDuration(runDuration)}`;
        if (view === 'waiting') return "Workflows waiting for action";
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
                                "flex items-center justify-between p-3 rounded-xl border bg-white/40 dark:bg-white/5 transition-all cursor-pointer border-white/20 dark:border-white/10 shadow-sm hover:shadow-md",
                                isExpanded && "ring-2 ring-primary/20 border-primary/50 bg-white/60 dark:bg-white/10",
                                status === 'skipped' && "opacity-60 grayscale cursor-default",
                                status === 'running' && "border-blue-400/50 shadow-blue-500/10"
                            )}
                            onClick={() => status !== 'skipped' && toggleStep(node.id)}
                            role="button"
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
                            <div className="animate-in slide-in-from-top-2 fade-in duration-300 mt-2">
                                {(result?.output || status === 'running' || status === 'pending') && (
                                    <div className="rounded-xl bg-white/30 dark:bg-black/30 p-4 text-xs font-mono overflow-auto w-full max-h-[400px] border border-white/20 dark:border-white/10 shadow-inner relative group/payload">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Output Payload</div>
                                            {status !== 'running' && status !== 'pending' && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6 opacity-0 group-hover/payload:opacity-100 transition-opacity bg-black/5 dark:bg-white/5"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const out = result?.output;
                                                        const text = typeof out === 'string' ? out : JSON.stringify(out, null, 2);
                                                        navigator.clipboard.writeText(text);
                                                        toast.success("Payload copied to clipboard");
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                                </Button>
                                            )}
                                        </div>
                                        {status === 'running' ? (
                                            <div className="flex items-center gap-2 text-blue-600"><Loader2 className="h-3 w-3 animate-spin" /> Executing...</div>
                                        ) : status === 'pending' ? (
                                            <span className="text-muted-foreground italic">Waiting to start...</span>
                                        ) : (
                                            <div className="space-y-3">
                                                {(() => {
                                                    const out = result?.output as Record<string, unknown> | null;
                                                    const isAgentResponse = out && typeof out === 'object' && ('text' in out || 'output' in out || '_output' in out);
                                                    
                                                    if (isAgentResponse) {
                                                        const agentOut = out as AgentResponse;
                                                        const reply = (agentOut.text || agentOut.output || agentOut._output) || '';
                                                        return (
                                                            <>
                                                                <div className="p-3 bg-white dark:bg-black/20 rounded-lg border border-border/50 text-sm font-sans whitespace-pre-wrap leading-relaxed">
                                                                    {reply}
                                                                </div>
                                                                <details className="mt-2 text-[10px]">
                                                                    <summary className="cursor-pointer hover:text-primary transition-colors">Show raw payload</summary>
                                                                    <pre className="mt-1 p-2 bg-black/5 dark:bg-white/5 rounded overflow-auto max-h-[200px] whitespace-pre-wrap break-all max-w-full">
                                                                        {JSON.stringify(out, null, 2)}
                                                                    </pre>
                                                                </details>
                                                            </>
                                                        );
                                                    }
                                                    return(
                                                        <pre className="whitespace-pre-wrap break-all max-w-full">
                                                            {JSON.stringify(out, null, 2) || '{}'}
                                                        </pre>
                                                    )
                                                })()}
                                            </div>
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
            <ResizableSheetContent side="left" storageKey="run-sidebar-width" defaultWidth={450} className="w-full sm:max-w-none flex flex-col gap-0 bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <SheetHeader className="p-6 border-b border-sidebar-border/50 shrink-0 bg-white/20 dark:bg-black/10">
                    <SheetTitle className="text-xl flex items-center gap-2">
                        {view === 'detail' && (
                            <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8 mr-1" onClick={() => handleViewChange('history')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        Workflow Activity
                        {liveRun && <Badge variant="destructive" className="animate-pulse px-1.5 h-5 text-[10px]">LIVE</Badge>}
                    </SheetTitle>
                    <SheetDescription asChild>
                        <div className="text-sm text-muted-foreground">{getDescriptionText()}</div>
                    </SheetDescription>

                </SheetHeader>

                {/* Navigation Tabs - Always Visible */}
                <div className="px-6 pb-4 pt-2 border-b border-border/50 bg-white/10 dark:bg-black/10">
                    <div className="flex gap-2">
                        <Button variant={view === 'live' || (view === 'detail' && selectedRun?.status === 'running') ? 'secondary' : 'ghost'} size="sm" onClick={() => handleViewChange('live')} className="flex-1">
                            <RefreshCcw className={cn("h-3.5 w-3.5 mr-2", liveRun && "animate-spin")} /> Current
                        </Button>
                        <Button variant={view === 'waiting' || (view === 'detail' && selectedRun?.status === 'waiting') ? 'secondary' : 'ghost'} size="sm" onClick={() => { handleViewChange('waiting'); fetchHistory(); }} className="flex-1">
                            <HistoryIcon className="h-3.5 w-3.5 mr-2" /> Waiting
                        </Button>
                        <Button variant={view === 'history' || (view === 'detail' && selectedRun && selectedRun.status !== 'running' && selectedRun.status !== 'waiting') ? 'secondary' : 'ghost'} size="sm" onClick={() => { handleViewChange('history'); fetchHistory(); }} className="flex-1">
                            <HistoryIcon className="h-3.5 w-3.5 mr-2" /> History
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1 min-h-0 px-6 py-6">
                    {view === 'history' || view === 'waiting' ? (
                        <div className="space-y-3">
                            {isLoadingHistory && <div className="text-center py-8 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Loading...</div>}
                            {!isLoadingHistory && runHistory.length === 0 && <div className="text-center py-8 text-muted-foreground">No run history found.</div>}
                            
                            {/* Filter for Waiting View */}
                            {(() => {
                                const runsToShow = view === 'waiting' 
                                    ? runHistory.filter(r => r.status === 'waiting' || r.status === 'running')
                                    : runHistory;
                                
                                if (view === 'waiting' && runsToShow.length === 0 && !isLoadingHistory) {
                                     return <div className="text-center py-8 text-muted-foreground">No active workflows found.</div>;
                                }

                                return runsToShow.map((run) => (
                                    <div key={run.id} onClick={() => handleRunClick(run)} className="flex items-center justify-between p-4 rounded-xl border border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 cursor-pointer transition-all group hover:shadow-lg hover:-translate-y-0.5">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("h-2 w-2 rounded-full", 
                                                run.status === 'success' ? 'bg-green-500' : 
                                                run.status === 'waiting' ? 'bg-amber-500 animate-pulse' :
                                                run.status === 'running' ? 'bg-blue-500 animate-pulse' :
                                                'bg-red-500')} />
                                            <div className="grid gap-0.5">
                                                <span className="text-sm font-medium">Run #{runHistory.length - runHistory.indexOf(run)}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">{new Date(run.created_at).toLocaleString()}</span>
                                                    {run.status === 'waiting' && <Badge variant="outline" className="text-[10px] h-4 px-1 border-amber-500/50 text-amber-600 bg-amber-50">WAITING</Badge>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {run.status === 'waiting' && (
                                                <Button 
                                                    size="sm" 
                                                    variant="default" 
                                                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setApprovingRun(run);
                                                    }}
                                                >
                                                    Action
                                                </Button>
                                            )}
                                            <Button 
                                                size="sm" 
                                                variant="secondary" 
                                                className="h-7 text-xs"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Avoid double toggle if handleRunClick is on parent
                                                    onViewRun?.(run);
                                                }}
                                            >
                                                View
                                            </Button>
                                        </div>
                                    </div>
                                ));
                            })()}
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

                <Dialog open={!!approvingRun} onOpenChange={(open) => !open && setApprovingRun(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-blue-600" />
                                Action Required
                            </DialogTitle>
                            <DialogDescription>
                                This workflow is paused at an approval step.
                            </DialogDescription>
                        </DialogHeader>
                        
                        {approvingRun && (
                            <div className="space-y-4 py-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border text-sm">
                                    <span className="font-bold text-[10px] text-muted-foreground uppercase block mb-1">Status</span>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="font-medium text-amber-600">Waiting for Approval</span>
                                    </div>
                                    
                                    <span className="font-bold text-[10px] text-muted-foreground uppercase block mb-1">Instructions</span>
                                    <div className="text-slate-600 dark:text-slate-300 italic">
                                        {(() => {
                                            try {
                                                const context = typeof approvingRun.current_context === 'string' ? JSON.parse(approvingRun.current_context) : approvingRun.current_context;
                                                const waitInfo = context?.wait_info;
                                                const stepName = waitInfo ? Object.keys(waitInfo)[0] : null;
                                                return waitInfo && stepName ? waitInfo[stepName]?.instructions : "Please review the workflow and decide to approve or reject.";
                                            } catch (e) {
                                                return "Please review the workflow and decide to approve or reject.";
                                            }
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="flex sm:justify-between gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50"
                                onClick={() => handleApprovalAction('reject')}
                                disabled={isActioning}
                            >
                                {isActioning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
                            </Button>
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleApprovalAction('resume')}
                                disabled={isActioning}
                            >
                                {isActioning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </ResizableSheetContent>
        </Sheet>
    );
}
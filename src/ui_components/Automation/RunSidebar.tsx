import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Check, X, ChevronRight, ChevronDown, ArrowLeft, History as HistoryIcon, RefreshCcw, Play, Zap } from "lucide-react";
import { type Node } from '@xyflow/react';
import { cn } from "@/lib/utils";
import { API_URL } from '../api/apiurl';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RunSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    nodes: Node[];
    socket?: any;
    flowId?: string;
}

type StepStatus = 'pending' | 'running' | 'success' | 'error';

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

export default function RunSidebar({ isOpen, onClose, nodes, socket, flowId }: RunSidebarProps) {
    const [results, setResults] = useState<Record<string, StepResult>>({});
    const [expandedStep, setExpandedStep] = useState<string | null>(null);
    
    // Track if there's an active run
    const [hasActiveRun, setHasActiveRun] = useState(false);
    const [runStartTime, setRunStartTime] = useState<Date | null>(null);
    const [runDuration, setRunDuration] = useState<number>(0);

    // History State
    const [view, setView] = useState<'live' | 'history' | 'detail'>('live');
    const [runHistory, setRunHistory] = useState<FlowRun[]>([]);
    const [selectedRun, setSelectedRun] = useState<FlowRun | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Initial simple linear sort of nodes for the list
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y).filter(n => n.type !== 'end' && !n.data.isPlaceholder);
    
    // Track active run status
    useEffect(() => {
        const activeRun = Object.values(results).some(result => 
            result.status === 'running' || result.status === 'success'
        );
        setHasActiveRun(activeRun);
        
        // Track run duration
        if (Object.values(results).some(r => r.status === 'running')) {
            if (!runStartTime) {
                setRunStartTime(new Date());
            }
        } else if (runStartTime && Object.values(results).every(r => r.status !== 'running')) {
            const endTime = new Date();
            const duration = endTime.getTime() - runStartTime.getTime();
            setRunDuration(duration);
        }
    }, [results, runStartTime]);

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
    };

    // Reset run state when closing or changing views
    const handleViewChange = (newView: 'live' | 'history' | 'detail') => {
        if (newView === 'history' || newView === 'detail') {
            setResults({});
            setRunStartTime(null);
            setRunDuration(0);
        }
        setView(newView);
    };

    // Derived results for rendering
    const displayResults = view === 'detail' && selectedRun ? (() => {
        const mapped: Record<string, StepResult> = {};
        const runRes = typeof selectedRun.result === 'string' ? JSON.parse(selectedRun.result) : selectedRun.result;
        
        sortedNodes.forEach(node => {
            let stepData = runRes && runRes[node.id];
            
            if (!stepData && runRes) {
                const triggerKeys = ['schedule', 'newEmail', 'newRow', 'webhook', 'trigger'];
                const foundKey = triggerKeys.find(k => runRes[k]);
                if (foundKey && sortedNodes.indexOf(node) === 0) {
                    stepData = runRes[foundKey];
                }
            }

            if (stepData) {
                mapped[node.id] = {
                    nodeId: node.id,
                    status: 'success',
                    output: stepData.data,
                    duration: 0 
                };
            }
        });
        return mapped;
    })() : results;

    useEffect(() => {
        if (socket) {
            const handleStepStart = (data: any) => {
                if (view !== 'live') handleViewChange('live');
                setRunStartTime(new Date());
                setRunDuration(0);
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
                setTimeout(() => {
                    setRunStartTime(null);
                }, 1000);
            };

            socket.on('step-run-start', handleStepStart);
            socket.on('step-run-finish', handleStepFinish);
            socket.on('run-complete', handleRunComplete);

            return () => {
                socket.off('step-run-start');
                socket.off('step-run-finish');
                socket.off('run-complete');
            };
        }
    }, [socket, view]);

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

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent side="left" className="w-full sm:max-w-md">
                <SheetHeader className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <SheetTitle className="text-xl">Workflow Activity</SheetTitle>
                            <SheetDescription className="mt-1">
                                {view === 'detail' && selectedRun 
                                    ? `Run Details • ${new Date(selectedRun.created_at).toLocaleDateString()}`
                                    : view === 'live'
                                    ? hasActiveRun
                                        ? `Running for ${formatDuration(runDuration)}`
                                        : "Ready for execution"
                                    : "View past executions"}
                            </SheetDescription>
                        </div>
                        
                    </div>

                    {/* Tabs */}
                    {view !== 'detail' && (
                        <div className="flex gap-2 mt-4">
                            <Button
                                variant={view === 'live' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleViewChange('live')}
                                className="flex-1 gap-2"
                            >
                                <RefreshCcw className={cn("h-4 w-4", view === 'live' && hasActiveRun && "animate-spin")} />
                                Current Run
                                {hasActiveRun && (
                                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 animate-pulse">
                                        ●
                                    </Badge>
                                )}
                            </Button>
                            <Button
                                variant={view === 'history' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => { handleViewChange('history'); fetchHistory(); }}
                                className="flex-1 gap-2"
                            >
                                <HistoryIcon className="h-4 w-4" />
                                History
                            </Button>
                        </div>
                    )}
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="px-6 space-y-6">
                        {view === 'detail' && (
                            <Button variant="ghost" size="sm" onClick={() => handleViewChange('history')} className="h-8 w-8 p-0 m-0 mb-2">
                                <ArrowLeft className="h-4 w-4" /> Back
                            </Button>
                        )}
                        {view === 'history' ? (
                            <div className="space-y-4">
                                {isLoadingHistory && (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin mb-3 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">Loading past runs...</p>
                                    </div>
                                )}
                                
                                {!isLoadingHistory && runHistory.length === 0 && (
                                    <div className="text-center py-12">
                                        <HistoryIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                        <h3 className="text-lg font-semibold mb-2">No History Found</h3>
                                        <p className="text-sm text-muted-foreground">This workflow hasn't recorded any past executions yet.</p>
                                    </div>
                                )}
                                
                                {runHistory.map(run => (
                                    <div 
                                        key={run.id}
                                        className="p-4 rounded-lg border bg-card hover:border-primary hover:shadow-sm transition-all cursor-pointer"
                                        onClick={() => handleRunClick(run)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-full flex items-center justify-center",
                                                    run.status === 'success' 
                                                        ? "bg-green-100 text-green-600"
                                                        : "bg-red-100 text-red-600"
                                                )}>
                                                    {run.status === 'success' 
                                                        ? <Check className="h-4 w-4" />
                                                        : <X className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">Run #{run.id.slice(0, 6)}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(run.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // LIVE / DETAIL VIEW
                            <div>
                                {view === 'live' && !hasActiveRun && (
                                    <div className="p-4 rounded-lg border bg-muted/30 mb-6">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-primary/10 rounded-md">
                                                <Zap className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold mb-1">No Active Run</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    This workflow hasn't started running yet. Trigger a run to see live execution here.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {sortedNodes.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Play className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                        <h3 className="text-lg font-semibold mb-2">No Steps Configured</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Add nodes to your builder to start seeing execution logs here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative border-l-2 border-muted ml-3 space-y-6">
                                        {sortedNodes.map((node, index) => {
                                            const result = displayResults[node.id];
                                            const status = result?.status || 'pending';
                                            
                                            return (
                                                <div key={node.id} className="ml-6 relative">
                                                    {/* Badge */}
                                                    <div className={cn(
                                                        "absolute -left-[31px] top-0 h-6 w-6 rounded-full border-2 flex items-center justify-center bg-background z-10",
                                                        status === 'pending' && "border-muted text-muted-foreground",
                                                        status === 'running' && "border-blue-500 text-blue-500",
                                                        status === 'success' && "border-green-500 bg-green-500 text-white",
                                                        status === 'error' && "border-red-500 bg-red-500 text-white"
                                                    )}>
                                                        {status === 'pending' && <span className="text-xs">{index + 1}</span>}
                                                        {status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
                                                        {status === 'success' && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                                                        {status === 'error' && <X className="h-3.5 w-3.5" strokeWidth={3} />}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div 
                                                            className={cn(
                                                                "flex items-center justify-between p-3 rounded-lg border bg-card transition-all cursor-pointer hover:border-primary/50",
                                                                expandedStep === node.id && "ring-2 ring-primary/20 border-primary"
                                                            )}
                                                            onClick={() => setExpandedStep(expandedStep === node.id ? null : node.id)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-medium text-sm">{node.data.label as string}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {status === 'success' && (
                                                                    <span className="text-xs text-muted-foreground">{result.duration}ms</span>
                                                                )}
                                                                {expandedStep === node.id ? (
                                                                    <ChevronDown className="h-4 w-4 text-muted-foreground"/>
                                                                ) : (
                                                                    <ChevronRight className="h-4 w-4 text-muted-foreground"/>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {expandedStep === node.id && (
                                                            <div className="rounded-lg bg-muted/50 p-3 text-xs font-mono overflow-x-auto">
                                                                <div className="mb-2 font-semibold text-muted-foreground uppercase tracking-wider">Output</div>
                                                                {status === 'pending' ? (
                                                                    <span className="text-muted-foreground italic">Waiting to run...</span>
                                                                ) : status === 'running' ? (
                                                                    <span className="text-blue-500 flex items-center gap-2">
                                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                                        Processing...
                                                                    </span>
                                                                ) : result?.output ? (
                                                                    <pre className="text-foreground whitespace-pre-wrap">
                                                                        {JSON.stringify(result.output, null, 2)}
                                                                    </pre>
                                                                ) : (
                                                                    <span className="text-muted-foreground italic">No output data available</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Quick Stats Footer */}
                {view === 'live' && sortedNodes.length > 0 && (
                    <div className="border-t p-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Steps</div>
                                <div className="text-lg font-bold">{sortedNodes.length}</div>
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed</div>
                                <div className="text-lg font-bold">
                                    {Object.values(displayResults).filter(r => r.status === 'success').length}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</div>
                                <div className={cn(
                                    "text-sm font-bold",
                                    hasActiveRun ? "text-primary" : "text-muted-foreground"
                                )}>
                                    {hasActiveRun ? "Running" : "Ready"}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
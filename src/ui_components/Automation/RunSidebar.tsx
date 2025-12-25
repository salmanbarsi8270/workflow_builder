import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, ChevronRight, ChevronDown } from "lucide-react";
import { type Node } from '@xyflow/react';
import { cn } from "@/lib/utils";

interface RunSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    nodes: Node[];
}

type StepStatus = 'pending' | 'running' | 'success' | 'error';

interface StepResult {
    nodeId: string;
    status: StepStatus;
    output: any;
    duration: number;
}

export default function RunSidebar({ isOpen, onClose, nodes }: RunSidebarProps) {
    const [results, setResults] = useState<Record<string, StepResult>>({});
    const [expandedStep, setExpandedStep] = useState<string | null>(null);

    // Initial simple linear sort of nodes for the list
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y).filter(n => n.type !== 'end' && !n.data.isPlaceholder);


    useEffect(() => {
        if (isOpen) {
             // Optional: Auto-start? Or wait for user. Let's wait for user to click "Test" again inside or just show previous?
             // User asked "run button click left slider model open to show the work runnug"
             // Implies it runs immediately or shows running state.
             setResults({});
             // We can let them click "Start Test" inside or auto-start.
        }
    }, [isOpen]);

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="left" className="w-[400px] sm:w-[540px] flex flex-col p-0">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle>Test Run</SheetTitle>
                    <SheetDescription>
                        Simulate your workflow execution to verify steps.
                    </SheetDescription>
                </SheetHeader>
                
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                        {sortedNodes.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10">
                                No Runs found. Add some steps to your workflow.
                            </div>
                        ) : (
                            <div className="relative border-l-2 border-muted ml-3 space-y-6">
                                {sortedNodes.map((node, index) => {
                                    const result = results[node.id];
                                    const status = result?.status || 'pending';
                                    
                                    return (
                                        <div key={node.id} className="ml-6 relative">
                                            {/* Badge */}
                                            <div className={cn(
                                                "absolute -left-[31px] top-0 h-6 w-6 rounded-full border-2 flex items-center justify-center bg-background z-10",
                                                status === 'pending' && "border-muted text-muted-foreground",
                                                status === 'running' && "border-blue-500 text-blue-500",
                                                status === 'success' && "border-green-500 bg-green-50 text-green-600",
                                                status === 'error' && "border-red-500 bg-red-50 text-red-600"
                                            )}>
                                                {status === 'pending' && <span className="text-xs">{index + 1}</span>}
                                                {status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
                                                {status === 'success' && <CheckCircle2 className="h-3 w-3" />}
                                                {status === 'error' && <XCircle className="h-3 w-3" />}
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
                                                         {/* Icon if available in data, else Generic */}
                                                         <span className="font-medium text-sm">{node.data.label as string}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {status === 'success' && <span className="text-xs text-muted-foreground">{result.duration}ms</span>}
                                                        {expandedStep === node.id ? <ChevronDown className="h-4 w-4 text-muted-foreground"/> : <ChevronRight className="h-4 w-4 text-muted-foreground"/>}
                                                    </div>
                                                </div>

                                                {expandedStep === node.id && (
                                                    <div className="rounded-lg bg-muted/50 p-3 text-xs font-mono overflow-x-auto">
                                                        <div className="mb-2 font-semibold text-muted-foreground uppercase tracking-wider">Output</div>
                                                        {status === 'pending' ? (
                                                            <span className="text-muted-foreground italic">Waiting to run...</span>
                                                        ) : status === 'running' ? (
                                                            <span className="text-blue-500">Processing...</span>
                                                        ) : (
                                                            <pre className="text-foreground">{JSON.stringify(result?.output, null, 2)}</pre>
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
                </ScrollArea>


            </SheetContent>
        </Sheet>
    );
}

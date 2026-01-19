import React, { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, AlertCircle, Clock, User, Bot, Sparkles, Copy, Brain, Award, Cpu, CreditCard, Tag, FileText, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

interface EvaluationDetailsSheetProps {
  evaluation: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EvaluationDetailsSheet({ evaluation, open, onOpenChange }: EvaluationDetailsSheetProps) {
    console.log('evaluation', evaluation);
  // Resize Logic
  const [width, setWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const savedWidth = localStorage.getItem('eval-sheet-width');
    if (savedWidth) {
       // Clamp between min and max reasonable widths
       const parsed = parseInt(savedWidth);
       setWidth(Math.max(400, Math.min(window.innerWidth - 50, parsed)));
    }
  }, []);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    localStorage.setItem('eval-sheet-width', width.toString());
  }, [width]);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - mouseMoveEvent.clientX;
      // Clamp width: min 400px, max window width - 50px
      if (newWidth > 500 && newWidth < window.innerWidth - 50) {
        setWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  if (!evaluation) return null;

  // Helper to parse 'scores' safely
  const parseScores = (scores: any) => {
    if (!scores) return null;
    try {
      const parsed = typeof scores === 'string' ? JSON.parse(scores) : scores;
      return parsed;
    } catch (e) {
      console.error("Failed to parse scores:", e);
      return null;
    }
  };

  const scoresData = parseScores(evaluation.scores);
  
  // Extract Reason
  const reason = evaluation.scores_reason || scoresData?.reason || scoresData?.object?.reason || scoresData?.helpfulness?.reason;
  
  // Extract Score
  const score = evaluation.score || scoresData?.score || scoresData?.object?.score || scoresData?.helpfulness?.score || 0;
  
  // Extract Input/Output
  const input = evaluation.result?.input || scoresData?.helpfulness?.input || (typeof evaluation.scores === 'string' ? '' : evaluation.scores?.helpfulness?.input) || evaluation.input || "No input provided";
  const output = evaluation.result?.output || evaluation.output || "No output response";

  // Extract Metadata (Tokens, Cost, Model) if available in 'scores' or 'scores.usage'
  const usage = scoresData?.usage;
  const metrics = scoresData?.providerMetadata?.openrouter; // Example structure from user request
  const reasoningDetails = metrics?.reasoning_details; // Thinking process (CoT)

  // Format Helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
      case 'failed': return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';
      default: return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
    }
  };

  const getScoreColor = (val: number) => {
    if (val >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (val >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="p-0 gap-0 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 flex flex-col h-full shadow-2xl transition-[width] duration-0"
        style={{ maxWidth: `${width}px`, width: `${width}px` }}
      >
        {/* Resize Handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 hover:w-2 bg-transparent hover:bg-blue-500/50 cursor-col-resize z-50 flex items-center justify-center group transition-all"
          onMouseDown={startResizing}
        >
           <div className="h-8 w-1 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-blue-500 transition-colors">
              <GripVertical className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity absolute -left-1" />
           </div>
        </div>
        
        {/* Header */}
        <SheetHeader className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 sticky top-0 z-10">
           <div className="flex items-start justify-between gap-4">
              <div>
                 <div className="flex items-center gap-2 mb-2">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize flex items-center gap-1.5", getStatusColor(evaluation.status))}>
                       {evaluation.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                       {evaluation.status === 'failed' && <XCircle className="w-3 h-3" />}
                       {evaluation.status !== 'completed' && evaluation.status !== 'failed' && <AlertCircle className="w-3 h-3" />}
                       {evaluation.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                       <Clock className="w-3 h-3" /> {formatDate(evaluation.created_at)}
                    </span>
                 </div>
                 <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">
                    {evaluation.name}
                 </SheetTitle>
                 <SheetDescription className="text-slate-500 line-clamp-2 text-xs">
                    {evaluation.description}
                 </SheetDescription>
              </div>
              
              {/* Score Display */}
              <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-white/5 min-w-[80px]">
                 <span className={cn("text-3xl font-black tabular-nums", getScoreColor(score))}>{score}</span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
              </div>
           </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 w-full overflow-y-auto">
           <div className="p-6 space-y-8">
              
              <Tabs defaultValue="results" className="w-full">
                 <TabsList className="w-full grid grid-cols-3 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl mb-6">
                    <TabsTrigger value="results" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm text-xs font-bold">Results</TabsTrigger>
                    <TabsTrigger value="thinking" disabled={!reasoningDetails} className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm text-xs font-bold disabled:opacity-50">Thinking Process</TabsTrigger>
                    <TabsTrigger value="metadata" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm text-xs font-bold">Metadata</TabsTrigger>
                 </TabsList>

                 {/* TAB: RESULTS */}
                 <TabsContent value="results" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    
                    {/* Input/Output Cards */}
                    <div className="space-y-4">
                       <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                             <div className="flex items-center gap-2 font-bold text-sm text-slate-700 dark:text-slate-200">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-md text-blue-600 dark:text-blue-400"><User className="w-4 h-4" /></div>
                                Input Prompt
                             </div>
                             <button onClick={() => { navigator.clipboard.writeText(input); toast.success("Copied input"); }} className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-md text-slate-400 hover:text-blue-600 transition-colors">
                                <Copy className="w-3.5 h-3.5" />
                             </button>
                          </div>
                          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50">
                             <p className="text-sm font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{input}</p>
                          </div>
                       </div>

                       <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
                          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                             <div className="flex items-center gap-2 font-bold text-sm text-slate-700 dark:text-slate-200">
                                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md text-emerald-600 dark:text-emerald-400"><Bot className="w-4 h-4" /></div>
                                Agent Response
                             </div>
                             <button onClick={() => { navigator.clipboard.writeText(output); toast.success("Copied output"); }} className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-md text-slate-400 hover:text-emerald-600 transition-colors">
                                <Copy className="w-3.5 h-3.5" />
                             </button>
                          </div>
                          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50">
                             <p className="text-sm font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{output}</p>
                          </div>
                       </div>
                    </div>

                    {/* Evaluation Logic */}
                    {reason && (
                       <div className="relative overflow-hidden rounded-xl border border-indigo-100 dark:border-indigo-500/20 bg-linear-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 p-5">
                          <div className="absolute top-0 right-0 p-3 opacity-5"><Award className="w-24 h-24" /></div>
                          <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2 relative z-10">
                             <Sparkles className="w-4 h-4" /> Evaluation Analysis
                          </h4>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed relative z-10">
                             {reason}
                          </p>
                       </div>
                    )}
                 </TabsContent>

                 {/* TAB: THINKING PROCESS */}
                 <TabsContent value="thinking" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {reasoningDetails && reasoningDetails.length > 0 ? (
                      reasoningDetails.map((item: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-xl p-4 font-mono text-xs border border-slate-200 dark:border-slate-800 shadow-xs">
                           <div className="flex items-center gap-2 mb-3 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                              <Brain className="w-3.5 h-3.5" />
                              <span className="uppercase font-bold tracking-widest text-[10px]">CoT Trace segment {idx + 1}</span>
                           </div>
                           <p className="whitespace-pre-wrap leading-relaxed opacity-90">{item.text || JSON.stringify(item)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                         <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
                         <p>No internal reasoning traces available for this run.</p>
                      </div>
                    )}
                 </TabsContent>

                 {/* TAB: METADATA */}
                 <TabsContent value="metadata" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    
                    {/* Model Info */}
                    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 p-5`}>
                       <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-blue-500" /> Model Configuration
                       </h4>
                       <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                             <p className="text-slate-500 text-xs mb-1">Agent Name</p>
                             <p className="font-medium">{evaluation.agent_name}</p>
                          </div>
                          <div>
                             <p className="text-slate-500 text-xs mb-1">Model ID</p>
                             <div className="flex items-center gap-2">
                                <span className="font-mono text-xs bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">{evaluation.agent_model || 'Unknown'}</span>
                             </div>
                          </div>
                          <div>
                             <p className="text-slate-500 text-xs mb-1">Run ID</p>
                             <p className="font-mono text-xs text-slate-400 truncate" title={evaluation.eval_id}>{evaluation.eval_id}</p>
                          </div>
                       </div>
                    </div>

                    {/* Token Usage Stats */}
                    {usage && (
                       <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 p-5">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                             <Tag className="w-4 h-4 text-emerald-500" /> Token Usage
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                             <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg text-center border border-slate-100 dark:border-white/5">
                                <p className="text-xs text-slate-500 mb-1">Input</p>
                                <p className="font-mono font-bold text-slate-700 dark:text-slate-300">{usage.inputTokens}</p>
                             </div>
                             <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg text-center border border-slate-100 dark:border-white/5">
                                <p className="text-xs text-slate-500 mb-1">Output</p>
                                <p className="font-mono font-bold text-slate-700 dark:text-slate-300">{usage.outputTokens}</p>
                             </div>
                             <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg text-center border border-slate-100 dark:border-white/5">
                                <p className="text-xs text-slate-500 mb-1">Total</p>
                                <p className="font-mono font-bold text-blue-600 dark:text-blue-400">{usage.totalTokens}</p>
                             </div>
                          </div>
                          {usage.cost !== undefined && (
                             <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                                <span className="text-xs text-slate-500 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Estimated Cost</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">${Number(usage.cost || 0).toFixed(6)}</span>
                             </div>
                          )}
                       </div>
                    )}

                    {/* Additional Metadata */}
                    {Object.keys(scoresData?.providerMetadata || {}).length > 0 && (
                       <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 p-5">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                             <FileText className="w-4 h-4 text-purple-500" /> Provider Metadata
                          </h4>
                          <pre className="text-[10px] bg-slate-50 dark:bg-slate-900 p-3 rounded-lg font-mono overflow-x-auto max-w-full break-words whitespace-pre-wrap">
                             {JSON.stringify(scoresData.providerMetadata, null, 2)}
                          </pre>
                       </div>
                    )}
                 </TabsContent>
              </Tabs>
           </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { ZapIcon } from "@hugeicons/core-free-icons";
import type { TopWorkflow } from './types';
import { cn } from "@/lib/utils";

interface TopWorkflowsProps {
    topWorkflows: TopWorkflow[];
}

export function TopWorkflows({ topWorkflows }: TopWorkflowsProps) {
    return (
        <Card className="col-span-4 lg:col-span-3 bg-white/70 dark:bg-white/5 backdrop-blur-xl border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl">
            <CardHeader className="pb-4">
                <CardTitle className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-blue-300/50 font-black">Performance</CardTitle>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Top Workflows</h3>
            </CardHeader>
            <CardContent className="space-y-3">
            {topWorkflows.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-300 group">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            <HugeiconsIcon icon={ZapIcon} className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{w.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">{w.runs} runs • {w.successRate}% success</p>
                        </div>
                    </div>
                    <Badge className={cn(
                        "rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest border",
                        w.status === 'active' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20" : 
                        "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-white/10"
                    )}>
                        {w.status}
                    </Badge>
                </div>
            ))}
            {topWorkflows.length === 0 && (
                <div className="py-12 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <HugeiconsIcon icon={ZapIcon} className="h-6 w-6 opacity-20" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No workflows found</p>
                </div>
            )}
            </CardContent>
        </Card>
    );
}

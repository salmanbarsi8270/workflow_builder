import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { X, CheckCheckIcon, Play } from "lucide-react";
import type { RecentRun } from './types';

interface RecentActivityProps {
    recentRuns: RecentRun[];
}

export function RecentActivity({ recentRuns }: RecentActivityProps) {
    return (
        <Card className="col-span-4 lg:col-span-4 bg-white/70 dark:bg-white/5 backdrop-blur-xl border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl">
            <CardHeader className="pb-4">
                <CardTitle className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-violet-300/50 font-black">Timeline</CardTitle>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Recent Activity</h3>
            </CardHeader>
            <CardContent>
            <div className="space-y-2">
                {recentRuns.map((run) => (
                <div key={run.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-white/10 group cursor-default">
                    <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110",
                        run.status.toLowerCase() === 'success' || run.status.toLowerCase() === 'completed' ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30" : 
                        run.status.toLowerCase() === 'running' || run.status.toLowerCase() === 'waiting' ? "bg-blue-500/10 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30" : 
                        "bg-rose-500/10 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30"
                    )}>
                    {
                        (run.status.toLowerCase() === 'success' || run.status.toLowerCase() === 'completed') ? <CheckCheckIcon className="h-5 w-5" /> : 
                        (run.status.toLowerCase() === 'running' || run.status.toLowerCase() === 'waiting') ? <Play className="h-5 w-5 fill-current" /> : 
                        <X className="h-5 w-5" />
                    }
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate">{run.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border",
                                run.status.toLowerCase() === 'success' || run.status.toLowerCase() === 'completed' ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20" : 
                                run.status.toLowerCase() === 'running' || run.status.toLowerCase() === 'waiting' ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20" : 
                                "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20"
                            )}>
                                {run.status}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• {run.trigger}</span>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[10px] font-black text-slate-400 dark:text-violet-300/50 uppercase tracking-widest">Just now</p>
                    </div>
                </div>
                ))}
                {recentRuns.length === 0 && (
                    <div className="py-12 text-center">
                        <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Play className="h-6 w-6 opacity-20" />
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No recent runs</p>
                    </div>
                )}
            </div>
            </CardContent>
        </Card>
    );
}

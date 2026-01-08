import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, AlertCircleIcon, PlayIcon, WorkflowCircle01Icon } from "@hugeicons/core-free-icons";
import type { DashboardStats as GlobalStats, WorkflowStats } from './types';

interface StatsCardsProps {
    isLoading: boolean;
    stats: GlobalStats;
    workflowStats: WorkflowStats;
}

export function StatsCards({ isLoading, stats, workflowStats }: StatsCardsProps) {
    const statsConfig = [
        {
          title: "Total Workflows",
          value: workflowStats.total.toString(),
          description: `${workflowStats.active} active now`,
          icon: WorkflowCircle01Icon,
          color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          border: "border-blue-200/50 dark:border-blue-500/20"
        },
        {
          title: "Successful Runs",
          value: stats.successfulRuns.toLocaleString(),
          description: `${stats.successRate}% success rate`,
          icon: CheckmarkCircle02Icon,
          color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          border: "border-emerald-200/50 dark:border-emerald-500/20"
        },
        {
          title: "Running Now",
          value: workflowStats.active.toString(),
          description: "Active executions",
          icon: PlayIcon,
          color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          border: "border-blue-200/50 dark:border-blue-500/20"
        },
        {
          title: "Failed Runs",
          value: stats.failedRuns.toString(),
          description: "Requires attention",
          icon: AlertCircleIcon,
          color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
          border: "border-rose-200/50 dark:border-rose-500/20"
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 shrink-0">
            {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border-slate-200 dark:border-white/10 rounded-2xl">
                    <CardContent className="p-6">
                        <Skeleton className="h-4 w-24 mb-4 bg-slate-200 dark:bg-white/10" />
                        <Skeleton className="h-8 w-16 bg-slate-200 dark:bg-white/10" />
                    </CardContent>
                </Card>
            ))
            ) : (
            statsConfig.map((stat, index) => (
                <Card key={index} className="overflow-hidden bg-white/70 dark:bg-white/5 backdrop-blur-xl border-slate-200 dark:border-white/10 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl border-b-4">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-blue-300/50 font-black">{stat.title}</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.description}</p>
                            </div>
                            <div className={cn(
                                "p-3 rounded-2xl bg-white/80 dark:bg-white/10 border border-white dark:border-white/10 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500",
                                stat.color
                            )}>
                                <HugeiconsIcon icon={stat.icon} className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))
            )}
        </div>
    );
}

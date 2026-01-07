import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
          color: "text-purple-500",
        },
        {
          title: "Successful Runs",
          value: stats.successfulRuns.toLocaleString(),
          description: `${stats.successRate}% success rate`,
          icon: CheckmarkCircle02Icon,
          color: "text-green-500",
        },
        {
          title: "Running Now",
          value: workflowStats.active.toString(),
          description: "Active executions",
          icon: PlayIcon,
          color: "text-blue-500",
        },
        {
          title: "Failed Runs",
          value: stats.failedRuns.toString(),
          description: "Requires attention",
          icon: AlertCircleIcon,
          color: "text-red-500",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}><CardContent className="p-6"><Skeleton className="h-4 w-24 mb-4"/><Skeleton className="h-8 w-16"/></CardContent></Card>
            ))
            ) : (
            statsConfig.map((stat, index) => (
                <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <HugeiconsIcon icon={stat.icon} className={cn("h-4 w-4", stat.color)} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
                </Card>
            ))
            )}
        </div>
    );
}

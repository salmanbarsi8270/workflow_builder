import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { X, CheckCheckIcon, Play } from "lucide-react";
import type { RecentRun } from './types';

interface RecentActivityProps {
    recentRuns: RecentRun[];
}

export function RecentActivity({ recentRuns }: RecentActivityProps) {
    return (
        <Card className="col-span-4 lg:col-span-4">
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
            <div className="space-y-4">
                {recentRuns.map((run) => (
                <div key={run.id} className="flex items-center gap-4">
                    <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-white",
                    run.status.toLowerCase() === 'success' || run.status.toLowerCase() === 'completed' ? "bg-green-500" : 
                    run.status.toLowerCase() === 'running' || run.status.toLowerCase() === 'waiting' ? "bg-blue-500" : 
                    "bg-red-500"
                    )}>
                    {
                        (run.status.toLowerCase() === 'success' || run.status.toLowerCase() === 'completed') ? <CheckCheckIcon className="h-4 w-4" /> : 
                        (run.status.toLowerCase() === 'running' || run.status.toLowerCase() === 'waiting') ? <Play className="h-4 w-4" /> : 
                        <X className="h-4 w-4" />
                    }
                    </div>
                    <div className="flex-1">
                    <p className="text-sm font-medium">{run.name}</p>
                    <p className="text-xs text-muted-foreground">{run.status} • {run.trigger}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Recently</p>
                    </div>
                </div>
                ))}
                {recentRuns.length === 0 && <p className="text-center py-4 text-muted-foreground">No recent runs</p>}
            </div>
            </CardContent>
        </Card>
    );
}

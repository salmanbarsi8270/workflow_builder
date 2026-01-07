import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import { Database01Icon } from "@hugeicons/core-free-icons";
import type { DashboardStats } from './types';

interface HealthStatsProps {
    stats: DashboardStats;
}

export function HealthStats({ stats }: HealthStatsProps) {
    return (
        <Card className="col-span-4 lg:col-span-2">
            <CardHeader><CardTitle>Health</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="font-semibold text-green-500">{stats.successRate}%</span>
                </div>
                <Progress value={stats.successRate} className="h-2" />
                </div>
                
                <Separator />

                <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <HugeiconsIcon icon={Database01Icon} className="h-4 w-4" />
                    </div>
                    <div>
                    <p className="text-sm font-medium">Most Used App</p>
                    <p className="text-xs text-muted-foreground">{stats.mostUsedApp}</p>
                    </div>
                </div>
                </div>
            </CardContent>
        </Card>
    );
}

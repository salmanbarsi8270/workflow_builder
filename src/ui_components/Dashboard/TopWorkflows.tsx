import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { ZapIcon } from "@hugeicons/core-free-icons";
import type { TopWorkflow } from './types';

interface TopWorkflowsProps {
    topWorkflows: TopWorkflow[];
}

export function TopWorkflows({ topWorkflows }: TopWorkflowsProps) {
    return (
        <Card className="col-span-4 lg:col-span-3">
            <CardHeader><CardTitle>Top Workflows</CardTitle></CardHeader>
            <CardContent className="space-y-4">
            {topWorkflows.map((w) => (
                <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <HugeiconsIcon icon={ZapIcon} className="h-4 w-4" />
                    </div>
                    <div>
                    <p className="text-sm font-medium">{w.name}</p>
                    <p className="text-xs text-muted-foreground">{w.runs} runs • {w.successRate}% success</p>
                    </div>
                </div>
                <Badge variant={w.status === 'active' ? 'default' : 'secondary'}>{w.status}</Badge>
                </div>
            ))}
            {topWorkflows.length === 0 && <p className="text-center py-4 text-muted-foreground">No workflows found</p>}
            </CardContent>
        </Card>
    );
}

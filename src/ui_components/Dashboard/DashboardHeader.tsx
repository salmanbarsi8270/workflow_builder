import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Refresh01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";

interface DashboardHeaderProps {
    onRefresh: () => void;
    onNewWorkflow: () => void;
}

export function DashboardHeader({ onRefresh, onNewWorkflow }: DashboardHeaderProps) {
    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
            <h2 className="text-3xl font-bold tracking-tight">Workflow Dashboard</h2>
            <p className="text-muted-foreground mt-1">Monitor and manage your automations in real-time</p>
            </div>
            <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={onRefresh}>
                <HugeiconsIcon icon={Refresh01Icon} className="h-4 w-4" />
            </Button>
            <Button onClick={onNewWorkflow}>
                <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
                New Workflow
            </Button>
            </div>
        </div>
    );
}

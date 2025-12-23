import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type Node } from '@xyflow/react';
import GmailForm from "../Connections/GmailForm";
import GoogleSheetForm from "../Connections/GoogleSheetForm";
import ScheduleForm from "../Utility/ScheduleForm";

const Forms: Record<string, any> = {
    'Gmail': GmailForm,
    'Google Sheets': GoogleSheetForm,
    'Schedule': ScheduleForm
};

interface RightGenericSidebarProps {
    selectedNode: Node | undefined;
    onUpdateNode: (label: string, data?: any) => void;
    onDeleteNode: () => void;
    onClose: () => void;
}

export default function RightGenericSidebar({ selectedNode, onUpdateNode, onDeleteNode }: RightGenericSidebarProps) {
    if (!selectedNode) return null;

    const appName = selectedNode.data.appName as string;
    const actionName = selectedNode.data.actionName as string; // From the new StepSelector data
    const SpecificForm = Forms[appName];

    const handleDataUpdate = (newData: any) => {
        // Preserve label/icon/appName, update key-value pairs
        onUpdateNode((selectedNode.data as any).label, newData);
    };

    return (
        <div className="w-80 border-l bg-card p-4 flex flex-col gap-6 animate-in slide-in-from-right duration-300 h-full overflow-y-auto">
            <div>
                <h3 className="text-lg font-semibold mb-1">
                    {actionName || 'Edit Step'}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {appName ? `Configure ${appName}` : 'Configure this step.'}
                </p>
            </div>

            <div className="grid gap-2">
                <Label>Label</Label>
                <Input disabled
                    value={(selectedNode?.data as { label: string }).label || ''}
                    onChange={(e) => onUpdateNode(e.target.value)}
                />
            </div>

            {SpecificForm ? (
                <SpecificForm data={selectedNode.data} onUpdate={handleDataUpdate} />
            ) : (
                <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                    No configuration available for this app yet.
                </div>
            )}

            <div className="mt-auto pt-4">
                <Button variant="destructive" className="w-full" onClick={onDeleteNode}>
                    Delete Step
                </Button>
            </div>
        </div>
    );
}

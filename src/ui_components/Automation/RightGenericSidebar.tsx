import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type Node } from '@xyflow/react';
import GmailForm from "../Connections/GmailForm";
import GoogleSheetForm from "../Connections/GoogleSheetForm";
import ScheduleForm from "../Utility/ScheduleForm";
import GenericActionForm from "./GenericActionForm";
import { APP_DEFINITIONS } from "./ActionDefinitions";

import GoogleDocsForm from "../Connections/GoogleDocsForm";
import GoogleDriveForm from "../Connections/GoogleDriveForm";

const SpecificForms: Record<string, any> = {
    'Gmail': GmailForm,
    'Google Sheets': GoogleSheetForm,
    'Schedule': ScheduleForm,
    'Google Docs': GoogleDocsForm,
    'Google Drive': GoogleDriveForm
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
    const actionId = selectedNode.data.actionId as string;
    const actionName = selectedNode.data.actionName as string; 
    
    // 1. Try to find a specific form override (e.g. customized UI)
    // NOTE: You might want to remove SpecificForms for 'Gmail'/'Sheets' if you want them to use the Generic schema-driven form instead
    // For now, I'll prefer the Generic one for the *new* Apps, but keep Specific for existing if desired. 
    // Actually, to fully "fix" the schema compliance, let's use the GenericForm if parameters exist.
    
    let FormComponent = SpecificForms[appName];
    
    // Search for the definition to get parameters
    const appDef = APP_DEFINITIONS.find(a => a.name === appName || a.id === selectedNode.data.icon); // Icon often holds category/ID logic
    const actionDef = appDef?.actions.find(a => a.id === actionId);
    
    // If we have definitions but no specific form, OR if we want to force generic for consistency:
    if (!FormComponent && actionDef?.parameters) {
        FormComponent = GenericActionForm;
    }

    // fallback if still nothing
    if (!FormComponent && appName) {
         // Could assume nothing content 
    }

    const handleDataUpdate = (newData: any) => {
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
                {actionDef?.description && (
                    <p className="text-xs text-muted-foreground mt-1 border-t pt-1">
                        {actionDef.description}
                    </p>
                )}
            </div>

            <div className="grid gap-2">
                <Label>Label</Label>
                <Input 
                    value={(selectedNode?.data as { label: string }).label || ''}
                    onChange={(e) => onUpdateNode(e.target.value)}
                />
            </div>

            {FormComponent ? (
                <FormComponent 
                    data={selectedNode.data} 
                    onUpdate={handleDataUpdate} 
                    parameters={actionDef?.parameters || []} // Pass parameters if GenericForm uses them
                />
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

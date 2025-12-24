import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type Node } from '@xyflow/react';
import { toast } from "sonner";
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
    isLoading?: boolean;
}

export default function RightGenericSidebar({ selectedNode, onUpdateNode, onDeleteNode, isLoading }: RightGenericSidebarProps) {
    const [localLabel, setLocalLabel] = useState('');
    const [localParams, setLocalParams] = useState<any>({});

    useEffect(() => {
        if (selectedNode) {
            setLocalLabel(selectedNode.data.label as string || '');
            
            // --- Data Migration & Sync Logic ---
            const existingParams = selectedNode.data.params || {};
            const migratedParams = { ...existingParams } as any;

            // Support migration from old top-level fields to nested params
            // This fixes the "Gmail values not showing" if they were saved in the old structure
            const legacyFields = ['to', 'subject', 'body', 'spreadsheetId', 'sheetName', 'fileId', 'title', 'documentId', 'text', 'intervalMinutes', 'connection'];
            const nodeData = selectedNode.data as any;
            legacyFields.forEach(field => {
                if (nodeData[field] !== undefined && migratedParams[field] === undefined) {
                    migratedParams[field] = nodeData[field];
                }
            });

            setLocalParams(migratedParams);
        }
    }, [selectedNode?.id, selectedNode?.data]); // Re-run if ID or data changes

    if (!selectedNode) return null;

    const appName = selectedNode.data.appName as string;
    const actionId = selectedNode.data.actionId as string;
    const actionName = selectedNode.data.actionName as string; 
    
    // Search for the definition to get parameters
    const appDef = APP_DEFINITIONS.find(a => a.name === appName || a.id === selectedNode.data.icon);
    const actionDef = appDef?.actions.find(a => a.id === actionId);

    let FormComponent = SpecificForms[appName];
    if (!FormComponent && actionDef?.parameters) {
        FormComponent = GenericActionForm;
    }

    const handleSave = () => {
        if (isLoading) return;

        // Validation
        if (actionDef?.parameters) {
            for (const param of actionDef.parameters) {
                if (param.required && !localParams[param.name]) {
                    toast.error(`${param.label} is required`);
                    return;
                }
            }
        }

        onUpdateNode(localLabel, { 
            ...selectedNode.data, 
            label: localLabel, 
            params: localParams 
        });
        toast.success("Changes saved successfully");
    };

    return (
        <div className="w-80 border-l bg-card p-4 flex flex-col gap-6 animate-in slide-in-from-right duration-300 h-full overflow-y-auto">
            <div>
                <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
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
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Step Label</Label>
                <Input 
                    value={localLabel}
                    onChange={(e) => setLocalLabel(e.target.value)}
                    placeholder="Enter step label"
                />
            </div>

            <div className="flex flex-col gap-4 border-t pt-4">
                {FormComponent ? (
                    <FormComponent 
                        data={selectedNode.data} 
                        params={localParams}
                        onChange={setLocalParams} 
                        parameters={actionDef?.parameters || []}
                    />
                ) : (
                    <div className="p-4 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                        No configuration available for this app yet.
                    </div>
                )}
            </div>

            <div className="mt-auto pt-6 flex flex-col gap-2">
                <Button onClick={handleSave} className="w-full">
                    Save Changes
                </Button>
                <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDeleteNode}>
                    Delete Step
                </Button>
            </div>
        </div>
    );
}

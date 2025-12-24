import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ConnectionSelector from "./ConnectionSelector"

export default function GoogleDriveForm({ data, params, onChange, disabled }: { data: any, params: any, onChange: (params: any) => void, disabled?: boolean }) {
    const handleChange = (field: string, value: any) => {
        onChange({ ...params, [field]: value });
    };

    const action = data.actionId;

    return (
        <div className="flex flex-col gap-4">
             <div className="grid gap-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Connection</Label>
                <ConnectionSelector 
                    appName="Google Drive" 
                    value={params.connection || ''} 
                    onChange={(val) => handleChange('connection', val)} 
                    disabled={disabled}
                />
            </div>

            {action === 'listFiles' && (
                <div className="grid gap-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Page Size</Label>
                    <Input 
                        type="number"
                        value={params.pageSize || 10} 
                        onChange={(e) => handleChange('pageSize', Number(e.target.value))} 
                        placeholder="10"
                        disabled={disabled}
                    />
                </div>
            )}

            {action === 'createFolder' && (
                 <div className="grid gap-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Folder Name</Label>
                    <Input 
                        value={params.name || ''} 
                        onChange={(e) => handleChange('name', e.target.value)} 
                        placeholder="New Folder Name"
                        disabled={disabled}
                    />
                </div>
            )}
             {!action && (
                <div className="text-sm text-muted-foreground italic">Select an action (List/Create) to see fields.</div>
            )}
        </div>
    );
}

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ConnectionSelector from "./ConnectionSelector"

export default function GoogleDriveForm({ data, onUpdate }: { data: any, onUpdate: (data: any) => void }) {
    const handleChange = (field: string, value: any) => {
        onUpdate({ ...data, [field]: value });
    };

    const action = data.actionId;

    return (
        <div className="flex flex-col gap-4">
             <div className="grid gap-2">
                <Label>Connection</Label>
                <ConnectionSelector 
                    appName="Google Drive" 
                    value={data.connection || ''} 
                    onChange={(val) => handleChange('connection', val)} 
                />
            </div>

            {action === 'listFiles' && (
                <div className="grid gap-2">
                    <Label>Page Size</Label>
                    <Input 
                        type="number"
                        value={data.pageSize || 10} 
                        onChange={(e) => handleChange('pageSize', Number(e.target.value))} 
                        placeholder="10"
                    />
                </div>
            )}

            {action === 'createFolder' && (
                 <div className="grid gap-2">
                    <Label>Folder Name</Label>
                    <Input 
                        value={data.name || ''} 
                        onChange={(e) => handleChange('name', e.target.value)} 
                        placeholder="New Folder Name"
                    />
                </div>
            )}
             {!action && (
                <div className="text-sm text-muted-foreground">Select an action (List/Create) to see fields.</div>
            )}
        </div>
    );
}

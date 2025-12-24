import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ConnectionSelector from "./ConnectionSelector"

export default function GoogleDocsForm({ data, params, onChange, disabled }: { data: any, params: any, onChange: (params: any) => void, disabled?: boolean }) {
    const handleChange = (field: string, value: string) => {
        onChange({ ...params, [field]: value });
    };

    const action = data.actionId; // 'createDocument' or 'appendText'

    return (
        <div className="flex flex-col gap-4">
             <div className="grid gap-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Connection</Label>
                <ConnectionSelector 
                    appName="Google Docs" 
                    value={params.connection || ''} 
                    onChange={(val) => handleChange('connection', val)} 
                    disabled={disabled}
                />
            </div>

            {action === 'createDocument' && (
                <div className="grid gap-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Title</Label>
                    <Input 
                        value={params.title || ''} 
                        onChange={(e) => handleChange('title', e.target.value)} 
                        placeholder="New Document Title"
                        disabled={disabled}
                    />
                </div>
            )}

            {action === 'appendText' && (
                <>
                    <div className="grid gap-2">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Document ID</Label>
                        <Input 
                            value={params.documentId || ''} 
                            onChange={(e) => handleChange('documentId', e.target.value)} 
                            placeholder="Enter Document ID"
                            disabled={disabled}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Text to Append</Label>
                         <Textarea 
                            value={params.text || ''} 
                            onChange={(e) => handleChange('text', e.target.value)} 
                            placeholder="Content to append..."
                            className="min-h-[100px]"
                            disabled={disabled}
                        />
                    </div>
                </>
            )}
             {!action && (
                <div className="text-sm text-muted-foreground italic">Select an action (Create/Append) to see fields.</div>
            )}
        </div>
    );
}

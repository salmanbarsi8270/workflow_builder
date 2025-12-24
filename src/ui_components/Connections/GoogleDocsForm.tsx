import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ConnectionSelector from "./ConnectionSelector"

export default function GoogleDocsForm({ data, onUpdate }: { data: any, onUpdate: (data: any) => void }) {
    const handleChange = (field: string, value: string) => {
        onUpdate({ ...data, [field]: value });
    };

    const action = data.actionId; // 'createDocument' or 'appendText'

    return (
        <div className="flex flex-col gap-4">
             <div className="grid gap-2">
                <Label>Connection</Label>
                <ConnectionSelector 
                    appName="Google Docs" 
                    value={data.connection || ''} 
                    onChange={(val) => handleChange('connection', val)} 
                />
            </div>

            {action === 'createDocument' && (
                <div className="grid gap-2">
                    <Label>Title</Label>
                    <Input 
                        value={data.title || ''} 
                        onChange={(e) => handleChange('title', e.target.value)} 
                        placeholder="New Document Title"
                    />
                </div>
            )}

            {action === 'appendText' && (
                <>
                    <div className="grid gap-2">
                        <Label>Document ID</Label>
                        <Input 
                            value={data.documentId || ''} 
                            onChange={(e) => handleChange('documentId', e.target.value)} 
                            placeholder="Enter Document ID"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Text to Append</Label>
                         <Textarea 
                            value={data.text || ''} 
                            onChange={(e) => handleChange('text', e.target.value)} 
                            placeholder="Content to append..."
                            className="min-h-[100px]"
                        />
                    </div>
                </>
            )}
             {!action && (
                <div className="text-sm text-muted-foreground">Select an action (Create/Append) to see fields.</div>
            )}
        </div>
    );
}

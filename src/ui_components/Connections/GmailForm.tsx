import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ConnectionSelector from "./ConnectionSelector"

export default function GmailForm({ params, onChange, disabled }: { params: any, onChange: (params: any) => void, disabled?: boolean }) {
    const handleChange = (field: string, value: string) => {
        onChange({ ...params, [field]: value });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Connection</Label>
                <ConnectionSelector 
                    appName="Gmail" 
                    value={params.connection || ''} 
                    onChange={(val) => handleChange('connection', val)} 
                    disabled={disabled}
                />
            </div>

            <div className="grid gap-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">To</Label>
                <Input 
                    value={params.to || ''} 
                    onChange={(e) => handleChange('to', e.target.value)} 
                    placeholder="recipient@example.com"
                    disabled={disabled}
                />
            </div>

            <div className="grid gap-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Subject</Label>
                <Input 
                    value={params.subject || ''} 
                    onChange={(e) => handleChange('subject', e.target.value)} 
                    placeholder="Email Subject"
                    disabled={disabled}
                />
            </div>

            <div className="grid gap-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Body</Label>
                <Textarea 
                    value={params.body || ''} 
                    onChange={(e) => handleChange('body', e.target.value)} 
                    placeholder="Email content..."
                    className="min-h-[100px]"
                    disabled={disabled}
                />
            </div>
        </div>
    );
}

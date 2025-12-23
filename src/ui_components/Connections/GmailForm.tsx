import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function GmailForm({ data, onUpdate }: { data: any, onUpdate: (data: any) => void }) {
    const handleChange = (field: string, value: string) => {
        onUpdate({ ...data, [field]: value });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-2">
                <Label>Connection</Label>
                <Select value={data.connection || ''} onValueChange={(val) => handleChange('connection', val)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select connection..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="new">+ New Connection</SelectItem>
                        <SelectItem value="account-1">salman@example.com</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label>To</Label>
                <Input 
                    value={data.to || ''} 
                    onChange={(e) => handleChange('to', e.target.value)} 
                    placeholder="recipient@example.com"
                />
            </div>

            <div className="grid gap-2">
                <Label>Subject</Label>
                <Input 
                    value={data.subject || ''} 
                    onChange={(e) => handleChange('subject', e.target.value)} 
                    placeholder="Email Subject"
                />
            </div>

            <div className="grid gap-2">
                <Label>Body</Label>
                <Textarea 
                    value={data.body || ''} 
                    onChange={(e) => handleChange('body', e.target.value)} 
                    placeholder="Email content..."
                    className="min-h-[100px]"
                />
            </div>
        </div>
    );
}

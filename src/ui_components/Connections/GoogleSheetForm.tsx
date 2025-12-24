import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import ConnectionSelector from "./ConnectionSelector"

export default function GoogleSheetForm({ params, onChange, disabled }: { params: any, onChange: (params: any) => void, disabled?: boolean }) {
    const handleChange = (field: string, value: string) => {
        onChange({ ...params, [field]: value });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Connection</Label>
                <ConnectionSelector 
                    appName="Google Sheets" 
                    value={params.connection || ''} 
                    onChange={(val) => handleChange('connection', val)} 
                    disabled={disabled}
                />
            </div>

            <div className="grid gap-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Spreadsheet ID</Label>
                <Input 
                    value={params.spreadsheetId || ''} 
                    onChange={(e) => handleChange('spreadsheetId', e.target.value)} 
                    placeholder="Enter Spreadsheet ID"
                    disabled={disabled}
                />
            </div>

            <div className="grid gap-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Sheet Name</Label>
                <Input 
                    value={params.sheetName || ''} 
                    onChange={(e) => handleChange('sheetName', e.target.value)} 
                    placeholder="Sheet1"
                    disabled={disabled}
                />
            </div>

            <div className="grid gap-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Action</Label>
                <Select value={params.actionId || 'appendRow'} onValueChange={(val) => handleChange('actionId', val)} disabled={disabled}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="appendRow">Append Row</SelectItem>
                        <SelectItem value="getValues">Get Values</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

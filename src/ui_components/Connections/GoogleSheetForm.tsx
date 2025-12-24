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

export default function GoogleSheetForm({ data, onUpdate }: { data: any, onUpdate: (data: any) => void }) {
    const handleChange = (field: string, value: string) => {
        onUpdate({ ...data, [field]: value });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-2">
                <Label>Connection</Label>
                <ConnectionSelector 
                    appName="Google Sheets" 
                    value={data.connection || ''} 
                    onChange={(val) => handleChange('connection', val)} 
                />
            </div>

            <div className="grid gap-2">
                <Label>Spreadsheet ID</Label>
                <Input 
                    value={data.spreadsheetId || ''} 
                    onChange={(e) => handleChange('spreadsheetId', e.target.value)} 
                    placeholder="Enter Spreadsheet ID"
                />
            </div>

            <div className="grid gap-2">
                <Label>Sheet Name</Label>
                <Input 
                    value={data.sheetName || ''} 
                    onChange={(e) => handleChange('sheetName', e.target.value)} 
                    placeholder="Sheet1"
                />
            </div>

            <div className="grid gap-2">
                <Label>Action</Label>
                <Select value={data.action || 'create_row'} onValueChange={(val) => handleChange('action', val)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="create_row">Create Row</SelectItem>
                        <SelectItem value="update_row">Update Row</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

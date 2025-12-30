import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { type Node } from '@xyflow/react';
import { VariablePicker } from "../Automation/GenericActionForm"


export default function ScheduleForm({ data, params, onChange, disabled, nodes, nodeId }: { data: any, params: any, onChange: (params: any) => void, disabled?: boolean, nodes: Node[], nodeId?: string }) {
    const triggerType = data.actionId || 'schedule';

    const handleChange = (field: string, value: any) => {
        onChange({ ...params, [field]: value });
    };

    const handleVariableSelect = (field: string, variable: string) => {
        const currentValue = params[field] || '';
        handleChange(field, currentValue + variable);
    };


    return (
        <div className="flex flex-col gap-4">
             {triggerType === 'schedule' && (
                 <div className="grid gap-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Interval Type</Label>
                    <Select 
                        value={params.intervalType || 'minutes'} 
                        onValueChange={(val) => handleChange('intervalType', val)}
                        disabled={disabled}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select interval type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="minutes">Minutes</SelectItem>
                            <SelectItem value="hours">Hours</SelectItem>
                            <SelectItem value="days">Days</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
             )}

             {(!params.intervalType || params.intervalType === 'minutes') && (
                 <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Interval (Minutes)</Label>
                    </div>
                    <Input 
                        type="text" 
                        placeholder="e.g. 15"
                        value={params.intervalMinutes || ''}
                        onChange={(e) => handleChange('intervalMinutes', e.target.value)}
                        disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">Valid value between 1 to 59.</p>
                 </div>
             )}

             {params.intervalType === 'hours' && (
                 <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Interval (Hours)</Label>
                        <VariablePicker
                            nodes={nodes}
                            onSelect={(v) => handleVariableSelect('intervalHours', v)}
                            currentNodeId={nodeId}
                        />
                    </div>
                    <Input 
                        type="text" 
                        placeholder="e.g. 1"
                        value={params.intervalHours || ''}
                        onChange={(e) => handleChange('intervalHours', e.target.value)}
                        disabled={disabled}
                    />
                 </div>
             )}

             {params.intervalType === 'days' && (
                 <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Interval (Days)</Label>
                        <VariablePicker
                            nodes={nodes}
                            onSelect={(v) => handleVariableSelect('intervalDay', v)}
                            currentNodeId={nodeId}
                        />
                    </div>
                    <Input 
                        type="text" 
                        placeholder="e.g. 1"
                        value={params.intervalDay || ''}
                        onChange={(e) => handleChange('intervalDay', e.target.value)}
                        disabled={disabled}
                    />
                 </div>
             )}

             {triggerType === 'every_hour' && (
                 <div className="p-2 text-sm text-muted-foreground bg-muted rounded border border-dashed text-center italic">
                     Triggers once every hour.
                 </div>
             )}
        </div>
    );
}

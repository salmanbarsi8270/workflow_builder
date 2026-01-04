import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { type Node, type Edge } from '@xyflow/react';
import { VariablePicker } from "../Automation/components/VariablePicker"

export default function ScheduleForm({ data, params, onChange, disabled, nodes, edges, nodeId }: { data: any, params: any, onChange: (params: any) => void, disabled?: boolean, nodes: Node[], edges: Edge[], nodeId?: string }) {
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
                 <>
                 <div className="grid gap-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                        Interval Type <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                        value={params.intervalType || 'minutes'} 
                        onValueChange={(val) => handleChange('intervalType', val)}
                        disabled={disabled}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select interval type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="minutes">Minutes</SelectItem>
                            <SelectItem value="hours">Hours</SelectItem>
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="once">Once (Specific Date/Time)</SelectItem>
                            <SelectItem value="daily">Daily (Specific Time)</SelectItem>
                            <SelectItem value="weekly">Weekly (Specific Day/Time)</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>

                  {(params.intervalType === 'once') && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                                Execution Date <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                type="date" 
                                required
                                value={params.executionDate || ''}
                                onChange={(e) => handleChange('executionDate', e.target.value)}
                                disabled={disabled}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                                Execution Time <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                                type="time" 
                                required
                                value={params.executionTime || ''}
                                onChange={(e) => handleChange('executionTime', e.target.value)}
                                disabled={disabled}
                            />
                        </div>
                    </div>
                 )}
                 </>
             )}

             {(params.intervalType === 'daily' || params.intervalType === 'weekly') && (
                 <div className="grid gap-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                        Execution Time <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                        type="time" 
                        required
                        value={params.executionTime || ''}
                        onChange={(e) => handleChange('executionTime', e.target.value)}
                        disabled={disabled}
                    />
                 </div>
             )}

             {params.intervalType === 'weekly' && (
                 <div className="grid gap-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                        Day of Week <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                        value={params.dayOfWeek || 'monday'} 
                        onValueChange={(val) => handleChange('dayOfWeek', val)}
                        disabled={disabled}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monday">Monday</SelectItem>
                            <SelectItem value="tuesday">Tuesday</SelectItem>
                            <SelectItem value="wednesday">Wednesday</SelectItem>
                            <SelectItem value="thursday">Thursday</SelectItem>
                            <SelectItem value="friday">Friday</SelectItem>
                            <SelectItem value="saturday">Saturday</SelectItem>
                            <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
             )}

             {(!params.intervalType || params.intervalType === 'minutes') && (
                 <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                            Interval (Minutes) <span className="text-red-500">*</span>
                        </Label>
                    </div>
                    <Input 
                        type="text" 
                        placeholder="e.g. 15"
                        value={params.intervalMinutes || ''}
                        onChange={(e) => handleChange('intervalMinutes', e.target.value)}
                        disabled={disabled}
                        required
                    />
                    <p className="text-xs text-muted-foreground">Valid value between 1 to 59.</p>
                 </div>
             )}

             {params.intervalType === 'hours' && (
                 <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                            Interval (Hours) <span className="text-red-500">*</span>
                        </Label>
                        <VariablePicker
                            nodes={nodes}
                            edges={edges}
                            onSelect={(v: string) => handleVariableSelect('intervalHours', v)}
                            currentNodeId={nodeId}
                        />
                    </div>
                    <Input 
                        type="text" 
                        placeholder="e.g. 1"
                        value={params.intervalHours || ''}
                        onChange={(e) => handleChange('intervalHours', e.target.value)}
                        disabled={disabled}
                        required
                    />
                 </div>
             )}

             {params.intervalType === 'days' && (
                 <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                            Interval (Days) <span className="text-red-500">*</span>
                        </Label>
                        <VariablePicker
                            nodes={nodes}
                            edges={edges}
                            onSelect={(v: string) => handleVariableSelect('intervalDay', v)}
                            currentNodeId={nodeId}
                        />
                    </div>
                    <Input 
                        type="text" 
                        placeholder="e.g. 1"
                        value={params.intervalDay || ''}
                        onChange={(e) => handleChange('intervalDay', e.target.value)}
                        disabled={disabled}
                        required
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

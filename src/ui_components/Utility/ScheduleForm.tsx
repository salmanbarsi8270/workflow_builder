import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


export default function ScheduleForm({ data, params, onChange, disabled }: { data: any, params: any, onChange: (params: any) => void, disabled?: boolean }) {
    const triggerType = data.actionId || 'schedule';

    const handleChange = (field: string, value: any) => {
        onChange({ ...params, [field]: value });
    };

    return (
        <div className="flex flex-col gap-4">
             {(!params.intervalType || params.intervalType === 'minutes') && (
                 <div className="grid gap-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Interval (Minutes)</Label>
                    <Input 
                        type="number" 
                        placeholder="e.g. 15"
                        value={params.intervalMinutes || ''}
                        onChange={(e) => handleChange('intervalMinutes', Number(e.target.value))}
                        disabled={disabled}
                    />
                    <p className="text-xs text-muted-foreground">Valid value between 1 to 59.</p>
                 </div>
             )}

             {params.intervalType === 'hours' && (
                 <div className="grid gap-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Interval (Hours)</Label>
                    <Input 
                        type="number" 
                        placeholder="e.g. 1"
                        value={params.intervalHours || ''}
                        onChange={(e) => handleChange('intervalHours', Number(e.target.value))}
                        disabled={disabled}
                    />
                 </div>
             )}

             {params.intervalType === 'days' && (
                 <div className="grid gap-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Interval (Days)</Label>
                    <Input 
                        type="number" 
                        placeholder="e.g. 1"
                        value={params.intervalDay || ''}
                        onChange={(e) => handleChange('intervalDay', Number(e.target.value))}
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

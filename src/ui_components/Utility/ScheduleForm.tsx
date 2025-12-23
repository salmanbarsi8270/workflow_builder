import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


export default function ScheduleForm({ data, onUpdate }: { data: any, onUpdate: (data: any) => void }) {
    const triggerType = data.actionId || 'every_x_minutes'; // Default

    return (
        <div className="flex flex-col gap-4">
             {/* Dynamic fields based on specific schedule action - simpler version for now */}
             
             {triggerType === 'every_x_minutes' && (
                 <div className="grid gap-2">
                    <Label>Minutes</Label>
                    <Input 
                        type="number" 
                        placeholder="e.g. 15"
                        value={data.intervalValue || ''}
                        onChange={(e) => onUpdate({ ...data, intervalValue: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Valid value between 1 to 59.</p>
                 </div>
             )}

             {triggerType === 'every_hour' && (
                 <div className="p-2 text-sm text-muted-foreground bg-muted rounded">
                     Triggers once every hour.
                 </div>
             )}

            {/* Common settings could go here */}
        </div>
    );
}

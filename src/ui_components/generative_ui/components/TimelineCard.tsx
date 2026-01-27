import { cn } from '@/lib/utils';
import { CardHeader, CardContent } from '@/components/ui/card';

export const TimelineCard = ({ title, events = [], className }: any) => (
    <div className={cn("w-full bg-primary/[0.02]", className)}>
        {title && (
            <CardHeader className="border-b bg-primary/[0.03]">
                <h3 className="text-lg font-bold">{title}</h3>
            </CardHeader>
        )}
        <CardContent className="p-6">
            <div className="space-y-6">
                {events.map((event: any, idx: number) => (
                    <div key={idx} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className={cn("h-3 w-3 rounded-full", event.status === 'completed' ? 'bg-green-500' : event.status === 'active' ? 'bg-primary' : 'bg-muted')} />
                            {idx < events.length - 1 && <div className="w-px h-full bg-border mt-1" />}
                        </div>
                        <div className="flex-1 pb-6">
                            <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-semibold text-sm">{event.title}</h5>
                                {event.time && <span className="text-xs text-muted-foreground">{event.time}</span>}
                            </div>
                            {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    </div>
);

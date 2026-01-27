import { cn } from '@/lib/utils';
import { CardHeader, CardContent } from '@/components/ui/card';
import { renderIcon } from './utils';

export const ActivityFeed = ({ title, activities = [], className }: any) => (
    <div className={cn("w-full bg-primary/[0.01]", className)}>
        {title && (
            <CardHeader className="border-b bg-primary/[0.03]">
                <h3 className="text-lg font-bold">{title}</h3>
            </CardHeader>
        )}
        <CardContent className="p-4">
            <div className="space-y-3">
                {activities.map((activity: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-primary/[0.05] transition-colors">
                        {activity.icon && (
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                {renderIcon(activity.icon, { className: "h-4 w-4 text-primary" })}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{activity.action}</p>
                            {activity.details && <p className="text-xs text-muted-foreground mt-0.5">{activity.details}</p>}
                            {activity.time && <p className="text-xs text-muted-foreground/70 mt-1">{activity.time}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    </div>
);

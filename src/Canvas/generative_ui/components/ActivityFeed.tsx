import { cn } from '@/lib/utils';
import { CardHeader, CardContent } from '@/components/ui/card';
import { renderIcon } from './utils';

export const ActivityFeed = ({ title, activities = [], className }: any) => (
  <div className={cn("w-full bg-background rounded-lg border shadow-sm", className)}>
    {title && (
      <CardHeader className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      </CardHeader>
    )}
    <CardContent className="p-0">
      <div className="divide-y">
        {activities.map((activity: any, idx: number) => {
          // Normalize details (string | array | undefined)
          const details =
            Array.isArray(activity.details)
              ? activity.details[0]
              : activity.details;

          return (
            <div
              key={idx}
              className="flex items-start gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
            >
              {/* Icon: render even if details is missing */}
              {activity.icon ? (
                <div className="h-9 w-9 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                  {renderIcon(activity.icon, {
                    className: "h-4 w-4 text-primary",
                  })}
                </div>
              ) : (
                <div className="h-9 w-9 shrink-0 mt-0.5" />
              )}

              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight text-foreground">
                    {activity.action}
                  </p>
                  {activity.time && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {activity.time}
                    </span>
                  )}
                </div>

                {/* Safe render: no crash if details[0] doesn't exist */}
                {details && (
                  <p className="text-sm text-muted-foreground leading-snug">
                    {details}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </CardContent>
  </div>
);

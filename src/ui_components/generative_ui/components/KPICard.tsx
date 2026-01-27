import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { renderIcon } from './utils';

export const KPICard = ({ label, value, trend, trendDirection, icon, className }: any) => (
    <div className={cn(
        "flex flex-col p-6 border-l-4 bg-primary/[0.03] transition-all duration-300",
        trendDirection === 'up' ? "border-l-green-500" :
            trendDirection === 'down' ? "border-l-red-500" :
                "border-l-primary",
        className
    )}>
        <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
            {renderIcon(icon, { className: "h-4 w-4 text-muted-foreground/50" })}
        </div>
        <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black tracking-tight text-foreground">{value}</span>
            {trend && (
                <Badge variant={trendDirection === 'up' ? 'default' : 'destructive'}
                    className={cn("rounded-md px-2 py-0.5 text-[10px] h-5",
                        trendDirection === 'up' ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600")}>
                    {trendDirection === 'up' ? '↑' : '↓'} {trend}
                </Badge>
            )}
        </div>
    </div>
);

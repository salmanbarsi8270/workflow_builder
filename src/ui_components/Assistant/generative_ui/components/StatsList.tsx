import { cn } from '@/lib/utils';
import { CardHeader, CardContent } from '@/components/ui/card';
import { renderIcon } from './utils';
import { Badge } from '@/components/ui/badge';

export const StatsList = ({ title, stats = [], className }: any) => (
    <div className={cn("w-full bg-primary/[0.02]", className)}>
        {title && (
            <CardHeader className="border-b bg-primary/[0.03]">
                <h3 className="text-lg font-bold">{title}</h3>
            </CardHeader>
        )}
        <CardContent className="p-4 space-y-4">
            {stats.map((stat: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-primary/[0.04] hover:bg-primary/[0.08] transition-colors">
                    <div className="flex items-center gap-3">
                        {renderIcon(stat.icon, { className: "h-5 w-5 text-primary" })}
                        <span className="font-medium text-sm">{stat.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{stat.value}</span>
                        {stat.badge && <Badge variant="secondary" className="text-xs">{stat.badge}</Badge>}
                    </div>
                </div>
            ))}
        </CardContent>
    </div>
);

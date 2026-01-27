import { cn } from '@/lib/utils';
import { KPICard } from './KPICard';

export const StatsGrid = ({ stats = [], cols = 4, className }: any) => (
    <div className={cn("grid gap-4", `grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols}`, className)}>
        {stats.map((stat: any, idx: number) => (
            <KPICard key={idx} {...stat} />
        ))}
    </div>
);

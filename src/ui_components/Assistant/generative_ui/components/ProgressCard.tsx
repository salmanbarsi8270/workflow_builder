import { cn } from '@/lib/utils';

export const ProgressCard = ({ title, current, total, label, className }: any) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    return (
        <div className={cn("p-6 bg-primary/[0.04] transition-all duration-300", className)}>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm">{title}</h4>
                    <span className="text-2xl font-black text-primary">{percentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                </div>
                {label && <p className="text-xs text-muted-foreground">{label}</p>}
            </div>
        </div>
    );
};

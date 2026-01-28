import { cn } from '@/lib/utils';
import { renderIcon } from './utils';

export const StatusTag = ({ label, value, status = 'default', icon, className }: any) => {
    const getVariantStyles = (s: string) => {
        switch (s) {
            case 'success': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'error': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
            case 'warning': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'info': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            default: return 'bg-primary/5 text-primary border-primary/10';
        }
    };

    return (
        <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold shadow-xs whitespace-nowrap",
            getVariantStyles(status),
            className
        )}>
            {icon && renderIcon(icon, { className: "h-3 w-3" })}
            <span className="opacity-50 uppercase tracking-tighter">{label}:</span>
            <span className="font-black uppercase tracking-tight">{value}</span>
        </div>
    );
};

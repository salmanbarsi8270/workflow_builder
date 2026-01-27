import { cn } from '@/lib/utils';
import { renderIcon } from './utils';

export const Heading = ({ title, subtitle, icon, align = 'left', className }: any) => (
    <div className={cn(
        "flex flex-col gap-2 mb-4 w-full",
        align === 'center' ? 'items-center text-center' : align === 'right' ? 'items-end text-right' : 'items-start text-left',
        className
    )}>
        <div className="flex items-center gap-3">
            {icon && renderIcon(icon, { className: "h-8 w-8 text-primary shadow-sm" })}
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground decoration-primary/30 decoration-4 underline-offset-8">
                {title}
            </h1>
        </div>
        {subtitle && <p className="text-sm font-bold text-muted-foreground/60 tracking-tight uppercase">{subtitle}</p>}
    </div>
);

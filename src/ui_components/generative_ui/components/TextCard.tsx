import { cn } from '@/lib/utils';

export const TextCard = ({ content, title, className }: any) => (
    <div className={cn("flex flex-col gap-3 p-6 bg-primary/[0.01] rounded-2xl border border-border/50 shadow-sm", className)}>
        {title && <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">{title}</h3>}
        <div className="text-sm font-medium leading-relaxed text-foreground/80 whitespace-pre-wrap">
            {content}
        </div>
    </div>
);

import { cn } from '@/lib/utils';
import { renderIcon } from './utils';

export const EmptyState = ({ title, description, icon = 'Inbox', className }: any) => (
    <div className={cn("w-full p-12 bg-primary/[0.02]", className)}>
        <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center">
                {renderIcon(icon, { className: "h-8 w-8 text-muted-foreground/50" })}
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
            </div>
        </div>
    </div>
);

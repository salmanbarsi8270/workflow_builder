import { cn } from '@/lib/utils';
import { renderIcon } from './utils';

export const InfoCard = ({ title, description, icon, variant = 'default', className }: any) => {
    const variantStyles = {
        default: 'border-l-primary bg-primary/[0.04]',
        success: 'border-l-green-500 bg-green-500/[0.04] dark:bg-green-500/[0.08]',
        warning: 'border-l-yellow-500 bg-yellow-500/[0.04] dark:bg-yellow-500/[0.08]',
        error: 'border-l-red-500 bg-red-500/[0.04] dark:bg-red-500/[0.08]',
        info: 'border-l-blue-500 bg-blue-500/[0.04] dark:bg-blue-500/[0.08]'
    };

    return (
        <div className={cn("border-l-4 p-5 transition-all duration-300", variantStyles[variant as keyof typeof variantStyles] || variantStyles.default, className)}>
            <div className="flex items-start gap-4">
                {icon && (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {renderIcon(icon, { className: "h-5 w-5 text-primary" })}
                    </div>
                )}
                <div className="flex-1">
                    <h4 className="font-bold text-base mb-1">{title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
            </div>
        </div>
    );
};

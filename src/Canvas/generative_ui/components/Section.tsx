import { cn } from '@/lib/utils';

interface SectionProps {
    title?: string;
    description?: string;
    className?: string;
    children?: React.ReactNode;
    responsive?: boolean;
    [key: string]: any; // Allow any additional props
}

export const Section = ({ title, description, className, children, responsive, ...props }: SectionProps) => {
    return (
        <div className={cn("space-y-4", className)} {...props}>
            {(title || description) && (
                <div className="space-y-1">
                    {title && (
                        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                    )}
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
            )}
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
};

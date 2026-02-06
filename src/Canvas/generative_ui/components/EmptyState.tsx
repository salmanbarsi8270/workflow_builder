import { cn } from '@/lib/utils';
import { renderIcon } from './utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'subtle' | 'gradient';
    actions?: Array<{
        label: string;
        onClick: () => void;
        variant?: 'default' | 'outline' | 'ghost';
        icon?: string;
    }>;
    image?: React.ReactNode;
    illustration?: boolean;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
    align?: 'left' | 'center';
    span?: number | string;
    rowSpan?: number;
}

const getIcon = (iconName: string) => {
    const iconMap: Record<string, string> = {
        'no-data': 'FileText',
        'search': 'Search',
        'add': 'PlusCircle',
        'refresh': 'RefreshCw',
        'default': 'Inbox',
    };
    return iconMap[iconName] || iconName;
};

export const EmptyState = ({
    title = "No data available",
    description = "There's nothing to display here yet.",
    icon = 'default',
    className,
    size = 'md',
    variant = 'default',
    actions = [],
    image,
    illustration = false,
    maxWidth = 'lg',
    align = 'center',
    span,
    rowSpan
}: EmptyStateProps) => {
    const sizeClasses = {
        sm: 'p-6 space-y-3',
        md: 'p-8 md:p-12 space-y-4',
        lg: 'p-12 md:p-16 space-y-6',
    };

    const variantClasses = {
        default: 'bg-background',
        subtle: 'bg-muted/30',
        gradient: 'bg-gradient-to-br from-background via-background to-primary/5',
    };

    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    };

    const alignClasses = {
        center: 'items-center text-center',
        left: 'items-start text-left',
    };

    const iconSize = {
        sm: 'h-10 w-10',
        md: 'h-16 w-16 md:h-20 md:w-20',
        lg: 'h-20 w-20 md:h-24 md:w-24',
    };

    const iconContainerSize = {
        sm: 'h-12 w-12',
        md: 'h-16 w-16 md:h-20 md:w-20',
        lg: 'h-20 w-20 md:h-24 md:w-24',
    };

    const iconStroke = {
        sm: 1.5,
        md: 1.5,
        lg: 2,
    };

    const spanClass = span ? (typeof span === 'string' ? span : `col-span-${span}`) : 'col-span-12';
    const rowSpanClass = rowSpan ? `row-span-${rowSpan}` : '';

    return (
        <div className={cn(
            "w-full rounded-xl",
            variantClasses[variant],
            spanClass,
            rowSpanClass,
            className
        )}>
            <div className={cn(
                "flex flex-col mx-auto",
                alignClasses[align],
                sizeClasses[size],
                maxWidthClasses[maxWidth]
            )}>
                {/* Visual Element */}
                {image ? (
                    <div className={cn(
                        "mb-4",
                        align === 'center' ? 'mx-auto' : 'ml-0'
                    )}>
                        {image}
                    </div>
                ) : (
                    <div className={cn(
                        "relative mb-4",
                        align === 'center' ? 'mx-auto' : 'ml-0'
                    )}>
                        {/* Background decoration for illustration mode */}
                        {illustration && (
                            <div className="absolute inset-0 -z-10">
                                <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent rounded-full blur-xl" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[120%] w-[120%] rounded-full border border-primary/10" />
                            </div>
                        )}

                        <div className={cn(
                            "rounded-2xl flex items-center justify-center",
                            illustration
                                ? "bg-linear-to-br from-background to-primary/5 border border-primary/10 shadow-sm"
                                : "bg-primary/5",
                            iconContainerSize[size]
                        )}>
                            {renderIcon(getIcon(icon), {
                                className: cn(
                                    illustration ? "text-primary/80" : "text-muted-foreground/60",
                                    iconSize[size]
                                ),
                                strokeWidth: iconStroke[size]
                            })}
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="space-y-3">
                    <h3 className={cn(
                        "font-semibold text-foreground",
                        size === 'sm' && "text-lg",
                        size === 'md' && "text-xl md:text-2xl",
                        size === 'lg' && "text-2xl md:text-3xl"
                    )}>
                        {title}
                    </h3>

                    {description && (
                        <p className={cn(
                            "text-muted-foreground",
                            size === 'sm' && "text-sm",
                            size === 'md' && "text-base",
                            size === 'lg' && "text-lg"
                        )}>
                            {description}
                        </p>
                    )}
                </div>

                {/* Actions */}
                {actions.length > 0 && (
                    <div className={cn(
                        "flex flex-wrap gap-3 pt-2",
                        align === 'center' ? 'justify-center' : 'justify-start'
                    )}>
                        {actions.map((action, index) => (
                            <Button
                                key={index}
                                onClick={action.onClick}
                                variant={action.variant || 'default'}
                                size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
                                className="gap-2"
                            >
                                {action.icon && renderIcon(action.icon, {
                                    className: "h-4 w-4"
                                })}
                                {action.label}
                            </Button>
                        ))}
                    </div>
                )}

                {/* Additional decorative elements */}
                {illustration && (
                    <div className="pt-8">
                        <div className="flex items-center justify-center gap-8 opacity-40">
                            <div className="h-px w-12 bg-border" />
                            <div className="text-xs text-muted-foreground font-medium">EMPTY STATE</div>
                            <div className="h-px w-12 bg-border" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Pre-configured variants
EmptyState.NoData = (props: Partial<EmptyStateProps>) => (
    <EmptyState
        icon="no-data"
        title="No data available"
        description="There's nothing to display here yet. Add some data to get started."
        {...props}
    />
);

EmptyState.Search = (props: Partial<EmptyStateProps>) => (
    <EmptyState
        icon="search"
        title="No results found"
        description="Try adjusting your search or filter to find what you're looking for."
        {...props}
    />
);

EmptyState.Create = (props: Partial<EmptyStateProps>) => (
    <EmptyState
        icon="add"
        title="Create your first item"
        description="Get started by creating a new item."
        {...props}
    />
);
import { cn } from '@/lib/utils';
import { CardHeader, CardContent } from '@/components/ui/card';
import { renderIcon } from './utils';
import { ChevronRight} from 'lucide-react';
import type { ReactNode } from 'react';

interface SummaryCardProps {
    title?: string;
    content?: string | ReactNode;
    icon?: string | ReactNode;
    className?: string;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'gradient';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    align?: 'left' | 'center';
    bordered?: boolean;
    shadow?: boolean;
    action?: {
        label: string;
        onClick: () => void;
        icon?: string | ReactNode;
        variant?: 'default' | 'outline' | 'ghost';
    };
    footer?: ReactNode;
    badge?: string;
    highlight?: boolean;
    loading?: boolean;
    responsive?: boolean;
    interactive?: boolean;
    onClick?: () => void;
    truncate?: boolean;
    showIcon?: boolean;
    accent?: boolean;
    maxHeight?: string;
}

const sizeConfig = {
    sm: {
        padding: 'p-4',
        titleSize: 'text-sm font-semibold',
        contentSize: 'text-xs',
        iconSize: 'h-4 w-4',
        gap: 'gap-2',
        headerPadding: 'px-4 py-3'
    },
    md: {
        padding: 'p-5 sm:p-6',
        titleSize: 'text-base font-semibold sm:text-lg',
        contentSize: 'text-sm sm:text-base',
        iconSize: 'h-5 w-5 sm:h-6 sm:w-6',
        gap: 'gap-3',
        headerPadding: 'px-5 py-4 sm:px-6 sm:py-4'
    },
    lg: {
        padding: 'p-6 sm:p-8',
        titleSize: 'text-lg font-semibold sm:text-xl',
        contentSize: 'text-base sm:text-lg',
        iconSize: 'h-6 w-6 sm:h-7 sm:w-7',
        gap: 'gap-4',
        headerPadding: 'px-6 py-5 sm:px-8 sm:py-6'
    },
    xl: {
        padding: 'p-8 sm:p-10',
        titleSize: 'text-xl font-semibold sm:text-2xl',
        contentSize: 'text-lg sm:text-xl',
        iconSize: 'h-7 w-7 sm:h-8 sm:w-8',
        gap: 'gap-5',
        headerPadding: 'px-8 py-6 sm:px-10 sm:py-8'
    }
};

const variantConfig = {
    default: {
        bg: 'bg-card',
        border: 'border-border',
        headerBg: 'bg-muted/50',
        iconColor: 'text-primary',
        accent: 'border-l-primary'
    },
    success: {
        bg: 'bg-green-50 dark:bg-green-950/20',
        border: 'border-green-200 dark:border-green-800',
        headerBg: 'bg-green-100/50 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-500',
        accent: 'border-l-green-500'
    },
    warning: {
        bg: 'bg-yellow-50 dark:bg-yellow-950/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        headerBg: 'bg-yellow-100/50 dark:bg-yellow-900/30',
        iconColor: 'text-yellow-600 dark:text-yellow-500',
        accent: 'border-l-yellow-500'
    },
    error: {
        bg: 'bg-red-50 dark:bg-red-950/20',
        border: 'border-red-200 dark:border-red-800',
        headerBg: 'bg-red-100/50 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-500',
        accent: 'border-l-red-500'
    },
    info: {
        bg: 'bg-blue-50 dark:bg-blue-950/20',
        border: 'border-blue-200 dark:border-blue-800',
        headerBg: 'bg-blue-100/50 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-500',
        accent: 'border-l-blue-500'
    },
    gradient: {
        bg: 'bg-gradient-to-br from-card to-primary/5',
        border: 'border-primary/20',
        headerBg: 'bg-gradient-to-r from-primary/10 to-transparent',
        iconColor: 'text-primary',
        accent: 'border-l-primary'
    }
};

export const SummaryCard = ({
    title,
    content,
    icon,
    className,
    variant = 'default',
    size = 'md',
    align = 'left',
    bordered = true,
    shadow = false,
    action,
    footer,
    badge,
    highlight = false,
    loading = false,
    responsive = true,
    interactive = false,
    onClick,
    truncate = false,
    showIcon = true,
    accent = false,
    maxHeight
}: SummaryCardProps) => {
    const config = sizeConfig[size];
    const variantStyle = variantConfig[variant];
    const isInteractive = interactive || !!onClick;
    const hasAccent = accent || ['success', 'warning', 'error', 'info'].includes(variant);

    const renderIconElement = () => {
        if (!icon || !showIcon) return null;
        
        if (typeof icon === 'string') {
            return renderIcon(icon, { 
                className: cn(variantStyle.iconColor, config.iconSize) 
            });
        }
        
        return icon;
    };

    const renderLoading = () => (
        <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-4">
                <div className={cn("rounded-full bg-muted", config.iconSize)} />
                <div className="h-4 w-32 bg-muted rounded" />
            </div>
            <div className="space-y-2">
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-4/5 bg-muted rounded" />
                <div className="h-3 w-3/4 bg-muted rounded" />
            </div>
        </div>
    );

    const renderContent = () => {
        if (loading) return renderLoading();

        return (
            <>
                {/* Header */}
                {(title || icon) && (
                    <CardHeader className={cn(
                        "border-b",
                        config.headerPadding,
                        variantStyle.headerBg,
                        align === 'center' && "text-center",
                        hasAccent && "border-l-4 pl-3 sm:pl-4",
                        variantStyle.accent
                    )}>
                        <div className={cn(
                            "flex items-center",
                            config.gap,
                            align === 'center' && "justify-center",
                            !title && "justify-center"
                        )}>
                            {showIcon && renderIconElement()}
                            {title && (
                                <div className="flex items-center gap-2 min-w-0">
                                    <h3 className={cn(
                                        "font-semibold text-foreground tracking-tight",
                                        config.titleSize,
                                        truncate && "truncate",
                                        responsive && size === 'sm' && "text-sm",
                                        responsive && size === 'md' && "text-base sm:text-lg",
                                        responsive && size === 'lg' && "text-lg sm:text-xl"
                                    )}>
                                        {title}
                                    </h3>
                                    {badge && (
                                        <span className={cn(
                                            "text-xs font-medium px-2 py-0.5 rounded-full",
                                            variant === 'success' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                            variant === 'warning' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                                            variant === 'error' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                            variant === 'info' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                            variant === 'default' && "bg-primary/10 text-primary",
                                            variant === 'gradient' && "bg-primary/10 text-primary"
                                        )}>
                                            {badge}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardHeader>
                )}

                {/* Content */}
                <CardContent className={cn(
                    config.padding,
                    maxHeight && "overflow-y-auto"
                )} style={{ maxHeight }}>
                    {typeof content === 'string' ? (
                        <p className={cn(
                            "text-muted-foreground leading-relaxed",
                            config.contentSize,
                            truncate && "line-clamp-3",
                            align === 'center' && "text-center"
                        )}>
                            {content}
                        </p>
                    ) : (
                        content
                    )}
                </CardContent>

                {/* Footer with action */}
                {(action || footer) && (
                    <div className={cn(
                        "border-t px-6 py-4",
                        variant === 'gradient' ? "bg-linear-to-r from-transparent to-primary/5" : "bg-muted/30"
                    )}>
                        {action ? (
                            <div className={cn(
                                "flex items-center justify-between",
                                align === 'center' && "justify-center"
                            )}>
                                <button
                                    onClick={action.onClick}
                                    className={cn(
                                        "flex items-center gap-2 text-sm font-medium transition-colors",
                                        action.variant === 'outline' && "text-primary hover:text-primary/80",
                                        action.variant === 'ghost' && "text-muted-foreground hover:text-foreground",
                                        !action.variant && "text-primary hover:text-primary/80",
                                        responsive && "text-xs sm:text-sm"
                                    )}
                                    type="button"
                                >
                                    {action.label}
                                    {action.icon ? (
                                        typeof action.icon === 'string' ? 
                                            renderIcon(action.icon, { className: "h-3.5 w-3.5" }) : 
                                            action.icon
                                    ) : (
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    )}
                                </button>
                                {footer}
                            </div>
                        ) : (
                            footer
                        )}
                    </div>
                )}
            </>
        );
    };

    const cardClasses = cn(
        "w-full rounded-xl transition-all duration-200",
        variantStyle.bg,
        bordered && "border",
        bordered && variantStyle.border,
        shadow && "shadow-sm hover:shadow-md",
        highlight && "ring-2 ring-primary/20",
        isInteractive && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        className
    );

    if (onClick) {
        return (
            <button
                onClick={onClick}
                className={cn(cardClasses, "text-left focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2")}
                type="button"
            >
                {renderContent()}
            </button>
        );
    }

    return (
        <div className={cardClasses}>
            {renderContent()}
        </div>
    );
};

// Pre-styled variants
SummaryCard.Success = (props: Omit<SummaryCardProps, 'variant'>) => (
    <SummaryCard variant="success" showIcon icon="CheckCircle" {...props} />
);

SummaryCard.Warning = (props: Omit<SummaryCardProps, 'variant'>) => (
    <SummaryCard variant="warning" showIcon icon="AlertCircle" {...props} />
);

SummaryCard.Error = (props: Omit<SummaryCardProps, 'variant'>) => (
    <SummaryCard variant="error" showIcon icon="XCircle" {...props} />
);

SummaryCard.Info = (props: Omit<SummaryCardProps, 'variant'>) => (
    <SummaryCard variant="info" showIcon icon="Info" {...props} />
);

SummaryCard.Gradient = (props: Omit<SummaryCardProps, 'variant'>) => (
    <SummaryCard variant="gradient" accent {...props} />
);

// Compact version for dense layouts
SummaryCard.Compact = (props: Omit<SummaryCardProps, 'size' | 'bordered' | 'shadow'>) => (
    <SummaryCard 
        size="sm" 
        bordered={false} 
        shadow={false}
        className="bg-transparent"
        {...props}
    />
);

// Interactive version with onClick
SummaryCard.Interactive = (props: Omit<SummaryCardProps, 'interactive'> & { onClick: () => void }) => (
    <SummaryCard 
        interactive 
        shadow 
        className="hover:shadow-lg transition-all"
        {...props}
    />
);
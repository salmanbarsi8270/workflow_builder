import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertCircle, Info, Clock, Zap, Battery, Wifi } from 'lucide-react';
import { cloneElement, isValidElement, type ReactNode } from 'react';

interface StatusTagProps {
    status: string;
    variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'accent' | 'gradient';
    icon?: string | ReactNode;
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    outlined?: boolean;
    pill?: boolean;
    animate?: boolean;
    showIcon?: boolean;
    responsive?: boolean;
    count?: number;
    onClick?: () => void;
    dot?: boolean;
    badge?: string | number;
    uppercase?: boolean;
    truncate?: boolean;
    loading?: boolean;
    span?: number | string;
    rowSpan?: number;
}

const variantConfig = {
    default: {
        bg: 'bg-primary',
        text: 'text-primary-foreground',
        border: 'border-primary',
        outline: 'bg-transparent text-primary border-primary',
        icon: 'Circle'
    },
    success: {
        bg: 'bg-green-500',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-500',
        outline: 'bg-transparent text-green-600 dark:text-green-400 border-green-500',
        icon: 'CheckCircle'
    },
    error: {
        bg: 'bg-red-500',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-500',
        outline: 'bg-transparent text-red-600 dark:text-red-400 border-red-500',
        icon: 'XCircle'
    },
    warning: {
        bg: 'bg-yellow-500',
        text: 'text-yellow-600 dark:text-yellow-400',
        border: 'border-yellow-500',
        outline: 'bg-transparent text-yellow-600 dark:text-yellow-400 border-yellow-500',
        icon: 'AlertCircle'
    },
    info: {
        bg: 'bg-blue-500',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500',
        outline: 'bg-transparent text-blue-600 dark:text-blue-400 border-blue-500',
        icon: 'Info'
    },
    neutral: {
        bg: 'bg-gray-500',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-500',
        outline: 'bg-transparent text-gray-600 dark:text-gray-400 border-gray-500',
        icon: 'Circle'
    },
    accent: {
        bg: 'bg-accent',
        text: 'text-accent-foreground',
        border: 'border-accent',
        outline: 'bg-transparent text-accent border-accent',
        icon: 'Zap'
    },
    gradient: {
        bg: 'bg-gradient-to-r from-primary to-primary/80',
        text: 'text-primary-foreground',
        border: 'border-transparent',
        outline: 'bg-transparent text-primary border-primary',
        icon: 'Zap'
    }
};

const sizeConfig = {
    xs: {
        padding: 'px-2 py-0.5',
        text: 'text-[10px] font-medium',
        icon: 'h-2.5 w-2.5',
        badge: 'h-4 min-w-4 text-[8px] px-1',
        dot: 'h-1.5 w-1.5',
        gap: 'gap-1'
    },
    sm: {
        padding: 'px-2.5 py-1',
        text: 'text-xs font-medium',
        icon: 'h-3 w-3',
        badge: 'h-5 min-w-5 text-[10px] px-1',
        dot: 'h-2 w-2',
        gap: 'gap-1.5'
    },
    md: {
        padding: 'px-3 py-1.5',
        text: 'text-sm font-medium',
        icon: 'h-3.5 w-3.5',
        badge: 'h-6 min-w-6 text-xs px-1.5',
        dot: 'h-2.5 w-2.5',
        gap: 'gap-2'
    },
    lg: {
        padding: 'px-4 py-2',
        text: 'text-base font-medium',
        icon: 'h-4 w-4',
        badge: 'h-7 min-w-7 text-sm px-2',
        dot: 'h-3 w-3',
        gap: 'gap-2.5'
    }
};

const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, ReactNode> = {
        CheckCircle: <CheckCircle className="h-full w-full" />,
        XCircle: <XCircle className="h-full w-full" />,
        AlertCircle: <AlertCircle className="h-full w-full" />,
        Info: <Info className="h-full w-full" />,
        Clock: <Clock className="h-full w-full" />,
        Zap: <Zap className="h-full w-full" />,
        Battery: <Battery className="h-full w-full" />,
        Wifi: <Wifi className="h-full w-full" />,
        Circle: <div className="rounded-full border-2 h-full w-full" />
    };
    return iconMap[iconName] || <div className="rounded-full border-2 h-full w-full" />;
};

export const StatusTag = ({
    status,
    variant = 'default',
    icon,
    className,
    size = 'md',
    outlined = false,
    pill = true,
    animate = false,
    showIcon = true,
    responsive = true,
    count,
    onClick,
    dot = false,
    badge,
    uppercase = true,
    truncate = true,
    loading = false,
    span,
    rowSpan
}: StatusTagProps) => {
    const config = variantConfig[variant];
    const sizeStyle = sizeConfig[size];
    const isInteractive = !!onClick;

    // Get icon to display
    const iconToDisplay = icon || config.icon;
    const iconElement: any = typeof iconToDisplay === 'string'
        ? getIconComponent(iconToDisplay)
        : iconToDisplay;

    // Responsive size adjustments
    const getResponsiveSize = () => {
        if (!responsive) return size;
        switch (size) {
            case 'xs': return 'xs';
            case 'sm': return 'sm';
            case 'md': return 'text-xs sm:text-sm';
            case 'lg': return 'text-sm sm:text-base';
            default: return size;
        }
    };

    const spanClass = span ? (typeof span === 'string' ? span : `col-span-${span}`) : 'col-span-12';
    const rowSpanClass = rowSpan ? `row-span-${rowSpan}` : '';

    const baseClasses = cn(
        "inline-flex items-center border shadow-xs whitespace-nowrap transition-all duration-200",
        pill ? "rounded-full" : "rounded-lg",
        spanClass,
        rowSpanClass,
        outlined ? config.outline : cn(config.bg, config.text),
        sizeStyle.padding,
        sizeStyle.gap,
        animate && "animate-pulse",
        isInteractive && "cursor-pointer hover:scale-105 active:scale-95",
        loading && "animate-pulse bg-muted text-transparent",
        className
    );

    const textClasses = cn(
        "font-medium tracking-tight",
        uppercase && "uppercase",
        truncate && "truncate max-w-[120px] sm:max-w-[200px]",
        responsive ? getResponsiveSize() : sizeStyle.text
    );

    const renderContent = () => (
        <>
            {!loading && dot && (
                <div className={cn(
                    "rounded-full",
                    sizeStyle.dot,
                    outlined ? config.border.replace('border-', 'bg-') : 'bg-current'
                )} />
            )}

            {!loading && showIcon && iconElement && (
                <div className={cn(
                    "flex items-center justify-center",
                    outlined && "text-current"
                )}>
                    {isValidElement(iconElement)
                        ? cloneElement(iconElement as React.ReactElement<any>, {
                            className: cn(
                                sizeStyle.icon,
                                (iconElement as any).props?.className
                            )
                        })
                        : iconElement
                    }
                </div>
            )}

            <span className={textClasses}>
                {loading ? '...' : status}
            </span>

            {!loading && count !== undefined && (
                <span className={cn(
                    "rounded-full bg-current/10 text-current font-bold",
                    sizeStyle.badge
                )}>
                    {count}
                </span>
            )}

            {!loading && badge && (
                <span className={cn(
                    "rounded-full bg-current/20 text-current font-bold ml-1",
                    sizeStyle.badge
                )}>
                    {badge}
                </span>
            )}
        </>
    );

    if (onClick) {
        return (
            <button
                onClick={onClick}
                className={cn(baseClasses, "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current/20")}
                type="button"
            >
                {renderContent()}
            </button>
        );
    }

    return (
        <div className={baseClasses}>
            {renderContent()}
        </div>
    );
};

// Pre-styled variants for common statuses
StatusTag.Success = (props: Omit<StatusTagProps, 'variant'>) => (
    <StatusTag variant="success" {...props} />
);

StatusTag.Error = (props: Omit<StatusTagProps, 'variant'>) => (
    <StatusTag variant="error" {...props} />
);

StatusTag.Warning = (props: Omit<StatusTagProps, 'variant'>) => (
    <StatusTag variant="warning" {...props} />
);

StatusTag.Info = (props: Omit<StatusTagProps, 'variant'>) => (
    <StatusTag variant="info" {...props} />
);

StatusTag.Neutral = (props: Omit<StatusTagProps, 'variant'>) => (
    <StatusTag variant="neutral" {...props} />
);

// Common status tags with icons
StatusTag.Active = (props: Omit<StatusTagProps, 'status' | 'variant' | 'icon' | 'animate'>) => (
    <StatusTag
        status="Active"
        variant="success"
        icon="CheckCircle"
        {...props}
    />
);

StatusTag.Inactive = (props: Omit<StatusTagProps, 'status' | 'variant' | 'icon'>) => (
    <StatusTag
        status="Inactive"
        variant="neutral"
        icon="Circle"
        {...props}
    />
);

StatusTag.Pending = (props: Omit<StatusTagProps, 'status' | 'variant' | 'icon' | 'animate'>) => (
    <StatusTag
        status="Pending"
        variant="warning"
        icon="Clock"
        animate
        {...props}
    />
);

StatusTag.Processing = (props: Omit<StatusTagProps, 'status' | 'variant' | 'icon' | 'animate'>) => (
    <StatusTag
        status="Processing"
        variant="info"
        icon="Zap"
        animate
        {...props}
    />
);

// Compact version for dense interfaces
StatusTag.Compact = (props: Omit<StatusTagProps, 'size' | 'showIcon' | 'uppercase'>) => (
    <StatusTag
        size="xs"
        showIcon={false}
        uppercase={false}
        pill={false}
        className="font-normal"
        {...props}
    />
);

// Interactive version with onClick
StatusTag.Interactive = (props: Omit<StatusTagProps, 'onClick'> & { onClick: () => void }) => (
    <StatusTag
        className="hover:opacity-80 active:scale-95 transition-all"
        {...props}
    />
);
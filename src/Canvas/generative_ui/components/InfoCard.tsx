import { cn } from '@/lib/utils';
import { renderIcon } from './utils';
import { isValidElement } from 'react';

interface InfoCardProps {
    title?: any;
    description?: any;
    icon?: string | any;
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'gradient';
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    align?: 'left' | 'center';
    action?: any;
    closable?: boolean;
    onClose?: () => void;
    bordered?: boolean;
    shadow?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
    span?: number | string;
    rowSpan?: number;
}

const variantConfig = {
    default: {
        border: 'border-l-primary',
        bg: 'bg-background border',
        iconColor: 'text-primary',
        iconBg: 'bg-primary/10',
        icon: 'Info'
    },
    success: {
        border: 'border-l-green-500',
        bg: 'bg-green-50 dark:bg-green-950/30',
        iconColor: 'text-green-600 dark:text-green-500',
        iconBg: 'bg-green-100 dark:bg-green-900/50',
        icon: 'CheckCircle'
    },
    warning: {
        border: 'border-l-yellow-500',
        bg: 'bg-yellow-50 dark:bg-yellow-950/30',
        iconColor: 'text-yellow-600 dark:text-yellow-500',
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/50',
        icon: 'AlertTriangle'
    },
    error: {
        border: 'border-l-red-500',
        bg: 'bg-red-50 dark:bg-red-950/30',
        iconColor: 'text-red-600 dark:text-red-500',
        iconBg: 'bg-red-100 dark:bg-red-900/50',
        icon: 'XCircle'
    },
    info: {
        border: 'border-l-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        iconColor: 'text-blue-600 dark:text-blue-500',
        iconBg: 'bg-blue-100 dark:bg-blue-900/50',
        icon: 'AlertCircle'
    },
    gradient: {
        border: 'border-l-transparent',
        bg: 'bg-gradient-to-r from-primary/5 via-transparent to-transparent border',
        iconColor: 'text-primary',
        iconBg: 'bg-gradient-to-br from-primary/20 to-primary/5',
        icon: 'Info'
    }
};

const sizeConfig = {
    sm: {
        padding: 'p-3',
        iconSize: 'h-6 w-6',
        iconInnerSize: 'h-3 w-3',
        titleSize: 'text-xs font-semibold',
        descSize: 'text-[10px]'
    },
    md: {
        padding: 'p-4',
        iconSize: 'h-8 w-8',
        iconInnerSize: 'h-4 w-4',
        titleSize: 'text-sm font-semibold',
        descSize: 'text-xs sm:text-sm'
    },
    lg: {
        padding: 'p-5',
        iconSize: 'h-10 w-10',
        iconInnerSize: 'h-5 w-5',
        titleSize: 'text-base font-bold',
        descSize: 'text-sm'
    }
};

const paddingConfig = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6 md:p-8'
};

const roundedConfig = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full'
};

export const InfoCard = ({
    title,
    description,
    icon,
    variant = 'default',
    className,
    size = 'md',
    align = 'left',
    action,
    closable,
    onClose,
    bordered = true,
    shadow = false,
    padding: customPadding,
    rounded = 'md',
    span,
    rowSpan
}: InfoCardProps) => {
    const config = variantConfig[variant];
    const sizeStyle = sizeConfig[size];
    const paddingStyle = customPadding ? paddingConfig[customPadding] : sizeStyle.padding;
    const roundedStyle = roundedConfig[rounded];

    const getIcon = () => {
        if (icon === null || icon === false) return null;

        if (typeof icon === 'string') {
            return renderIcon(icon, {
                className: cn(config.iconColor, sizeStyle.iconInnerSize)
            });
        }

        if (isValidElement(icon)) {
            return icon;
        }

        return renderIcon(config.icon, {
            className: cn(config.iconColor, sizeStyle.iconInnerSize)
        });
    };

    const renderContent = () => (
        <div className={cn(
            "flex items-start gap-3 sm:gap-4",
            align === 'center' && "flex-col text-center"
        )}>
            {getIcon() && (
                <div className={cn(
                    "rounded-lg flex items-center justify-center shrink-0",
                    config.iconBg,
                    sizeStyle.iconSize,
                    align === 'center' && "mx-auto"
                )}>
                    {getIcon()}
                </div>
            )}

            <div className={cn(
                "flex-1 min-w-0",
                align === 'center' && "text-center"
            )}>
                {title && (
                    <h4 className={cn(
                        "text-foreground mb-1 sm:mb-2",
                        sizeStyle.titleSize
                    )}>
                        {title}
                    </h4>
                )}

                {description && (
                    <p className={cn(
                        "text-muted-foreground leading-relaxed",
                        sizeStyle.descSize,
                        title && "mt-1 sm:mt-2"
                    )}>
                        {description}
                    </p>
                )}

                {action && (
                    <div className={cn(
                        "mt-3 sm:mt-4",
                        align === 'center' && "flex justify-center"
                    )}>
                        {action}
                    </div>
                )}
            </div>

            {closable && (
                <button
                    onClick={onClose}
                    className="shrink-0 h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground hover:text-foreground transition-colors -mt-0.5 -mr-1"
                    aria-label="Close"
                >
                    ✕
                </button>
            )}
        </div>
    );

    // Apply span to wrapper
    const spanClass = typeof span === 'string'
        ? span
        : span
            ? `col-span-${span}`
            : '';
    const rowSpanClass = rowSpan ? `row-span-${rowSpan}` : '';

    return (
        <div
            className={cn(
                "w-full transition-all duration-300",
                config.bg,
                bordered && config.border,
                bordered && "border-l-4",
                shadow && "shadow-sm hover:shadow-md",
                paddingStyle,
                roundedStyle,
                spanClass,
                rowSpanClass,
                className
            )}
        >
            {renderContent()}
        </div>
    );
};

// Pre-styled variants for common use cases
InfoCard.Success = (props: Omit<InfoCardProps, 'variant'>) => (
    <InfoCard variant="success" {...props} />
);

InfoCard.Warning = (props: Omit<InfoCardProps, 'variant'>) => (
    <InfoCard variant="warning" {...props} />
);

InfoCard.Error = (props: Omit<InfoCardProps, 'variant'>) => (
    <InfoCard variant="error" {...props} />
);

InfoCard.Info = (props: Omit<InfoCardProps, 'variant'>) => (
    <InfoCard variant="info" {...props} />
);

InfoCard.Gradient = (props: Omit<InfoCardProps, 'variant'>) => (
    <InfoCard variant="gradient" {...props} />
);

// Inline info card for compact layouts
InfoCard.Inline = (props: Omit<InfoCardProps, 'size' | 'bordered' | 'shadow'>) => (
    <InfoCard
        size="sm"
        bordered={false}
        shadow={false}
        className="bg-transparent"
        {...props}
    />
);
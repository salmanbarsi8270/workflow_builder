import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface ProgressCardProps {
    label?: string;
    value: number;
    max?: number;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient';
    showValue?: boolean;
    showPercentage?: boolean;
    showIcon?: boolean;
    icon?: ReactNode;
    description?: string;
    animate?: boolean;
    striped?: boolean;
    formatValue?: (value: number, percentage: number) => string;
    onClick?: () => void;
    showLabel?: boolean;
    showMax?: boolean;
    compact?: boolean;
    responsive?: boolean;
}

const sizeConfig = {
    sm: {
        padding: 'p-3 sm:p-4',
        labelSize: 'text-xs sm:text-sm',
        valueSize: 'text-lg sm:text-xl',
        percentageSize: 'text-base sm:text-lg',
        barHeight: 'h-2',
        spaceY: 'space-y-2',
        iconSize: 'h-3.5 w-3.5'
    },
    md: {
        padding: 'p-4 sm:p-5',
        labelSize: 'text-sm sm:text-base',
        valueSize: 'text-xl sm:text-2xl md:text-3xl',
        percentageSize: 'text-lg sm:text-xl',
        barHeight: 'h-2.5 sm:h-3',
        spaceY: 'space-y-3',
        iconSize: 'h-4 w-4 sm:h-5 sm:w-5'
    },
    lg: {
        padding: 'p-5 sm:p-6 md:p-8',
        labelSize: 'text-base sm:text-lg',
        valueSize: 'text-2xl sm:text-3xl md:text-4xl',
        percentageSize: 'text-xl sm:text-2xl',
        barHeight: 'h-3 sm:h-4',
        spaceY: 'space-y-4',
        iconSize: 'h-5 w-5 sm:h-6 sm:w-6'
    }
};

const variantConfig = {
    default: {
        bar: 'bg-primary',
        text: 'text-primary',
        bg: 'bg-primary/5',
        icon: 'Clock',
        iconColor: 'text-primary'
    },
    success: {
        bar: 'bg-green-500',
        text: 'text-green-600 dark:text-green-500',
        bg: 'bg-green-50 dark:bg-green-950/20',
        icon: 'CheckCircle',
        iconColor: 'text-green-500'
    },
    warning: {
        bar: 'bg-yellow-500',
        text: 'text-yellow-600 dark:text-yellow-500',
        bg: 'bg-yellow-50 dark:bg-yellow-950/20',
        icon: 'AlertCircle',
        iconColor: 'text-yellow-500'
    },
    error: {
        bar: 'bg-red-500',
        text: 'text-red-600 dark:text-red-500',
        bg: 'bg-red-50 dark:bg-red-950/20',
        icon: 'AlertCircle',
        iconColor: 'text-red-500'
    },
    gradient: {
        bar: 'bg-gradient-to-r from-primary to-primary/80',
        text: 'text-primary',
        bg: 'bg-gradient-to-br from-primary/5 via-transparent to-transparent',
        icon: 'TrendingUp',
        iconColor: 'text-primary'
    }
};

const getIcon = (variant: keyof typeof variantConfig, size: keyof typeof sizeConfig) => {
    const iconName = variantConfig[variant].icon;
    const iconMap = {
        CheckCircle: <CheckCircle className={sizeConfig[size].iconSize} />,
        Clock: <Clock className={sizeConfig[size].iconSize} />,
        TrendingUp: <TrendingUp className={sizeConfig[size].iconSize} />,
        AlertCircle: <AlertCircle className={sizeConfig[size].iconSize} />
    };
    return iconMap[iconName as keyof typeof iconMap];
};

export const ProgressCard = ({
    label,
    value,
    max = 100,
    className,
    size = 'md',
    variant = 'default',
    showValue = true,
    showPercentage = true,
    showIcon = false,
    icon,
    description,
    animate = true,
    striped = false,
    formatValue,
    onClick,
    showLabel = true,
    showMax = false,
    compact = false,
    responsive = true
}: ProgressCardProps) => {
    const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    const config = sizeConfig[size];
    const variantStyle = variantConfig[variant];
    const isInteractive = !!onClick;

    const renderProgressBar = () => (
        <div className="relative w-full">
            <div className={cn(
                "w-full rounded-full overflow-hidden",
                variantStyle.bg,
                config.barHeight
            )}>
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out",
                        variantStyle.bar,
                        striped && variant !== 'gradient' && "bg-stripes",
                        animate && "animate-progress",
                        isInteractive && "hover:brightness-110"
                    )}
                    style={{ 
                        width: `${percentage}%`,
                        ...(striped && {
                            backgroundImage: `linear-gradient(
                                45deg,
                                rgba(255,255,255,0.15) 25%,
                                transparent 25%,
                                transparent 50%,
                                rgba(255,255,255,0.15) 50%,
                                rgba(255,255,255,0.15) 75%,
                                transparent 75%,
                                transparent
                            )`,
                            backgroundSize: '1rem 1rem'
                        })
                    }}
                />
            </div>
            
            {/* Progress indicator dot */}
            {percentage > 0 && (
                <div
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-background",
                        variantStyle.bar
                    )}
                    style={{ left: `calc(${percentage}% - ${size === 'sm' ? '6px' : size === 'md' ? '8px' : '12px'})` }}
                />
            )}
        </div>
    );

    const renderValueDisplay = () => {
        const displayValue = formatValue 
            ? formatValue(value, percentage)
            : `${value}${showMax ? `/${max}` : ''}`;
        
        return (
            <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
                {showValue && (
                    <span className={cn(
                        "font-bold tracking-tight",
                        variantStyle.text,
                        config.valueSize
                    )}>
                        {displayValue}
                    </span>
                )}
                
                {showPercentage && (
                    <span className={cn(
                        "font-semibold",
                        config.percentageSize,
                        responsive && "text-sm sm:text-base"
                    )}>
                        ({percentage}%)
                    </span>
                )}
            </div>
        );
    };

    const content = (
        <div className={cn(
            "w-full transition-all duration-300 rounded-xl border",
            config.spaceY,
            variantStyle.bg,
            config.padding,
            isInteractive && "cursor-pointer hover:shadow-md active:scale-[0.99]",
            className
        )}>
            {/* Header */}
            {!compact && (showLabel || label || showIcon) && (
                <div className="flex items-center justify-between">
                    {showLabel && label && (
                        <div className="flex items-center gap-2 sm:gap-3">
                            {showIcon && (
                                <div className={cn(
                                    "rounded-lg p-1.5",
                                    variantStyle.bg,
                                    variantStyle.iconColor
                                )}>
                                    {icon || getIcon(variant, size)}
                                </div>
                            )}
                            <h4 className={cn(
                                "font-semibold tracking-tight",
                                variantStyle.text,
                                config.labelSize
                            )}>
                                {label}
                            </h4>
                        </div>
                    )}
                    
                    {/* Compact percentage display for headers */}
                    {compact && showPercentage && (
                        <span className={cn(
                            "font-bold",
                            variantStyle.text,
                            size === 'sm' ? 'text-base' : 'text-lg'
                        )}>
                            {percentage}%
                        </span>
                    )}
                </div>
            )}

            {/* Main content - stacked on mobile, side-by-side on desktop for compact mode */}
            {compact ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <div className="flex-1">
                        {renderValueDisplay()}
                        {description && (
                            <p className={cn(
                                "text-muted-foreground mt-1",
                                size === 'sm' ? 'text-xs' : 'text-sm'
                            )}>
                                {description}
                            </p>
                        )}
                    </div>
                    <div className="flex-1 sm:max-w-md">
                        {renderProgressBar()}
                    </div>
                </div>
            ) : (
                <>
                    {/* Value display */}
                    {renderValueDisplay()}
                    
                    {/* Progress bar */}
                    {renderProgressBar()}
                    
                    {/* Description */}
                    {description && (
                        <p className={cn(
                            "text-muted-foreground pt-2",
                            size === 'sm' ? 'text-xs' : 'text-sm'
                        )}>
                            {description}
                        </p>
                    )}
                    
                    {/* Progress stats */}
                    {showMax && (
                        <div className="flex justify-between text-xs text-muted-foreground pt-2">
                            <span>0</span>
                            <span className="font-medium">
                                {value} of {max}
                            </span>
                            <span>{max}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    if (onClick) {
        return (
            <button
                onClick={onClick}
                className="w-full text-left focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 rounded-xl"
                type="button"
            >
                {content}
            </button>
        );
    }

    return content;
};

// Pre-configured variants
ProgressCard.Success = (props: Omit<ProgressCardProps, 'variant'>) => (
    <ProgressCard variant="success" {...props} />
);

ProgressCard.Warning = (props: Omit<ProgressCardProps, 'variant'>) => (
    <ProgressCard variant="warning" {...props} />
);

ProgressCard.Compact = (props: Omit<ProgressCardProps, 'size' | 'compact'>) => (
    <ProgressCard 
        size="sm" 
        compact 
        showLabel={false}
        className="bg-transparent border-0 p-0"
        {...props}
    />
);

ProgressCard.Circular = ({ 
    value, 
    max = 100, 
    size = 100,
    strokeWidth = 8,
    className,
    label
}: Omit<ProgressCardProps, 'size'> & { size?: number; strokeWidth?: number }) => {
    const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    return (
        <div className={cn("flex flex-col items-center", className)}>
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="transform -rotate-90">
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        className="fill-none stroke-muted"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        className="fill-none stroke-primary transition-all duration-700"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{percentage}%</span>
                </div>
            </div>
            {label && (
                <span className="text-sm font-medium mt-2">{label}</span>
            )}
        </div>
    );
};
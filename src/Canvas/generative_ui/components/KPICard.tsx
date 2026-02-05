import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { renderIcon } from './utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

interface KPICardProps {
    label?: string;
    value: string | number;
    trend?: string | number;
    trendDirection?: 'up' | 'down' | 'neutral';
    icon?: string | ReactNode;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    prefix?: string;
    suffix?: string;
    description?: string;
    format?: 'number' | 'currency' | 'percentage';
    loading?: boolean;
    href?: string;
    onClick?: () => void;
    bordered?: boolean;
    shadow?: boolean;
    compact?: boolean;
}

const sizeConfig = {
    sm: {
        padding: 'p-3',
        iconSize: 'h-3 w-3',
        labelSize: 'text-[10px]',
        valueSize: 'text-xl sm:text-2xl',
        descSize: 'text-[10px]',
        gap: 'gap-1.5',
        badgeSize: 'h-4 text-[10px] px-1.5'
    },
    md: {
        padding: 'p-4',
        iconSize: 'h-4 w-4',
        labelSize: 'text-xs',
        valueSize: 'text-2xl sm:text-3xl',
        descSize: 'text-xs',
        gap: 'gap-2',
        badgeSize: 'h-5 text-[10px] px-2'
    },
    lg: {
        padding: 'p-5',
        iconSize: 'h-5 w-5',
        labelSize: 'text-sm',
        valueSize: 'text-3xl sm:text-4xl',
        descSize: 'text-sm',
        gap: 'gap-3',
        badgeSize: 'h-6 text-xs px-2.5'
    }
};

const formatValue = (value: string | number, format?: string) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
        case 'currency':
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                notation: 'compact',
                maximumFractionDigits: 1
            }).format(value);
        case 'percentage':
            return `${value}%`;
        case 'number':
            return new Intl.NumberFormat('en-US', {
                notation: 'compact',
                maximumFractionDigits: 1
            }).format(value);
        default:
            return value.toLocaleString();
    }
};

export const KPICard = ({
    label,
    value,
    trend,
    trendDirection,
    icon,
    className,
    size = 'md',
    prefix,
    suffix,
    description,
    format,
    loading = false,
    href,
    onClick,
    bordered = true,
    shadow = false,
    compact = false
}: KPICardProps) => {
    const config = sizeConfig[size];
    const isInteractive = href || onClick;

    const renderTrend = () => {
        if (!trend || trendDirection === 'neutral') return null;

        const trendIcon = {
            up: <TrendingUp className="h-3 w-3" />,
            down: <TrendingDown className="h-3 w-3" />,
            neutral: <Minus className="h-3 w-3" />
        }[trendDirection || 'neutral'];

        const variant = trendDirection === 'up' ? 'default' : 
                       trendDirection === 'down' ? 'destructive' : 'secondary';

        const bgColor = trendDirection === 'up' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                       trendDirection === 'down' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                       'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';

        return (
            <Badge 
                variant={variant}
                className={cn(
                    "inline-flex items-center gap-1 rounded-full font-medium border-0",
                    config.badgeSize,
                    bgColor
                )}
            >
                {trendIcon}
                {typeof trend === 'number' ? `${trend > 0 ? '+' : ''}${trend}%` : trend}
            </Badge>
        );
    };

    const renderIconElement = () => {
        if (!icon) return null;
        
        if (typeof icon === 'string') {
            return renderIcon(icon, { 
                className: cn("text-muted-foreground", config.iconSize) 
            });
        }
        
        return icon;
    };

    const content = (
        <div className={cn(
            "w-full h-full flex flex-col",
            config.padding,
            config.gap,
            bordered && "rounded-xl border",
            shadow && "shadow-sm hover:shadow-md transition-shadow",
            isInteractive && "cursor-pointer",
            className
        )}>
            {/* Header: Label and Icon */}
            {(label || icon) && (
                <div className="flex items-center justify-between">
                    {label && (
                        <span className={cn(
                            "font-semibold text-muted-foreground uppercase tracking-wider",
                            config.labelSize
                        )}>
                            {label}
                        </span>
                    )}
                    {renderIconElement() && (
                        <div className={cn(
                            "rounded-lg p-1.5 bg-primary/5",
                            !label && "ml-auto"
                        )}>
                            {renderIconElement()}
                        </div>
                    )}
                </div>
            )}

            {/* Main Value */}
            <div className="flex flex-col">
                <div className="flex items-baseline gap-2 flex-wrap">
                    {prefix && (
                        <span className={cn(
                            "font-medium text-muted-foreground",
                            size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
                        )}>
                            {prefix}
                        </span>
                    )}
                    
                    <span className={cn(
                        "font-bold tracking-tight text-foreground",
                        config.valueSize,
                        loading && "animate-pulse bg-muted rounded-md"
                    )}>
                        {loading ? '...' : formatValue(value, format)}
                    </span>
                    
                    {suffix && (
                        <span className={cn(
                            "font-medium text-muted-foreground",
                            size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
                        )}>
                            {suffix}
                        </span>
                    )}
                    
                    {!compact && trend && renderTrend()}
                </div>

                {/* Trend in compact mode */}
                {compact && trend && (
                    <div className="mt-2">
                        {renderTrend()}
                    </div>
                )}

                {/* Description */}
                {description && (
                    <p className={cn(
                        "text-muted-foreground mt-2",
                        config.descSize
                    )}>
                        {description}
                    </p>
                )}
            </div>

            {/* Additional trend info for large cards */}
            {size === 'lg' && trendDirection && (
                <div className="mt-auto pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {trendDirection === 'up' ? (
                            <>
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <span>Positive trend</span>
                            </>
                        ) : trendDirection === 'down' ? (
                            <>
                                <TrendingDown className="h-4 w-4 text-red-500" />
                                <span>Negative trend</span>
                            </>
                        ) : (
                            <>
                                <Minus className="h-4 w-4 text-gray-500" />
                                <span>Stable</span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    // Wrap in link if href is provided
    if (href) {
        return (
            <a 
                href={href} 
                className="block no-underline hover:no-underline focus:no-underline"
                onClick={onClick}
            >
                {content}
            </a>
        );
    }

    // Wrap in button if onClick is provided
    if (onClick) {
        return (
            <button
                onClick={onClick}
                className={cn(
                    "text-left transition-all",
                    isInteractive && "hover:scale-[1.02] active:scale-[0.98]"
                )}
                type="button"
            >
                {content}
            </button>
        );
    }

    return content;
};

// Pre-styled variants
KPICard.Success = (props: Omit<KPICardProps, 'trendDirection'> & { trendDirection?: 'up' | 'down' | 'neutral' }) => (
    <KPICard 
        trendDirection="up"
        className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20"
        {...props}
    />
);

KPICard.Warning = (props: Omit<KPICardProps, 'trendDirection'> & { trendDirection?: 'up' | 'down' | 'neutral' }) => (
    <KPICard 
        trendDirection="down"
        className="border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20"
        {...props}
    />
);

KPICard.Compact = (props: Omit<KPICardProps, 'size' | 'compact'>) => (
    <KPICard 
        size="sm" 
        compact
        bordered={false}
        className="bg-transparent"
        {...props}
    />
);

KPICard.Grid = (props: Omit<KPICardProps, 'size' | 'shadow'>) => (
    <KPICard 
        size="md"
        shadow
        className="hover:shadow-lg transition-all duration-300"
        {...props}
    />
);
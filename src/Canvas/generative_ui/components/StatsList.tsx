import { cn } from '@/lib/utils';
import { CardHeader, CardContent } from '@/components/ui/card';
import { renderIcon } from './utils';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatsListProps {
    title?: string;
    stats?: Array<{
        label: string;
        value: string | number;
        icon?: string | ReactNode;
        badge?: string | number;
        trend?: number;
        trendDirection?: 'up' | 'down' | 'neutral';
        description?: string;
        color?: string;
        action?: () => void;
        href?: string;
    }>;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    bordered?: boolean;
    shadow?: boolean;
    showTrend?: boolean;
    showIcons?: boolean;
    compact?: boolean;
    loading?: boolean;
    emptyState?: ReactNode;
    headerAction?: ReactNode;
    responsive?: boolean;
    maxHeight?: string;
    striped?: boolean;
    interactive?: boolean;
    onItemClick?: (stat: any, index: number) => void;
}

const sizeConfig = {
    sm: {
        padding: 'p-3',
        iconSize: 'h-4 w-4',
        labelSize: 'text-xs font-medium',
        valueSize: 'text-sm font-bold',
        badgeSize: 'h-5 text-[10px] px-2',
        gap: 'gap-2',
        spacing: 'space-y-1'
    },
    md: {
        padding: 'p-4',
        iconSize: 'h-5 w-5',
        labelSize: 'text-sm font-medium',
        valueSize: 'text-base font-bold sm:text-lg',
        badgeSize: 'h-6 text-xs px-2.5',
        gap: 'gap-3',
        spacing: 'space-y-2'
    },
    lg: {
        padding: 'p-5',
        iconSize: 'h-6 w-6',
        labelSize: 'text-base font-medium',
        valueSize: 'text-lg font-bold sm:text-xl',
        badgeSize: 'h-7 text-sm px-3',
        gap: 'gap-4',
        spacing: 'space-y-3'
    }
};

export const StatsList = ({
    title,
    stats = [],
    className,
    size = 'md',
    bordered = true,
    shadow = false,
    showTrend = true,
    showIcons = true,
    compact = false,
    loading = false,
    emptyState,
    headerAction,
    responsive = true,
    maxHeight,
    striped = false,
    interactive = false,
    onItemClick
}: StatsListProps) => {
    const config = sizeConfig[size];
    const hasTrend = stats.some(stat => stat.trend !== undefined);
    const isCompact = compact || (size as string) === 'sm';

    const renderTrendIndicator = (trend?: number, trendDirection?: string) => {
        if (trend === undefined) return null;
        
        const isUp = trendDirection === 'up' || (trendDirection === undefined && trend > 0);
        const color = isUp ? 'text-green-600' : 'text-red-600';
        const bgColor = isUp ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30';
        const Icon = isUp ? TrendingUp : TrendingDown;
        
        return (
            <Badge 
                variant="outline"
                className={cn(
                    "rounded-full font-medium border-0",
                    config.badgeSize,
                    bgColor,
                    color
                )}
            >
                <Icon className="h-2.5 w-2.5 mr-1" />
                {Math.abs(trend)}%
            </Badge>
        );
    };

    const renderIconElement = (icon?: string | ReactNode) => {
        if (!icon || !showIcons) return null;
        
        if (typeof icon === 'string') {
            return renderIcon(icon, { 
                className: cn("text-muted-foreground", config.iconSize) 
            });
        }
        
        return icon;
    };

    const renderLoading = () => (
        <div className="animate-pulse">
            {Array.from({ length: 5 }).map((_, idx) => (
                <div 
                    key={idx} 
                    className={cn(
                        "flex items-center justify-between",
                        config.padding,
                        striped && idx % 2 === 0 && "bg-muted/30"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <div className={cn("rounded-full bg-muted", config.iconSize)} />
                        <div className="space-y-1">
                            <div className="h-3 w-20 bg-muted rounded" />
                            {(size as string) !== 'sm' && (
                                <div className="h-2 w-16 bg-muted/50 rounded" />
                            )}
                        </div>
                    </div>
                    <div className="h-4 w-12 bg-muted rounded" />
                </div>
            ))}
        </div>
    );

    const renderEmptyState = () => {
        if (emptyState) return emptyState;
        
        return (
            <div className="text-center py-8">
                <div className="mx-auto max-w-sm space-y-2">
                    <div className="h-10 w-10 mx-auto rounded-full bg-muted flex items-center justify-center">
                        📊
                    </div>
                    <p className="text-sm text-muted-foreground">No statistics available</p>
                </div>
            </div>
        );
    };

    const renderStatItem = (stat: any, idx: number) => {
        const isInteractive = interactive || stat.action || stat.href || onItemClick;
        const content = (
            <>
                <div className={cn("flex items-center", config.gap, isCompact ? "flex-1 min-w-0" : "flex-1")}>
                    {showIcons && (
                        <div className={cn(
                            "rounded-lg p-1.5 flex items-center justify-center shrink-0",
                            stat.color ? `bg-${stat.color}/10 text-${stat.color}` : "bg-primary/10 text-primary"
                        )}>
                            {renderIconElement(stat.icon)}
                        </div>
                    )}
                    
                    <div className={cn("min-w-0", config.spacing)}>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-foreground truncate",
                                config.labelSize,
                                responsive && size === 'sm' && "text-xs sm:text-sm"
                            )}>
                                {stat.label}
                            </span>
                            {!isCompact && stat.badge && (
                                <Badge 
                                    variant="outline" 
                                    className={cn(
                                        "rounded-full",
                                        (size as string) === 'sm' ? 'h-4 text-[9px] px-1.5' : 
                                        (size as string) === 'md' ? 'h-5 text-xs px-2' : 
                                        'h-6 text-sm px-2.5'
                                    )}
                                >
                                    {stat.badge}
                                </Badge>
                            )}
                        </div>
                        
                        {!isCompact && stat.description && (
                            <p className={cn(
                                "text-muted-foreground truncate",
                                (size as string) === 'sm' ? 'text-xs' : 
                                (size as string) === 'md' ? 'text-xs sm:text-sm' : 
                                'text-sm'
                            )}>
                                {stat.description}
                            </p>
                        )}
                    </div>
                </div>
                
                <div className={cn(
                    "flex items-center gap-2",
                    isCompact ? "shrink-0 ml-2" : "shrink-0"
                )}>
                    {isCompact && stat.badge && (
                        <Badge 
                            variant="outline" 
                            className={cn(
                                "rounded-full",
                                (size as string) === 'sm' ? 'h-4 text-[9px] px-1.5' : 'h-5 text-xs px-2'
                            )}
                        >
                            {stat.badge}
                        </Badge>
                    )}
                    
                    <span className={cn(
                        "font-bold whitespace-nowrap",
                        config.valueSize,
                        responsive && size === 'sm' && "text-sm sm:text-base"
                    )}>
                        {stat.value}
                    </span>
                    
                    {showTrend && hasTrend && renderTrendIndicator(stat.trend, stat.trendDirection)}
                    
                    {isInteractive && (
                        <ChevronRight className={cn(
                            "text-muted-foreground",
                            (size as string) === 'sm' ? "h-3 w-3" : "h-4 w-4"
                        )} />
                    )}
                </div>
            </>
        );

        const handleClick = (e: React.MouseEvent) => {
            e.preventDefault();
            if (stat.action) stat.action();
            if (onItemClick) onItemClick(stat, idx);
        };

        const baseClasses = cn(
            "flex items-center justify-between transition-colors",
            config.padding,
            striped && idx % 2 === 0 && "bg-muted/30",
            isInteractive && "cursor-pointer hover:bg-muted/50 active:bg-muted",
            !isInteractive && !isCompact && "border-b border-border/50 last:border-b-0"
        );

        if (stat.href) {
            return (
                <a
                    key={idx}
                    href={stat.href}
                    className={cn(baseClasses, "no-underline hover:no-underline")}
                    onClick={handleClick}
                >
                    {content}
                </a>
            );
        }

        if (isInteractive) {
            return (
                <button
                    key={idx}
                    onClick={handleClick}
                    className={cn(baseClasses, "w-full text-left")}
                    type="button"
                >
                    {content}
                </button>
            );
        }

        return (
            <div key={idx} className={baseClasses}>
                {content}
            </div>
        );
    };

    return (
        <div className={cn(
            "w-full rounded-xl",
            bordered && "border",
            shadow && "shadow-sm",
            className
        )}>
            {/* Header */}
            {(title || headerAction) && (
                <CardHeader className="px-4 sm:px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                        {title && (
                            <h3 className={cn(
                                "font-semibold text-foreground",
                                responsive ? "text-base sm:text-lg" : "text-lg"
                            )}>
                                {title}
                            </h3>
                        )}
                        {headerAction && (
                            <div className="ml-auto">
                                {headerAction}
                            </div>
                        )}
                    </div>
                </CardHeader>
            )}

            {/* Content */}
            <div className={maxHeight ? `overflow-y-auto` : undefined} style={{ maxHeight }}>
                <CardContent className={cn(
                    "p-0",
                    loading && "p-4"
                )}>
                    {loading ? (
                        renderLoading()
                    ) : stats.length === 0 ? (
                        renderEmptyState()
                    ) : (
                        <div className="divide-y divide-border/50">
                            {stats.map((stat, idx) => renderStatItem(stat, idx))}
                        </div>
                    )}
                </CardContent>
            </div>

            {/* Footer for compact stats summary */}
            {!isCompact && stats.length > 0 && (
                <div className="px-4 sm:px-6 py-3 border-t bg-muted/30 text-xs text-muted-foreground">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span>{stats.length} items</span>
                        {hasTrend && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-green-500" />
                                    <span>Positive trends</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <TrendingDown className="h-3 w-3 text-red-500" />
                                    <span>Negative trends</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Pre-configured variants
StatsList.Compact = (props: Omit<StatsListProps, 'size' | 'compact' | 'bordered'>) => (
    <StatsList 
        size="sm" 
        compact 
        bordered={false}
        className="bg-transparent"
        {...props}
    />
);

StatsList.Dashboard = (props: Omit<StatsListProps, 'size' | 'bordered' | 'shadow' | 'showTrend'>) => (
    <StatsList 
        size="md" 
        bordered 
        shadow 
        showTrend
        striped
        interactive
        responsive
        {...props}
    />
);

StatsList.Scrollable = (props: Omit<StatsListProps, 'maxHeight'> & { maxHeight?: string }) => (
    <StatsList 
        maxHeight="400px"
        bordered
        className="overflow-hidden"
        {...props}
    />
);
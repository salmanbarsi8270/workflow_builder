import { cn } from '@/lib/utils';
import { KPICard } from './KPICard';
import type { ReactNode } from 'react';

interface StatsGridProps {
    stats?: Array<any>;
    cols?: number | { base?: number; sm?: number; md?: number; lg?: number; xl?: number };
    className?: string;
    gap?: number | string | { base?: number | string; sm?: number | string; md?: number | string; lg?: number | string; xl?: number | string };
    cardSize?: 'sm' | 'md' | 'lg';
    autoHeight?: boolean;
    equalHeight?: boolean;
    bordered?: boolean;
    shadow?: boolean;
    title?: string;
    description?: string;
    titleAlign?: 'left' | 'center' | 'right';
    loading?: boolean;
    emptyState?: ReactNode;
    responsive?: boolean;
    aspectRatio?: string;
}

export const StatsGrid = ({
    stats = [],
    cols = 4,
    className,
    gap = 4,
    cardSize = 'md',
    autoHeight = true,
    equalHeight = true,
    bordered = false,
    shadow = false,
    title,
    description,
    titleAlign = 'left',
    loading = false,
    emptyState,
    responsive = true,
    aspectRatio
}: StatsGridProps) => {
    // Convert responsive cols config to Tailwind classes
    const getColsClasses = () => {
        if (typeof cols === 'number') {
            return responsive
                ? `grid-cols-1 sm:grid-cols-${Math.min(2, cols)} md:grid-cols-${Math.min(3, cols)} lg:grid-cols-${cols}`
                : `grid-cols-${cols}`;
        }

        // Responsive object
        const { base = 1, sm = 2, md = 3, lg = cols.lg || 4, xl = cols.xl || cols.lg || 4 } = cols;
        return [
            `grid-cols-${base}`,
            sm && `sm:grid-cols-${sm}`,
            md && `md:grid-cols-${md}`,
            lg && `lg:grid-cols-${lg}`,
            xl && `xl:grid-cols-${xl}`
        ].filter(Boolean).join(' ');
    };

    // Convert responsive gap config to Tailwind classes
    const getGapClasses = () => {
        if (typeof gap === 'number') {
            return `gap-${gap}`;
        }
        
        if (typeof gap === 'string') {
            return `gap-[${gap}]`;
        }

        // Responsive object
        const { base = 3, sm = gap.sm, md = gap.md, lg = gap.lg, xl = gap.xl } = gap;
        return [
            `gap-${base}`,
            sm && `sm:gap-${sm}`,
            md && `md:gap-${md}`,
            lg && `lg:gap-${lg}`,
            xl && `xl:gap-${xl}`
        ].filter(Boolean).join(' ');
    };

    // Loading skeleton
    const renderSkeleton = () => (
        <div className={cn(
            "grid w-full animate-pulse",
            getColsClasses(),
            getGapClasses()
        )}>
            {Array.from({ length: typeof cols === 'number' ? cols : cols.base || 4 }).map((_, idx) => (
                <div
                    key={idx}
                    className={cn(
                        "rounded-xl border bg-muted/30",
                        autoHeight ? "h-full" : "h-32",
                        aspectRatio && "aspect-square",
                        equalHeight && "min-h-[120px]"
                    )}
                />
            ))}
        </div>
    );

    // Empty state
    const renderEmptyState = () => {
        if (emptyState) return emptyState;
        
        return (
            <div className="col-span-full py-12 text-center">
                <div className="mx-auto max-w-md space-y-3">
                    <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center">
                        📊
                    </div>
                    <h3 className="text-lg font-semibold">No stats available</h3>
                    <p className="text-muted-foreground">Add some statistics to display here</p>
                </div>
            </div>
        );
    };

    return (
        <div className={cn("w-full space-y-6", className)}>
            {/* Header */}
            {(title || description) && (
                <div className={cn(
                    "space-y-2",
                    titleAlign === 'center' && "text-center",
                    titleAlign === 'right' && "text-right"
                )}>
                    {title && (
                        <h3 className={cn(
                            "text-lg font-semibold sm:text-xl",
                            responsive && "text-base sm:text-lg md:text-xl"
                        )}>
                            {title}
                        </h3>
                    )}
                    {description && (
                        <p className={cn(
                            "text-muted-foreground",
                            responsive ? "text-sm sm:text-base" : "text-base"
                        )}>
                            {description}
                        </p>
                    )}
                </div>
            )}

            {/* Stats Grid */}
            {loading ? (
                renderSkeleton()
            ) : stats.length === 0 ? (
                renderEmptyState()
            ) : (
                <div className={cn(
                    "grid w-full",
                    getColsClasses(),
                    getGapClasses(),
                    equalHeight && "grid-rows-1 auto-rows-fr"
                )}>
                    {stats.map((stat: any, idx: number) => (
                        <div
                            key={idx}
                            className={cn(
                                "h-full",
                                autoHeight ? "min-h-0" : "h-32",
                                equalHeight && "flex flex-col",
                                aspectRatio && "aspect-square"
                            )}
                        >
                            <KPICard
                                {...stat}
                                size={cardSize}
                                bordered={bordered}
                                shadow={shadow}
                                compact={cardSize === 'sm'}
                                className={cn(
                                    "h-full",
                                    equalHeight && "flex-1"
                                )}
                                responsive={responsive}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Pre-configured variants
StatsGrid.Dashboard = (props: Omit<StatsGridProps, 'cols' | 'gap' | 'cardSize' | 'responsive'>) => (
    <StatsGrid
        cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
        gap={{ base: 3, md: 4, lg: 6 }}
        cardSize="md"
        responsive
        bordered
        shadow
        {...props}
    />
);

StatsGrid.Compact = (props: Omit<StatsGridProps, 'cols' | 'gap' | 'cardSize' | 'responsive'>) => (
    <StatsGrid
        cols={{ base: 2, sm: 3, md: 4, lg: 6 }}
        gap={{ base: 2, md: 3 }}
        cardSize="sm"
        responsive
        bordered={false}
        shadow={false}
        {...props}
    />
);

StatsGrid.Featured = (props: Omit<StatsGridProps, 'cols' | 'gap' | 'cardSize'>) => (
    <StatsGrid
        cols={2}
        gap={6}
        cardSize="lg"
        responsive={false}
        bordered
        shadow
        equalHeight={false}
        {...props}
    />
);

StatsGrid.Masonry = ({ stats = [], ...props }: Omit<StatsGridProps, 'cols' | 'equalHeight'>) => {
    // Group stats by size for masonry layout
    const smallStats = stats.filter((_, idx) => idx % 3 === 0);
    const mediumStats = stats.filter((_, idx) => idx % 3 === 1);
    const largeStats = stats.filter((_, idx) => idx % 3 === 2);

    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", props.className)}>
            <div className="space-y-4">
                {smallStats.map((stat, idx) => (
                    <KPICard key={idx} {...stat} size="sm" compact responsive />
                ))}
            </div>
            <div className="space-y-4">
                {mediumStats.map((stat, idx) => (
                    <KPICard key={idx} {...stat} size="md" compact responsive />
                ))}
            </div>
            <div className="space-y-4">
                {largeStats.map((stat, idx) => (
                    <KPICard key={idx} {...stat} size="lg" responsive />
                ))}
            </div>
        </div>
    );
};
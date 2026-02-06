import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart, CartesianGrid } from 'recharts';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from "framer-motion";
import { renderIcon } from './components/utils';

// Responsive grid utility function
// Standardized grid classes helper

// Card Wrapper with Responsive Grid Span Support
const CardWrapper = ({ className, children, responsive = true, ...props }: any) => {
    return (
        <Card className={cn(
            "group overflow-hidden transition-all duration-300",
            "hover:shadow-lg hover:border-primary/30 hover:scale-[1.02]",
            "bg-card/50 backdrop-blur-sm border-border/30",
            "rounded-xl sm:rounded-2xl",
            "p-0 m-0",
            className
        )} {...props}>
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative h-full">
                {children}
            </div>
        </Card>
    );
};

// Wrapper for Lucide Icons
const IconWrapper = ({ name, className, size = 'md', responsive = true, ...props }: { name: string; className?: string; size?: string; responsive?: boolean }) => {
    const sizeClasses = {
        xs: 'h-3 w-3',
        sm: 'h-3.5 w-3.5 sm:h-4 sm:w-4',
        md: 'h-4 w-4 sm:h-5 sm:w-5',
        lg: 'h-5 w-5 sm:h-6 sm:w-6',
        xl: 'h-6 w-6 sm:h-7 sm:w-7'
    };

    return renderIcon(name, {
        className: cn(responsive ? sizeClasses[size as keyof typeof sizeClasses] : `h-${size} w-${size}`, className),
        ...props
    });
};

// Layout Components with Responsive Design
const Container = ({
    className,
    children,
    layout = 'grid',
    gap = 4,
    cols,
    dense = true,
    responsive = true,
    ...props
}: any) => {
    const layoutClasses = responsive
        ? layout === 'grid'
            ? cn(
                "grid",
                cols === 4
                    ? "grid-cols-4"
                    : `grid-cols-1 ${cols ? `sm:grid-cols-${Math.min(2, cols)} md:grid-cols-${Math.min(4, cols)} lg:grid-cols-${cols}` : "sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4"}`,
                gap === 4 ? "gap-4 md:gap-6" : (gap === 6 ? "gap-6 md:gap-8" : `gap-${gap}`),
                dense && "grid-flow-dense"
            )
            : layout === 'flex'
                ? cn("flex flex-col", `gap-${gap} sm:gap-${gap + 2}`)
                : ""
        : cn(
            layout === 'grid' && `grid grid-cols-${cols || 1} gap-${gap}`,
            layout === 'flex' && `flex flex-col gap-${gap}`,
            dense && "grid-flow-dense"
        );

    return (
        <div
            className={cn("w-full", layoutClasses, className)}
            style={dense ? { gridAutoFlow: 'dense' } : {}}
            {...props}
        >
            {children}
        </div>
    );
};

const Section = ({ title, description, children, className, responsive = true, ...props }: any) => (
    <div className={cn("space-y-4 mb-6 sm:mb-8", className)} {...props}>
        {(title || description) && (
            <div className="space-y-1 sm:space-y-2">
                {title && (
                    <h3 className={cn(
                        "font-semibold tracking-tight",
                        responsive ? "text-base sm:text-lg md:text-xl" : "text-lg"
                    )}>
                        {title}
                    </h3>
                )}
                {description && (
                    <p className={cn(
                        "text-muted-foreground",
                        responsive ? "text-xs sm:text-sm" : "text-sm"
                    )}>
                        {description}
                    </p>
                )}
            </div>
        )}
        {children}
    </div>
);

const Stack = ({ className, children, gap = 2, direction = 'col', responsive = true, ...props }: any) => {
    const responsiveDirection = direction === 'col'
        ? "flex-col"
        : responsive
            ? "flex-col sm:flex-row"
            : "flex-row";

    const responsiveGap = responsive
        ? `gap-${gap} sm:gap-${gap + 1}`
        : `gap-${gap}`;

    return (
        <div className={cn("flex", responsiveDirection, responsiveGap, className)} {...props}>
            {children}
        </div>
    );
};

const Grid = ({ className, children, cols, gap = 4, dense = true, responsive = true, ...props }: any) => {
    const gridCols = !cols
        ? 'grid-cols-1'
        : cols === 'auto'
            ? 'grid-cols-[repeat(auto-fit,minmax(200px,1fr))]'
            : responsive
                ? cn(
                    "grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4"
                )
                : (cols === 4 ? "grid-cols-4" : `grid-cols-${cols}`);

    const responsiveGap = responsive
        ? `gap-${gap} sm:gap-${gap + 1} md:gap-${gap + 2}`
        : `gap-${gap}`;

    return (
        <div
            className={cn("grid", gridCols, responsiveGap, className)}
            style={dense ? { gridAutoFlow: 'dense' } : {}}
            {...props}
        >
            {children}
        </div>
    );
};

// Typography & Content with Responsive Text
const Text = ({ className, variant = 'p', children, value, content, responsive = true, ...props }: any) => {
    const Component = variant === 'h1' ? 'h1' :
        variant === 'h2' ? 'h2' :
            variant === 'h3' ? 'h3' :
                variant === 'span' ? 'span' : 'p';

    const responsiveClasses = responsive && variant.startsWith('h')
        ? variant === 'h1' ? 'text-2xl sm:text-3xl md:text-4xl'
            : variant === 'h2' ? 'text-xl sm:text-2xl md:text-3xl'
                : variant === 'h3' ? 'text-lg sm:text-xl md:text-2xl'
                    : ''
        : '';

    return (
        <Component className={cn(responsiveClasses, className)} {...props}>
            {children || content || value}
        </Component>
    );
};

const TextBlock = ({ children, className, responsive = true, ...props }: any) => (
    <div className={cn(
        "prose dark:prose-invert max-w-none text-muted-foreground",
        responsive ? "text-sm sm:text-base" : "text-base",
        className
    )} {...props}>
        {children}
    </div>
);

const StreamingText = ({ text, speed = 20, className, responsive = true, ...props }: any) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        setDisplayedText('');
        setIsComplete(false);

        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText((prev) => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
                setIsComplete(true);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return (
        <div className={cn("relative", className)}>
            <span className={cn(
                "font-mono animate-in fade-in",
                responsive ? "text-xs sm:text-sm" : "text-sm"
            )} {...props}>
                {displayedText}
            </span>
            {!isComplete && (
                <span className="inline-block w-2 h-3 ml-1 bg-primary/40 animate-pulse" />
            )}
        </div>
    );
};

// Stats & Metrics with Responsive Sizing
const MetricCard = ({ label, value, icon, trend, trendDirection, subtext, gradient = true, size = 'md', responsive = true, className }: any) => {
    const sizeClasses = responsive ? {
        sm: 'p-3 sm:p-4',
        md: 'p-4 sm:p-5 md:p-6',
        lg: 'p-5 sm:p-6 md:p-8'
    } : {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6'
    };

    const valueClasses = responsive ? {
        sm: 'text-2xl sm:text-3xl',
        md: 'text-3xl sm:text-4xl',
        lg: 'text-4xl sm:text-5xl'
    } : {
        sm: 'text-2xl',
        md: 'text-3xl',
        lg: 'text-4xl'
    };

    return (
        <div className={cn(
            "flex flex-col border rounded-xl sm:rounded-2xl bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md",
            gradient && "bg-linear-to-br from-card to-card/50",
            sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md,
            className
        )}>
            <div className="flex justify-between items-start mb-1 sm:mb-2">
                <span className={cn(
                    "font-bold uppercase tracking-wider",
                    responsive ? "text-[10px] sm:text-xs" : "text-xs"
                )}>
                    {label}
                </span>
                {icon && <IconWrapper name={icon} className="h-4 w-4 text-muted-foreground/40" />}
            </div>
            <div className="flex items-baseline gap-2">
                <span className={cn(
                    "font-black tracking-tight",
                    valueClasses[size as keyof typeof valueClasses] || valueClasses.md
                )}>{value}</span>
            </div>
            {(trend || subtext) && (
                <div className={cn("flex items-center gap-2 mt-2 sm:mt-3", responsive ? "text-xs sm:text-sm" : "text-sm")}>
                    {trend && (
                        <span className={cn(
                            "font-bold px-1.5 py-0.5 rounded-md",
                            trendDirection === 'up' ? "bg-emerald-500/10 text-emerald-600" :
                                trendDirection === 'down' ? "bg-rose-500/10 text-rose-600" :
                                    "bg-muted text-muted-foreground"
                        )}>
                            {trend}
                        </span>
                    )}
                    {subtext && <span className="text-muted-foreground font-medium">{subtext}</span>}
                </div>
            )}
        </div>
    );
};

// Status Badge with Responsive Sizing
const StatusBadge = ({ status, dot = true, children, className, responsive = true, ...props }: any) => {
    const variants = {
        success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
        warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
        error: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20",
        info: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
        neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700"
    }

    const dotColors = {
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        error: "bg-red-500",
        info: "bg-blue-500",
        neutral: "bg-slate-400"
    }

    return (
        <span className={cn(
            "inline-flex items-center rounded-full border font-medium",
            responsive ? "px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs" : "px-2.5 py-0.5 text-xs",
            variants[status as keyof typeof variants],
            className
        )} {...props}>
            {dot && <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", dotColors[status as keyof typeof dotColors])} />}
            {children}
        </span>
    );
};

// Separator Component
const Separator = ({ orientation = 'horizontal', className, responsive = true, ...props }: any) => (
    <div
        className={cn(
            "shrink-0 bg-border",
            orientation === 'horizontal' ? "h-[1px] w-full" : "h-full w-[1px]",
            className
        )}
        {...props}
    />
);

// Divider Component with Responsive Text
const Divider = ({ text, className, responsive = true, ...props }: any) => {
    if (text) {
        return (
            <div className={cn("relative flex items-center py-3 sm:py-4", className)} {...props}>
                <div className="flex-grow border-t border-border" />
                <span className={cn(
                    "mx-3 sm:mx-4 text-muted-foreground flex-shrink",
                    responsive ? "text-xs sm:text-sm" : "text-sm"
                )}>
                    {text}
                </span>
                <div className="flex-grow border-t border-border" />
            </div>
        );
    }
    return <div className={cn("w-full border-t border-border my-3 sm:my-4", className)} {...props} />;
};

// Stat Card Component with Responsive Design
const StatCard = ({ label, value, icon, trend, trendDirection = 'neutral', color = 'primary', className, responsive = true, ...props }: any) => {
    const colorClasses = {
        primary: 'border-primary/20 bg-linear-to-br from-primary/10 to-primary/5',
        success: 'border-emerald-500/20 bg-linear-to-br from-emerald-500/10 to-emerald-500/5',
        warning: 'border-amber-500/20 bg-linear-to-br from-amber-500/10 to-amber-500/5',
        error: 'border-red-500/20 bg-linear-to-br from-red-500/10 to-red-500/5',
        info: 'border-blue-500/20 bg-linear-to-br from-blue-500/10 to-blue-500/5'
    };

    const iconColorClasses = {
        primary: 'text-primary',
        success: 'text-emerald-500',
        warning: 'text-amber-500',
        error: 'text-red-500',
        info: 'text-blue-500'
    };

    const trendColorClasses = {
        up: 'text-emerald-600 dark:text-emerald-400',
        down: 'text-red-600 dark:text-red-400',
        neutral: 'text-muted-foreground'
    };

    return (
        <Card className={cn(
            "border shadow-sm hover:shadow-md transition-shadow",
            colorClasses[color as keyof typeof colorClasses],
            responsive && "rounded-xl sm:rounded-2xl",
            className
        )} {...props}>
            <CardContent className={cn(
                "p-4 sm:p-5 md:p-6",
                responsive && "space-y-2 sm:space-y-3"
            )}>
                <div className="flex items-start justify-between">
                    <div className="space-y-1 sm:space-y-2">
                        <p className={cn(
                            "font-medium text-muted-foreground",
                            responsive ? "text-xs sm:text-sm" : "text-sm"
                        )}>
                            {label}
                        </p>
                        <p className={cn(
                            "font-bold tracking-tight",
                            responsive ? "text-2xl sm:text-3xl md:text-4xl" : "text-3xl"
                        )}>
                            {value}
                        </p>
                        {trend && (
                            <div className={cn(
                                "flex items-center gap-1 font-medium",
                                trendColorClasses[trendDirection as keyof typeof trendColorClasses],
                                responsive ? "text-xs sm:text-sm" : "text-sm"
                            )}>
                                {trendDirection === 'up' && <LucideIcons.TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />}
                                {trendDirection === 'down' && <LucideIcons.TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />}
                                <span>{trend}</span>
                            </div>
                        )}
                    </div>
                    {icon && (
                        <div className={cn(
                            "p-2 sm:p-3 rounded-xl bg-background/50 backdrop-blur-sm",
                            iconColorClasses[color as keyof typeof iconColorClasses]
                        )}>
                            <IconWrapper name={icon} className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// Error State with Responsive Design
const ErrorState = ({ title, message, retryAction, className, responsive = true, ...props }: any) => (
    <div className={cn(
        "flex flex-col gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm",
        className
    )} {...props}>
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
                <LucideIcons.AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <h4 className={cn(
                "font-semibold text-red-900 dark:text-red-400",
                responsive ? "text-sm sm:text-base" : "text-base"
            )}>
                {title}
            </h4>
        </div>
        <p className={cn(
            "text-red-800/70 dark:text-red-400/70 leading-relaxed font-medium",
            responsive ? "text-xs sm:text-sm" : "text-sm"
        )}>
            {message}
        </p>
        {retryAction && (
            <Button
                variant="outline"
                size={responsive ? "sm" : "default"}
                onClick={retryAction}
                className="w-fit border-red-500/20 hover:bg-red-500/10 text-red-500 transition-colors"
            >
                Try Again
            </Button>
        )}
    </div>
);

// Responsive Charts Component
const Chart = ({ type = 'bar', data = [], xAxisKey = 'name', series = [], title, description, className, responsive = true }: any) => {
    const colors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];
    const [chartHeight, setChartHeight] = useState(300);

    useEffect(() => {
        const updateHeight = () => {
            setChartHeight(window.innerWidth < 640 ? 250 : window.innerWidth < 1024 ? 300 : 350);
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    const ChartComponent = () => {
        if (!data || data.length === 0) return (
            <div className={cn(
                "flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md",
                responsive ? "h-[200px] sm:h-[250px]" : "h-[200px]"
            )}>
                No data available
            </div>
        );

        const commonProps = {
            data,
            margin: responsive ? { top: 10, right: 10, left: -10, bottom: 5 } : { top: 10, right: 10, left: -20, bottom: 5 }
        };

        switch (type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <BarChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                            <XAxis
                                dataKey={xAxisKey}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={responsive ? 10 : 12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={responsive ? 10 : 12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                                width={responsive ? 30 : 40}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    fontSize: responsive ? '12px' : '14px'
                                }}
                                cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                            />
                            {series.map((s: any, i: number) => (
                                <Bar
                                    key={s.key}
                                    dataKey={s.key}
                                    fill={s.color || colors[i % colors.length]}
                                    radius={[4, 4, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <LineChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                            <XAxis
                                dataKey={xAxisKey}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={responsive ? 10 : 12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={responsive ? 10 : 12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                                width={responsive ? 30 : 40}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    fontSize: responsive ? '12px' : '14px'
                                }}
                            />
                            {series.map((s: any, i: number) => (
                                <Line
                                    key={s.key}
                                    type="monotone"
                                    dataKey={s.key}
                                    stroke={s.color || colors[i % colors.length]}
                                    strokeWidth={2}
                                    dot={{ r: responsive ? 3 : 4, strokeWidth: 2 }}
                                    activeDot={{ r: responsive ? 4 : 5, strokeWidth: 2 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <AreaChart {...commonProps}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                            <XAxis
                                dataKey={xAxisKey}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={responsive ? 10 : 12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={responsive ? 10 : 12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                                width={responsive ? 30 : 40}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--popover))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: 'var(--radius)',
                                    fontSize: responsive ? '12px' : '14px'
                                }}
                            />
                            {series.map((s: any, i: number) => (
                                <Area
                                    key={s.key}
                                    type="monotone"
                                    dataKey={s.key}
                                    stroke={s.color || colors[i % colors.length]}
                                    fill={s.color || colors[i % colors.length]}
                                    fillOpacity={0.2}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    return (
        <Card className={cn(
            "w-full bg-card text-card-foreground border-border/50 shadow-sm hover:shadow-md transition-shadow",
            responsive && "rounded-xl sm:rounded-2xl",
            className
        )}>
            <CardHeader className={responsive ? "px-4 sm:px-6 py-3 sm:py-4" : "p-6"}>
                <CardTitle className={responsive ? "text-base sm:text-lg" : "text-lg"}>{title}</CardTitle>
                {description && (
                    <CardDescription className={responsive ? "text-xs sm:text-sm" : "text-sm"}>
                        {description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className={responsive ? "px-2 sm:px-4 pb-4 sm:pb-6" : "p-6"}>
                <ChartComponent />
            </CardContent>
        </Card>
    );
};

const ChartPlaceholder = ({ type = 'bar', title, className, responsive = true }: any) => (
    <Card className={cn(
        "w-full bg-card text-card-foreground border-border/50 shadow-sm",
        responsive && "rounded-xl sm:rounded-2xl",
        className
    )}>
        <CardHeader className={responsive ? "px-4 sm:px-6 py-3 sm:py-4" : "p-6"}>
            <CardTitle className={responsive ? "text-base sm:text-lg" : "text-lg"}>
                {title || 'Chart Placeholder'}
            </CardTitle>
            <CardDescription className={responsive ? "text-xs sm:text-sm" : "text-sm"}>
                Visual representation of {type} data
            </CardDescription>
        </CardHeader>
        <CardContent className={cn(
            "flex items-center justify-center bg-muted/20 rounded-md border-2 border-dashed border-border/50",
            responsive ? "h-[200px] sm:h-[250px] m-3 sm:m-6" : "h-[300px] m-6"
        )}>
            <div className="flex flex-col items-center gap-2 sm:gap-3 text-muted-foreground/60">
                <LucideIcons.BarChart3 className={cn(
                    "opacity-20",
                    responsive ? "h-8 w-8 sm:h-10 sm:w-10" : "h-10 w-10"
                )} />
                <span className={cn(
                    "font-medium uppercase tracking-wider",
                    responsive ? "text-xs sm:text-sm" : "text-sm"
                )}>
                    {type} chart area
                </span>
            </div>
        </CardContent>
    </Card>
);

// Import specialized responsive components
import { DataTable } from './components/DataTable';
import { KPICard } from './components/KPICard';
import { InfoCard } from './components/InfoCard';
import { ActivityFeed } from './components/ActivityFeed';
import { TimelineCard } from './components/TimelineCard';
import { ChartCard } from './components/ChartCard';
import { GridContainer } from './components/GridContainer';
import { StatsGrid } from './components/StatsGrid';
import { StatsList } from './components/StatsList';
import { CalendarCard } from './components/CalendarCard';
import { CodeCard } from './components/CodeCard';
import { ComparisonCard } from './components/ComparisonCard';
import { EmptyState } from './components/EmptyState';
import { Heading } from './components/Heading';
import { ProgressCard } from './components/ProgressCard';
import { StatusTag } from './components/StatusTag';
import { StepIndicator } from './components/StepIndicator';
import { SummaryCard } from './components/SummaryCard';
import { TextCard } from './components/TextCard';
import { WikiCard } from './components/WikiCard';
import { GenButton, GenBadge, GenAccordion, GenAvatar, GenTabs, GenAvatarGroup } from './components/ShadcnPrimitives';

// Basic HTML Elements with Responsive Support
const DivWrapper = ({ className, children, responsive = true, ...props }: any) => {
    return (
        <div className={cn(className)} {...props}>{children}</div>
    );
};

// Thinking Block Component with Responsive Animation
const ThinkingBlock = ({ children, className, finished, responsive = true }: any) => {
    const [isOpen, setIsOpen] = useState(false);

    const getSteps = () => {
        if (!children) return [];

        const content = Array.isArray(children)
            ? children.map(child => {
                if (typeof child === 'string') return child;
                if (child?.props?.content) return child.props.content;
                if (child?.content) return child.content;
                return '';
            }).join(' ')
            : typeof children === 'string' ? children : '';

        const steps = content
            .split(/\n+|(?:\d+\.)|(?:Step \d+:?)|(?:[-•]\s)/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        return steps.length > 1 ? steps : [content];
    };

    const steps = getSteps();

    return (
        <div className={cn("transition-all duration-300", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 py-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity w-fit focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg px-2",
                    responsive && "py-1.5 sm:py-2"
                )}
            >
                <LucideIcons.ChevronRight className={cn(
                    "text-muted-foreground/70 transition-transform duration-200",
                    responsive ? "h-3 w-3 sm:h-3.5 sm:w-3.5" : "h-3.5 w-3.5",
                    isOpen && "rotate-90"
                )} />
                <span className={cn(
                    "font-medium text-muted-foreground select-none uppercase tracking-wider",
                    responsive ? "text-[10px] sm:text-[11px]" : "text-[11px]"
                )}>
                    Thought Process {steps.length > 1 && `(${steps.length} steps)`}
                </span>
                {!isOpen && !finished && (
                    <span className="flex gap-0.5 sm:gap-1 ml-1 sm:ml-2">
                        <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce"></span>
                    </span>
                )}
                {finished && !isOpen && (
                    <LucideIcons.CheckCircle2 className={cn(
                        "text-green-500/70",
                        responsive ? "h-2.5 w-2.5 sm:h-3 sm:w-3" : "h-3 w-3"
                    )} />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className={cn(
                            "pl-4 sm:pl-6 py-2 sm:py-3 space-y-2 sm:space-y-3 border-l-2 border-primary/10 ml-1 sm:ml-1.5 my-1 max-h-[300px] sm:max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20 transition-colors pr-2 sm:pr-3"
                        )}>
                            {/* Completion Milestones */}
                            <div className="space-y-1.5 sm:space-y-2 pb-2 sm:pb-3 border-b border-border/20">
                                <div className="flex items-center gap-2 sm:gap-2.5">
                                    <div className={cn(
                                        "flex items-center justify-center rounded-full bg-green-500/10 border border-green-500/20",
                                        responsive ? "w-4 h-4" : "w-5 h-5"
                                    )}>
                                        <LucideIcons.Check className={cn(
                                            "text-green-500",
                                            responsive ? "h-2 w-2" : "h-3 w-3"
                                        )} />
                                    </div>
                                    <span className={cn(
                                        "font-medium text-foreground/80",
                                        responsive ? "text-xs" : "text-[12px]"
                                    )}>
                                        Thinking Completed
                                    </span>
                                    <LucideIcons.Brain className={cn(
                                        "text-green-500/60 ml-auto",
                                        responsive ? "h-3 w-3" : "h-3.5 w-3.5"
                                    )} />
                                </div>
                                <div className="flex items-center gap-2 sm:gap-2.5">
                                    <div className={cn(
                                        "flex items-center justify-center rounded-full bg-green-500/10 border border-green-500/20",
                                        responsive ? "w-4 h-4" : "w-5 h-5"
                                    )}>
                                        <LucideIcons.Check className={cn(
                                            "text-green-500",
                                            responsive ? "h-2 w-2" : "h-3 w-3"
                                        )} />
                                    </div>
                                    <span className={cn(
                                        "font-medium text-foreground/80",
                                        responsive ? "text-xs" : "text-[12px]"
                                    )}>
                                        Generating UI
                                    </span>
                                    <LucideIcons.Sparkles className={cn(
                                        "text-green-500/60 ml-auto",
                                        responsive ? "h-3 w-3" : "h-3.5 w-3.5"
                                    )} />
                                </div>
                                <div className="flex items-center gap-2 sm:gap-2.5">
                                    <div className={cn(
                                        "flex items-center justify-center rounded-full bg-green-500/10 border border-green-500/20",
                                        responsive ? "w-4 h-4" : "w-5 h-5"
                                    )}>
                                        <LucideIcons.Check className={cn(
                                            "text-green-500",
                                            responsive ? "h-2 w-2" : "h-3 w-3"
                                        )} />
                                    </div>
                                    <span className={cn(
                                        "font-medium text-foreground/80",
                                        responsive ? "text-xs" : "text-[12px]"
                                    )}>
                                        UI Completed
                                    </span>
                                    <LucideIcons.CheckCircle2 className={cn(
                                        "text-green-500/60 ml-auto",
                                        responsive ? "h-3 w-3" : "h-3.5 w-3.5"
                                    )} />
                                </div>
                            </div>

                            {/* Thinking Steps */}
                            <div className="space-y-1.5 sm:space-y-2.5">
                                <span className={cn(
                                    "font-semibold text-muted-foreground uppercase tracking-wider",
                                    responsive ? "text-[10px]" : "text-[10px]"
                                )}>
                                    Thought Process
                                </span>
                                {steps.map((step, index) => (
                                    <div key={index} className="flex items-start gap-2 sm:gap-3 group/step">
                                        <span className={cn(
                                            "flex-shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary font-semibold mt-0.5",
                                            responsive ? "w-4 h-4 text-[10px]" : "w-5 h-5 text-[10px]"
                                        )}>
                                            {index + 1}
                                        </span>
                                        <span className={cn(
                                            "flex-1 text-muted-foreground/80 leading-relaxed",
                                            responsive ? "text-xs sm:text-[13px]" : "text-[13px]"
                                        )}>
                                            {step}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Table Components with Responsive Support
import {
    Table, TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell
} from '@/components/table';

// Enhanced Registry Map with Responsive Props
export const componentRegistry: Record<string, React.ComponentType<any>> = {
    'div': DivWrapper,
    'container': Container,
    'section': Section,
    'stack': Stack,
    'grid': Grid,
    'card': CardWrapper,
    'card-header': CardHeader,
    'card-content': CardContent,
    'card-footer': CardFooter,
    'button': GenButton,
    'text': Text,
    'text-block': TextBlock,
    'streaming-text': StreamingText,
    'icon': IconWrapper,
    'input': Input,
    'metric': MetricCard,
    'badge': GenBadge,
    'status-badge': StatusBadge,
    'avatar': GenAvatar,
    'avatar-group': GenAvatarGroup,
    'accordion': GenAccordion,
    'tabs': GenTabs,
    'table': Table,
    'table-header': TableHeader,
    'table-body': TableBody,
    'table-row': TableRow,
    'table-head': TableHead,
    'table-cell': TableCell,
    'chart': Chart,
    'chart-placeholder': ChartPlaceholder,
    'error-state': ErrorState,
    'separator': Separator,
    'divider': Divider,
    'stat-card': StatCard,
    'thinking-block': ThinkingBlock,

    // Specialized responsive components
    'data-table': DataTable,
    'kpi-card': KPICard,
    'info-card': InfoCard,
    'activity-feed': ActivityFeed,
    'timeline-card': TimelineCard,
    'chart-card': ChartCard,
    'grid-container': GridContainer,
    'stats-grid': StatsGrid,
    'stats-list': StatsList,
    'calendar-card': CalendarCard,
    'code-card': CodeCard,
    'comparison-card': ComparisonCard,
    'empty-state': EmptyState,
    'heading': Heading,
    'progress-card': ProgressCard,
    'status-tag': StatusTag,
    'step-indicator': StepIndicator,
    'summary-card': SummaryCard,
    'text-card': TextCard,
    'wiki-card': WikiCard,
};

// Helper function to apply responsive props
export const applyResponsiveProps = (Component: React.ComponentType<any>, props: any) => {
    const responsiveProps = {
        responsive: true,
        ...props,
        className: cn(
            props.className,
            props.responsive !== false && "transition-all duration-300"
        )
    };
    return React.createElement(Component, responsiveProps);
};
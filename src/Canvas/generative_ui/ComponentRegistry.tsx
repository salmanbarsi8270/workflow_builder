import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
// import { Alert, AlertTitle, AlertDescription } from '@/components/alert';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts';
import { Input } from '@/components/ui/input';

// Card Wrapper with Grid Span Support
const CardWrapper = ({ span, rowSpan, className, children, ...props }: any) => {
    const spanClass = span ? `col-span-${span}` : 'col-span-12';
    const rowSpanClass = rowSpan ? `row-span-${rowSpan}` : '';
    return (
        <Card className={cn(
            "group overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30",
            "bg-card/50 backdrop-blur-sm border-border/50 p-0 m-0",
            spanClass,
            rowSpanClass,
            className
        )} {...props}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            {children}
        </Card>
    );
};

// Wrapper for Lucide Icons
const IconWrapper = ({ name, className, ...props }: { name: string; className?: string }) => {
    // @ts-ignore
    const Icon = LucideIcons[name];
    if (!Icon) return null;
    return <Icon className={cn("h-4 w-4", className)} {...props} />;
};

// Layout Components
const Container = ({ className, children, layout = 'grid', gap = 4, span, rowSpan, cols, dense = true, ...props }: any) => {
    // 12-column grid system (standard Tailwind)
    const layoutClasses = layout === 'grid'
        ? cn(
            "grid",
            cols ? `grid-cols-${cols}` : "grid-cols-1", // Default to 1 column for nested content
            `gap-${gap}`,
            dense && "grid-flow-dense", // Standard Tailwind class
            "auto-rows-min"
        )
        : layout === 'flex'
            ? cn("flex flex-col", `gap-${gap}`)
            : "";

    const spanClass = span ? `col-span-${span}` : '';
    const rowSpanClass = rowSpan ? `row-span-${rowSpan}` : '';

    return (
        <div
            className={cn("w-full", spanClass, rowSpanClass, layoutClasses, className)}
            style={dense ? { gridAutoFlow: 'dense' } : {}}
            {...props}
        >
            {children}
        </div>
    );
};

const Section = ({ title, description, children, className, ...props }: any) => (
    <div className={cn("space-y-4 mb-6", className)} {...props}>
        {(title || description) && (
            <div className="space-y-1">
                {title && <h3 className="text-lg font-semibold tracking-tight">{title}</h3>}
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
        )}
        {children}
    </div>
);

const Stack = ({ className, children, gap = 2, direction = 'col', ...props }: any) => (
    <div className={cn("flex", direction === 'col' ? "flex-col" : "flex-row", `gap-${gap}`, className)} {...props}>{children}</div>
);

const Grid = ({ className, children, cols, gap = 4, dense = true, ...props }: any) => {
    const gridCols = !cols
        ? 'grid-cols-1'
        : cols === 'auto'
            ? 'grid-cols-[repeat(auto-fit,minmax(200px,1fr))]'
            : `grid-cols-${cols}`;

    return (
        <div
            className={cn("grid", gridCols, `gap-${gap}`, className)}
            style={dense ? { gridAutoFlow: 'dense' } : {}}
            {...props}
        >
            {children}
        </div>
    );
};

// Typography & Content
const Text = ({ className, variant = 'p', children, value, content, ...props }: any) => {
    const Component = variant === 'h1' ? 'h1' :
        variant === 'h2' ? 'h2' :
            variant === 'h3' ? 'h3' :
                variant === 'span' ? 'span' : 'p';
    return <Component className={cn(className)} {...props}>{children || content || value}</Component>;
};

const TextBlock = ({ children, className, ...props }: any) => (
    <div className={cn("prose dark:prose-invert max-w-none text-sm text-muted-foreground", className)} {...props}>
        {children}
    </div>
);

const StreamingText = ({ text, speed = 20, className, ...props }: any) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText((prev) => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return <span className={cn("font-mono animate-in fade-in", className)} {...props}>{displayedText}</span>;
}

// Stats & Metrics
const MetricCard = ({ label, value, trend, trendDirection, subtext, className }: any) => (
    <div className={cn("flex flex-col p-4 border rounded-xl bg-card text-card-foreground shadow-sm", className)}>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</span>
        <div className="flex items-baseline gap-2">
            <span className={cn("text-3xl font-bold tracking-tight")}>{value}</span>
        </div>
        {(trend || subtext) && (
            <div className="flex items-center gap-2 text-xs mt-3">
                {trend && (
                    <span className={cn(
                        "font-medium px-1.5 py-0.5 rounded-md",
                        trendDirection === 'up' ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" :
                            trendDirection === 'down' ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" :
                                "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                    )}>
                        {trend}
                    </span>
                )}
                {subtext && <span className="text-muted-foreground">{subtext}</span>}
            </div>
        )}
    </div>
);

// Status Badge
const StatusBadge = ({ status, dot = true, children, className, ...props }: any) => {
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
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", variants[status as keyof typeof variants], className)} {...props}>
            {dot && <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", dotColors[status as keyof typeof dotColors])} />}
            {children}
        </span>
    );
};

// Separator Component
const Separator = ({ orientation = 'horizontal', className, ...props }: any) => (
    <div
        className={cn(
            "shrink-0 bg-border",
            orientation === 'horizontal' ? "h-[1px] w-full" : "h-full w-[1px]",
            className
        )}
        {...props}
    />
);

// Divider Component
const Divider = ({ text, className, ...props }: any) => {
    if (text) {
        return (
            <div className={cn("relative flex items-center py-4", className)} {...props}>
                <div className="flex-grow border-t border-border" />
                <span className="mx-4 text-sm text-muted-foreground flex-shrink">{text}</span>
                <div className="flex-grow border-t border-border" />
            </div>
        );
    }
    return <div className={cn("w-full border-t border-border my-4", className)} {...props} />;
};

// Stat Card Component
const StatCard = ({ label, value, icon, trend, trendDirection = 'neutral', color = 'primary', className, ...props }: any) => {
    const colorClasses = {
        primary: 'border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5',
        success: 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5',
        warning: 'border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-500/5',
        error: 'border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-500/5',
        info: 'border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5'
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
        <Card className={cn("border shadow-sm", colorClasses[color as keyof typeof colorClasses], className)} {...props}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{label}</p>
                        <p className="text-3xl font-bold tracking-tight">{value}</p>
                        {trend && (
                            <div className={cn("flex items-center gap-1 text-sm font-medium", trendColorClasses[trendDirection as keyof typeof trendColorClasses])}>
                                {trendDirection === 'up' && <LucideIcons.TrendingUp className="h-4 w-4" />}
                                {trendDirection === 'down' && <LucideIcons.TrendingDown className="h-4 w-4" />}
                                <span>{trend}</span>
                            </div>
                        )}
                    </div>
                    {icon && (
                        <div className={cn("p-3 rounded-xl bg-background/50 backdrop-blur-sm", iconColorClasses[color as keyof typeof iconColorClasses])}>
                            <IconWrapper name={icon} className="h-6 w-6" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// Error State
const ErrorState = ({ title, message, retryAction, className, ...props }: any) => (
    <div className={cn("flex flex-col gap-4 p-6 rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm", className)} {...props}>
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
                <LucideIcons.AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <h4 className="font-semibold text-red-900 dark:text-red-400">{title}</h4>
        </div>
        <p className="text-sm text-red-800/70 dark:text-red-400/70 leading-relaxed font-medium">{message}</p>
        {retryAction && (
            <Button variant="outline" size="sm" onClick={retryAction} className="w-fit border-red-500/20 hover:bg-red-500/10 text-red-500 transition-colors">
                Try Again
            </Button>
        )}
    </div>
);

// Charts - Theme Aware
const Chart = ({ type = 'bar', data = [], xAxisKey = 'name', series = [], title, description, className }: any) => {
    // Basic theme-aware colors
    const colors = ['#2563eb', '#16a34a', '#db2777', '#ea580c', '#8b5cf6'];

    const ChartComponent = () => {
        if (!data || data.length === 0) return <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md">No data available</div>;

        switch (type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <XAxis dataKey={xAxisKey} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--popover-foreground))' }}
                                itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                                cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                            />
                            {series.map((s: any, i: number) => (
                                <Bar key={s.key} dataKey={s.key} fill={s.color || colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <XAxis dataKey={xAxisKey} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--popover-foreground))' }}
                                itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                            />
                            {series.map((s: any, i: number) => (
                                <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color || colors[i % colors.length]} strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--background))', strokeWidth: 2 }} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'area':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={data}>
                            <XAxis dataKey={xAxisKey} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--popover-foreground))' }}
                                itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                            />
                            {series.map((s: any, i: number) => (
                                <Area key={s.key} type="monotone" dataKey={s.key} stroke={s.color || colors[i % colors.length]} fill={s.color || colors[i % colors.length]} fillOpacity={0.2} />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                );
            default:
                return null;
        }
    };

    return (
        <Card className={cn("w-full bg-card text-card-foreground border-border/50 shadow-sm", className)}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartComponent />
            </CardContent>
        </Card>
    );
};


const ChartPlaceholder = ({ type = 'bar', title, className }: any) => (
    <Card className={cn("w-full bg-card text-card-foreground border-border/50 shadow-sm", className)}>
        <CardHeader>
            <CardTitle>{title || 'Chart Placeholder'}</CardTitle>
            <CardDescription>Visual representation of {type} data</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md border-2 border-dashed border-border/50 m-6">
            <div className="flex flex-col items-center gap-3 text-muted-foreground/60">
                <LucideIcons.BarChart3 className="h-10 w-10 opacity-20" />
                <span className="text-sm font-medium uppercase tracking-wider">{type} chart area</span>
            </div>
        </CardContent>
    </Card>
);

// Data Display
const BadgeWrapper = ({ className, variant = 'default', children, ...props }: any) => (
    <Badge variant={variant} className={cn(className)} {...props}>{children}</Badge>
);

const AvatarWrapper = ({ src, fallback, className, ...props }: any) => (
    <Avatar className={cn(className)} {...props}>
        <AvatarImage src={src} />
        <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
);

// Table Components (using shadcn imports directly in Registry)
import {
    Table, TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell
} from '@/components/table';

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/collapsible';

// Basic HTML Elements
const DivWrapper = ({ className, children, ...props }: any) => (
    <div className={cn("w-full", className)} {...props}>{children}</div>
);

// Thinking Block Component with Animation
import { motion } from "framer-motion";

const ThinkingBlock = ({ children, className, finished }: any) => {
    const [isOpen, setIsOpen] = useState(false); // Default to closed

    // Parse children text into steps
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

        // Split by common step delimiters
        const steps = content
            .split(/\n+|(?:\d+\.)|(?:Step \d+:?)|(?:[-•]\s)/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        return steps.length > 1 ? steps : [content];
    };

    const steps = getSteps();

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className={cn("w-full transition-all duration-300", className)}
        >
            <CollapsibleTrigger asChild>
                <div className="flex items-center gap-2 py-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity group w-fit">
                    <LucideIcons.ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200", isOpen && "rotate-90")} />
                    <span className="text-[11px] font-medium text-muted-foreground select-none uppercase tracking-wider">
                        Thought Process {steps.length > 1 && `(${steps.length} steps)`}
                    </span>
                    {!isOpen && !finished && (
                        <span className="flex gap-1 ml-2">
                            <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1 h-1 bg-primary/40 rounded-full animate-bounce"></span>
                        </span>
                    )}
                    {finished && !isOpen && (
                        <LucideIcons.CheckCircle2 className="h-3 w-3 text-green-500/70 ml-1" />
                    )}
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="pl-6 py-3 space-y-3 border-l-2 border-primary/10 ml-1.5 my-1 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20 transition-colors pr-3">
                        {/* Completion Milestones */}
                        <div className="space-y-2 pb-3 border-b border-border/20">
                            <div className="flex items-center gap-2.5">
                                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20">
                                    <LucideIcons.Check className="h-3 w-3 text-green-500" />
                                </div>
                                <span className="text-[12px] font-medium text-foreground/80">Thinking Completed</span>
                                <LucideIcons.Brain className="h-3.5 w-3.5 text-green-500/60 ml-auto" />
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20">
                                    <LucideIcons.Check className="h-3 w-3 text-green-500" />
                                </div>
                                <span className="text-[12px] font-medium text-foreground/80">Generating UI</span>
                                <LucideIcons.Sparkles className="h-3.5 w-3.5 text-green-500/60 ml-auto" />
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20">
                                    <LucideIcons.Check className="h-3 w-3 text-green-500" />
                                </div>
                                <span className="text-[12px] font-medium text-foreground/80">UI Completed</span>
                                <LucideIcons.CheckCircle2 className="h-3.5 w-3.5 text-green-500/60 ml-auto" />
                            </div>
                        </div>

                        {/* Thinking Steps */}
                        <div className="space-y-2.5">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Thought Process</span>
                            {steps.map((step, index) => (
                                <div key={index} className="flex items-start gap-3 group/step">
                                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold mt-0.5">
                                        {index + 1}
                                    </span>
                                    <span className="flex-1 text-[13px] text-muted-foreground/80 leading-relaxed">{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </CollapsibleContent>
        </Collapsible>
    );
};

// Registry Map
export const componentRegistry: Record<string, React.ComponentType<any>> = {
    'div': DivWrapper, // Fixed: Added div registration
    'container': Container,
    'section': Section,
    'stack': Stack,
    'grid': Grid,
    'card': CardWrapper,
    'card-header': CardHeader,
    'card-content': CardContent,
    'card-footer': CardFooter,
    'button': Button,
    'text': Text,
    'text-block': TextBlock,
    'streaming-text': StreamingText,
    'icon': IconWrapper,
    'input': Input,
    'metric': MetricCard,
    'badge': BadgeWrapper,
    'status-badge': StatusBadge,
    'avatar': AvatarWrapper,
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
};

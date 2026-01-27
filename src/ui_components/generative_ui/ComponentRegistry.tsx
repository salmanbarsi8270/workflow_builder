import React from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

// Wrapper for Lucide Icons
const IconWrapper = ({ name, className, ...props }: { name: string; className?: string }) => {
    // @ts-ignore
    const Icon = LucideIcons[name];
    if (!Icon) return null;
    return <Icon className={cn("h-4 w-4", className)} {...props} />;
};

// Layout Components
const Container = ({ className, children, ...props }: any) => (
    <div className={cn("w-full", className)} {...props}>{children}</div>
);

const Stack = ({ className, children, gap = 2, direction = 'col', ...props }: any) => (
    <div className={cn("flex", direction === 'col' ? "flex-col" : "flex-row", `gap-${gap}`, className)} {...props}>{children}</div>
);

const Grid = ({ className, children, cols = 1, gap = 4, ...props }: any) => (
    <div className={cn("grid", `grid-cols-${cols}`, `gap-${gap}`, className)} {...props}>{children}</div>
);

// Typography
// Typography
const Text = ({ className, variant = 'p', children, value, ...props }: any) => {
    const Component = variant === 'h1' ? 'h1' : variant === 'h2' ? 'h2' : variant === 'h3' ? 'h3' : 'p';
    return <Component className={cn(className)} {...props}>{children || value}</Component>;
};

// Specialized Components (like the Sales Stats)
const Metric = ({ label, value, trend, trendDirection, subtext, className }: any) => (
    <div className={cn("flex flex-col", className)}>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</span>
        <div className="flex items-baseline gap-2">
            <span className={cn("text-4xl font-bold", trendDirection === 'up' ? "text-green-500" : "text-foreground")}>{value}</span>
        </div>
        {(trend || subtext) && (
            <div className="flex items-center gap-1 text-xs mt-2">
                {trend && <span className={cn(trendDirection === 'up' ? "text-green-500" : "text-red-500")}>{trend}</span>}
                {subtext && <span className="text-muted-foreground">{subtext}</span>}
            </div>
        )}
    </div>
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

// Table Components
const Table = ({ className, children, ...props }: any) => (
    <div className="relative w-full overflow-auto">
        <table className={cn("w-full caption-bottom text-sm", className)} {...props}>{children}</table>
    </div>
);
const TableHeader = ({ className, children, ...props }: any) => (
    <thead className={cn("[&_tr]:border-b", className)} {...props}>{children}</thead>
);
const TableBody = ({ className, children, ...props }: any) => (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props}>{children}</tbody>
);
const TableRow = ({ className, children, ...props }: any) => (
    <tr className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props}>{children}</tr>
);
const TableHead = ({ className, children, ...props }: any) => (
    <th className={cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0", className)} {...props}>{children}</th>
);
const TableCell = ({ className, children, ...props }: any) => (
    <td className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)} {...props}>{children}</td>
);

// Registry Map
export const componentRegistry: Record<string, React.ComponentType<any>> = {
    'container': Container,
    'stack': Stack,
    'grid': Grid,
    'card': Card,
    'card-header': CardHeader,
    'card-content': CardContent,
    'card-footer': CardFooter,
    'button': Button,
    'text': Text,
    'icon': IconWrapper,
    'metric': Metric,
    'badge': BadgeWrapper,
    'avatar': AvatarWrapper,
    'table': Table,
    'table-header': TableHeader,
    'table-body': TableBody,
    'table-row': TableRow,
    'table-head': TableHead,
    'table-cell': TableCell,
};

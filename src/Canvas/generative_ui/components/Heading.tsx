import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface HeadingProps {
    level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    gradient?: boolean | 'primary' | 'secondary' | 'accent';
    children: any;
    className?: string;
    align?: 'left' | 'center' | 'right';
    weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
    tracking?: 'tight' | 'tighter' | 'normal' | 'wide' | 'wider';
    lineClamp?: number;
    balance?: boolean;
    responsive?: boolean;
    decorative?: boolean;
    icon?: any;
    subheading?: string;
    as?: any;
    span?: number | string;
    rowSpan?: number;
}

const gradientColors = {
    primary: 'from-primary via-primary/80 to-primary/60',
    secondary: 'from-secondary via-secondary/80 to-secondary/60',
    accent: 'from-accent via-accent/80 to-accent/60',
    default: 'from-primary to-primary/60',
};

export const Heading = ({
    level = 'h2',
    gradient = false,
    children,
    className,
    align = 'left',
    weight,
    tracking,
    lineClamp,
    balance = false,
    responsive = true,
    decorative = false,
    icon,
    subheading,
    as,
    span,
    rowSpan
}: HeadingProps) => {
    // Normalize level to ensure it's a valid h1-h6 tag
    const normalizedLevel = useMemo(() => {
        const str = String(level).toLowerCase();
        if (str.startsWith('h')) return str as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        const num = parseInt(str, 10);
        if (!isNaN(num) && num >= 1 && num <= 6) {
            return `h${num}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        }
        return 'h2';
    }, [level]);

    // Determine the actual tag to render
    const Tag = as || normalizedLevel;

    // Level-specific styles
    const levelStyles: Record<string, string> = {
        h1: cn(
            "font-black",
            responsive ? "text-3xl sm:text-4xl md:text-5xl lg:text-6xl" : "text-4xl md:text-5xl"
        ),
        h2: cn(
            "font-extrabold",
            responsive ? "text-2xl sm:text-3xl md:text-4xl" : "text-3xl md:text-4xl"
        ),
        h3: cn(
            "font-bold",
            responsive ? "text-xl sm:text-2xl md:text-3xl" : "text-2xl md:text-3xl"
        ),
        h4: cn(
            "font-semibold",
            responsive ? "text-lg sm:text-xl md:text-2xl" : "text-xl md:text-2xl"
        ),
        h5: cn(
            "font-medium",
            responsive ? "text-base sm:text-lg md:text-xl" : "text-lg md:text-xl"
        ),
        h6: cn(
            "font-medium",
            responsive ? "text-sm sm:text-base md:text-lg" : "text-base md:text-lg"
        ),
    };

    // Alignment classes
    const alignClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    // Weight classes (if explicitly provided)
    const weightClasses = weight && {
        light: 'font-light',
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
        extrabold: 'font-extrabold',
        black: 'font-black',
    }[weight];

    // Tracking classes
    const trackingClasses = tracking && {
        tighter: 'tracking-tighter',
        tight: 'tracking-tight',
        normal: 'tracking-normal',
        wide: 'tracking-wide',
        wider: 'tracking-wider',
    }[tracking];

    // Line clamp utility
    const lineClampClass = lineClamp && `line-clamp-${lineClamp}`;

    const spanClass = span ? (typeof span === 'string' ? span : `col-span-${span}`) : 'col-span-12';
    const rowSpanClass = rowSpan ? `row-span-${rowSpan}` : '';

    return (
        <div className={cn(
            "space-y-2",
            spanClass,
            rowSpanClass,
            alignClasses[align]
        )}>
            <div className="flex flex-col">
                {/* Decorative top line for h1 */}
                {decorative && level === 'h1' && (
                    <div className={cn(
                        "h-0.5 w-12 mb-4",
                        gradient
                            ? typeof gradient === 'string'
                                ? `bg-gradient-to-r ${gradientColors[gradient]}`
                                : gradientColors.default
                            : "bg-primary"
                    )} />
                )}

                <div className="flex items-center gap-3">
                    {icon && (
                        <div className={cn(
                            "flex-shrink-0",
                            align === 'center' && 'absolute left-0',
                            align === 'right' && 'absolute right-0 order-last'
                        )}>
                            {icon}
                        </div>
                    )}

                    <div className={cn(
                        "flex-1",
                        icon && align === 'left' && 'ml-0',
                        icon && align === 'center' && 'mx-auto',
                        icon && align === 'right' && 'mr-0'
                    )}>
                        <Tag
                            className={cn(
                                levelStyles[level],
                                alignClasses[align],
                                weightClasses,
                                trackingClasses,
                                lineClampClass,
                                balance && 'text-balance',
                                gradient
                                    ? typeof gradient === 'string'
                                        ? `bg-clip-text text-transparent bg-gradient-to-r ${gradientColors[gradient]}`
                                        : `bg-clip-text text-transparent bg-gradient-to-r ${gradientColors.default}`
                                    : "text-foreground",
                                decorative && level === 'h1' && "relative",
                                className
                            )}
                        >
                            {children}
                        </Tag>

                        {/* Decorative underline for h2-h4 */}
                        {decorative && ['h2', 'h3', 'h4'].includes(level) && (
                            <div className={cn(
                                "h-0.5 w-8 mt-2",
                                gradient
                                    ? typeof gradient === 'string'
                                        ? `bg-gradient-to-r ${gradientColors[gradient]}`
                                        : gradientColors.default
                                    : "bg-primary/30"
                            )} />
                        )}
                    </div>
                </div>
            </div>

            {/* Subheading */}
            {subheading && (
                <p className={cn(
                    "text-muted-foreground",
                    responsive ? "text-sm sm:text-base" : "text-base",
                    alignClasses[align],
                    level === 'h1' && "mt-4",
                    level === 'h2' && "mt-3",
                    ["h3", "h4", "h5", "h6"].includes(level) && "mt-2",
                    decorative && "font-light tracking-wide"
                )}>
                    {subheading}
                </p>
            )}
        </div>
    );
};

// Pre-styled heading variants for common use cases
Heading.PageTitle = (props: Omit<HeadingProps, 'level'>) => (
    <Heading
        level="h1"
        gradient="primary"
        decorative
        balance
        responsive
        {...props}
    />
);

Heading.SectionTitle = (props: Omit<HeadingProps, 'level'>) => (
    <Heading
        level="h2"
        gradient={false}
        decorative
        responsive
        {...props}
    />
);

Heading.CardTitle = (props: Omit<HeadingProps, 'level'>) => (
    <Heading
        level="h3"
        responsive={false}
        weight="semibold"
        {...props}
    />
);

Heading.Subtitle = (props: Omit<HeadingProps, 'level'>) => (
    <Heading
        level="h4"
        responsive={false}
        weight="medium"
        className="text-muted-foreground"
        {...props}
    />
);
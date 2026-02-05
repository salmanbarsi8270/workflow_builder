import React from 'react';
import { cn } from "@/lib/utils";
import { DynamicRenderer } from '../DynamicRenderer';
import type { UIComponent } from '../types';

interface GridContainerProps {
    children?: UIComponent[] | any;
    className?: string;
    rows?: number | string | { base?: number | string; sm?: number | string; md?: number | string; lg?: number | string; xl?: number | string };
    cols?: number | string | { base?: number | string; sm?: number | string; md?: number | string; lg?: number | string; xl?: number | string };
    gap?: number | string | { base?: number | string; sm?: number | string; md?: number | string; lg?: number | string; xl?: number | string };
    padding?: number | string | { base?: number | string; sm?: number | string; md?: number | string; lg?: number | string; xl?: number | string };
    height?: string | { base?: string; sm?: string; md?: string; lg?: string; xl?: string };
    flow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense';
    autoRows?: string;
    autoCols?: string;
    align?: 'start' | 'end' | 'center' | 'stretch';
    justify?: 'start' | 'end' | 'center' | 'stretch' | 'between' | 'around' | 'evenly';
    overflow?: 'visible' | 'hidden' | 'clip' | 'scroll' | 'auto';
    as?: React.ElementType;
    debug?: boolean;
}

// Helper function to convert numeric gaps to rem
const getGapValue = (value: number | string): string => {
    if (typeof value === 'number') {
        return `${value * 0.25}rem`;
    }
    return value;
};

// Helper to generate responsive template values
const getResponsiveValue = (
    value: number | string | { base?: number | string; sm?: number | string; md?: number | string; lg?: number | string; xl?: number | string } | undefined,
    defaultVal: number | string
): any => {
    if (!value) return defaultVal;
    
    if (typeof value === 'number' || typeof value === 'string') {
        return { base: value };
    }
    
    return value;
};

// Helper to convert responsive values to CSS custom properties
const generateResponsiveStyles = (
    rowsValue: any,
    colsValue: any,
    gapValue: any,
    paddingValue: any,
    heightValue: any
): React.CSSProperties => {
    const styles: React.CSSProperties & Record<string, string> = {};
    
    // Generate CSS custom properties for responsive values
    const processValue = (value: any, prefix: string) => {
        if (typeof value !== 'object') {
            styles[`--${prefix}`] = typeof value === 'number' 
                ? `repeat(${value}, minmax(0, 1fr))` 
                : value;
            return;
        }
        
        const breakpoints = ['base', 'sm', 'md', 'lg', 'xl'] as const;
        breakpoints.forEach(bp => {
            if (value[bp] !== undefined) {
                const cssVar = bp === 'base' ? `--${prefix}` : `--${prefix}-${bp}`;
                styles[cssVar] = typeof value[bp] === 'number' 
                    ? `repeat(${value[bp]}, minmax(0, 1fr))` 
                    : value[bp]!;
            }
        });
    };
    
    // Generate CSS custom properties for spacing values
    const processSpacingValue = (value: any, prefix: string) => {
        if (typeof value !== 'object') {
            styles[`--${prefix}`] = getGapValue(value);
            return;
        }
        
        const breakpoints = ['base', 'sm', 'md', 'lg', 'xl'] as const;
        breakpoints.forEach(bp => {
            if (value[bp] !== undefined) {
                const cssVar = bp === 'base' ? `--${prefix}` : `--${prefix}-${bp}`;
                styles[cssVar] = getGapValue(value[bp]!);
            }
        });
    };
    
    processValue(rowsValue, 'grid-rows');
    processValue(colsValue, 'grid-cols');
    processSpacingValue(gapValue, 'gap');
    processSpacingValue(paddingValue, 'padding');
    
    // Process height values
    if (typeof heightValue !== 'object') {
        styles['--height'] = heightValue;
    } else {
        const breakpoints = ['base', 'sm', 'md', 'lg', 'xl'] as const;
        breakpoints.forEach(bp => {
            if (heightValue[bp] !== undefined) {
                const cssVar = bp === 'base' ? '--height' : `--height-${bp}`;
                styles[cssVar] = heightValue[bp]!;
            }
        });
    }
    
    return styles;
};

export const GridContainer = ({
    children,
    className,
    rows = 2,
    cols = 4,
    gap = 4,
    padding = 4,
    height = 'min-h-[300px]',
    flow = 'row',
    autoRows,
    autoCols,
    align = 'stretch',
    justify = 'stretch',
    overflow = 'hidden',
    as: Component = 'div',
    debug = false
}: GridContainerProps) => {
    // Process responsive values
    const rowsValue = getResponsiveValue(rows, 2);
    const colsValue = getResponsiveValue(cols, 4);
    const gapValue = getResponsiveValue(gap, 4);
    const paddingValue = getResponsiveValue(padding, 4);
    const heightValue = getResponsiveValue(height, 'min-h-[300px]');

    const responsiveStyles = generateResponsiveStyles(
        rowsValue,
        colsValue,
        gapValue,
        paddingValue,
        heightValue
    );

    // Determine if we need responsive grid classes
    const needsResponsiveRows = typeof rowsValue === 'object';
    const needsResponsiveCols = typeof colsValue === 'object';
    const needsResponsiveGap = typeof gapValue === 'object';
    const needsResponsivePadding = typeof paddingValue === 'object';
    const needsResponsiveHeight = typeof heightValue === 'object';

    // Base grid classes
    const gridClasses = cn(
        "grid w-full",
        // Responsive grid templates
        needsResponsiveRows && [
            "grid-rows-[--grid-rows]",
            rowsValue.sm && "sm:grid-rows-[--grid-rows-sm]",
            rowsValue.md && "md:grid-rows-[--grid-rows-md]",
            rowsValue.lg && "lg:grid-rows-[--grid-rows-lg]",
            rowsValue.xl && "xl:grid-rows-[--grid-rows-xl]",
        ],
        needsResponsiveCols && [
            "grid-cols-[--grid-cols]",
            colsValue.sm && "sm:grid-cols-[--grid-cols-sm]",
            colsValue.md && "md:grid-cols-[--grid-cols-md]",
            colsValue.lg && "lg:grid-cols-[--grid-cols-lg]",
            colsValue.xl && "xl:grid-cols-[--grid-cols-xl]",
        ],
        
        // Static grid templates
        !needsResponsiveRows && (typeof rowsValue === 'number' 
            ? `grid-rows-${rowsValue}`
            : `grid-rows-[${rowsValue.base}]`),
        !needsResponsiveCols && (typeof colsValue === 'number' 
            ? `grid-cols-${colsValue}`
            : `grid-cols-[${colsValue.base}]`),
            
        // Responsive gaps
        needsResponsiveGap && [
            "gap-[--gap]",
            gapValue.sm && "sm:gap-[--gap-sm]",
            gapValue.md && "md:gap-[--gap-md]",
            gapValue.lg && "lg:gap-[--gap-lg]",
            gapValue.xl && "xl:gap-[--gap-xl]",
        ].filter(Boolean).join(' '),
        
        !needsResponsiveGap && (typeof gapValue === 'number' 
            ? `gap-${gapValue}`
            : `gap-[${getGapValue(gapValue)}]`),
            
        // Responsive padding
        needsResponsivePadding && [
            "p-[--padding]",
            paddingValue.sm && "sm:p-[--padding-sm]",
            paddingValue.md && "md:p-[--padding-md]",
            paddingValue.lg && "lg:p-[--padding-lg]",
            paddingValue.xl && "xl:p-[--padding-xl]",
        ].filter(Boolean).join(' '),
        
        !needsResponsivePadding && (typeof paddingValue === 'number' 
            ? `p-${paddingValue}`
            : `p-[${getGapValue(paddingValue)}]`),
            
        // Responsive height
        needsResponsiveHeight && [
            "h-[--height]",
            heightValue.sm && "sm:h-[--height-sm]",
            heightValue.md && "md:h-[--height-md]",
            heightValue.lg && "lg:h-[--height-lg]",
            heightValue.xl && "xl:h-[--height-xl]",
        ].filter(Boolean).join(' '),
        
        !needsResponsiveHeight && heightValue,
        
        // Grid properties
        flow && `grid-flow-${flow.replace(' ', '-')}`,
        autoRows && `auto-rows-${autoRows}`,
        autoCols && `auto-cols-${autoCols}`,
        align && `items-${align}`,
        justify && `justify-${justify}`,
        overflow && `overflow-${overflow}`,
        
        // Visual styling
        "bg-background rounded-lg border",
        debug && "bg-grid bg-[size:20px_20px] border-dashed border-red-300",
        
        className
    );

    const renderChildren = () => {
        if (Array.isArray(children)) {
            return children.map((child: UIComponent | any, index: number) => {
                const layout = child.layout || {};
                
                // Generate placement classes
                const placementClasses = cn(
                    layout.colStart && `col-start-${layout.colStart}`,
                    layout.colSpan && `col-span-${layout.colSpan}`,
                    layout.colEnd && `col-end-${layout.colEnd}`,
                    layout.rowStart && `row-start-${layout.rowStart}`,
                    layout.rowSpan && `row-span-${layout.rowSpan}`,
                    layout.rowEnd && `row-end-${layout.rowEnd}`,
                    
                    // Responsive placements
                    layout.colStartSm && `sm:col-start-${layout.colStartSm}`,
                    layout.colSpanSm && `sm:col-span-${layout.colSpanSm}`,
                    layout.rowStartSm && `sm:row-start-${layout.rowStartSm}`,
                    layout.rowSpanSm && `sm:row-span-${layout.rowSpanSm}`,
                    
                    // Ensure proper cell sizing
                    "h-full w-full min-h-0 min-w-0"
                );

                // Check if child is a valid React element
                if (React.isValidElement(child)) {
                    return (
                        <div
                            key={child.key || index}
                            className={placementClasses}
                        >
                            {child}
                        </div>
                    );
                }

                // Handle UIComponent schema object
                return (
                    <div
                        key={child.id || index}
                        className={placementClasses}
                    >
                        {typeof child === 'object' && child !== null && 'type' in child ? (
                            <DynamicRenderer component={child} />
                        ) : (
                            child
                        )}
                    </div>
                );
            });
        }

        // Single child
        return (
            <div className="col-span-full row-span-full">
                {React.isValidElement(children) ? (
                    children
                ) : typeof children === 'object' && children !== null && 'type' in children ? (
                    <DynamicRenderer component={children} />
                ) : (
                    children
                )}
            </div>
        );
    };

    // Render with proper typing
    return React.createElement(
        Component,
        {
            className: gridClasses,
            style: responsiveStyles,
            'data-debug': debug
        },
        renderChildren()
    );
};

// Quick grid helpers with proper typing
GridContainer.Responsive = ({ children, className, ...props }: Omit<GridContainerProps, 'rows' | 'cols' | 'gap' | 'padding'>) => (
    <GridContainer
        rows={{ base: 1, sm: 2, md: 3, lg: 4 }}
        cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
        gap={{ base: 2, md: 4, lg: 6 }}
        padding={{ base: 3, md: 4, lg: 6 }}
        className={className}
        {...props}
    >
        {children}
    </GridContainer>
);

GridContainer.CardGrid = ({ children, className, ...props }: Omit<GridContainerProps, 'cols' | 'gap' | 'padding' | 'className'> & { className?: string }) => (
    <GridContainer
        cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
        gap={{ base: 4, lg: 6 }}
        padding={4}
        className={cn("bg-transparent border-0", className)}
        {...props}
    >
        {children}
    </GridContainer>
);

GridContainer.FormGrid = ({ children, className, ...props }: Omit<GridContainerProps, 'cols' | 'gap' | 'padding' | 'className'> & { className?: string }) => (
    <GridContainer
        cols={{ base: 1, md: 2 }}
        gap={{ base: 3, md: 4 }}
        className={cn("bg-transparent border-0 p-0", className)}
        {...props}
    >
        {children}
    </GridContainer>
);

// Type exports
export type { GridContainerProps };
import React, { type JSX } from 'react';
import { cn } from "@/lib/utils";
import { DynamicRenderer } from '../DynamicRenderer';

interface ContainerProps {
    children?: any;
    className?: string;
    layout?: 'flex' | 'grid' | 'block' | 'stack';
    direction?: 'row' | 'column';
    gap?: number | string;
    gapSm?: number | string;
    gapMd?: number | string;
    gapLg?: number | string;
    cols?: number;
    colsSm?: number;
    colsMd?: number;
    colsLg?: number;
    justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
    align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
    padding?:  any;
    paddingSm?: number | string;
    paddingMd?: number | string;
    paddingLg?: number | string;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'screen';
    center?: boolean;
    wrap?: boolean;
    as?: keyof JSX.IntrinsicElements;
}

export const Container = ({
    children,
    className,
    layout = 'block',
    direction = 'column',
    gap = 4,
    gapSm,
    gapMd,
    gapLg,
    cols = 1,
    colsSm,
    colsMd,
    colsLg,
    justify = 'start',
    align = 'stretch',
    padding = 0,
    paddingSm,
    paddingMd,
    paddingLg,
    maxWidth = 'full',
    center = false,
    wrap = false,
    as: Component = 'div'
}: ContainerProps) => {

    // Responsive gap classes
    const getGapClass = (value: number | string | undefined, breakpoint?: string) => {
        if (value === undefined) return '';
        const prefix = breakpoint ? `${breakpoint}:` : '';
        return typeof value === 'number' ? `${prefix}gap-${value}` : `${prefix}gap-[${value}]`;
    };

    // Responsive padding classes
    const getPaddingClass = (value: number | string | undefined, breakpoint?: string) => {
        if (value === undefined) return '';
        const prefix = breakpoint ? `${breakpoint}:` : '';
        return typeof value === 'number' ? `${prefix}p-${value}` : `${prefix}p-[${value}]`;
    };

    // Responsive grid columns
    const getColsClass = (value: number | undefined, breakpoint?: string) => {
        if (value === undefined) return '';
        const prefix = breakpoint ? `${breakpoint}:` : '';
        return `${prefix}grid-cols-${value}`;
    };

    // Generate responsive layout classes
    const layoutClasses = cn(
        'w-full',
        // Max width and centering
        maxWidth !== 'full' && maxWidth !== 'screen' && `max-w-${maxWidth}`,
        maxWidth === 'screen' && 'max-w-screen',
        center && 'mx-auto',
        
        // Layout specific classes
        layout === 'flex' && [
            'flex',
            direction === 'column' ? 'flex-col' : 'flex-row',
            wrap && 'flex-wrap',
            `justify-${justify}`,
            `items-${align}`,
            getGapClass(gap),
            gapSm && getGapClass(gapSm, 'sm'),
            gapMd && getGapClass(gapMd, 'md'),
            gapLg && getGapClass(gapLg, 'lg'),
        ],
        
        layout === 'grid' && [
            'grid',
            getColsClass(cols),
            colsSm && getColsClass(colsSm, 'sm'),
            colsMd && getColsClass(colsMd, 'md'),
            colsLg && getColsClass(colsLg, 'lg'),
            getGapClass(gap),
            gapSm && getGapClass(gapSm, 'sm'),
            gapMd && getGapClass(gapMd, 'md'),
            gapLg && getGapClass(gapLg, 'lg'),
            `justify-${justify}`,
            `items-${align}`,
        ],
        
        layout === 'stack' && [
            'flex flex-col',
            'space-y-reverse space-y-0',
            getGapClass(gap, 'space-y'),
            gapSm && getGapClass(gapSm, 'sm:space-y'),
            gapMd && getGapClass(gapMd, 'md:space-y'),
            gapLg && getGapClass(gapLg, 'lg:space-y'),
        ],
        
        layout === 'block' && 'block',
        
        // Responsive padding
        getPaddingClass(padding),
        paddingSm && getPaddingClass(paddingSm, 'sm'),
        paddingMd && getPaddingClass(paddingMd, 'md'),
        paddingLg && getPaddingClass(paddingLg, 'lg'),
        
        className
    );

    const renderChildren = () => {
        if (Array.isArray(children)) {
            return children.map((child: any, index: number) => {
                // Check if child is a valid React element
                if (React.isValidElement(child)) {
                    return <React.Fragment key={index}>{child}</React.Fragment>;
                }
                
                // Check if child is an object (component definition)
                if (typeof child === 'object' && child !== null) {
                    return <DynamicRenderer key={child.id || index} component={child} />;
                }
                
                // Fallback for strings/other
                return <React.Fragment key={index}>{child}</React.Fragment>;
            });
        }
        
        // Single child
        if (React.isValidElement(children)) {
            return children;
        }
        
        if (typeof children === 'object' && children !== null) {
            return <DynamicRenderer component={children} />;
        }
        
        return children;
    };

    return (
        <Component className={layoutClasses}>
            {renderChildren()}
        </Component>
    );
};

// Helper component for responsive breakpoints
Container.Section = ({ 
    children, 
    className,
    size = 'md',
    background = 'transparent'
}: {
    children: React.ReactNode;
    className?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    background?: 'transparent' | 'muted' | 'primary' | 'secondary';
}) => {
    const sizeClasses = {
        xs: 'py-8 sm:py-10',
        sm: 'py-12 sm:py-16',
        md: 'py-16 sm:py-20',
        lg: 'py-20 sm:py-24',
        xl: 'py-24 sm:py-32'
    };
    
    const backgroundClasses = {
        transparent: '',
        muted: 'bg-muted',
        primary: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground'
    };
    
    return (
        <section className={cn(
            sizeClasses[size],
            backgroundClasses[background],
            className
        )}>
            <Container 
                maxWidth="lg" 
                center
                padding={{ base: 4, sm: 6, md: 8 }}
            >
                {children}
            </Container>
        </section>
    );
};
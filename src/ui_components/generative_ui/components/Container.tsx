import React from 'react';
import { cn } from "@/lib/utils";
import { DynamicRenderer } from '../DynamicRenderer';

interface ContainerProps {
    children?: any;
    className?: string;
    layout?: 'flex' | 'grid' | 'block';
    direction?: 'row' | 'col';
    gap?: string;
    cols?: number;
}

export const Container = ({
    children,
    className,
    layout = 'block',
    direction = 'col',
    gap = '4',
    cols = 1
}: ContainerProps) => {

    // Base layout classes
    const layoutClasses = cn(
        layout === 'flex' && `flex flex-${direction}`,
        layout === 'grid' && `grid grid-cols-${cols}`,
        layout === 'block' && 'block',
        `gap-${gap}`,
        className
    );

    return (
        <div className={cn("w-full h-full", layoutClasses)}>
            {Array.isArray(children) ? (
                children.map((child: any, index: number) => (
                    // 1. Check if child is a valid React element
                    React.isValidElement(child) ? (
                        <React.Fragment key={index}>{child}</React.Fragment>
                    ) :
                        // 2. Check if child is an object (component definition)
                        typeof child === 'object' && child !== null ? (
                            <DynamicRenderer key={child.id || index} component={child} />
                        ) : (
                            // 3. Fallback for strings/other
                            <React.Fragment key={index}>{child}</React.Fragment>
                        )
                ))
            ) : (
                React.isValidElement(children) ? (
                    children
                ) : typeof children === 'object' && children !== null ? (
                    <DynamicRenderer component={children} />
                ) : children
            )}
        </div>
    );
};

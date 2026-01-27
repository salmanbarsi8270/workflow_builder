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
                    // If child is an object (component definition), render it via DynamicRenderer
                    // If it's a string, render directly
                    typeof child === 'object' && child !== null ? (
                        <DynamicRenderer key={child.id || index} component={child} />
                    ) : (
                        <React.Fragment key={index}>{child}</React.Fragment>
                    )
                ))
            ) : (
                typeof children === 'object' && children !== null ? (
                    <DynamicRenderer component={children} />
                ) : children
            )}
        </div>
    );
};

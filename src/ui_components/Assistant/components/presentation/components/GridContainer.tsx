import React from 'react';
import { cn } from "@/lib/utils";
import { DynamicRenderer } from '../DynamicRenderer';
import type { UIComponent } from '../types';

interface GridContainerProps {
    children?: UIComponent[] | any; // Supports UIComponent array or direct children
    className?: string;
    rows?: number | string;
    cols?: number | string;
    gap?: string;
    padding?: string;
    height?: string;
}

export const GridContainer = ({
    children,
    className,
    rows = 2,
    cols = 4,
    gap = '4',
    padding = '4',
    height = 'min-h-[400px]'
}: GridContainerProps) => {

    // Helper to process grid template values
    const getTemplate = (val: number | string) => {
        if (typeof val === 'number') {
            return `repeat(${val}, minmax(0, 1fr))`;
        }
        return val; // Allow passing raw CSS strings like "200px 1fr"
    };

    const style = {
        display: 'grid',
        gridTemplateRows: getTemplate(rows),
        gridTemplateColumns: getTemplate(cols),
        gap: `${Number(gap) * 0.25}rem`, // Assuming gap prop is tailwind-like (4 = 1rem)
        padding: `${Number(padding) * 0.25}rem`,
    };

    return (
        <div
            className={cn("w-full bg-background/50 rounded-lg border", className, height)}
            style={style}
        >
            {Array.isArray(children) ? (
                children.map((child: UIComponent | any, index: number) => {
                    const layout = child.layout || {};
                    const childStyle: React.CSSProperties = {
                        gridColumnStart: layout.colStart,
                        gridColumnEnd: layout.colSpan ? `span ${layout.colSpan}` : layout.colEnd,
                        gridRowStart: layout.rowStart,
                        gridRowEnd: layout.rowSpan ? `span ${layout.rowSpan}` : layout.rowEnd,
                    };

                    // Check if child is a valid React element (already rendered JSX)
                    if (React.isValidElement(child)) {
                        return (
                            <div
                                key={child.key || index}
                                style={childStyle}
                                className="h-full w-full min-h-0 min-w-0"
                            >
                                {child}
                            </div>
                        );
                    }

                    // Handle UIComponent schema object
                    return (
                        <div
                            key={child.id || index}
                            style={childStyle}
                            className="h-full w-full min-h-0 min-w-0" // Ensure children don't overflow grid cells
                        >
                            {typeof child === 'object' && child !== null && 'type' in child ? (
                                <DynamicRenderer component={child} />
                            ) : (
                                child
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="col-span-full row-span-full">
                    {React.isValidElement(children) ? (
                        children
                    ) : typeof children === 'object' && children !== null && 'type' in children ? (
                        <DynamicRenderer component={children} />
                    ) : children}
                </div>
            )}
        </div>
    );
};

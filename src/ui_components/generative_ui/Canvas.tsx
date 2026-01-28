import { DynamicRenderer } from './DynamicRenderer';
import type { UIComponent, GridLayout } from './types';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CanvasProps {
    uiSchemas: UIComponent[];
}

// Convert component type/props to a layout object
const getLayout = (component: UIComponent): GridLayout => {
    // 1. Explicit layout from AI
    if (component.layout) {
        return component.layout;
    }

    // 2. Legacy colSpan prop support
    if (component.props?.colSpan) {
        const span = Math.min(12, Math.max(1, Number(component.props.colSpan)));
        return { colSpan: span };
    }

    // 3. Intelligent auto-sizing based on component type (12-column grid)
    switch (component.type) {
        // LARGE - Full width
        case 'data-table':
        case 'timeline-card':
        case 'activity-feed':
        case 'heading':
        case 'tabs':
        case 'wiki-card':
            return { colSpan: 12 };

        // MEDIUM - Half width
        case 'stats-grid':
        case 'chart-card':
        case 'accordion':
            return { colSpan: 6 };

        // SMALL - Third width
        case 'summary-card':
        case 'comparison-card':
        case 'stats-list':
        case 'info-card':
        case 'progress-card':
        case 'calendar-card':
        case 'text-card':
            return { colSpan: 4 };

        // MINI - Quarter width
        case 'kpi-card':
        case 'empty-state':
        case 'avatar':
        case 'button':
        case 'badge':
        case 'status-tag':
            return { colSpan: 3 };

        default:
            return { colSpan: 4 };
    }
};

export function Canvas({ uiSchemas }: CanvasProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new components arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [uiSchemas.length]);

    return (
        <TooltipProvider delayDuration={300}>
            <div ref={scrollRef} className="flex-1 w-full h-full overflow-y-auto no-scrollbar bg-transparent scroll-smooth">
                <div
                    className="p-6 pb-40 grid gap-6"
                    style={{
                        gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                        gridAutoRows: 'min-content'
                    }}
                >
                    {uiSchemas.map((schema, index) => {
                        const layout = getLayout(schema);
                        const userPrompt = (schema as any)._userPrompt;

                        // Construct grid style
                        const gridStyle: React.CSSProperties = {
                            gridColumnStart: layout.colStart,
                            gridColumnEnd: layout.colSpan ? `span ${layout.colSpan}` : layout.colEnd,
                            gridRowStart: layout.rowStart,
                            gridRowEnd: layout.rowSpan ? `span ${layout.rowSpan}` : layout.rowEnd,
                            animationDelay: `${index * 100}ms`
                        };

                        // Responsive modifications could be handled here if needed, 
                        // but for now we follow the strict grid logic "under the hood" as requested.
                        // To keep some responsiveness, we could use media queries in CSS 
                        // or just rely on the fact that on mobile we might force single column via className overrides if necessary.
                        // For this implementation, we stick to the core grid system request.

                        return (
                            <Tooltip key={schema.id || index}>
                                <TooltipTrigger asChild>
                                    <div
                                        className={cn(
                                            "group relative bg-card/40 backdrop-blur-md border border-border/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 animate-in zoom-in-95 fade-in duration-700",
                                            // Fallback for mobile if we want to collapse
                                            "max-md:!col-span-12"
                                        )}
                                        style={gridStyle}
                                    >
                                        {/* User Prompt Label - Always Visible */}
                                        {userPrompt && (
                                            <div className="absolute top-0 left-0 right-0 bg-primary/10 backdrop-blur-sm border-b border-primary/20 px-3 py-1.5 z-20">
                                                <p className="text-[10px] text-muted-foreground truncate">
                                                    <span className="font-semibold text-primary">Q:</span> {userPrompt}
                                                </p>
                                            </div>
                                        )}

                                        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="h-6 w-6 rounded-full bg-background/80 flex items-center justify-center text-[10px] font-bold border border-border shadow-sm">
                                                {index + 1}
                                            </div>
                                        </div>
                                        <div className={cn("p-1 h-full flex flex-col", userPrompt && "pt-8")}>
                                            <DynamicRenderer component={schema} />
                                        </div>
                                    </div>
                                </TooltipTrigger>
                                {userPrompt && (
                                    <TooltipContent
                                        side="top"
                                        className="max-w-xs bg-background/95 backdrop-blur-sm border-primary/20"
                                    >
                                        <p className="text-xs text-muted-foreground">
                                            <span className="font-semibold text-foreground">Question: </span>
                                            {userPrompt}
                                        </p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        );
                    })}
                </div>

                {uiSchemas.length === 0 && (
                    <div className="h-full w-full flex flex-col items-center justify-center opacity-20 select-none">
                        <div className="h-24 w-24 rounded-full border-4 border-dashed border-primary/20 animate-[spin_10s_linear_infinite]" />
                        <p className="mt-4 text-sm font-medium">Ready for your first generation</p>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}

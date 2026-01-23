
import React, { useState, useEffect } from 'react';
import { SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { RotateCcw, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface ResizableSheetContentProps extends React.ComponentProps<typeof SheetContent> {
    storageKey: string;
    defaultWidth: number;
    side: "left" | "right";
}

export function ResizableSheetContent({ 
    storageKey, 
    defaultWidth, 
    side, 
    className, 
    children, 
    ...props 
}: ResizableSheetContentProps) {
    // --- State ---
    // Initialize width from localStorage or default
    const [width, setWidth] = useState<number>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (!saved) return defaultWidth;
            const parsed = parseInt(saved, 10);
            return isNaN(parsed) ? defaultWidth : parsed;
        } catch (e) {
            return defaultWidth;
        }
    });

    const [isDragging, setIsDragging] = useState(false);
    
    // --- Handlers ---
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true); // Visual feedback
        const startX = e.clientX;
        const startWidth = width;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentX = moveEvent.clientX;
            const diff = side === 'left' 
                ? currentX - startX 
                : startX - currentX; // Invert for right side

            // Constraints
            const newWidth = Math.max(300, Math.min(window.innerWidth - 50, startWidth + diff));
            setWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            // Save final width
            try {
                // Get the *current* width from state (might be stale in closure? No, we use ref or relying on re-render to have updated width? 
                // Actually handleMouseMove updates state. But here we might not have latest 'width'.
                // Better to save in handleMouseMove or just fetch from DOM? 
                // Simplest: just save result of last calculation if we tracked it, but easier to use a ref for latest width if needed.
                // Or just assume the last render was close enough.
                // Let's use a ref to track live width to ensure we save the exact value.
            } catch (e) {}
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Keep localStorage in sync (debounced slightly or just on change)
    useEffect(() => {
        localStorage.setItem(storageKey, width.toString());
    }, [width, storageKey]);

    const handleReset = () => {
        setWidth(defaultWidth);
    };

    return (
        <SheetContent 
            side={side} 
            className={cn(
                "p-0 flex flex-col gap-0", // Remove standard transition for smooth drag
                isDragging && "select-none",
                className
            )}
            style={{ 
                maxWidth: 'none', 
                width: `${width}px`,
                transition: 'width 0s'
            }}
            {...props}
        >
            {/* Resize Handle */}
            <div 
                onMouseDown={handleMouseDown}
                className={cn(
                    "absolute top-0 bottom-0 w-6 cursor-col-resize z-50 flex items-center justify-center group/handle",
                    side === 'left' ? "-right-3" : "-left-3"
                )}
                title="Drag to resize"
            >
                <div className={cn(
                    "h-8 w-4 bg-background border shadow-sm rounded-full flex items-center justify-center transition-all",
                    isDragging && "bg-primary/10 border-primary/20",
                    // Correction for side positioning if needed to center pill exactly on border
                )}>
                    <GripVertical className="h-2.5 w-2.5 text-muted-foreground" />
                </div>
                
                 {/* Active Line Indicator */}
                 <div className={cn(
                        "absolute top-0 bottom-0 w-px bg-primary/0 transition-colors",
                         (isDragging) && "bg-primary/20",
                         side === 'left' ? "right-1.5" : "left-1.5"
                )} />
            </div>

            {/* Custom Header Controls (Reset) - Positioned absolute near close button usually */}
            <div className={cn(
                "absolute top-4 z-50 flex items-center gap-1",
                 side === 'left' ? "right-12" : "left-4" // Opposite of close button or next to it? 
                 // Standard close button is usually top-right for both or based on direction.
                 // SheetContent default close is top-right.
                 // If side=left, close is top-right of panel. 
                 // If side=right, close is top-right.
                 // So we want this to the left of the close button.
                 // Close button is usually `absolute right-4 top-4`.
            )}>
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn("h-6 w-6 text-muted-foreground/50 hover:text-foreground mt-1", width === defaultWidth && "opacity-0 pointer-events-none")}
                                onClick={handleReset}
                            >
                                <RotateCcw className="h-3 w-3" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reset Width</TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
            </div>

            {children}
        </SheetContent>
    );
}

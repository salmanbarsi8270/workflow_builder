import { useState, useEffect, useCallback } from 'react';
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import type { Agent } from './types';
import { cn } from "@/lib/utils";
import { PublicChat } from '../PublicChat/PublicChat';



interface RunAgentDialogProps {
    agent: Agent | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId?: string;
}

export function RunAgentDialog({ agent, open, onOpenChange, userId }: RunAgentDialogProps) {
    const [width, setWidth] = useState(600);
    const [isResizing, setIsResizing] = useState(false);

    // Resize logic
    const startResizing = useCallback((e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = window.innerWidth - e.clientX;
            const minWidth = 400;
            const maxWidth = window.innerWidth * 0.9;
            
            if (newWidth > minWidth && newWidth < maxWidth) {
                setWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    // UI Config
    const uiConfig: any = agent?.ui_config || {};
    const fontFamily = uiConfig.font_family || 'Inter, sans-serif';



    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction="right">
            <DrawerContent className={cn("h-full border-none shadow-2xl flex flex-col p-0 gap-0 rounded-none mt-0 ml-auto bg-background/95 backdrop-blur-xl", isResizing ? "transition-none" : "transition-[width] duration-300 ease-out")} style={{ width, fontFamily }}>
                {/* Resize Handle */}
                <div className={cn("absolute left-0 top-0 w-1.5 h-full cursor-ew-resize hover:bg-blue-500/50 transition-colors z-50", isResizing && "bg-blue-500")} onMouseDown={startResizing}/>

                <div className="flex flex-col h-full">
                    <PublicChat agent={agent} userId={userId} />
                </div>

            </DrawerContent>
        </Drawer>
    );
}

import { RefreshCcw, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";

interface NodeContextMenuProps {
    x: number;
    y: number;
    onSwap: () => void;
    onDelete: () => void;
    onClose: () => void;
}

export default function NodeContextMenu({ x, y, onSwap, onDelete, onClose }: NodeContextMenuProps) {
    return (
        <div 
            className="fixed z-[100] w-48 bg-popover border border-border shadow-xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{ top: y, left: x }}
            onMouseLeave={onClose}
        >
            <div className="p-1">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSwap();
                        onClose();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                >
                    <RefreshCcw className="h-4 w-4" />
                    <span>Swap Step</span>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                        onClose();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Step</span>
                </button>
            </div>
        </div>
    );
}

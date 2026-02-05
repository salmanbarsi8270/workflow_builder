import { Canvas } from "../generative_ui/Canvas";
import type { UIComponent } from "../generative_ui/types";

interface CanvasAreaProps {
    uiSchema: UIComponent;
}

export const CanvasArea = ({ uiSchema }: CanvasAreaProps) => (
    <div className="h-full flex-1 relative bg-background/50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px] opacity-[0.15] pointer-events-none" />
        <Canvas uiSchema={uiSchema} />
    </div>
);

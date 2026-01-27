import React from 'react';
import { DynamicRenderer } from './DynamicRenderer';
import type { UIComponent } from './types';

interface CanvasProps {
    uiSchema: UIComponent;
}

export function Canvas({ uiSchema }: CanvasProps) {
    return (
        <div className="flex-1 w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20 scrollbar-track-transparent">
            <div className="min-h-full w-full flex flex-col items-center justify-center p-8 pb-32 pt-24">
                <DynamicRenderer component={uiSchema} />
            </div>
        </div>
    );
}

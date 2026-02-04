import { DynamicRenderer } from './DynamicRenderer';
import type { UIComponent } from './types';

interface CanvasProps {
    uiSchema: UIComponent;
}

export function Canvas({ uiSchema }: CanvasProps) {
    return (
        <div className="flex-1 w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20 scrollbar-track-transparent">
            <div className="min-h-full w-full pb-32 max-w-7xl mx-auto">
                <div className="grid grid-cols-12 gap-6" style={{ gridAutoFlow: 'dense' }}>
                    <DynamicRenderer component={uiSchema} isRoot={true} />
                </div>
            </div>
        </div>
    );
}

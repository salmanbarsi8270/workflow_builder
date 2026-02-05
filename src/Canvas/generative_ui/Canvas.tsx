import { DynamicRenderer } from './DynamicRenderer';
import type { UIComponent } from './types';

interface CanvasProps {
    uiSchema: UIComponent;
}

export function Canvas({ uiSchema }: CanvasProps) {
    return (
        <div className="h-full w-full overflow-y-auto scrollbar-thin scrollbar-thumb-primary/10">
            <div className="min-h-full w-full px-4 lg:px-6 xl:px-8 py-6 sm:py-8 md:py-12 pb-32 sm:pb-48 max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-12 gap-4 sm:gap-6" style={{ gridAutoFlow: 'dense' }}>
                    <DynamicRenderer component={uiSchema} isRoot={true} />
                </div>
            </div>
        </div>
    );
}

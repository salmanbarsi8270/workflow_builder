import type { UIComponent } from './types';
import { componentRegistry } from './ComponentRegistry';
import { analyzeComponent, sortComponentsByPriority } from './auto-grid-engine';

interface DynamicRendererProps {
    component: UIComponent | string;
    isRoot?: boolean; // New prop to track if we're at the root level
}

export const DynamicRenderer: React.FC<DynamicRendererProps> = ({ component, isRoot = false }) => {
    if (!component) return null;

    // Handle arrays (e.g. fragments or Multiple components)
    if (Array.isArray(component)) {
        const sortedComponents = isRoot ? sortComponentsByPriority(component) : component;
        return (
            <>
                {sortedComponents.map((child, index) => (
                    <DynamicRenderer key={(child as any)?.id || index} component={child as any} isRoot={isRoot} />
                ))}
            </>
        );
    }

    // Handle text nodes
    if (typeof component === 'string') {
        return <>{component}</>;
    }

    const { type, props = {}, children } = component;
    const Component = componentRegistry[type];

    if (!Component) {
        console.warn(`Component type "${type}" not found in registry.`);
        return (
            <div className="p-2 border border-dashed border-red-500 text-red-500 text-xs rounded">
                Unknown component: {type}
            </div>
        );
    }

    // Auto-grid logic: only calculate spans if we're at the root level
    const metrics = isRoot ? analyzeComponent(component) : null;

    // Convert metrics width to span if span is not provided
    const getSpanFromWidth = (width: string | undefined) => {
        switch (width) {
            case 'full': return 12;
            case 'half': return 6;
            case 'third': return 4;
            case 'quarter': return 3;
            default: return 12; // Nested components default to full container width
        }
    };

    const finalSpan = isRoot ? (props.span || 12) : (props.span || getSpanFromWidth(metrics?.width));
    const finalRowSpan = isRoot ? (props.rowSpan || 1) : (props.rowSpan || metrics?.rowSpan || 1);

    return (
        <Component {...props} span={finalSpan} rowSpan={finalRowSpan}>
            {Array.isArray(children) ? (
                children.map((child, index) => (
                    <DynamicRenderer key={(child as any)?.id || index} component={child} isRoot={false} />
                ))
            ) : (
                children
            )}
        </Component>
    );
};

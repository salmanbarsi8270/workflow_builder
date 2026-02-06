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

    // Auto-grid logic: calculate metrics if no explicit span is provided
    const shouldAnalyze = !props.span;
    const metrics = shouldAnalyze ? analyzeComponent(component) : null;

    // Convert metrics width to span if span is not provided
    const getSpanFromWidth = (width: string | undefined): string | number => {
        switch (width) {
            case 'full': return 'col-span-12';
            case 'half': return 'col-span-12 md:col-span-6';
            case 'third': return 'col-span-12 md:col-span-4';
            case 'quarter': return 'col-span-12 sm:col-span-6 lg:col-span-3';
            default: return 'col-span-12'; // Default fallback
        }
    };

    // Use explicit span > analyzed metrics > default classes
    const finalSpan = props.span || getSpanFromWidth(metrics?.width) || 'col-span-12';
    const finalRowSpan = props.rowSpan || metrics?.rowSpan || 1;

    // Debug logging
    if (type !== 'container' && type !== 'div') {
        console.log(`[DynamicRenderer] ${type}:`, {
            metricsWidth: metrics?.width,
            calculatedSpan: getSpanFromWidth(metrics?.width),
            propsSpan: props.span,
            finalSpan
        });
    }

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

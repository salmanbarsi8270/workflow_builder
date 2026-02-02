import React from 'react';
import type { UIComponent } from './types';
import { componentRegistry } from './ComponentRegistry';
import { validateComponent } from './validation';

interface DynamicRendererProps {
    component: UIComponent | string;
}

export const DynamicRenderer: React.FC<DynamicRendererProps> = ({ component }) => {
    if (!component) return null;

    // Handle text nodes
    if (typeof component === 'string') {
        return <>{component}</>;
    }

    // 1. Validate Component Schema
    const validation = validateComponent(component);
    if (!validation.valid) {
        console.error(`[DynamicRenderer] Validation Failed: ${validation.error}`, component);

        // Return ErrorReportPanel if it exists in registry
        if (componentRegistry['ErrorReportPanel']) {
            const ErrorComponent = componentRegistry['ErrorReportPanel'];
            return (
                <ErrorComponent
                    title="Component Validation Error"
                    message={validation.error || 'Unknown validation error'}
                    severity="error"
                />
            );
        }

        // Fallback to basic error display
        return (
            <div className="p-3 border border-red-200 bg-red-50 text-red-600 rounded-md text-sm font-medium">
                Validation Error: {validation.error}
            </div>
        );
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

    return (
        <Component {...props}>
            {Array.isArray(children) ? (
                children.map((child, index) => (
                    // Use id if available, otherwise index (not ideal but works for static render)
                    <DynamicRenderer key={typeof child === 'object' ? child.id || index : index} component={child} />
                ))
            ) : (
                children // This handles string children or undefined
            )}
        </Component>
    );
};

import React from 'react';
import type { UIComponent } from './types';
import { componentRegistry } from './ComponentRegistry';

interface DynamicRendererProps {
    component: UIComponent | string;
}

export const DynamicRenderer: React.FC<DynamicRendererProps> = ({ component }) => {
    if (!component) return null;

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

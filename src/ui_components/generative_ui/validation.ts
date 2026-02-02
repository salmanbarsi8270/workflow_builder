
import type { UIComponent } from './types';
import { COMPONENT_DEFINITIONS } from './component-definitions';

export function validateComponent(component: UIComponent): { valid: boolean; error?: string } {
    if (typeof component === 'string') return { valid: true };

    const def = COMPONENT_DEFINITIONS[component.type];
    
    // If we don't have a definition, we can't validate it. 
    // In a strict mode, we might reject it, but for now we'll allow it (registry-only components).
    if (!def) {
        return { valid: true }; 
    }

    // Validate Props
    if (def.props) {
        for (const [propName, propDef] of Object.entries(def.props)) {
            const value = component.props?.[propName];

            // 1. Check Required
            if (propDef.required && (value === undefined || value === null || value === '')) {
                return { 
                    valid: false, 
                    error: `Missing required prop '${propName}' for component '${component.type}'.` 
                };
            }
            
            // 2. Check Enums
            if (value !== undefined && propDef.type === 'enum' && propDef.options) {
                 if (!propDef.options.includes(value)) {
                     return { 
                         valid: false, 
                         error: `Invalid value '${value}' for prop '${propName}' in '${component.type}'. Allowed: ${propDef.options.join(', ')}` 
                     };
                 }
            }
        }
    }

    // Validate Children
    if (def.allowedChildren === 'none' && component.children && Array.isArray(component.children) && component.children.length > 0) {
        return { valid: false, error: `Component '${component.type}' does not allow children.` };
    }
    
    return { valid: true };
}

// Auto Grid Flow Engine for Canvas Components
// This utility intelligently manages component layout based on content analysis

export interface ComponentMetrics {
    width?: 'full' | 'half' | 'third' | 'quarter' | 'auto';
    height?: 'compact' | 'medium' | 'tall' | 'extra-tall' | 'auto';
    priority?: number;
    complexity?: 'simple' | 'moderate' | 'complex';
    rowSpan?: number;
}

export interface LayoutHint {
    suggestedCols: number;
    suggestedSpan: number;
}

/**
 * Analyzes component structure and content to determine optimal grid placement
 */
export function analyzeComponent(_component: any): ComponentMetrics {
    // Default to full width for components inside containers
    return { 
        width: 'full', 
        height: 'medium', 
        priority: 2, 
        complexity: 'moderate', 
        rowSpan: 1 
    };
}

/**
 * Generates responsive grid classes based on component metrics and sidebar state
 */
export function getGridClasses(
    metrics: ComponentMetrics, 
    leftSidebarOpen: boolean = true, 
    rightSidebarOpen: boolean = true
): string {
    const width = metrics.width || 'full';
    const rowSpan = metrics.rowSpan || 1;
    
    // Generate Tailwind classes
    const colSpanClass = getAdaptiveColSpan(width, leftSidebarOpen, rightSidebarOpen);
    const rowSpanClass = rowSpan > 1 ? `row-span-${rowSpan}` : '';
    
    return `${colSpanClass} ${rowSpanClass}`.trim();
}

/**
 * Generate adaptive column span classes
 */
function getAdaptiveColSpan(
    width: ComponentMetrics['width'], 
    _leftSidebarOpen: boolean, 
    _rightSidebarOpen: boolean
): string {
    // If width is 'full' or not specified, use col-span-full
    if (width === 'full' || !width) return 'col-span-full';
    
    // Otherwise, default to col-span-1 for other widths since we use a dynamic grid
    return 'col-span-1';
}

/**
 * Sorts components by priority for optimal visual flow
 */
export function sortComponentsByPriority(components: any[]): any[] {
    return [...components].sort((a, b) => {
        const metricsA = analyzeComponent(a);
        const metricsB = analyzeComponent(b);
        return (metricsA.priority || 0) - (metricsB.priority || 0);
    });
}

/**
 * Wraps a component with intelligent grid classes based on content analysis
 */
export function applyAutoGridFlow(
    component: any,
    leftSidebarOpen: boolean = true,
    rightSidebarOpen: boolean = true
): string {
    if (!component) return 'col-span-1';

    const metrics = analyzeComponent(component);
    return getGridClasses(metrics, leftSidebarOpen, rightSidebarOpen);
}

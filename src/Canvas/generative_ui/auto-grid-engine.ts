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
    // Force a 4-column layout (quarter width) for all components
    return { 
        width: 'quarter', 
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
    const width = metrics.width || 'quarter';
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
    _width: ComponentMetrics['width'], 
    _leftSidebarOpen: boolean, 
    _rightSidebarOpen: boolean
): string {
    // With dynamic grid-cols (4, 2, or 1), a span of 1 always takes the correct proportion
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

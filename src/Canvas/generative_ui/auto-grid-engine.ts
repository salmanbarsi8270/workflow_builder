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
export function analyzeComponent(component: any): ComponentMetrics {
    if (!component || typeof component !== 'object') {
        return { width: 'quarter', height: 'compact', complexity: 'simple' };
    }

    let width: ComponentMetrics['width'] = 'half';
    let height: ComponentMetrics['height'] = 'medium';
    let complexity: ComponentMetrics['complexity'] = 'moderate';
    let priority = 0;
    let rowSpan = 1;

    const type = component.type?.toLowerCase();
    
    // Analyze text content complexity
    const textContent = extractTextContent(component);
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
    
    // Simple text (1-3 words like "hi") - Quarter width
    if (wordCount <= 3 && !hasComplexChildren(component)) {
        width = 'quarter';
        height = 'compact';
        complexity = 'simple';
        priority = 4;
    }
    // Short text or simple cards (4-20 words) - Third width
    else if (wordCount <= 20 && !hasComplexChildren(component)) {
        width = 'third';
        height = 'compact';
        complexity = 'simple';
        priority = 3;
    }
    // Medium content - Half width
    else if (wordCount <= 50 || type === 'card' || type === 'metric') {
        width = 'half';
        height = 'medium';
        complexity = 'moderate';
        priority = 2;
    }
    
    // Charts and tables need more vertical space
    if (type === 'chart' || type === 'chart-placeholder' || type === 'table') {
        width = 'full';
        height = 'tall';
        complexity = 'complex';
        priority = 1; // Highest priority for placement
        rowSpan = 2; 
    }
    
    // Grid containers with many children
    if (component.children) {
        const childCount = Array.isArray(component.children) ? component.children.length : 1;
        
        if (childCount > 6) {
            width = 'full';
            height = 'extra-tall';
            complexity = 'complex';
            priority = 1;
            rowSpan = 3;
        } else if (childCount > 3) {
            width = 'half';
            height = 'tall';
            priority = 2;
            rowSpan = 2;
        }
    }

    // Special handling for metrics - they are compact but high priority
    if (type === 'metric' || type === 'stat-card' || type === 'status-badge') {
        width = 'quarter'; // Default to quarter for dense dashboard look
        height = 'compact';
        rowSpan = 1;
    }

    // Thinking blocks should be full width but compact
    if (type === 'thinking-block') {
        width = 'full';
        height = 'compact';
        rowSpan = 1;
    }

    return { width, height, priority, complexity, rowSpan };
}

/**
 * Extract all text content from component recursively
 */
function extractTextContent(component: any): string {
    if (!component) return '';
    if (typeof component === 'string') return component;
    
    let text = '';
    
    if (component.props?.content) text += component.props.content + ' ';
    if (component.content) text += component.content + ' ';
    
    if (component.children) {
        const children = Array.isArray(component.children) ? component.children : [component.children];
        children.forEach((child: any) => {
            text += extractTextContent(child) + ' ';
        });
    }
    
    return text.trim();
}

/**
 * Check if component has complex children (tables, charts, etc.)
 */
function hasComplexChildren(component: any): boolean {
    if (!component.children) return false;
    
    const children = Array.isArray(component.children) ? component.children : [component.children];
    return children.some((child: any) => {
        const type = child?.type?.toLowerCase();
        return type === 'table' || type === 'chart' || type === 'chart-placeholder' || 
               type === 'grid' || type === 'card';
    });
}

/**
 * Generates responsive grid classes based on component metrics and sidebar state
 */
export function getGridClasses(
    metrics: ComponentMetrics, 
    leftSidebarOpen: boolean = true, 
    rightSidebarOpen: boolean = true
): string {
    const width = metrics.width || 'half';
    const rowSpan = metrics.rowSpan || 1;
    
    // Generate Tailwind classes
    const colSpanClass = getAdaptiveColSpan(width, leftSidebarOpen, rightSidebarOpen);
    const rowSpanClass = rowSpan > 1 ? `row-span-${rowSpan}` : '';
    
    return `${colSpanClass} ${rowSpanClass}`.trim();
}

/**
 * Get max columns based on sidebar state
 */
function getMaxColumns(leftSidebarOpen: boolean, rightSidebarOpen: boolean): number {
    if (!leftSidebarOpen && !rightSidebarOpen) return 4;
    if (leftSidebarOpen && rightSidebarOpen) return 2;
    return 3;
}

/**
 * Generate adaptive column span classes
 */
function getAdaptiveColSpan(
    width: ComponentMetrics['width'], 
    leftSidebarOpen: boolean, 
    rightSidebarOpen: boolean
): string {
    const maxCols = getMaxColumns(leftSidebarOpen, rightSidebarOpen);
    
    if (width === 'full') {
        return 'col-span-12';
    }
    
    if (width === 'quarter') {
        if (maxCols === 4) return 'col-span-12 md:col-span-6 lg:col-span-3';  // 1/4
        if (maxCols === 3) return 'col-span-12 md:col-span-6 lg:col-span-4';  // 1/3
        return 'col-span-12 md:col-span-6';  // 1/2
    }
    
    if (width === 'third') {
        if (maxCols === 4) return 'col-span-12 md:col-span-6 lg:col-span-4';  // 1/3
        if (maxCols === 3) return 'col-span-12 md:col-span-6 lg:col-span-4';  // 1/3
        return 'col-span-12 md:col-span-6';  // 1/2
    }
    
    if (width === 'half') {
        if (maxCols === 4) return 'col-span-12 md:col-span-6';  // 1/2
        if (maxCols === 3) return 'col-span-12 md:col-span-6 lg:col-span-4';  // 1/3
        return 'col-span-12 md:col-span-6';  // 1/2
    }
    
    // Default to half
    return 'col-span-12 md:col-span-6';
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
    if (!component) return 'col-span-12 md:col-span-6';

    const metrics = analyzeComponent(component);
    return getGridClasses(metrics, leftSidebarOpen, rightSidebarOpen);
}

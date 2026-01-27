import type { ComponentType } from './types';

export interface ComponentPropDefinition {
    type: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object';
    description: string;
    required?: boolean;
    options?: string[];
    defaultValue?: any;
}

export interface ComponentDefinition {
    type: ComponentType;
    description: string;
    category: 'data' | 'visualization' | 'feedback' | 'progress' | 'activity';
    props: Record<string, ComponentPropDefinition>;
    example?: string;
}

export const COMPONENT_DEFINITIONS: Record<string, ComponentDefinition> = {
    'kpi-card': {
        type: 'kpi-card',
        description: 'Single KPI/metric card with value, trend indicator, and optional icon. Perfect for dashboard metrics.',
        category: 'data',
        props: {
            label: { type: 'string', description: 'Metric label/name', required: true },
            value: { type: 'string', description: 'Metric value (can be number or formatted string)', required: true },
            trend: { type: 'string', description: 'Trend indicator (e.g., "+12%", "-5%")', required: false },
            trendDirection: { type: 'enum', description: 'Trend direction for color coding', options: ['up', 'down', 'neutral'], required: false },
            icon: { type: 'string', description: 'Lucide icon name (e.g., "TrendingUp", "Users", "DollarSign")', required: false },
            className: { type: 'string', description: 'Additional CSS classes', defaultValue: '' }
        },
        example: '{"type": "kpi-card", "props": {"label": "Total Revenue", "value": "$45,231", "trend": "+12%", "trendDirection": "up", "icon": "DollarSign"}}'
    },
    'stats-grid': {
        type: 'stats-grid',
        description: 'Responsive grid of KPI cards. Automatically layouts multiple metrics in a clean grid.',
        category: 'data',
        props: {
            stats: {
                type: 'array',
                description: 'Array of stat objects. Each object: {label, value, trend?, trendDirection?, icon?}',
                required: true
            },
            cols: { type: 'number', description: 'Number of columns on large screens (1-4)', defaultValue: 4 },
            className: { type: 'string', description: 'Additional CSS classes', defaultValue: '' }
        },
        example: '{"type": "stats-grid", "props": {"cols": 3, "stats": [{"label": "Users", "value": "1,234", "trend": "+5%", "trendDirection": "up"}, {"label": "Revenue", "value": "$45K", "trend": "+12%", "trendDirection": "up"}]}}'
    },
    'data-table': {
        type: 'data-table',
        description: 'Sortable data table. Perfect for displaying structured datasets.',
        category: 'data',
        props: {
            title: { type: 'string', description: 'Table title', required: false },
            data: { type: 'array', description: 'Array of row objects', required: true },
            columns: { type: 'array', description: 'Column definitions: [{key, label, sortable?}]', required: true }
        },
        example: '{"type": "data-table", "props": {"title": "Users", "columns": [{"key": "name", "label": "Name"}], "data": [{"name": "John"}]}}'
    },
    'chart-card': {
        type: 'chart-card',
        description: 'Professional Recharts visualization (bar, line, area, or pie).',
        category: 'visualization',
        props: {
            title: { type: 'string', description: 'Chart title', required: true },
            type: { type: 'enum', description: 'Chart type', options: ['bar', 'line', 'area', 'pie'], defaultValue: 'bar' },
            data: { type: 'array', description: 'Chart data objects', required: true },
            dataKey: { type: 'string', description: 'The property key for the values', defaultValue: 'value' },
            categoryKey: { type: 'string', description: 'The property key for labels (X-axis)', defaultValue: 'name' }
        },
        example: '{"type": "chart-card", "props": {"title": "Sales", "type": "area", "data": [{"name": "Jan", "value": 400}, {"name": "Feb", "value": 300}]}}'
    },
    'heading': {
        type: 'heading',
        description: 'Large title or section header.',
        category: 'feedback',
        props: {
            title: { type: 'string', description: 'Heading text', required: true },
            subtitle: { type: 'string', description: 'Subtext', required: false },
            icon: { type: 'string', description: 'Lucide icon', required: false },
            align: { type: 'enum', description: 'Alignment', options: ['left', 'center', 'right'], defaultValue: 'left' }
        },
        example: '{"type": "heading", "props": {"title": "Dashboard", "subtitle": "Welcome back"}}'
    },
    'code-card': {
        type: 'code-card',
        description: 'Terminal-style code/JSON viewer.',
        category: 'visualization',
        props: {
            code: { type: 'string', description: 'Code content', required: true },
            title: { type: 'string', description: 'Header label', required: false },
            language: { type: 'string', description: 'Language hint', defaultValue: 'json' }
        },
        example: '{"type": "code-card", "props": {"title": "API Response", "code": "{\\"status\\": \\"ok\\"}"}}'
    },
    'calendar-card': {
        type: 'calendar-card',
        description: 'Interactive Shadcn calendar component.',
        category: 'feedback',
        props: {
            title: { type: 'string', description: 'Card title', required: false },
            selectedDate: { type: 'string', description: 'ISO date string', required: false },
            mode: { type: 'enum', description: 'Mode: single, multiple, or range', options: ['single', 'multiple', 'range'], defaultValue: 'single' }
        },
        example: '{"type": "calendar-card", "props": {"title": "Deadline"}}'
    },
    'button': {
        type: 'button',
        description: 'Standard Shadcn button.',
        category: 'feedback',
        props: {
            label: { type: 'string', description: 'Text label', required: true },
            variant: { type: 'enum', description: 'Visual style', options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'], defaultValue: 'default' },
            icon: { type: 'string', description: 'Lucide icon', required: false }
        },
        example: '{"type": "button", "props": {"label": "Submit", "icon": "Send"}}'
    },
    'badge': {
        type: 'badge',
        description: 'Status badge/pill.',
        category: 'feedback',
        props: {
            label: { type: 'string', description: 'Label text', required: true },
            variant: { type: 'enum', description: 'Visual style', options: ['default', 'secondary', 'destructive', 'outline'], defaultValue: 'default' }
        },
        example: '{"type": "badge", "props": {"label": "High Priority", "variant": "destructive"}}'
    },
    'accordion': {
        type: 'accordion',
        description: 'Collapsible item list.',
        category: 'feedback',
        props: {
            title: { type: 'string', description: 'Section title', required: false },
            items: { type: 'array', description: 'Array of {title, content, icon?}', required: true }
        },
        example: '{"type": "accordion", "props": {"items": [{"title": "Details", "content": "More info here"}]}}'
    },
    'avatar': {
        type: 'avatar',
        description: 'User profile avatar with name.',
        category: 'visualization',
        props: {
            name: { type: 'string', description: 'User name', required: true },
            subtext: { type: 'string', description: 'Subtitle (e.g., role)', required: false },
            src: { type: 'string', description: 'Image URL', required: false }
        },
        example: '{"type": "avatar", "props": {"name": "Alice Wilson", "subtext": "Admin"}}'
    },
    'tabs': {
        type: 'tabs',
        description: 'Tabbed container for organizing content.',
        category: 'feedback',
        props: {
            items: { type: 'array', description: 'Array of {label, value, content}', required: true },
            defaultValue: { type: 'string', description: 'Initial tab value', required: false }
        },
        example: '{"type": "tabs", "props": {"items": [{"label": "Info", "value": "info", "content": "Information"}]}}'
    },
    'info-card': {
        type: 'info-card',
        description: 'Informational card with icon.',
        category: 'feedback',
        props: {
            title: { type: 'string', description: 'Card title', required: true },
            description: { type: 'string', description: 'Main message', required: true },
            variant: { type: 'enum', description: 'Visual intent', options: ['default', 'success', 'warning', 'error', 'info'], defaultValue: 'default' }
        }
    },
    'stats-list': {
        type: 'stats-list',
        description: 'Vertical list of statistics.',
        category: 'data',
        props: {
            title: { type: 'string', description: 'List header', required: false },
            stats: { type: 'array', description: 'Array of {label, value, icon?, badge?}', required: true }
        }
    },
    'empty-state': {
        type: 'empty-state',
        description: 'Placeholder for no data.',
        category: 'feedback',
        props: {
            title: { type: 'string', description: 'Empty state title', required: true },
            description: { type: 'string', description: 'Explanation text', required: true },
            icon: { type: 'string', description: 'Lucide icon', defaultValue: 'Inbox' }
        }
    },
    'progress-card': {
        type: 'progress-card',
        description: 'Progress bar card.',
        category: 'progress',
        props: {
            title: { type: 'string', description: 'Progress label', required: true },
            current: { type: 'number', description: 'Current count/value', required: true },
            total: { type: 'number', description: 'Target/max value', required: true },
            label: { type: 'string', description: 'Subtext' }
        }
    },
    'timeline-card': {
        type: 'timeline-card',
        description: 'Chronological event list.',
        category: 'activity',
        props: {
            title: { type: 'string', description: 'Timeline header' },
            events: { type: 'array', description: 'Array of {title, description, time, status}', required: true }
        }
    },
    'comparison-card': {
        type: 'comparison-card',
        description: 'Side-by-side comparison.',
        category: 'data',
        props: {
            title: { type: 'string', description: 'Comparison header' },
            items: { type: 'array', description: 'Array of 2 items: {label, value, details}', required: true }
        }
    },
    'summary-card': {
        type: 'summary-card',
        description: 'Executive summary block.',
        category: 'data',
        props: {
            title: { type: 'string', description: 'Summary header', required: true },
            summary: { type: 'string', description: 'Main narrative content', required: true },
            highlights: { type: 'array', description: 'Bulleted list of points' }
        }
    },
    'activity-feed': {
        type: 'activity-feed',
        description: 'Recent activity feed.',
        category: 'activity',
        props: {
            title: { type: 'string', description: 'Feed header' },
            activities: { type: 'array', description: 'Array of {action, details, time, icon}', required: true }
        }
    },
    'step-indicator': {
        type: 'step-indicator',
        description: 'Process stepper.',
        category: 'progress',
        props: {
            title: { type: 'string', description: 'Step header' },
            steps: { type: 'array', description: 'Array of {title, description}', required: true },
            activeStep: { type: 'number', description: 'Current zero-indexed step', defaultValue: 0 }
        }
    },
    'status-tag': {
        type: 'status-tag',
        description: 'Key-value pill.',
        category: 'feedback',
        props: {
            label: { type: 'string', description: 'Status name', required: true },
            value: { type: 'string', description: 'Status value', required: true },
            status: { type: 'enum', description: 'Color intent', options: ['default', 'success', 'warning', 'error', 'info'], defaultValue: 'default' }
        }
    },
    'text-card': {
        type: 'text-card',
        description: 'Simple text block.',
        category: 'feedback',
        props: {
            content: { type: 'string', description: 'Narrative content', required: true },
            title: { type: 'string', description: 'Optional header' }
        }
    },
    'wiki-card': {
        type: 'wiki-card',
        description: 'Wikipedia-style explanatory card. Use this when the user needs a detailed, text-heavy explanation of a concept or flow. It supports a title, subtitle, main content paragraph, optional image, citations, and related links.',
        category: 'feedback',
        props: {
            title: { type: 'string', description: 'Article title', required: true },
            subtitle: { type: 'string', description: 'Subtitle or short description', required: false },
            content: { type: 'string', description: 'Main explanatory text. Use \\n for paragraph breaks.', required: true },
            imageUrl: { type: 'string', description: 'URL for a side image (infobox style)', required: false },
            citations: { type: 'array', description: 'List of reference strings', required: false },
            relatedLinks: { type: 'array', description: 'List of {label, url} objects', required: false }
        },
        example: '{"type": "wiki-card", "props": {"title": "Flow Architecture", "subtitle": "System Design", "content": "The flow begins with an event trigger...", "citations": [" System docs v1"], "relatedLinks": [{"label": "Docs", "url": "#"}]}}'
    }
};

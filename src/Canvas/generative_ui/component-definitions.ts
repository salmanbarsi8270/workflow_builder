import type { ComponentType } from './types';

export interface ComponentPropDefinition {
    type: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object' | 'function';
    description: string;
    required?: boolean;
    options?: string[]; // For enum types
    defaultValue?: any;
}

export interface ComponentDefinition {
    type: ComponentType;
    description: string;
    category: 'layout' | 'typography' | 'input' | 'display' | 'chart' | 'specialized';
    props: Record<string, ComponentPropDefinition>;
    allowedChildren?: ComponentType[] | 'all' | 'none'; // 'all' means any component, 'none' means no children
}

export const COMPONENT_DEFINITIONS: Record<ComponentType, ComponentDefinition> = {
    'container': {
        type: 'container',
        description: 'A generic wrapper component for grouping other components. Supports styling and basic layout.',
        category: 'layout',
        props: {
            className: { type: 'string', description: 'Tailwind CSS classes for styling', defaultValue: '' }
        },
        allowedChildren: 'all'
    },
    'stack': {
        type: 'stack',
        description: 'Arranges children sequentially in a vertical or horizontal direction with a gap.',
        category: 'layout',
        props: {
            direction: { type: 'enum', description: 'Direction to stack items', options: ['col', 'row'], defaultValue: 'col' },
            gap: { type: 'number', description: 'Gap between items (tailwind spacing units)', defaultValue: 2 },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'all'
    },
    'grid': {
        type: 'grid',
        description: 'Arranges children in a grid layout.',
        category: 'layout',
        props: {
            cols: { type: 'number', description: 'Number of columns', defaultValue: 1 },
            gap: { type: 'number', description: 'Gap between grid items', defaultValue: 4 },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'all'
    },
    'card': {
        type: 'card',
        description: 'A premium panel with gradient backgrounds, shadows, and enhanced styling for grouping content.',
        category: 'layout',
        props: {
            variant: { 
                type: 'enum', 
                description: 'Visual style variant', 
                options: ['default', 'gradient', 'glass', 'bordered', 'premium'], 
                defaultValue: 'gradient' 
            },
            hover: { 
                type: 'boolean', 
                description: 'Enable hover elevation effect', 
                defaultValue: true 
            },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: 'bg-gradient-to-br from-card to-card/50 border border-border/40 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl' }
        },
        allowedChildren: ['card-header', 'card-content', 'card-footer', 'container', 'stack', 'grid', 'table', 'text', 'metric']
    },
    'card-header': {
        type: 'card-header',
        description: 'Header section of a card.',
        category: 'layout',
        props: {
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'all'
    },
    'card-content': {
        type: 'card-content',
        description: 'Main content area of a card.',
        category: 'layout',
        props: {
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'all'
    },
    'card-footer': {
        type: 'card-footer',
        description: 'Footer section of a card.',
        category: 'layout',
        props: {
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'all'
    },
    'text': {
        type: 'text',
        description: 'Displays text with enhanced typography, gradients, and styling options.',
        category: 'typography',
        props: {
            variant: { type: 'enum', description: 'Typography variant', options: ['h1', 'h2', 'h3', 'h4', 'p', 'span', 'caption', 'subtitle'], defaultValue: 'p' },
            gradient: { type: 'boolean', description: 'Apply gradient text effect', defaultValue: false },
            weight: { type: 'enum', description: 'Font weight', options: ['light', 'normal', 'medium', 'semibold', 'bold'], defaultValue: 'normal' },
            align: { type: 'enum', description: 'Text alignment', options: ['left', 'center', 'right'], defaultValue: 'left' },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
    'button': {
        type: 'button',
        description: 'Interactive button with loading states, icons, and premium styling.',
        category: 'input',
        props: {
            variant: { type: 'enum', description: 'Button style variant', options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link', 'gradient'], defaultValue: 'default' },
            size: { type: 'enum', description: 'Button size', options: ['default', 'sm', 'lg', 'icon'], defaultValue: 'default' },
            loading: { type: 'boolean', description: 'Show loading spinner', defaultValue: false },
            iconLeft: { type: 'string', description: 'Lucide icon name for left side', required: false },
            iconRight: { type: 'string', description: 'Lucide icon name for right side', required: false },
            fullWidth: { type: 'boolean', description: 'Full width button', defaultValue: false },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' },
            onClick: { type: 'function', description: 'Click handler', required: false }
        },
        allowedChildren: ['text', 'icon']
    },
    'icon': {
        type: 'icon',
        description: 'Displays an icon from the Lucide library.',
        category: 'display',
        props: {
            name: { type: 'string', description: 'Name of the Lucide icon', required: true },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
    'input': {
        type: 'input',
        description: 'Input field for user text entry.',
        category: 'input',
        props: {
            placeholder: { type: 'string', description: 'Placeholder text', defaultValue: '' },
            type: { type: 'string', description: 'Input type (text, password, email, etc.)', defaultValue: 'text' },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
    'metric': {
        type: 'metric',
        description: 'Displays premium statistics with icons, gradients, and trend indicators.',
        category: 'specialized',
        props: {
            label: { type: 'string', description: 'Label for the metric', required: true },
            value: { type: 'string', description: 'Main value to display', required: true },
            icon: { type: 'string', description: 'Lucide icon name', required: false },
            trend: { type: 'string', description: 'Trend text (e.g. +12%)', required: false },
            trendDirection: { type: 'enum', description: 'Direction (up/down) for coloring', options: ['up', 'down', 'neutral'], required: false },
            subtext: { type: 'string', description: 'Small helper text below value', required: false },
            gradient: { type: 'boolean', description: 'Enable gradient accent', defaultValue: true },
            size: { type: 'enum', description: 'Metric size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: 'p-4 rounded-xl bg-gradient-to-br from-card to-card/50 border border-border/40' }
        },
        allowedChildren: 'none'
    },
    'avatar': {
        type: 'avatar',
        description: 'Circular user image or fallback initials.',
        category: 'display',
        props: {
            src: { type: 'string', description: 'Image source URL', required: false },
            fallback: { type: 'string', description: 'Fallback text (initials)', required: true },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
    'badge': {
        type: 'badge',
        description: 'Small status indicator or label.',
        category: 'display',
        props: {
            variant: { type: 'enum', description: 'Badge style', options: ['default', 'secondary', 'destructive', 'outline'], defaultValue: 'default' },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
    'table': {
        type: 'table',
        description: 'Premium data table with striped rows, hover effects, and enhanced borders.',
        category: 'display',
        props: {
            striped: { type: 'boolean', description: 'Alternating row colors', defaultValue: true },
            hover: { type: 'boolean', description: 'Row hover effects', defaultValue: true },
            compact: { type: 'boolean', description: 'Compact spacing', defaultValue: false },
            bordered: { type: 'boolean', description: 'Show borders', defaultValue: true },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: ['table-header', 'table-body']
    },
     'table-header': {
        type: 'table-header',
        description: 'Container for table header rows.',
        category: 'display',
        props: {
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: ['table-row']
    },
     'table-body': {
        type: 'table-body',
        description: 'Container for table body rows.',
        category: 'display',
        props: {
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: ['table-row']
    },
     'table-row': {
        type: 'table-row',
        description: 'A single row in a table.',
        category: 'display',
        props: {
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: ['table-head', 'table-cell']
    },
     'table-head': {
        type: 'table-head',
        description: 'Header cell for a column title.',
        category: 'display',
        props: {
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'all' // Text usually
    },
     'table-cell': {
        type: 'table-cell',
        description: 'Standard data cell in a table.',
        category: 'display',
        props: {
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'all'
    },
     'chart-placeholder': {
         type: 'chart-placeholder',
         description: 'Placeholder for where a chart would acturally be rendered.',
         category: 'chart',
         props: {
             type: { type: 'enum', description: 'Type of chart', options: ['bar', 'line', 'pie'], defaultValue: 'bar' },
             title: { type: 'string', description: 'Title of the chart', defaultValue: 'Chart' }
         },
         allowedChildren: 'none'

     },
     'chart': {
         type: 'chart',
         description: 'A data visualization component supporting various chart types.',
         category: 'chart',
         props: {
             type: { type: 'enum', description: 'Type of chart', options: ['bar', 'line', 'area', 'pie'], defaultValue: 'bar' },
             data: { type: 'array', description: 'Data for the chart', required: false },
             xAxisKey: { type: 'string', description: 'Key for the X-axis', required: false },
             series: { type: 'array', description: 'Configuration for chart data series', required: false },
             title: { type: 'string', description: 'Title of the chart', required: false },
             description: { type: 'string', description: 'Description of the chart', required: false },
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
         },
         allowedChildren: 'none'
     },
     'streaming-text': {
         type: 'streaming-text',
         description: 'Displays text with a typewriter/streaming effect.',
         category: 'specialized',
         props: {
             text: { type: 'string', description: 'The text to stream', required: true },
             speed: { type: 'number', description: 'Speed of streaming (ms per character)', defaultValue: 20 },
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
         },
         allowedChildren: 'none'
     },
     'error-state': {
         type: 'error-state',
         description: 'Displays an error message with an optional retry action.',
         category: 'specialized',
         props: {
             title: { type: 'string', description: 'Error title', required: true },
             message: { type: 'string', description: 'Detailed error message', required: false },
             retryAction: { type: 'function', description: 'Function to call on retry', required: false },
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
         },
         allowedChildren: 'none'
     },
     'section': {
         type: 'section',
         description: 'A structural component for grouping content with a title and description.',
         category: 'layout',
         props: {
             title: { type: 'string', description: 'Section title', required: false },
             description: { type: 'string', description: 'Section description', required: false },
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
         },
         allowedChildren: 'all'
     },
     'status-badge': {
         type: 'status-badge',
         description: 'A badge indicating a specific status with color coding.',
         category: 'display',
         props: {
             status: { type: 'enum', description: 'Status level', options: ['success', 'warning', 'error', 'neutral', 'info'], defaultValue: 'neutral' },
             dot: { type: 'boolean', description: 'Whether to show a status dot', defaultValue: true },
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
         },
         allowedChildren: 'none'
     },
     'separator': {
         type: 'separator',
         description: 'A visual divider to separate content sections.',
         category: 'layout',
         props: {
             orientation: { type: 'enum', description: 'Separator direction', options: ['horizontal', 'vertical'], defaultValue: 'horizontal' },
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
         },
         allowedChildren: 'none'
     },
     'divider': {
         type: 'divider',
         description: 'A styled horizontal divider with optional text.',
         category: 'layout',
         props: {
             text: { type: 'string', description: 'Optional centered text', required: false },
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
         },
         allowedChildren: 'none'
     },
     'stat-card': {
         type: 'stat-card',
         description: 'Premium statistic card with icon, value, trend, and gradient styling.',
         category: 'specialized',
         props: {
             label: { type: 'string', description: 'Stat label', required: true },
             value: { type: 'string', description: 'Main value', required: true },
             icon: { type: 'string', description: 'Lucide icon name', required: true },
             trend: { type: 'string', description: 'Trend text', required: false },
             trendDirection: { type: 'enum', description: 'Trend direction', options: ['up', 'down', 'neutral'], required: false },
             color: { type: 'enum', description: 'Accent color', options: ['primary', 'success', 'warning', 'error', 'info'], defaultValue: 'primary' },
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
         },
         allowedChildren: 'none'
     },
     'thinking-block': {
         type: 'thinking-block',
         description: 'Displays AI thought process with collapsible steps.',
         category: 'specialized',
         props: {
             finished: { type: 'boolean', description: 'Whether thinking is complete', defaultValue: false },
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
         },
         allowedChildren: 'all'
     },
     'data-table': {
         type: 'data-table',
         description: 'Sortable data table with columns and rows. Perfect for displaying employee lists, product catalogs, or any tabular data.',
         category: 'display',
         props: {
             title: { type: 'string', description: 'Table title', required: false },
             data: { type: 'array', description: 'Array of row objects', required: true },
             columns: { type: 'array', description: 'Array of column definitions with key, label, sortable, and render properties', required: true },
             pageSize: { type: 'number', description: 'Items per page', defaultValue: 10 },
             showPagination: { type: 'boolean', description: 'Display pagination controls', defaultValue: true },
             striped: { type: 'boolean', description: 'Alternating row colors', defaultValue: true },
             compact: { type: 'boolean', description: 'Compact cell spacing', defaultValue: true },
             searchable: { type: 'boolean', description: 'Display search input', defaultValue: true },
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
         },
         allowedChildren: 'none'
     },
     'kpi-card': {
        type: 'kpi-card',
        description: 'Key Performance Indicator card with value, trend, and border accent. Great for dashboards.',
        category: 'specialized',
        props: {
            label: { type: 'string', description: 'KPI label', required: true },
            value: { type: 'string', description: 'KPI value', required: true },
            trend: { type: 'string', description: 'Trend indicator (e.g., +12%)', required: false },
            trendDirection: { type: 'enum', description: 'Trend direction', options: ['up', 'down', 'neutral'], required: false },
            icon: { type: 'string', description: 'Lucide icon name', required: false },
            size: { type: 'enum', description: 'Card size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
            prefix: { type: 'string', description: 'Value prefix', required: false },
            suffix: { type: 'string', description: 'Value suffix', required: false },
            description: { type: 'string', description: 'Additional description text', required: false },
            format: { type: 'enum', description: 'Value format', options: ['number', 'currency', 'percentage'], required: false },
            loading: { type: 'boolean', description: 'Show loading state', defaultValue: false },
            href: { type: 'string', description: 'Link URL', required: false },
            bordered: { type: 'boolean', description: 'Show border', defaultValue: true },
            shadow: { type: 'boolean', description: 'Show shadow', defaultValue: true },
            compact: { type: 'boolean', description: 'Compact layout', defaultValue: false },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
     'info-card': {
        type: 'info-card',
        description: 'Information card with title, description, icon, and colored border accent.',
        category: 'display',
        props: {
            title: { type: 'string', description: 'Card title', required: true },
            description: { type: 'string', description: 'Card description', required: true },
            icon: { type: 'string', description: 'Lucide icon name', required: false },
            variant: { type: 'enum', description: 'Visual variant', options: ['default', 'success', 'warning', 'error', 'info', 'gradient'], defaultValue: 'default' },
            size: { type: 'enum', description: 'Card size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
            align: { type: 'enum', description: 'Text alignment', options: ['left', 'center'], defaultValue: 'left' },
            closable: { type: 'boolean', description: 'Whether the card is closable', defaultValue: false },
            bordered: { type: 'boolean', description: 'Show border', defaultValue: true },
            shadow: { type: 'boolean', description: 'Show shadow', defaultValue: true },
            padding: { type: 'enum', description: 'Internal padding', options: ['none', 'sm', 'md', 'lg'], defaultValue: 'md' },
            rounded: { type: 'enum', description: 'Corner radius', options: ['none', 'sm', 'md', 'lg', 'full'], defaultValue: 'lg' },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
     'activity-feed': {
         type: 'activity-feed',
         description: 'Activity feed showing a list of actions or events with icons and timestamps.',
         category: 'display',
         props: {
             title: { type: 'string', description: 'Feed title', required: false },
             activities: { type: 'array', description: 'Array of activity objects with action, details, time, and icon', required: true },
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
         },
         allowedChildren: 'none'
     },
    'timeline-card': {
        type: 'timeline-card',
        description: 'Timeline visualization showing events in chronological order with status indicators.',
        category: 'display',
        props: {
            title: { type: 'string', description: 'Timeline title', required: false },
            events: { type: 'array', description: 'Array of event objects with title, description, time, and status', required: true },
            size: { type: 'enum', description: 'Card size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
            variant: { type: 'enum', description: 'Visual style', options: ['default', 'bordered', 'subtle', 'cards'], defaultValue: 'default' },
            orientation: { type: 'enum', description: 'Timeline direction', options: ['horizontal', 'vertical'], defaultValue: 'vertical' },
            showConnectors: { type: 'boolean', description: 'Show lines between events', defaultValue: true },
            showDates: { type: 'boolean', description: 'Display event dates', defaultValue: true },
            showAvatars: { type: 'boolean', description: 'Display user avatars if provided', defaultValue: true },
            responsive: { type: 'boolean', description: 'Enable responsive styling', defaultValue: true },
            loading: { type: 'boolean', description: 'Show loading state', defaultValue: false },
            maxEvents: { type: 'number', description: 'Limit number of events shown', required: false },
            truncate: { type: 'boolean', description: 'Truncate event descriptions', defaultValue: true },
            interactive: { type: 'boolean', description: 'Enable hover and click effects', defaultValue: false },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
     'chart-card': {
         type: 'chart-card',
         description: 'Advanced chart component with support for bar, line, area, and pie charts using Recharts.',
         category: 'chart',
         props: {
             title: { type: 'string', description: 'Chart title', required: false },
             type: { type: 'enum', description: 'Chart type', options: ['bar', 'line', 'area', 'pie'], defaultValue: 'bar' },
             data: { type: 'array', description: 'Chart data array', required: true },
             config: { type: 'object', description: 'Chart configuration object', required: false },
             dataKey: { type: 'string', description: 'Primary data key', defaultValue: 'value' },
             categoryKey: { type: 'string', description: 'Category/X-axis key', defaultValue: 'name' },
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
         },
         allowedChildren: 'none'
     },
     'grid-container': {
         type: 'grid-container',
         description: 'Advanced grid layout container with CSS Grid support for complex layouts.',
         category: 'layout',
         props: {
             rows: { type: 'number', description: 'Number of rows or CSS template string', defaultValue: 2 },
             cols: { type: 'number', description: 'Number of columns or CSS template string', defaultValue: 4 },
             gap: { type: 'string', description: 'Gap between grid items', defaultValue: '4' },
             padding: { type: 'string', description: 'Container padding', defaultValue: '4' },
             height: { type: 'string', description: 'Container height class', defaultValue: 'min-h-[400px]' },
         },
         allowedChildren: 'all'
     },
     'stats-grid': {
        type: 'stats-grid',
        description: 'Grid layout specifically for displaying multiple KPI cards.',
        category: 'layout',
        props: {
            stats: { type: 'array', description: 'Array of stat objects (each becomes a KPI card)', required: true },
            cols: { type: 'number', description: 'Number of columns', defaultValue: 4 },
            gap: { type: 'number', description: 'Gap between cards', defaultValue: 6 },
            loading: { type: 'boolean', description: 'Show loading state', defaultValue: false },
            variant: { type: 'enum', description: 'Visual style for child cards', options: ['default', 'gradient', 'glass', 'bordered'], defaultValue: 'default' },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
    'stats-list': {
        type: 'stats-list',
        description: 'Vertical list of statistics with labels, values, and optional trends.',
        category: 'display',
        props: {
            stats: { type: 'array', description: 'Array of stat objects', required: true },
            size: { type: 'enum', description: 'Component size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
            variant: { type: 'enum', description: 'Visual style variant', options: ['default', 'bordered', 'subtle'], defaultValue: 'default' },
            compact: { type: 'boolean', description: 'Use compact spacing', defaultValue: false },
            interactive: { type: 'boolean', description: 'Enable hover and click effects', defaultValue: false },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
    'calendar-card': {
        type: 'calendar-card',
        description: 'Calendar view component for displaying dates and events.',
        category: 'specialized',
        props: {
            title: { type: 'string', description: 'Calendar title', required: false },
            selectedDate: { type: 'string', description: 'Initially selected date', required: false },
            mode: { type: 'enum', description: 'Selection mode', options: ['single', 'range', 'multiple'], defaultValue: 'single' },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
     'code-card': {
         type: 'code-card',
         description: 'Code snippet display with syntax highlighting and copy-to-clipboard functionality.',
         category: 'display',
         props: {
             code: { type: 'string', description: 'Code content', required: true },
             language: { type: 'enum', description: 'Programming language', options: ['json', 'javascript', 'typescript', 'jsx', 'tsx', 'python', 'bash', 'html', 'css', 'sql'], defaultValue: 'json' },
             title: { type: 'string', description: 'Code block title', required: false },
             showLineNumbers: { type: 'boolean', description: 'Display line numbers', defaultValue: true },
             maxHeight: { type: 'string', description: 'CSS max-height value', defaultValue: '400px' },
             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
         },
         allowedChildren: 'none'
     },
    'comparison-card': {
        type: 'comparison-card',
        description: 'Side-by-side comparison card for showing before/after or option comparisons.',
        category: 'display',
        props: {
            title: { type: 'string', description: 'Comparison title', required: false },
            items: { type: 'array', description: 'Array of comparison items with label, badge, and content', required: true },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
    'empty-state': {
        type: 'empty-state',
        description: 'Empty state component for when there is no data to display.',
        category: 'display',
        props: {
            title: { type: 'string', description: 'Main title', required: false },
            description: { type: 'string', description: 'Supporting description text', required: false },
            icon: { type: 'string', description: 'Lucide icon name', required: false },
            size: { type: 'enum', description: 'Component size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
            variant: { type: 'enum', description: 'Visual variant', options: ['default', 'subtle', 'gradient'], defaultValue: 'default' },
            illustration: { type: 'boolean', description: 'Show decorative illustration background', defaultValue: true },
            maxWidth: { type: 'enum', description: 'Maximum width container', options: ['sm', 'md', 'lg', 'xl'], defaultValue: 'md' },
            align: { type: 'enum', description: 'Text alignment', options: ['left', 'center'], defaultValue: 'center' },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
    'heading': {
        type: 'heading',
        description: 'Styled heading component with gradient and typography options.',
        category: 'typography',
        props: {
            level: { type: 'enum', description: 'Heading level', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], defaultValue: 'h2' },
            gradient: { type: 'boolean', description: 'Apply gradient effect', defaultValue: false },
            align: { type: 'enum', description: 'Text alignment', options: ['left', 'center', 'right'], defaultValue: 'left' },
            weight: { type: 'enum', description: 'Font weight', options: ['light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'], defaultValue: 'bold' },
            subheading: { type: 'string', description: 'Small text shown above or below the head', required: false },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
     'progress-card': {
        type: 'progress-card',
        description: 'Progress indicator card showing completion percentage.',
        category: 'display',
        props: {
            label: { type: 'string', description: 'Progress label', required: true },
            value: { type: 'number', description: 'Progress value (0-100)', required: true },
            max: { type: 'number', description: 'Maximum value', defaultValue: 100 },
            size: { type: 'enum', description: 'Component size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
            variant: { type: 'enum', description: 'Visual style', options: ['default', 'success', 'warning', 'error', 'gradient'], defaultValue: 'default' },
            showValue: { type: 'boolean', description: 'Display current value text', defaultValue: true },
            showPercentage: { type: 'boolean', description: 'Display percentage text', defaultValue: true },
            showIcon: { type: 'boolean', description: 'Display status icon', defaultValue: true },
            description: { type: 'string', description: 'Helper text below progress bar', required: false },
            animate: { type: 'boolean', description: 'Enable fill animation', defaultValue: true },
            striped: { type: 'boolean', description: 'Use striped progress bar', defaultValue: false },
            showLabel: { type: 'boolean', description: 'Display label text', defaultValue: true },
            showMax: { type: 'boolean', description: 'Display maximum value text', defaultValue: false },
            compact: { type: 'boolean', description: 'Compact display mode', defaultValue: false },
            responsive: { type: 'boolean', description: 'Enable responsive styling', defaultValue: true },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
     'status-tag': {
        type: 'status-tag',
        description: 'Status tag with icon and colored styling.',
        category: 'display',
        props: {
            status: { type: 'string', description: 'Status text content', required: true },
            variant: { type: 'enum', description: 'Visual variant', options: ['default', 'success', 'warning', 'error', 'info', 'neutral', 'accent', 'gradient'], defaultValue: 'default' },
            icon: { type: 'string', description: 'Lucide icon name', required: false },
            size: { type: 'enum', description: 'Tag size', options: ['xs', 'sm', 'md', 'lg'], defaultValue: 'md' },
            outlined: { type: 'boolean', description: 'Use outline style', defaultValue: false },
            pill: { type: 'boolean', description: 'Use rounded-full style', defaultValue: true },
            animate: { type: 'boolean', description: 'Enable pulse animation', defaultValue: false },
            showIcon: { type: 'boolean', description: 'Display the icon', defaultValue: true },
            responsive: { type: 'boolean', description: 'Enable responsive sizing', defaultValue: true },
            count: { type: 'number', description: 'Small count/badge number', required: false },
            dot: { type: 'boolean', description: 'Show a status dot', defaultValue: false },
            badge: { type: 'string', description: 'Small badge text/number', required: false },
            uppercase: { type: 'boolean', description: 'Force uppercase text', defaultValue: true },
            truncate: { type: 'boolean', description: 'Truncate long text', defaultValue: true },
            loading: { type: 'boolean', description: 'Show loading state', defaultValue: false },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
     'step-indicator': {
        type: 'step-indicator',
        description: 'Step-by-step progress indicator for multi-step processes.',
        category: 'display',
        props: {
            steps: { type: 'array', description: 'Array of step objects with label and status', required: true },
            currentStep: { type: 'number', description: 'Current active step index', defaultValue: 0 },
            orientation: { type: 'enum', description: 'Display orientation', options: ['horizontal', 'vertical'], defaultValue: 'horizontal' },
            size: { type: 'enum', description: 'Component size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
            showConnectors: { type: 'boolean', description: 'Show lines between steps', defaultValue: true },
            responsive: { type: 'boolean', description: 'Enable responsive styling', defaultValue: true },
            clickable: { type: 'boolean', description: 'Enable clicking steps', defaultValue: false },
            showNumbers: { type: 'boolean', description: 'Display step numbers', defaultValue: true },
            variant: { type: 'enum', description: 'Visual style', options: ['default', 'circles', 'dots', 'wizard', 'timeline'], defaultValue: 'default' },
            showTime: { type: 'boolean', description: 'Display step timestamps if available', defaultValue: false },
            showStatus: { type: 'boolean', description: 'Display status text below label', defaultValue: true },
            maxSteps: { type: 'number', description: 'Maximum steps to show before collapsing', required: false },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
     'summary-card': {
        type: 'summary-card',
        description: 'Summary card for displaying key information with icon.',
        category: 'display',
        props: {
            title: { type: 'string', description: 'Summary title', required: true },
            content: { type: 'string', description: 'Summary content', required: true },
            icon: { type: 'string', description: 'Lucide icon name', required: false },
            variant: { type: 'enum', description: 'Visual variant', options: ['default', 'success', 'warning', 'error', 'info', 'gradient'], defaultValue: 'default' },
            size: { type: 'enum', description: 'Card size', options: ['sm', 'md', 'lg', 'xl'], defaultValue: 'md' },
            align: { type: 'enum', description: 'Text alignment', options: ['left', 'center'], defaultValue: 'left' },
            bordered: { type: 'boolean', description: 'Show border', defaultValue: true },
            shadow: { type: 'boolean', description: 'Show shadow', defaultValue: true },
            badge: { type: 'string', description: 'Optional badge text', required: false },
            highlight: { type: 'boolean', description: 'Highlight card', defaultValue: false },
            loading: { type: 'boolean', description: 'Show loading state', defaultValue: false },
            responsive: { type: 'boolean', description: 'Enable responsive styling', defaultValue: true },
            interactive: { type: 'boolean', description: 'Enable interactive hover effects', defaultValue: false },
            truncate: { type: 'boolean', description: 'Truncate text content', defaultValue: false },
            showIcon: { type: 'boolean', description: 'Show/hide icon', defaultValue: true },
            accent: { type: 'boolean', description: 'Show accent border', defaultValue: false },
            maxHeight: { type: 'string', description: 'CSS max-height value', required: false },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
    'text-card': {
        type: 'text-card',
        description: 'Simple text content card with enhanced typography and styling.',
        category: 'display',
        props: {
            content: { type: 'string', description: 'Main text content', required: true },
            title: { type: 'string', description: 'Optional card title', required: false },
            author: { type: 'string', description: 'Author/Source name', required: false },
            icon: { type: 'string', description: 'Lucide icon name', required: false },
            variant: { type: 'enum', description: 'Styling variant', options: ['default', 'subtle', 'gradient', 'glass'], defaultValue: 'default' },
            size: { type: 'enum', description: 'Component size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
            align: { type: 'enum', description: 'Text alignment', options: ['left', 'center', 'right'], defaultValue: 'left' },
            copyable: { type: 'boolean', description: 'Add copy to clipboard button', defaultValue: false },
            bordered: { type: 'boolean', description: 'Show border', defaultValue: true },
            shadow: { type: 'boolean', description: 'Show shadow', defaultValue: true },
            background: { type: 'boolean', description: 'Show background color', defaultValue: true },
            maxLines: { type: 'number', description: 'Maximum lines before truncation', required: false },
            responsive: { type: 'boolean', description: 'Enable responsive styling', defaultValue: true },
            loading: { type: 'boolean', description: 'Show loading state', defaultValue: false },
            highlight: { type: 'boolean', description: 'Highlight card border', defaultValue: false },
            badge: { type: 'string', description: 'Small badge text', required: false },
            interactive: { type: 'boolean', description: 'Enable interactive hover effects', defaultValue: false },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    },
    'wiki-card': {
        type: 'wiki-card',
        description: 'Rich content card with markdown support and sections.',
        category: 'display',
        props: {
            title: { type: 'string', description: 'Wiki card title', required: true },
            content: { type: 'string', description: 'Main content', required: true },
            sections: { type: 'array', description: 'Array of section objects', required: false },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none'
    }
};

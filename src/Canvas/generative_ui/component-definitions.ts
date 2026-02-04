
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
     }
};

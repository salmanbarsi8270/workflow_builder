
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
        description: 'A panel with shadow and proper spacing, used to group related content.',
        category: 'layout',
        props: {
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: ['card-header', 'card-content', 'card-footer', 'container', 'stack', 'grid', 'table'] // Broaden this if needed
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
        description: 'Displays basic text with different variants.',
        category: 'typography',
        props: {
            variant: { type: 'enum', description: 'Typography variant', options: ['h1', 'h2', 'h3', 'p', 'span'], defaultValue: 'p' },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
        },
        allowedChildren: 'none' // Usually just text string, handled separately
    },
    'button': {
        type: 'button',
        description: 'Interactive button element.',
        category: 'input',
        props: {
            variant: { type: 'enum', description: 'Button style variant', options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'], defaultValue: 'default' },
            size: { type: 'enum', description: 'Button size', options: ['default', 'sm', 'lg', 'icon'], defaultValue: 'default' },
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
        description: 'Displays a standard statistic or metric with optional trend.',
        category: 'specialized',
        props: {
            label: { type: 'string', description: 'Label for the metric', required: true },
            value: { type: 'string', description: 'Main value to display', required: true },
            trend: { type: 'string', description: 'Trend text (e.g. +12%)', required: false },
            trendDirection: { type: 'enum', description: 'Direction (up/down) for coloring', options: ['up', 'down', 'neutral'], required: false },
            subtext: { type: 'string', description: 'Small helper text below value', required: false },
            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }
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
        description: 'Root container for a data table.',
        category: 'display',
        props: {
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

     }
};

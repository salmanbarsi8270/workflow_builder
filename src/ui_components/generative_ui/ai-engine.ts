import apiClient from '../api/auth';
import type { UIComponent } from './types';
import { COMPONENT_DEFINITIONS } from './component-definitions';

const AGENT_ID = 'e8cd753a-7a7e-4aba-8795-1cfdafee333e';

const SYSTEM_INSTRUCTION_TEMPLATE = `You are a UI schema generator.

CRITICAL OUTPUT RULES:
- Output VALID JSON only
- Do NOT include markdown
- Do NOT include explanations
- Do NOT include comments
- Do NOT include trailing commas
- Do NOT include code fences
- Do NOT include text before or after JSON

UI NODE SHAPE:
"{\\r\\n    'container': {\\r\\n        type: 'container',\\r\\n        description: 'A generic wrapper component for grouping other components. Supports styling and basic layout.',\\r\\n        category: 'layout',\\r\\n        props: {\\r\\n            className: { type: 'string', description: 'Tailwind CSS classes for styling', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: 'all'\\r\\n    },\\r\\n    'stack': {\\r\\n        type: 'stack',\\r\\n        description: 'Arranges children sequentially in a vertical or horizontal direction with a gap.',\\r\\n        category: 'layout',\\r\\n        props: {\\r\\n            direction: { type: 'enum', description: 'Direction to stack items', options: ['col', 'row'], defaultValue: 'col' },\\r\\n            gap: { type: 'number', description: 'Gap between items (tailwind spacing units)', defaultValue: 2 },\\r\\n            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: 'all'\\r\\n    },\\r\\n    'grid': {\\r\\n        type: 'grid',\\r\\n        description: 'Arranges children in a grid layout.',\\r\\n        category: 'layout',\\r\\n        props: {\\r\\n            cols: { type: 'number', description: 'Number of columns', defaultValue: 1 },\\r\\n            gap: { type: 'number', description: 'Gap between grid items', defaultValue: 4 },\\r\\n            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: 'all'\\r\\n    },\\r\\n    'card': {\\r\\n        type: 'card',\\r\\n        description: 'A panel with shadow and proper spacing, used to group related content.',\\r\\n        category: 'layout',\\r\\n        props: {\\r\\n            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: ['card-header', 'card-content', 'card-footer', 'container', 'stack', 'grid', 'table'] // Broaden this if needed\\r\\n    },\\r\\n    'card-header': {\\r\\n        type: 'card-header',\\r\\n        description: 'Header section of a card.',\\r\\n        category: 'layout',\\r\\n        props: {\\r\\n            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: 'all'\\r\\n    },\\r\\n    'card-content': {\\r\\n        type: 'card-content',\\r\\n        description: 'Main content area of a card.',\\r\\n        category: 'layout',\\r\\n        props: {\\r\\n            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: 'all'\\r\\n    },\\r\\n    'card-footer': {\\r\\n        type: 'card-footer',\\r\\n        description: 'Footer section of a card.',\\r\\n        category: 'layout',\\r\\n        props: {\\r\\n            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: 'all'\\r\\n    },\\r\\n    'text': {\\r\\n        type: 'text',\\r\\n        description: 'Displays basic text with different variants.',\\r\\n        category: 'typography',\\r\\n        props: {\\r\\n            variant: { type: 'enum', description: 'Typography variant', options: ['h1', 'h2', 'h3', 'p', 'span'], defaultValue: 'p' },\\r\\n            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: 'none' // Usually just text string, handled separately\\r\\n    },\\r\\n    'button': {\\r\\n        type: 'button',\\r\\n        description: 'Interactive button element.',\\r\\n        category: 'input',\\r\\n        props: {\\r\\n            variant: { type: 'enum', description: 'Button style variant', options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'], defaultValue: 'default' },\\r\\n            size: { type: 'enum', description: 'Button size', options: ['default', 'sm', 'lg', 'icon'], defaultValue: 'default' },\\r\\n            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' },\\r\\n            onClick: { type: 'function', description: 'Click handler', required: false }\\r\\n        },\\r\\n        allowedChildren: ['text', 'icon']\\r\\n    },\\r\\n    'icon': {\\r\\n        type: 'icon',\\r\\n        description: 'Displays an icon from the Lucide library.',\\r\\n        category: 'display',\\r\\n        props: {\\r\\n            name: { type: 'string', description: 'Name of the Lucide icon', required: true },\\r\\n            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: 'none'\\r\\n    },\\r\\n    'input': {\\r\\n        type: 'input',\\r\\n        description: 'Input field for user text entry.',\\r\\n        category: 'input',\\r\\n        props: {\\r\\n            placeholder: { type: 'string', description: 'Placeholder text', defaultValue: '' },\\r\\n            type: { type: 'string', description: 'Input type (text, password, email, etc.)', defaultValue: 'text' },\\r\\n            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: 'none'\\r\\n    },\\r\\n    'metric': {\\r\\n        type: 'metric',\\r\\n        description: 'Displays a standard statistic or metric with optional trend.',\\r\\n        category: 'specialized',\\r\\n        props: {\\r\\n            label: { type: 'string', description: 'Label for the metric', required: true },\\r\\n            value: { type: 'string', description: 'Main value to display', required: true },\\r\\n            trend: { type: 'string', description: 'Trend text (e.g. +12%)', required: false },\\r\\n            trendDirection: { type: 'enum', description: 'Direction (up/down) for coloring', options: ['up', 'down', 'neutral'], required: false },\\r\\n            subtext: { type: 'string', description: 'Small helper text below value', required: false },\\r\\n            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: 'none'\\r\\n    },\\r\\n    'avatar': {\\r\\n        type: 'avatar',\\r\\n        description: 'Circular user image or fallback initials.',\\r\\n        category: 'display',\\r\\n        props: {\\r\\n            src: { type: 'string', description: 'Image source URL', required: false },\\r\\n            fallback: { type: 'string', description: 'Fallback text (initials)', required: true },\\r\\n            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: 'none'\\r\\n    },\\r\\n    'badge': {\\r\\n        type: 'badge',\\r\\n        description: 'Small status indicator or label.',\\r\\n        category: 'display',\\r\\n        props: {\\r\\n            variant: { type: 'enum', description: 'Badge style', options: ['default', 'secondary', 'destructive', 'outline'], defaultValue: 'default' },\\r\\n            className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: 'none'\\r\\n    },\\r\\n    'table': {\\r\\n        type: 'table',\\r\\n        description: 'Root container for a data table.',\\r\\n        category: 'display',\\r\\n        props: {\\r\\n             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: ['table-header', 'table-body']\\r\\n    },\\r\\n     'table-header': {\\r\\n        type: 'table-header',\\r\\n        description: 'Container for table header rows.',\\r\\n        category: 'display',\\r\\n        props: {\\r\\n             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: ['table-row']\\r\\n    },\\r\\n     'table-body': {\\r\\n        type: 'table-body',\\r\\n        description: 'Container for table body rows.',\\r\\n        category: 'display',\\r\\n        props: {\\r\\n             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: ['table-row']\\r\\n    },\\r\\n     'table-row': {\\r\\n        type: 'table-row',\\r\\n        description: 'A single row in a table.',\\r\\n        category: 'display',\\r\\n        props: {\\r\\n             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: ['table-head', 'table-cell']\\r\\n    },\\r\\n     'table-head': {\\r\\n        type: 'table-head',\\r\\n        description: 'Header cell for a column title.',\\r\\n        category: 'display',\\r\\n        props: {\\r\\n             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: 'all' // Text usually\\r\\n    },\\r\\n     'table-cell': {\\r\\n        type: 'table-cell',\\r\\n        description: 'Standard data cell in a table.',\\r\\n        category: 'display',\\r\\n        props: {\\r\\n             className: { type: 'string', description: 'Additional tailwind classes', defaultValue: '' }\\r\\n        },\\r\\n        allowedChildren: 'all'\\r\\n    },\\r\\n     'chart-placeholder': {\\r\\n         type: 'chart-placeholder',\\r\\n         description: 'Placeholder for where a chart would acturally be rendered.',\\r\\n         category: 'chart',\\r\\n         props: {\\r\\n             type: { type: 'enum', description: 'Type of chart', options: ['bar', 'line', 'pie'], defaultValue: 'bar' },\\r\\n             title: { type: 'string', description: 'Title of the chart', defaultValue: 'Chart' }\\r\\n         },\\r\\n         allowedChildren: 'none'\\r\\n\\r\\n     }\\r\\n};\r\n"

STRICT RULES:
- All text MUST use the "text" component with a "value" prop
- Never output raw strings as children
- Never invent component types
- Never invent props
- Respect allowedChildren rules
- Children must always be an array (or omitted)
- Use Tailwind classes where appropriate

AVAILABLE COMPONENTS:
<COMPONENT_DEFINITIONS_JSON>

If the request is unclear, return:
{
  "type": "container",
  "props": { "className": "p-6" },
  "children": [
    {
      "type": "text",
      "props": {
        "variant": "p",
        "children": "Unable to generate UI for this request" 
      }
    }
  ]
}`;

const DEBUG_SCHEMA: UIComponent = {
    type: "container",
    props: { className: "p-8 flex flex-col items-center justify-center min-h-screen bg-muted/20" },
    children: [
        { type: "text", props: { variant: "h1", className: "text-4xl font-bold mb-4 text-primary" }, children: "Debug Mode Active" },
         { type: "text", props: { className: "text-muted-foreground mb-8" }, children: "If you see this, the Renderer is working perfectly." },
        { 
            type: "card", 
            props: { className: "p-6 max-w-md w-full" },
            children: [
                { type: "text", props: { variant: "h3", className: "mb-2" }, children: "System Status" },
                { type: "metric", props: { label: "Renderer", value: "Operational", trendDirection: "up", className: "mb-4" } },
                { type: "button", props: { children: "Test Interaction" } }
            ] 
        }
    ]
};

export const generateUI = async (prompt: string, userId: string): Promise<UIComponent> => {
     const p = prompt.toLowerCase();
    
    // DEBUG: Force return mock data to test renderer
    if (p.includes("debug")) {
        return DEBUG_SCHEMA;
    }

    try {
        // 1. Prepare system instruction with definitions
        const definitionsJson = JSON.stringify(COMPONENT_DEFINITIONS, null, 2);
        const systemInstruction = SYSTEM_INSTRUCTION_TEMPLATE.replace('<COMPONENT_DEFINITIONS_JSON>', definitionsJson);

        // 2. Construct FULL prompt
        const fullInput = `${systemInstruction}\n\nUSER REQUEST:\n${prompt}`;

        // 3. Call Agent API
        console.log("Calling Agent API...");
        const response = await apiClient.post(`/api/v1/agents/${AGENT_ID}/run`, {
            input: fullInput,
            userId: userId || 'public-user',
            stream: false
        });

        // 4. Parse Response
        const output = response.data?.output;

        if (!output) {
            throw new Error("No output received from agent");
        }

        console.log("Raw Agent Output:", output);

        // Clean up markdown code blocks if present
        let cleanJson = output.trim();
        const jsonBlockMatch = cleanJson.match(/```json([\s\S]*?)```/);
        if (jsonBlockMatch) {
            cleanJson = jsonBlockMatch[1];
        } else {
             // Fallback: try to find the first '{' and last '}'
            const firstBrace = cleanJson.indexOf('{');
            const lastBrace = cleanJson.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
            }
        }

        const uiSchema = JSON.parse(cleanJson);
        return uiSchema;

    } catch (error: any) {
        console.error("AI Generation Error:", error);
         return {
            type: "container",
            props: { className: "flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-destructive/50 rounded-xl bg-destructive/5" },
            children: [
                { type: "icon", props: { name: "AlertTriangle", className: "h-12 w-12 text-destructive mb-4" } },
                { type: "text", props: { variant: "h3", className: "text-xl font-semibold mb-2 text-destructive" }, children: "Generation Failed" },
                { type: "text", props: { className: "text-muted-foreground max-w-md" }, children: error.message || "An unexpected error occurred." },
                { type: "text", props: { className: "text-xs text-muted-foreground/50 mt-4 font-mono" }, children: "Check console for details." }
            ]
        };
    }
};

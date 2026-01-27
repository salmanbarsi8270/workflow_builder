import apiClient from '../api/auth';
import type { UIComponent } from './types';
import { COMPONENT_DEFINITIONS } from './component-definitions';
import aiClient from '../api/aiClient';

const SYSTEM_INSTRUCTION_TEMPLATE = `
You are an expert AI Presentation Specialist. Your goal is to provide deep insights and visualize data using your component library.

STRUCTURE YOUR RESPONSE:
1. Provide a brief (2-3 sentences) explanation or executive summary of the data insights first.
2. Follow with the appropriate JSON UI components to represent that data.
3. Use MARKDOWN code blocks ( \`\`\`json ... \`\`\` ) for all JSON output.

DESIGN RULES:
    1. Use 'colSpan: 12' ONLY for large data-tables or complex dashboards.
    2. Favor 'colSpan: 4' or 'colSpan: 6' for summary-cards and stats-grids.
    3. ICONS: ONLY use valid Lucide-React icon names (PascalCase, e.g., 'Activity', 'Shield', 'LineChart', 'Coins', 'Users', 'Zap', 'Box'). 
    4. Prohibited Icon Names: 'Tokens', 'ArrowRightOnRectangle', 'RectangleStack' (these are invalid).
    5. Always provide 2-3 sentences of context BEFORE any JSON block to explain your design reasoning.
    6. Ensure every UI component has a unique 'id'.
- Use 'colSpan: 3' (1/4 width) for single KPI cards or status tags.
- DENSITY: Try to fill rows effectively. If you have 3 small metrics, use 'colSpan: 4' for each so they sit in one row.
- Avoid large empty spaces by matching component width to content depth.

AVAILABLE COMPONENTS:
<COMPONENT_DEFINITIONS_JSON>
`;

const DEBUG_SCHEMA: UIComponent = {
    type: "container",
    props: { className: "p-8 flex flex-col items-center justify-center min-h-screen bg-muted/20" },
    children: [
        { type: "text", props: { variant: "h1", className: "text-4xl font-bold mb-4 text-primary" }, children: [{ type: "text", props: { children: "Debug Mode Active" } }] },
         { type: "text", props: { className: "text-muted-foreground mb-8" }, children: [{ type: "text", props: { children: "If you see this, the Renderer is working perfectly." } }] },
        { 
            type: "card", 
            props: { className: "p-6 max-w-md w-full" },
            children: [
                { type: "text", props: { variant: "h3", className: "mb-2" }, children: [{ type: "text", props: { children: "System Status" } }] },
                { type: "metric", props: { label: "Renderer", value: "Operational", trendDirection: "up", className: "mb-4" } },
                { type: "button", props: { children: [{ type: "text", props: { children: "Test Interaction" } }] } }
            ] 
        }
    ]
};

import { extractAllJson } from './utils';

export const generateUI = async (prompt: string, userId: string, direct: boolean = true, currentSchemas: UIComponent[] = [], conversationId?: string): Promise<{ text: string, schemas: UIComponent[] }> => {
     const p = prompt.toLowerCase();
    
    // DEBUG: Force return mock data to test renderer
    if (p.includes("debug")) {
        return { text: "System diagnostic complete.", schemas: [DEBUG_SCHEMA] };
    }

    try {
        const definitionsJson = JSON.stringify(COMPONENT_DEFINITIONS, null, 2);
        const systemInstruction = SYSTEM_INSTRUCTION_TEMPLATE.replace('<COMPONENT_DEFINITIONS_JSON>', definitionsJson);

        const contextStr = currentSchemas.length > 0 
            ? `\n\nCURRENT GRID CONTEXT (EXISTING COMPONENTS):\n${JSON.stringify(currentSchemas, null, 2)}\n\nYou can REUSE or MODIFY an existing component or generate NEW ones to answer the user's question.`
            : '';
            
        const fullInput = `${systemInstruction}${contextStr}\n\nUSER QUESTION:\n${prompt}`;

        console.log(`Calling Presentation API (${direct ? 'Direct' : 'Proxy'})...`);
        const client = direct ? aiClient : apiClient;
        const response = await client.post(`/api/v1/presentation/run`, {
            input: fullInput,
            userId: userId || 'public-user',
            conversationId: conversationId,
            stream: false
        });

        const output = response.data?.output || "";
        if (!output) throw new Error("No response from assistant");

        console.log("Raw Response received.");

        // Extract explanation text (text before the first JSON block or the entire output if no JSON)
        const firstJsonIdx = output.search(/[{\[]/);
        const explanation = firstJsonIdx !== -1 ? output.substring(0, firstJsonIdx).trim() : output;
        
        // Extract all components
        const schemas = extractAllJson(output);

        return {
            text: explanation || "Generated visualization:",
            schemas: schemas
        };

    } catch (error: any) {
        console.error("Presentation Error:", error);
         return {
            text: "I encountered an error while trying to visualize the response.",
            schemas: [{
                type: "info-card",
                props: { 
                    variant: "error",
                    title: "Presentation Error",
                    message: error.message || "Could not visualize response.",
                    icon: "AlertTriangle",
                    className: "col-span-12 border-destructive/50 bg-destructive/5 text-destructive"
                }
            }]
        };
    }
};


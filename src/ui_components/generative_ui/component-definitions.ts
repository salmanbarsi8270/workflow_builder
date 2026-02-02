
import type { ComponentType } from './types';

export interface ComponentPropDefinition {
    type: 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object' | 'function';
    description: string;
    required?: boolean;
    options?: string[]; // For enum types
    defaultValue?: any;
}

export interface ComponentDefinition {
    type: string;
    description: string;
    category: 'layout' | 'typography' | 'input' | 'display' | 'chart' | 'specialized';
    props: Record<string, ComponentPropDefinition>;
    allowedChildren?: string[] | 'all' | 'none';
    aiAccessible?: boolean; // Controls if this component is exposed to the AI model
}

export const COMPONENT_DEFINITIONS: Record<string, ComponentDefinition> = {
    'container': {
        type: 'container',
        description: 'A responsive grid container.',
        category: 'layout',
        props: {
            layout: { type: 'enum', description: 'Layout mode', options: ['grid', 'flex'], defaultValue: 'grid' },
            cols: { type: 'number', description: 'Number of columns', defaultValue: 24 },
            gap: { type: 'number', description: 'Gap', defaultValue: 4 },
        },
        allowedChildren: 'all',
        aiAccessible: false
    },
    'stack': {
        type: 'stack',
        description: 'Vertical or horizontal stack.',
        category: 'layout',
        props: {
            direction: { type: 'enum', description: 'Direction', options: ['col', 'row'], defaultValue: 'col' },
            gap: { type: 'number', description: 'Gap', defaultValue: 2 },
        },
        allowedChildren: 'all',
        aiAccessible: false
    },
    'grid': {
        type: 'grid',
        description: 'Grid layout.',
        category: 'layout',
        props: {
            cols: { type: 'number', description: 'Columns', defaultValue: 1 },
            gap: { type: 'number', description: 'Gap', defaultValue: 4 },
        },
        allowedChildren: 'all',
        aiAccessible: false
    },
    'card': {
        type: 'card',
        description: 'Generic card container.',
        category: 'layout',
        props: {},
        allowedChildren: 'all',
        aiAccessible: false
    },
    'text-block': {
        type: 'text-block',
        description: 'Block of text',
        category: 'typography',
        props: { text: { type: 'string', description: 'Content', required: true } },
        aiAccessible: false
    },
    'thinking-block': {
        type: 'thinking-block',
        description: 'AI reasoning block',
        category: 'specialized',
        props: { state: { type: 'string', description: 'State', defaultValue: 'thinking' } },
        aiAccessible: false
    },
    'streaming-text': {
        type: 'streaming-text',
        description: 'Live streaming text',
        category: 'typography',
        props: { text: { type: 'string', description: 'Content', required: true } },
        aiAccessible: false
    },
    'database-card': {
        type: 'database-card',
        description: 'Database connection info',
        category: 'display',
        props: { name: { type: 'string', description: 'db name', required: true } },
        aiAccessible: false
    },
    'SummaryCard': {
        type: 'SummaryCard',
        description: 'Display a single KPI or summary metric. Best for high-level stats.',
        category: 'display',
        props: {
            title: { type: 'string', description: 'Title of the card', required: true },
            value: { type: 'string', description: 'Main value to display', required: true },
            subtitle: { type: 'string', description: 'Optional subtitle or context', required: false }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'MetricTrendCard': {
        type: 'MetricTrendCard',
        description: 'Display a metric with its trend over time (sparkline) and delta.',
        category: 'display',
        props: {
            title: { type: 'string', description: 'Metric title', required: true },
            value: { type: 'string', description: 'Current value', required: true },
            delta: { type: 'number', description: 'Percentage change', required: true },
            trend: { type: 'array', description: 'Array of numbers for the sparkline', defaultValue: [] }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'StatusOverviewCard': {
        type: 'StatusOverviewCard',
        description: 'Display system or entity status (success, warning, error).',
        category: 'display',
        props: {
            title: { type: 'string', description: 'Status title', required: true },
            status: { type: 'enum', description: 'Status level', options: ['success', 'warning', 'error'], required: true },
            message: { type: 'string', description: 'Status message explanation', required: false }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'KeyValuePanel': {
        type: 'KeyValuePanel',
        description: 'Display a list of key-value pairs.',
        category: 'display',
        props: {
            items: { type: 'array', description: 'Array of {key, value} objects', defaultValue: [] }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'SimpleTablePanel': {
        type: 'SimpleTablePanel',
        description: 'Display a simple data table.',
        category: 'display',
        props: {
            columns: { type: 'array', description: 'Array of column headers', defaultValue: [] },
            rows: { type: 'array', description: 'Array of row data arrays', defaultValue: [] }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'ActivityFeedPanel': {
        type: 'ActivityFeedPanel',
        description: 'Display a chronological list of events.',
        category: 'display',
        props: {
            events: { type: 'array', description: 'Array of {label, time, description} objects', defaultValue: [] }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'InsightSummaryCard': {
        type: 'InsightSummaryCard',
        description: 'Display an AI-generated insight with a confidence score.',
        category: 'specialized',
        props: {
            headline: { type: 'string', description: 'Insight headline', required: true },
            insight: { type: 'string', description: 'Detailed insight text', required: true },
            confidence: { type: 'number', description: 'Confidence score (0-100)', required: false }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'ComparisonCard': {
        type: 'ComparisonCard',
        description: 'Compare two entities across multiple metrics.',
        category: 'specialized',
        props: {
            leftLabel: { type: 'string', description: 'Label for left entity', required: true },
            rightLabel: { type: 'string', description: 'Label for right entity', required: true },
            metrics: { type: 'array', description: 'Array of {label, left, right} objects', defaultValue: [] }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'TrendAnalysisPanel': {
        type: 'TrendAnalysisPanel',
        description: 'Analyze a trend with key drivers.',
        category: 'specialized',
        props: {
            summary: { type: 'string', description: 'Summary of the trend', required: true },
            trendDirection: { type: 'enum', description: 'Overall direction', options: ['up', 'down', 'stable'], required: true },
            keyDrivers: { type: 'array', description: 'List of driving factors', defaultValue: [] }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'RiskAssessmentCard': {
        type: 'RiskAssessmentCard',
        description: 'Display risk assessment with level, reasons, and recommendations.',
        category: 'specialized',
        props: {
            riskLevel: { type: 'enum', description: 'Risk level', options: ['low', 'medium', 'high'], required: true },
            reasons: { type: 'array', description: 'List of reasons for risk', defaultValue: [] },
            recommendation: { type: 'string', description: 'Mitigation recommendation', required: false }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'RecommendationPanel': {
        type: 'RecommendationPanel',
        description: 'List of actionable recommendations.',
        category: 'specialized',
        props: {
            recommendations: { type: 'array', description: 'List of recommendation strings', defaultValue: [] }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },

    'ChartWithSummary': {
        type: 'ChartWithSummary',
        description: 'A chart with an accompanying text summary. Data heavy.',
        category: 'chart',
        props: {
            chartType: { type: 'string', description: 'Description of chart type', required: true },
            data: { type: 'array', description: 'Array of {label, value} objects', defaultValue: [] },
            summary: { type: 'string', description: 'Summary of what the chart shows', required: false }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'PerformanceDashboardBlock': {
        type: 'PerformanceDashboardBlock',
        description: 'A block displaying multiple performance metrics in a grid.',
        category: 'specialized',
        props: {
             metrics: { type: 'array', description: 'Array of {label, value, delta} objects', defaultValue: [] }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'DistributionBreakdownCard': {
        type: 'DistributionBreakdownCard',
        description: 'Show distribution of a total across categories.',
        category: 'specialized',
        props: {
            title: { type: 'string', description: 'Title', required: true },
            items: { type: 'array', description: 'Array of {label, value} objects', defaultValue: [] }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'TimeSeriesReport': {
        type: 'TimeSeriesReport',
        description: 'Detailed time-series analysis with insights.',
        category: 'chart',
        props: {
             title: { type: 'string', description: 'Report title', required: true },
             series: { type: 'array', description: 'Array of {label, value} points', defaultValue: [] },
             insights: { type: 'array', description: 'List of insights', defaultValue: [] }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'ModelAnswerCard': {
        type: 'ModelAnswerCard',
        description: 'Display the main text response from the AI.',
        category: 'specialized',
        props: {
             answer: { type: 'string', description: 'The AI answer text', required: true },
             confidence: { type: 'number', description: 'Confidence score', required: false }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'ReasoningPanel': {
        type: 'ReasoningPanel',
        description: 'Collapsible panel showing the AIs Chain of Thought.',
        category: 'specialized',
        props: {
             steps: { type: 'array', description: 'Array of reasoning steps strings', defaultValue: [] }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'PromptResultBlock': {
        type: 'PromptResultBlock',
        description: 'Show an input prompt and its resulting output side-by-side or stacked.',
        category: 'specialized',
        props: {
             prompt: { type: 'string', description: 'Input prompt', required: true },
             result: { type: 'string', description: 'Output result', required: true }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'TokenUsageCard': {
        type: 'TokenUsageCard',
        description: 'Display token usage statistics.',
        category: 'specialized',
        props: {
             inputTokens: { type: 'number', description: 'Input token count', required: true },
             outputTokens: { type: 'number', description: 'Output token count', required: true }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'LatencyStatsCard': {
        type: 'LatencyStatsCard',
        description: 'Display response latency metrics.',
        category: 'specialized',
        props: {
             latencyMs: { type: 'number', description: 'Latency in milliseconds', required: true }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'ErrorReportPanel': {
        type: 'ErrorReportPanel',
        description: 'Display an error message.',
        category: 'display',
        props: {
             title: { type: 'string', description: 'Error title', required: true },
             message: { type: 'string', description: 'Error definition', required: true },
             severity: { type: 'enum', description: 'Severity level', options: ['error', 'warning', 'info'], defaultValue: 'error' }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'EmptyResultCard': {
        type: 'EmptyResultCard',
        description: 'Placeholder for when no data is available.',
        category: 'display',
        props: {
             message: { type: 'string', description: 'Message to display', defaultValue: 'No data available' }
        },
        allowedChildren: 'none',
        aiAccessible: true
    },
    'LoadingBlock': {
        type: 'LoadingBlock',
        description: 'Loading skeleton/indicator.',
        category: 'display',
        props: {
             label: { type: 'string', description: 'Loading text', defaultValue: 'Loading...' }
        },
        allowedChildren: 'none',
        aiAccessible: true 
    },

  
    'text': {
        type: 'text',
        description: 'Basic text',
        category: 'typography',
        props: { variant: { type: 'enum', description: 'Type', options: ['p', 'h1'] } },
        aiAccessible: false
    },
    'button': {
        type: 'button',
        description: 'Button',
        category: 'input',
        props: { onClick: { type: 'function', description: 'Handler' } },
        aiAccessible: false
    },
    'icon': {
        type: 'icon',
        description: 'Icon',
        category: 'display',
        props: { name: { type: 'string', description: 'Name' } },
        aiAccessible: false
    },
    'input': {
        type: 'input',
        description: 'Input',
        category: 'input',
        props: {},
        aiAccessible: false
    },
    'table': { type: 'table', description: 'Table', category: 'display', props: {}, aiAccessible: false },
    'table-header': { type: 'table-header', description: 'Table Header', category: 'display', props: {}, aiAccessible: false },
    'table-body': { type: 'table-body', description: 'Table Body', category: 'display', props: {}, aiAccessible: false },
    'table-row': { type: 'table-row', description: 'Table Row', category: 'display', props: {}, aiAccessible: false },
    'table-head': { type: 'table-head', description: 'Table Head', category: 'display', props: {}, aiAccessible: false },
    'table-cell': { type: 'table-cell', description: 'Table Cell', category: 'display', props: {}, aiAccessible: false },
    'chart-placeholder': {
         type: 'chart-placeholder',
         description: 'Chart Placeholder',
         category: 'chart',
         props: {},
         aiAccessible: false
     },
    'metric': {
        type: 'metric',
        description: 'Base metric',
        category: 'display',
        props: { label: { type: 'string', description: 'Label' }, value: { type: 'string', description: 'Value' } },
        aiAccessible: false
    },
    'status-badge': {
        type: 'status-badge',
        description: 'Status badge',
        category: 'display',
        props: { status: { type: 'string', description: 'Status' } },
        aiAccessible: false
    },
    'avatar': {
        type: 'avatar',
        description: 'Avatar',
        category: 'display',
        props: { src: { type: 'string', description: 'Src' } },
        aiAccessible: false
    },
    'badge': {
        type: 'badge',
        description: 'Badge',
        category: 'display',
        props: { label: { type: 'string', description: 'Label' } },
        aiAccessible: false
    },
    'chart': {
        type: 'chart',
        description: 'Base Chart',
        category: 'chart',
        props: {},
        aiAccessible: false
    }
};

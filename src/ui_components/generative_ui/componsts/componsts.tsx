import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    AlertTriangle,
    Clock,
    Activity,
    BarChart3,
    Brain,
    Zap,
    AlertOctagon
} from 'lucide-react';

import { cn } from "@/lib/utils";

// ============================================================================
// 🔒 TIER 1 — Universal "must-have" working components
// ============================================================================

interface SummaryCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    value: string | number;
    subtitle?: string;
}

/**
 * SummaryCard
 * Purpose: show a single summarized insight
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, subtitle, className, ...props }) => (
    <Card className={cn("col-span-6", className)} {...props}>
        <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
        </CardContent>
    </Card>
);

interface MetricTrendCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    value: string | number;
    delta: number;
    trend?: number[];
}

/**
 * MetricTrendCard
 * Purpose: metric + trend over time
 */
export const MetricTrendCard: React.FC<MetricTrendCardProps> = ({ title, value, delta, trend = [], className, ...props }) => {
    const isPositive = delta >= 0;
    const max = Math.max(...trend);
    const min = Math.min(...trend);
    const range = max - min || 1;

    return (
        <Card className={cn("col-span-6", className)} {...props}>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{value}</div>
                    <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        {Math.abs(delta)}%
                    </div>
                </div>
                {trend.length > 0 && (
                    <div className="flex items-end gap-1 h-12 mt-4">
                        {trend.map((val, i) => {
                            const height = ((val - min) / range) * 100;
                            return (
                                <div
                                    key={i}
                                    className="flex-1 bg-primary/20 rounded-t"
                                    style={{ height: `${height}%`, minHeight: '4px' }}
                                />
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

interface StatusOverviewCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    status: 'success' | 'warning' | 'error';
    message?: string;
}

/**
 * StatusOverviewCard
 * Purpose: show system or entity status
 */
export const StatusOverviewCard: React.FC<StatusOverviewCardProps> = ({ title, status, message, className, ...props }) => {
    const statusConfig = {
        success: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
        warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
        error: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
    };

    const config = statusConfig[status] || statusConfig.success;
    const Icon = config.icon;

    return (
        <Card className={cn(`border-l-4 ${config.border} col-span-6`, className)} {...props}>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    {title}
                </CardTitle>
            </CardHeader>
            {message && (
                <CardContent>
                    <p className="text-sm text-muted-foreground">{message}</p>
                </CardContent>
            )}
        </Card>
    );
};

interface KeyValueItem {
    key: string;
    value: string | number;
}

interface KeyValuePanelProps extends React.HTMLAttributes<HTMLDivElement> {
    items?: KeyValueItem[];
}

/**
 * KeyValuePanel
 * Purpose: show structured details
 */
export const KeyValuePanel: React.FC<KeyValuePanelProps> = ({ items = [], className, ...props }) => (
    <Card className={cn("col-span-6", className)} {...props}>
        <CardContent className="pt-6">
            <dl className="space-y-3">
                {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-start">
                        <dt className="text-sm font-medium text-muted-foreground">{item.key}</dt>
                        <dd className="text-sm font-semibold text-right ml-4">{item.value}</dd>
                    </div>
                ))}
            </dl>
        </CardContent>
    </Card>
);

interface SimpleTablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
    columns?: string[];
    rows?: (string | number)[][];
}

/**
 * SimpleTablePanel
 * Purpose: display structured rows
 */
export const SimpleTablePanel: React.FC<SimpleTablePanelProps> = ({ columns = [], rows = [], className, ...props }) => (
    <Card className={cn("col-span-6 w-full", className)} {...props}>
        <CardContent className="pt-6">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b">
                            {columns.map((col: any, i) => (
                                <th key={i} className="text-left text-sm font-medium text-muted-foreground pb-3 px-2 whitespace-nowrap">
                                    {typeof col === 'object' && col.label ? col.label : col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row: any, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                {columns.map((col: any, j) => {
                                    // Determine the key to access data
                                    const key = typeof col === 'object' ? (col.field || col.key) : col;

                                    // Handle row being an object (AI output) or array (standard)
                                    let cellValue;
                                    if (Array.isArray(row)) {
                                        cellValue = row[j];
                                    } else if (typeof row === 'object' && row !== null) {
                                        cellValue = row[key] || row[col.label] || "";
                                    } else {
                                        cellValue = "";
                                    }

                                    return (
                                        <td key={j} className="py-3 px-2 text-sm text-foreground/80">
                                            {cellValue}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </CardContent>
    </Card>
);

interface ActivityEvent {
    label: string;
    time: string;
    description?: string;
}

interface ActivityFeedPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    events?: ActivityEvent[];
}

/**
 * ActivityFeedPanel
 * Purpose: show chronological events
 */
export const ActivityFeedPanel: React.FC<ActivityFeedPanelProps> = ({ events = [], className, ...props }) => (
    <Card className={cn("col-span-6", className)} {...props}>
        <CardContent className="pt-6">
            <div className="space-y-4">
                {events.map((event, i) => (
                    <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                            {i < events.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                        </div>
                        <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{event.label}</span>
                                <span className="text-xs text-muted-foreground">{event.time}</span>
                            </div>
                            {event.description && (
                                <p className="text-sm text-muted-foreground">{event.description}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
);

// ============================================================================
// 🧠 TIER 2 — Analytics & insight components
// ============================================================================

interface InsightSummaryCardProps extends React.HTMLAttributes<HTMLDivElement> {
    headline: string;
    insight: string;
    confidence?: number;
}

/**
 * InsightSummaryCard
 * Purpose: highlight an insight
 */
export const InsightSummaryCard: React.FC<InsightSummaryCardProps> = ({ headline, insight, confidence, className, ...props }) => (
    <Card className={cn("border-l-4 border-l-blue-500 col-span-6", className)} {...props}>
        <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-500" />
                    {headline}
                </CardTitle>
                {confidence && (
                    <Badge variant="secondary" className="ml-2">
                        {confidence}% confidence
                    </Badge>
                )}
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">{insight}</p>
        </CardContent>
    </Card>
);

interface ComparisonMetric {
    label: string;
    left: string | number;
    right: string | number;
}

interface ComparisonCardProps extends React.HTMLAttributes<HTMLDivElement> {
    leftLabel: string;
    rightLabel: string;
    metrics?: ComparisonMetric[];
}

/**
 * ComparisonCard
 * Purpose: compare two entities
 */
export const ComparisonCard: React.FC<ComparisonCardProps> = ({ leftLabel, rightLabel, metrics = [], className, ...props }) => (
    <Card className={cn("col-span-6", className)} {...props}>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-blue-600">{leftLabel}</CardTitle>
                <CardTitle className="text-sm font-medium text-purple-600">{rightLabel}</CardTitle>
            </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {metrics.map((metric, i) => (
                    <div key={i}>
                        <div className="flex justify-between text-sm font-medium mb-2">
                            <span className="text-muted-foreground">{metric.label}</span>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 text-right">
                                <span className="text-sm font-semibold text-blue-600">{metric.left}</span>
                            </div>
                            <div className="flex-1">
                                <span className="text-sm font-semibold text-purple-600">{metric.right}</span>
                            </div>
                        </div>
                        <Progress
                            value={50}
                            className="h-1 mt-1"
                        />
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
);

interface TrendAnalysisPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    summary: string;
    trendDirection: 'up' | 'down' | 'stable';
    keyDrivers?: string[];
}

/**
 * TrendAnalysisPanel
 * Purpose: explain trend meaning
 */
export const TrendAnalysisPanel: React.FC<TrendAnalysisPanelProps> = ({ summary, trendDirection, keyDrivers = [], className, ...props }) => {
    const directionConfig = {
        up: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
        down: { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
        stable: { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' }
    };

    const config = directionConfig[trendDirection] || directionConfig.stable;
    const Icon = config.icon;

    return (
        <Card className={cn("col-span-6", className)} {...props}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                    Trend Analysis
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm">{summary}</p>
                {keyDrivers.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium mb-2">Key Drivers</h4>
                        <ul className="space-y-1">
                            {keyDrivers.map((driver, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{driver}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

interface RiskAssessmentCardProps extends React.HTMLAttributes<HTMLDivElement> {
    riskLevel: 'low' | 'medium' | 'high';
    reasons?: string[];
    recommendation?: string;
}

/**
 * RiskAssessmentCard
 * Purpose: show risk level
 */
export const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({ riskLevel, reasons = [], recommendation, className, ...props }) => {
    const riskConfig = {
        low: { color: 'text-green-600', bg: 'bg-green-50', label: 'Low Risk' },
        medium: { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Medium Risk' },
        high: { color: 'text-red-600', bg: 'bg-red-50', label: 'High Risk' }
    };

    const config = riskConfig[riskLevel] || riskConfig.medium;

    return (
        <Card className={cn("col-span-6", className)} {...props}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertOctagon className={`w-5 h-5 ${config.color}`} />
                    Risk Assessment
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Badge className={`${config.bg} ${config.color} border-0`}>
                        {config.label}
                    </Badge>
                </div>
                {reasons.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium mb-2">Risk Factors</h4>
                        <ul className="space-y-1">
                            {reasons.map((reason, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-red-500 mt-1">•</span>
                                    <span>{reason}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {recommendation && (
                    <Alert>
                        <AlertTitle>Recommendation</AlertTitle>
                        <AlertDescription>{recommendation}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

interface RecommendationPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    recommendations?: string[];
}

/**
 * RecommendationPanel
 * Purpose: suggest actions
 */
export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ recommendations = [], className, ...props }) => (
    <Card className={cn("col-span-6", className)} {...props}>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Recommendations
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
                {recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {i + 1}
                        </div>
                        <p className="text-sm flex-1">{rec}</p>
                    </div>
                ))}
            </div>
        </CardContent>
    </Card>
);

// ============================================================================
// 📊 TIER 3 — Data-heavy working components
// ============================================================================

interface ChartDataPoint {
    label: string;
    value: number;
}

interface ChartWithSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
    chartType: string;
    data?: ChartDataPoint[];
    summary?: string;
}

/**
 * ChartWithSummary
 * Purpose: chart + explanation
 */
export const ChartWithSummary: React.FC<ChartWithSummaryProps> = ({ chartType, data = [], summary, className, ...props }) => {
    const max = Math.max(...data.map(d => d.value));

    return (
        <Card className={cn("col-span-12", className)} {...props}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {chartType}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="h-48 flex items-end gap-2">
                    {data.map((item, i) => {
                        const height = (item.value / max) * 100;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                                    style={{ height: `${height}%`, minHeight: '8px' }}
                                    title={`${item.label}: ${item.value}`}
                                />
                                <span className="text-xs text-muted-foreground">{item.label}</span>
                            </div>
                        );
                    })}
                </div>
                {summary && (
                    <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground">{summary}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

interface PerformanceMetric {
    label: string;
    value: string | number;
    delta: number;
}

interface PerformanceDashboardBlockProps extends React.HTMLAttributes<HTMLDivElement> {
    metrics?: PerformanceMetric[];
}

/**
 * PerformanceDashboardBlock
 * Purpose: show multiple KPIs together
 */
export const PerformanceDashboardBlock: React.FC<PerformanceDashboardBlockProps> = ({ metrics = [], className, ...props }) => (
    <Card className={cn("col-span-12", className)} {...props}>
        <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.map((metric, i) => {
                    const isPositive = metric.delta >= 0;
                    return (
                        <div key={i} className="space-y-2">
                            <p className="text-xs text-muted-foreground">{metric.label}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">{metric.value}</span>
                                <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                    {isPositive ? '+' : ''}{metric.delta}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </CardContent>
    </Card>
);

interface DistributionItem {
    label: string;
    value: number;
}

interface DistributionBreakdownCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    items?: DistributionItem[];
}

/**
 * DistributionBreakdownCard
 * Purpose: show distribution
 */
export const DistributionBreakdownCard: React.FC<DistributionBreakdownCardProps> = ({ title, items = [], className, ...props }) => {
    const total = items.reduce((sum, item) => sum + item.value, 0);

    return (
        <Card className={cn("col-span-12", className)} {...props}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.map((item, i) => {
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;
                    return (
                        <div key={i} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{item.label}</span>
                                <span className="text-muted-foreground">{item.value} ({percentage.toFixed(1)}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};

interface TimeSeriesPoint {
    label: string;
    value: number;
}

interface TimeSeriesReportProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    series?: TimeSeriesPoint[];
    insights?: string[];
}

/**
 * TimeSeriesReport
 * Purpose: time-based analysis
 */
export const TimeSeriesReport: React.FC<TimeSeriesReportProps> = ({ title, series = [], insights = [], className, ...props }) => (
    <Card className={cn("col-span-12", className)} {...props}>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="h-32 flex items-end gap-1">
                {series.map((point, i) => {
                    const max = Math.max(...series.map(p => p.value));
                    const height = (point.value / max) * 100;
                    return (
                        <div
                            key={i}
                            className="flex-1 bg-primary/60 rounded-t"
                            style={{ height: `${height}%`, minHeight: '4px' }}
                            title={`${point.label}: ${point.value}`}
                        />
                    );
                })}
            </div>
            {insights.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                    <h4 className="text-sm font-medium">Key Insights</h4>
                    <ul className="space-y-1">
                        {insights.map((insight, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{insight}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </CardContent>
    </Card>
);

// ============================================================================
// ============================================================================
// 🤖 TIER 4 — AI-specific working components
// ============================================================================

interface ModelAnswerCardProps extends React.HTMLAttributes<HTMLDivElement> {
    answer: string;
    confidence?: number;
}

/**
 * ModelAnswerCard
 * Purpose: show AI response
 */
export const ModelAnswerCard: React.FC<ModelAnswerCardProps> = ({ answer, confidence, className, ...props }) => (
    <Card className={cn("border-l-4 border-l-purple-500 col-span-12", className)} {...props}>
        <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    AI Response
                </CardTitle>
                {confidence && (
                    <Badge variant="outline" className="ml-2">
                        {confidence}%
                    </Badge>
                )}
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-sm whitespace-pre-wrap">{answer}</p>
        </CardContent>
    </Card>
);

interface ReasoningPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    steps?: string[];
}

/**
 * ReasoningPanel
 * Purpose: show reasoning (collapsed by default)
 */
export const ReasoningPanel: React.FC<ReasoningPanelProps> = ({ steps = [], className, ...props }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    return (
        <Card className={cn("col-span-12", className)} {...props}>
            <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        Reasoning Steps
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {isExpanded ? '▼' : '▶'} {steps.length} steps
                    </span>
                </CardTitle>
            </CardHeader>
            {isExpanded && (
                <CardContent>
                    <ol className="space-y-2">
                        {steps.map((step, i) => (
                            <li key={i} className="text-sm flex gap-3">
                                <span className="font-medium text-muted-foreground min-w-6">{i + 1}.</span>
                                <span className="flex-1">{step}</span>
                            </li>
                        ))}
                    </ol>
                </CardContent>
            )}
        </Card>
    );
};

interface PromptResultBlockProps extends React.HTMLAttributes<HTMLDivElement> {
    prompt: string;
    result: string;
}

/**
 * PromptResultBlock
 * Purpose: show prompt → result
 */
export const PromptResultBlock: React.FC<PromptResultBlockProps> = ({ prompt, result, className, ...props }) => (
    <Card className={cn("col-span-12", className)} {...props}>
        <CardContent className="pt-6 space-y-4">
            <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Prompt</h4>
                <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm font-mono">{prompt}</p>
                </div>
            </div>
            <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">Result</h4>
                <div className="p-3 bg-primary/5 rounded-md border border-primary/20">
                    <p className="text-sm">{result}</p>
                </div>
            </div>
        </CardContent>
    </Card>
);

interface TokenUsageCardProps extends React.HTMLAttributes<HTMLDivElement> {
    inputTokens: number;
    outputTokens: number;
}

/**
 * TokenUsageCard
 * Purpose: show usage stats
 */
export const TokenUsageCard: React.FC<TokenUsageCardProps> = ({ inputTokens, outputTokens, className, ...props }) => {
    const total = inputTokens + outputTokens;
    const inputPercentage = (inputTokens / total) * 100;

    return (
        <Card className={cn("col-span-6", className)} {...props}>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Input</span>
                    <span className="text-sm font-semibold">{inputTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Output</span>
                    <span className="text-sm font-semibold">{outputTokens.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-medium">Total</span>
                        <span className="text-sm font-bold">{total.toLocaleString()}</span>
                    </div>
                    <Progress value={inputPercentage} className="h-1 mt-2" />
                </div>
            </CardContent>
        </Card>
    );
};

interface LatencyStatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
    latencyMs: number;
}

/**
 * LatencyStatsCard
 * Purpose: show response time
 */
export const LatencyStatsCard: React.FC<LatencyStatsCardProps> = ({ latencyMs, className, ...props }) => {
    const seconds = (latencyMs / 1000).toFixed(2);
    const rating = latencyMs < 1000 ? 'Excellent' : latencyMs < 3000 ? 'Good' : 'Slow';
    const color = latencyMs < 1000 ? 'text-green-600' : latencyMs < 3000 ? 'text-yellow-600' : 'text-red-600';

    return (
        <Card className={cn("col-span-6", className)} {...props}>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Response Time
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{seconds}</span>
                    <span className="text-sm text-muted-foreground">seconds</span>
                </div>
                <Badge variant="outline" className={`mt-2 ${color} border-current`}>
                    {rating}
                </Badge>
            </CardContent>
        </Card>
    );
};

// ============================================================================
// 🚨 TIER 5 — Control & safety components
// ============================================================================

interface ErrorReportPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    message: string;
    severity?: 'error' | 'warning' | 'info';
}

/**
 * ErrorReportPanel
 * Purpose: show errors
 */
export const ErrorReportPanel: React.FC<ErrorReportPanelProps> = ({ title, message, severity = 'error', className, ...props }) => {
    const severityConfig = {
        error: { icon: AlertCircle, variant: 'destructive' as const },
        warning: { icon: AlertTriangle, variant: 'default' as const },
        info: { icon: AlertCircle, variant: 'default' as const }
    };

    const config = severityConfig[severity] || severityConfig.error;
    const Icon = config.icon;

    return (
        <Alert variant={config.variant} className={cn("col-span-12", className)} {...props}>
            <Icon className="h-4 w-4" />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    );
};

interface EmptyResultCardProps extends React.HTMLAttributes<HTMLDivElement> {
    message?: string;
}

/**
 * EmptyResultCard
 * Purpose: no data state
 */
export const EmptyResultCard: React.FC<EmptyResultCardProps> = ({ message = 'No data available', className, ...props }) => (
    <Card className={cn("col-span-12", className)} {...props}>
        <CardContent className="pt-12 pb-12 text-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{message}</p>
            </div>
        </CardContent>
    </Card>
);

interface LoadingBlockProps extends React.HTMLAttributes<HTMLDivElement> {
    label?: string;
}

/**
 * LoadingBlock
 * Purpose: loading indicator
 */
export const LoadingBlock: React.FC<LoadingBlockProps> = ({ label = 'Loading...', className, ...props }) => (
    <Card className={cn("col-span-6", className)} {...props}>
        <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="pt-2">
                <p className="text-xs text-muted-foreground">{label}</p>
            </div>
        </CardContent>
    </Card>
);



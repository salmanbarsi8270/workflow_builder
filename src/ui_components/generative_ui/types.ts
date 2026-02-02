export type ComponentType = 
  | 'container'
  | 'text'
  | 'button'
  | 'card'
  | 'card-header'
  | 'card-content'
  | 'card-footer'
  | 'input'
  | 'icon'
  | 'grid'
  | 'stack'
  | 'metric'
  | 'avatar'
  | 'badge'
  | 'table'
  | 'table-header'
  | 'table-row'
  | 'table-head'
  | 'table-body'
  | 'table-cell'
  | 'chart'
  | 'chart-placeholder'
  | 'streaming-text'
  | 'error-state'
  | 'section'
  | 'status-badge'
  | 'SummaryCard'
  | 'MetricTrendCard'
  | 'StatusOverviewCard'
  | 'KeyValuePanel'
  | 'SimpleTablePanel'
  | 'ActivityFeedPanel'
  | 'InsightSummaryCard'
  | 'ComparisonCard'
  | 'TrendAnalysisPanel'
  | 'RiskAssessmentCard'
  | 'RecommendationPanel'
  | 'ChartWithSummary'
  | 'PerformanceDashboardBlock'
  | 'DistributionBreakdownCard'
  | 'TimeSeriesReport'
  | 'ModelAnswerCard'
  | 'ReasoningPanel'
  | 'PromptResultBlock'
  | 'TokenUsageCard'
  | 'LatencyStatsCard'
  | 'ErrorReportPanel'
  | 'EmptyResultCard'
  | 'LoadingBlock'
  | 'text-block'
  | 'thinking-block'
  | 'database-card';

export interface BaseProps {
  className?: string;
  [key: string]: any;
}

export interface ContainerProps extends BaseProps {}

export interface StackProps extends BaseProps {
  direction?: 'col' | 'row';
  gap?: number;
}

export interface GridProps extends BaseProps {
  cols?: number;
  gap?: number;
}

export interface TextProps extends BaseProps {
  variant?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export interface ButtonProps extends BaseProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onClick?: () => void;
}

export interface IconProps extends BaseProps {
  name: string;
}

export interface MetricProps extends BaseProps {
  label: string;
  value: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  subtext?: string;
}

export interface AvatarProps extends BaseProps {
  src?: string;
  fallback: string;
}

export interface BadgeProps extends BaseProps {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export interface ChartProps extends BaseProps {
  type?: 'bar' | 'line' | 'area' | 'pie';
  data?: any[];
  xAxisKey?: string;
  series?: { key: string; color?: string; name?: string }[];
  title?: string;
  description?: string;
}

export interface StreamingTextProps extends BaseProps {
  text: string;
  speed?: number;
}

export interface ErrorStateProps extends BaseProps {
  title: string;
  message?: string;
  retryAction?: () => void;
}

export interface SectionProps extends BaseProps {
  title?: string;
  description?: string;
}

export interface StatusBadgeProps extends BaseProps {
  status: 'success' | 'warning' | 'error' | 'neutral' | 'info';
  dot?: boolean;
}

export type AnyComponentProps = 
  | ContainerProps 
  | StackProps 
  | GridProps 
  | TextProps 
  | ButtonProps 
  | IconProps 
  | MetricProps 
  | AvatarProps 
  | BadgeProps 
  | ChartProps
  | StreamingTextProps
  | ErrorStateProps
  | SectionProps
  | StatusBadgeProps
  | BaseProps;

export interface UIComponent {
  id?: string;
  type: ComponentType | string;
  props?: AnyComponentProps;
  children?: (UIComponent | string)[] | string;
}

export interface UISchema {
  version: string;
  root: UIComponent;
}


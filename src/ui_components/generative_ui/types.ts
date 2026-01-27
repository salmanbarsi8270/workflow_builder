export type ComponentType = 
  | 'kpi-card'
  | 'stats-grid'
  | 'data-table'
  | 'stats-list'
  | 'chart-card'
  | 'info-card'
  | 'empty-state'
  | 'progress-card'
  | 'timeline-card'
  | 'comparison-card'
  | 'summary-card'
  | 'activity-feed'
  | 'heading'
  | 'code-card'
  | 'step-indicator'
  | 'status-tag'
  | 'text-card'
  | 'calendar-card'
  | 'button'
  | 'badge'
  | 'accordion'
  | 'avatar'
  | 'tabs'
  | 'wiki-card'
  | 'container';

export interface BaseProps {
  className?: string;
  [key: string]: any;
}

export interface UIComponent {
  id?: string;
  type: ComponentType | string;
  props?: BaseProps;
  children?: (UIComponent | string)[] | string;
}

export interface UISchema {
  version: string;
  root: UIComponent;
}

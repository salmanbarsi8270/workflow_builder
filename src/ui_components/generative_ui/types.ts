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
  | 'chart-placeholder';

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


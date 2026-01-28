export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    id: string;
    status?: 'sending' | 'sent' | 'error';
    feedback?: 'helpful' | 'not-helpful';
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    timestamp: Date;
    isPinned?: boolean;
    tags?: string[];
    preview: string;
}

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
  | 'container'
  | 'grid-container';

export interface BaseProps {
  className?: string;
  _userPrompt?: string;
  [key: string]: any;
}

export interface GridLayout {
  colStart?: number | string;
  colEnd?: number | string;
  rowStart?: number | string;
  rowEnd?: number | string;
  colSpan?: number | string;
  rowSpan?: number | string;
}

export interface UIComponent {
  id?: string;
  type: ComponentType | string;
  props?: BaseProps;
  layout?: GridLayout;
  children?: (UIComponent | string)[] | string;
  _userPrompt?: string;
}

export interface UISchema {
  version: string;
  root: UIComponent;
}

export interface AssistantHistory {
  sessions: ChatSession[];
  isLoading: boolean;
  error: string | null;
  fetchHistory: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  renameSession: (sessionId: string, newTitle: string) => Promise<boolean>;
  setSessions: (sessions: ChatSession[] | ((prev: ChatSession[]) => ChatSession[])) => void;
}

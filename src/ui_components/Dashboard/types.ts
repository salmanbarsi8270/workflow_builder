export interface DashboardStats {
  totalWorkflows: number;
  successfulRuns: number;
  runningNow: number;
  failedRuns: number;
  totalRuns: number;
  successRate: number;
  avgExecutionTime: string;
  mostUsedApp: string;
}

export interface RecentRun {
  id: string;
  flow_id?: string;
  name: string;
  status: string;
  time: string;
  timestamp: string;
  duration: string;
  appIcon: string;
  trigger: string;
  current_context?: any;
}

export interface ActivityChartData {
  name: string;
  runs: number;
  success: number;
}

export interface TopWorkflow {
  id: string;
  name: string;
  runs: number;
  successRate: number;
  lastRun: string;
  status: 'active' | 'paused' | 'error';
}

export interface WorkflowStats {
    total: number;
    active: number;
}

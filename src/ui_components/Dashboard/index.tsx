import { useEffect, useState } from 'react';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useUser } from '@/context/UserContext';
import { API_URL } from '../api/apiurl';
import { io, type Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

import type { DashboardStats, RecentRun, ActivityChartData, TopWorkflow } from './types';
import { DashboardHeader } from './DashboardHeader';
import { StatsCards } from './StatsCards';
import { ActivityChart } from './ActivityChart';
import { HealthStats } from './HealthStats';
import { RecentActivity } from './RecentActivity';
import { TopWorkflows } from './TopWorkflows';

export default function WorkflowDashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkflows: 0,
    successfulRuns: 0,
    runningNow: 0,
    failedRuns: 0,
    totalRuns: 0,
    successRate: 0,
    avgExecutionTime: '---',
    mostUsedApp: 'None'
  });
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);
  const [activityData, setActivityData] = useState<ActivityChartData[]>([]);
  const [topWorkflows, setTopWorkflows] = useState<TopWorkflow[]>([]);
  const [workflowStats, setWorkflowStats] = useState({ total: 0, active: 0 });

  // Initialize Socket
  useEffect(() => {
    if (user?.id) {
      const newSocket = io(API_URL, {
        withCredentials: true,
      });

      newSocket.on('connect', () => {
        console.log('Dashboard connected to socket server:', newSocket.id);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user?.id]);

  // Fetch Dashboard Data
  useEffect(() => {
    if (socket && user?.id) {
      fetchDashboardData();
      fetchWorkflowStats();
      const interval = setInterval(() => {
        fetchDashboardData();
        fetchWorkflowStats();
      }, 30000); // 30s refresh
      return () => clearInterval(interval);
    }
  }, [socket, user?.id, timeRange]);

  const fetchWorkflowStats = () => {
    if (!socket || !user?.id) return;
    
    socket.emit('list-flows', user.id, (response: any) => {
        if (response.success && response.flows) {
            const flows = response.flows;
            const activeCount = flows.filter((f: any) => f.is_active).length;
            setWorkflowStats({
                total: flows.length,
                active: activeCount
            });
        }
    });
  };

  const fetchDashboardData = () => {
    if (!socket || !user?.id) return;

    setIsLoading(true);
    socket.emit('get-dashboard-stats', { userId: user.id, timeRange }, (response: any) => {
      if (response.success) {
        setStats(response.stats);
        setRecentRuns(response.recentRuns);
        setActivityData(response.activityData);
        setTopWorkflows(response.topWorkflows);
        setTimeRange(response.timeRange);
      }
      setIsLoading(false);
    });
  };

  const handleNewWorkflow = () => {
    navigate('/automation', { state: { openNew: true } });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <DashboardHeader onRefresh={fetchDashboardData} onNewWorkflow={handleNewWorkflow} />

      <StatsCards isLoading={isLoading} stats={stats} workflowStats={workflowStats} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-7">
            <ActivityChart data={activityData} />
            <HealthStats stats={stats} />
            <RecentActivity recentRuns={recentRuns} />
            <TopWorkflows topWorkflows={topWorkflows} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

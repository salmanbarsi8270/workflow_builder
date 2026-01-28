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
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="min-h-full bg-transparent text-slate-900 dark:text-white overflow-y-auto relative animate-in fade-in duration-500">
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.015)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-size-[50px_50px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none" />

      <div className="relative w-full max-w-[90%] mx-auto z-10 p-8 h-full flex flex-col gap-8">
        <AnimatePresence mode="wait">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-8"
          >
            <DashboardHeader 
              onRefresh={fetchDashboardData} 
              onNewWorkflow={handleNewWorkflow} 
            />

            <StatsCards isLoading={isLoading} stats={stats} workflowStats={workflowStats} />

            <Tabs defaultValue="overview" className="space-y-8">
              <TabsContent value="overview" className="space-y-8 m-0 outline-none">
                <div className="grid gap-8 lg:grid-cols-7">
                  <ActivityChart data={activityData} />
                  <HealthStats stats={stats} />
                  <RecentActivity recentRuns={recentRuns} />
                  <TopWorkflows topWorkflows={topWorkflows} />
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

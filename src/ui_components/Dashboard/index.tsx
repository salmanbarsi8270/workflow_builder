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
import { ApprovalsList } from './ApprovalsList';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Notification03Icon } from "@hugeicons/core-free-icons";

import { HugeiconsIcon } from "@hugeicons/react";

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
  const [isApprovalsOpen, setIsApprovalsOpen] = useState(false);
  const [approvalMode, setApprovalMode] = useState<'dev' | 'pro'>('dev');

  const approvalCount = recentRuns.filter(r => r.status.toLowerCase() === 'waiting').length;

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
        setApprovalMode(response.approvalMode || 'dev');
      }
      setIsLoading(false);
    });
  };

  const handleNewWorkflow = () => {
    navigate('/automation', { state: { openNew: true } });
  };

  return (
    <div className="min-h-full bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white overflow-y-scroll relative">
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-size-[50px_50px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none" />

      <div className="relative z-10 container mx-auto p-8 w-full space-y-8 flex flex-col h-full min-h-screen">
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
              approvalCount={approvalCount}
              onOpenApprovals={() => setIsApprovalsOpen(true)}
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

        <Sheet open={isApprovalsOpen} onOpenChange={setIsApprovalsOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-white/10 p-0">
            <SheetHeader className="p-6 pb-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Approvals</SheetTitle>
                <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${
                  approvalMode === 'pro' 
                    ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30'
                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                }`}>
                  {approvalMode} mode
                </div>
              </div>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {user?.id && <ApprovalsList userId={user.id} />}
              {approvalCount === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                    <HugeiconsIcon icon={Notification03Icon} className="h-8 w-8 opacity-20" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-xs">All caught up!</p>
                    <p className="text-xs text-slate-500 mt-1">No pending approvals found.</p>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

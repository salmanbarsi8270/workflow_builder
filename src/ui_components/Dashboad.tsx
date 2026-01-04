import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { HugeiconsIcon } from "@hugeicons/react";
import { X, CheckCheckIcon, Play } from "lucide-react";
import { CheckmarkCircle02Icon, AlertCircleIcon, PlayIcon, PlusSignIcon, WorkflowCircle01Icon, Refresh01Icon, ZapIcon, Database01Icon } from "@hugeicons/core-free-icons";
import { useUser } from '@/context/UserContext';
import { API_URL } from './api/apiurl';
import { io, type Socket } from 'socket.io-client';
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalWorkflows: number;
  successfulRuns: number;
  runningNow: number;
  failedRuns: number;
  totalRuns: number;
  successRate: number;
  avgExecutionTime: string;
  mostUsedApp: string;
}

interface RecentRun {
  id: string;
  name: string;
  status: string;
  time: string;
  timestamp: string;
  duration: string;
  appIcon: string;
  trigger: string;
}

interface ActivityChartData {
  name: string;
  runs: number;
  success: number;
}

interface TopWorkflow {
  id: string;
  name: string;
  runs: number;
  successRate: number;
  lastRun: string;
  status: 'active' | 'paused' | 'error';
}

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
      const interval = setInterval(fetchDashboardData, 30000); // 30s refresh
      return () => clearInterval(interval);
    }
  }, [socket, user?.id, timeRange]);

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
    navigate('/automation');
  };

  const statsConfig = [
    {
      title: "Total Workflows",
      value: stats.totalWorkflows.toString(),
      description: `${stats.runningNow} active now`,
      icon: WorkflowCircle01Icon,
      color: "text-purple-500",
    },
    {
      title: "Successful Runs",
      value: stats.successfulRuns.toLocaleString(),
      description: `${stats.successRate}% success rate`,
      icon: CheckmarkCircle02Icon,
      color: "text-green-500",
    },
    {
      title: "Running Now",
      value: stats.runningNow.toString(),
      description: "Active executions",
      icon: PlayIcon,
      color: "text-blue-500",
    },
    {
      title: "Failed Runs",
      value: stats.failedRuns.toString(),
      description: "Requires attention",
      icon: AlertCircleIcon,
      color: "text-red-500",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Workflow Dashboard</h2>
          <p className="text-muted-foreground mt-1">Monitor and manage your automations in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={fetchDashboardData}>
            <HugeiconsIcon icon={Refresh01Icon} className="h-4 w-4" />
          </Button>
          <Button onClick={handleNewWorkflow}>
            <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}><CardContent className="p-6"><Skeleton className="h-4 w-24 mb-4"/><Skeleton className="h-8 w-16"/></CardContent></Card>
          ))
        ) : (
          statsConfig.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <HugeiconsIcon icon={stat.icon} className={cn("h-4 w-4", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-7">
            {/* Chart */}
            <Card className="col-span-4 lg:col-span-5">
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>Executions over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="runs" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRuns)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Quick Stats sidebar */}
            <Card className="col-span-4 lg:col-span-2">
               <CardHeader><CardTitle>Health</CardTitle></CardHeader>
               <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-semibold text-green-500">{stats.successRate}%</span>
                    </div>
                    <Progress value={stats.successRate} className="h-2" />
                  </div>
                  
                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <HugeiconsIcon icon={Database01Icon} className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Most Used App</p>
                        <p className="text-xs text-muted-foreground">{stats.mostUsedApp}</p>
                      </div>
                    </div>
                  </div>
               </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="col-span-4 lg:col-span-4">
              <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentRuns.map((run) => (
                    <div key={run.id} className="flex items-center gap-4">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-white",
                        run.status === 'Success' ? "bg-green-500" : run.status === 'Running' ? "bg-blue-500" : "bg-red-500"
                      )}>
                        {run.status === 'Success' ? <CheckCheckIcon className="h-4 w-4" /> : run.status === 'Running' ? <Play className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{run.name}</p>
                        <p className="text-xs text-muted-foreground">{run.status} • {run.trigger}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs text-muted-foreground">Recently</p>
                      </div>
                    </div>
                  ))}
                  {recentRuns.length === 0 && <p className="text-center py-4 text-muted-foreground">No recent runs</p>}
                </div>
              </CardContent>
            </Card>

            {/* Top Workflows */}
            <Card className="col-span-4 lg:col-span-3">
              <CardHeader><CardTitle>Top Workflows</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {topWorkflows.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <HugeiconsIcon icon={ZapIcon} className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{w.name}</p>
                        <p className="text-xs text-muted-foreground">{w.runs} runs • {w.successRate}% success</p>
                      </div>
                    </div>
                    <Badge variant={w.status === 'active' ? 'default' : 'secondary'}>{w.status}</Badge>
                  </div>
                ))}
                {topWorkflows.length === 0 && <p className="text-center py-4 text-muted-foreground">No workflows found</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

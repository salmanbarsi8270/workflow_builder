import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  CheckmarkCircle02Icon, 
  HourglassIcon, 
  AlertCircleIcon, 
  PlayIcon,
  PlusSignIcon
} from "@hugeicons/core-free-icons"
import { useUser } from '@/context/UserContext';
import { API_URL } from './api/apiurl';
import { io, type Socket } from 'socket.io-client';
import { Skeleton } from "@/components/ui/skeleton"
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalWorkflows: number;
  successfulRuns: number;
  runningNow: number;
  failedRuns: number;
}

interface RecentRun {
  id: string;
  name: string;
  status: 'Success' | 'Running' | 'Failed';
  time: string;
  timestamp: string;
}

export default function WorkflowDashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkflows: 0,
    successfulRuns: 0,
    runningNow: 0,
    failedRuns: 0,
  });
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([]);

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
    }
  }, [socket, user?.id]);

  const fetchDashboardData = () => {
    if (!socket || !user?.id) return;

    setIsLoading(true);

    // Fetch workflows list
    socket.emit('list-flows', user.id, (response: any) => {
      if (response.success && response.flows) {
        const flows = response.flows;
        
        // Calculate stats
        const totalWorkflows = flows.length;
        const activeWorkflows = flows.filter((f: any) => f.is_active).length;
        
        setStats({
          totalWorkflows,
          successfulRuns: 0, // This would come from a runs API
          runningNow: activeWorkflows,
          failedRuns: 0, // This would come from a runs API
        });

        // Get recent runs (mock for now, would need a real API endpoint)
        // For now, show recent workflows as placeholder
        const recent: RecentRun[] = flows.slice(0, 5).map((flow: any) => ({
          id: flow.id,
          name: flow.name,
          status: flow.is_active ? 'Running' : 'Success',
          time: getRelativeTime(flow.updated_at || flow.created_at),
          timestamp: flow.updated_at || flow.created_at,
        }));

        setRecentRuns(recent);
      }
      setIsLoading(false);
    });
  };

  const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleNewWorkflow = () => {
    navigate('/automation');
  };

  const statsConfig = [
    {
      title: "Total Workflows",
      value: stats.totalWorkflows.toString(),
      description: "Active automations",
      icon: PlayIcon,
      color: "text-muted-foreground",
    },
    {
      title: "Successful Runs",
      value: stats.successfulRuns.toString(),
      description: "Completed successfully",
      icon: CheckmarkCircle02Icon,
      color: "text-green-500",
    },
    {
      title: "Running Now",
      value: stats.runningNow.toString(),
      description: "Active workflows",
      icon: HourglassIcon,
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <Button onClick={handleNewWorkflow}>
          <HugeiconsIcon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
          New Workflow
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          statsConfig.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <HugeiconsIcon icon={stat.icon} className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-8">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center">
                    <div className="ml-4 space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentRuns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity</p>
                <p className="text-sm mt-2">Create your first workflow to get started</p>
              </div>
            ) : (
              <div className="space-y-8">
                {recentRuns.map((run) => (
                  <div key={run.id} className="flex items-center">
                    <div className={`ml-4 space-y-1`}>
                      <p className="text-sm font-medium leading-none">{run.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {run.time}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        run.status === "Success" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
                        run.status === "Running" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" :
                        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      }`}>
                        {run.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid gap-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/integration')}>Connect New App</Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/automation')}>View Workflows</Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/integration')}>Manage Integrations</Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleNewWorkflow}>Create Workflow</Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

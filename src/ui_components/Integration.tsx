import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, CheckCircle, XCircle, RefreshCw, AlertCircle, Search, X } from "lucide-react"
import { getConnections } from "./api/connectionlist"
import { useUser } from '@/context/UserContext';
import { API_URL } from './api/apiurl';
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"

interface IntegrationApp {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  connected: boolean;
  lastSynced?: string;
  category?: string;
  connectionStatus?: 'healthy' | 'warning' | 'error';
  syncProgress?: number;
}

// Category colors for better organization
const categoryColors: Record<string, string> = {
  'productivity': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'storage': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'communication': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'development': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  'default': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
};

const StatusIndicator = ({ status }: { status: IntegrationApp['connectionStatus'] }) => {
  switch (status) {
    case 'healthy':
      return <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
        <CheckCircle className="h-3 w-3" />
        <span className="text-xs">Connected</span>
      </div>;
    case 'warning':
      return <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs">Warning</span>
      </div>;
    case 'error':
      return <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
        <XCircle className="h-3 w-3" />
        <span className="text-xs">Error</span>
      </div>;
    default:
      return <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
        <AlertCircle className="h-3 w-3" />
        <span className="text-xs">Unknown</span>
      </div>;
  }
};

export default function Integration() {
  const { user } = useUser();
  const [apps, setApps] = useState<IntegrationApp[]>([]);
  const [filteredApps, setFilteredApps] = useState<IntegrationApp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [syncingApp, setSyncingApp] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchConnections();
  }, [user?.id]);

  useEffect(() => {
    filterApps();
  }, [apps, activeTab, searchQuery, categoryFilter, statusFilter]);

  const fetchConnections = () => {
    if (user?.id) {
      setIsLoading(true);
      getConnections(user.id)
        .then((data: any) => {
          const list = data.data || [];
          const enhancedList = list.map((app: IntegrationApp) => ({
            ...app,
            category: app.category || 'default',
            lastSynced: app.connected ? new Date().toISOString() : undefined,
            connectionStatus: app.connected ? 'healthy' : undefined,
          }));
          setApps(enhancedList);
        })
        .catch(err => {
          console.error("Failed to fetch connections", err);
          toast.error("Failed to load integrations");
        })
        .finally(() => setIsLoading(false));
    }
  };

  const filterApps = () => {
    let filtered = [...apps];

    // Tab filtering
    if (activeTab === 'connected') {
      filtered = filtered.filter(app => app.connected);
    } else if (activeTab === 'disconnected') {
      filtered = filtered.filter(app => !app.connected);
    }

    // Search filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        (app.category && app.category.toLowerCase().includes(query))
      );
    }

    // Category filtering
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(app => app.category === categoryFilter);
    }

    // Status filtering
    if (statusFilter !== 'all') {
      if (statusFilter === 'connected') {
        filtered = filtered.filter(app => app.connected);
      } else if (statusFilter === 'disconnected') {
        filtered = filtered.filter(app => !app.connected);
      } else {
        filtered = filtered.filter(app => app.connectionStatus === statusFilter);
      }
    }

    setFilteredApps(filtered);
  };

  const handleConnect = (app: IntegrationApp) => {
    if (user?.id) {
      window.location.href = `${API_URL}/auth/connect/${app.id}?userId=${user.id}`;
    }
  };

  const handleDisconnect = (app: IntegrationApp) => {
    const token = localStorage.getItem('authToken');
    if (user?.id) {
      fetch(`${API_URL}/api/disconnect/${user.id}/${app.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          toast.success(`${app.name} disconnected successfully`);
          fetchConnections();
        } else {
          throw new Error('Failed to disconnect');
        }
      })
      .catch(error => {
        console.error('Error disconnecting app:', error);
        toast.error(`Failed to disconnect ${app.name}`);
      });
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
  };

  const getFilterCount = () => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (categoryFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    return count;
  };

  // Loading skeleton component
  const IntegrationCardSkeleton = () => (
    <Card className="flex flex-col animate-pulse">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <Skeleton className="h-12 w-full" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header with search and filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
            <p className="text-muted-foreground">Manage your connected apps and services</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search integrations by name, description, or category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-9" />
                {searchQuery && (
                  <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7" onClick={() => setSearchQuery('')}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            <Button variant="outline" size="icon" onClick={fetchConnections} disabled={isLoading} title="Refresh integrations">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs and content */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="connected">Connected</TabsTrigger>
            <TabsTrigger value="disconnected">Available</TabsTrigger>
          </TabsList>
          
          <div className="text-sm text-muted-foreground">
            Showing {filteredApps.length} of {apps.length} integrations
            {getFilterCount() > 0 && ` • ${getFilterCount()} filter${getFilterCount() > 1 ? 's' : ''} active`}
          </div>
        </div>
        
        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <IntegrationCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredApps.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No integrations found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : activeTab === 'connected' 
                      ? 'Connect an integration to get started'
                      : 'No integrations available'}
                </p>
                {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') && (
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear all filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Integration Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredApps.map((app) => (
                  <Card key={app.id || app.name} className="flex flex-col hover:shadow-lg transition-shadow duration-300 group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${app.connected ? 'bg-primary/10' : 'bg-muted'}`}>
                            <img 
                              src={app.icon} 
                              alt={app.name} 
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=6b7280&color=fff`;
                              }}
                            />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {app.name}
                              {app.connected && app.connectionStatus && (
                                <StatusIndicator status={app.connectionStatus} />
                              )}
                            </CardTitle>
                            {app.category && (
                              <Badge variant="secondary" className={`mt-2 ${categoryColors[app.category] || categoryColors.default}`}>{app.category}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <CardDescription className="text-sm leading-relaxed">
                        {app.description}
                      </CardDescription>
                      {app.connected && app.lastSynced && (
                        <div className="mt-4 text-xs text-muted-foreground">
                          <p>Last synced: {new Date(app.lastSynced).toLocaleDateString()}</p>
                        </div>
                      )}
                      {app.syncProgress !== undefined && (
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Syncing...</span>
                            <span>{app.syncProgress}%</span>
                          </div>
                          <Progress value={app.syncProgress} className="h-1" />
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      {app.connected ? (
                        <div className="flex gap-2 w-full">
                          <Button variant="destructive" className="flex-1" onClick={() => handleDisconnect(app)} disabled={syncingApp === app.id}>
                            Disconnect
                          </Button>
                        </div>
                      ) : (
                        <Button variant="default" className="w-full group-hover:bg-primary/90 transition-colors" onClick={() => handleConnect(app)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
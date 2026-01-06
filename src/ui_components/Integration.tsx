import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, CheckCircle, RefreshCw, AlertCircle, Search, X, Loader2, UserCircle, Grid, List, Plus, Star, Zap, TrendingUp, Globe, MoreVertical, Info } from "lucide-react"
import { getServices } from "./api/connectionlist"
import { useUser } from '@/context/UserContext';
import { API_URL } from './api/apiurl';
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { OpenRouterModel } from "./Utility/openroutermodel"

interface ConnectedAccount {
  id: string;
  externalId: string;
  username: string;
  avatarUrl: string;
  connectedAt: string;
}

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
  accounts?: ConnectedAccount[];
  service?: string;
  popularity?: number;
  featured?: boolean;
}

const categoryColors: Record<string, { bg: string, text: string, border: string }> = {
  'productivity': { 
    bg: 'bg-blue-500/10 dark:bg-blue-500/20', 
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800'
  },
  'cloud': { 
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', 
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800'
  },
  'storage': { 
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', 
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800'
  },
  'communication': { 
    bg: 'bg-purple-500/10 dark:bg-purple-500/20', 
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800'
  },
  'development': { 
    bg: 'bg-orange-500/10 dark:bg-orange-500/20', 
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800'
  },
  'tools': { 
    bg: 'bg-rose-500/10 dark:bg-rose-500/20', 
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800'
  },
  'marketing': { 
    bg: 'bg-amber-500/10 dark:bg-amber-500/20', 
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800'
  },
  'crm': { 
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', 
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800'
  },
  'social': { 
    bg: 'bg-sky-500/10 dark:bg-sky-500/20', 
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800'
  },
  'finance': { 
    bg: 'bg-green-500/10 dark:bg-green-500/20', 
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800'
  },
  'e-commerce': { 
    bg: 'bg-violet-500/10 dark:bg-violet-500/20', 
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800'
  },
  'ai': { 
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', 
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800'
  },
  'education': { 
    bg: 'bg-lime-500/10 dark:bg-lime-500/20', 
    text: 'text-lime-700 dark:text-lime-300',
    border: 'border-lime-200 dark:border-lime-800'
  },
  'security': { 
    bg: 'bg-slate-500/10 dark:bg-slate-500/20', 
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-800'
  },
  'default': { 
    bg: 'bg-gray-500/10 dark:bg-gray-500/20', 
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-800'
  }
};

const StatusIndicator = ({ status, size = "sm" }: { status: IntegrationApp['connectionStatus']; size?: "sm" | "md" }) => {
  const sizeClasses = size === "sm" ? "h-2 w-2" : "h-3 w-3";
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <div className={`
              ${status === 'healthy' ? 'bg-green-500 animate-pulse' : 
                status === 'warning' ? 'bg-yellow-500' : 
                status === 'error' ? 'bg-red-500' : 'bg-gray-500'} 
              ${sizeClasses} rounded-full ring-2 ring-background
            `} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {status === 'healthy' ? 'Connected' : 
             status === 'warning' ? 'Warning' : 
             status === 'error' ? 'Error' : 'Unknown'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const StatsCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <Card className="overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 group">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              <TrendingUp className={`h-3 w-3 ${trend > 0 ? '' : 'rotate-180'}`} />
              <span>{Math.abs(trend)}% this month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const IntegrationCardSkeleton = () => (
  <Card className="overflow-hidden animate-pulse">
    <CardHeader>
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-16 w-full" />
    </CardContent>
    <CardFooter>
      <Skeleton className="h-10 w-full" />
    </CardFooter>
  </Card>
);

const IntegrationGridCard = ({ app, onConnect, connectingApp }: { app: IntegrationApp, onConnect: (app: IntegrationApp) => void, connectingApp: string | null }) => {
  const colors = categoryColors[app.category || 'default'] || categoryColors.default;
  
  return (
    <Card className="group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden border border-border/50 hover:border-primary/30 relative bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              ${app.connected ? 'ring-2 ring-primary/20' : 'ring-1 ring-border'} 
              p-3 rounded-xl ${colors.bg}
              group-hover:scale-105 transition-transform
            `}>
              <img 
                src={app.icon} 
                alt={app.name} 
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=6b7280&color=fff`;
                }}
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold">{app.name}</CardTitle>
                {app.connected && (
                  <StatusIndicator status={app.connectionStatus} />
                )}
              </div>
              <Badge 
                variant="outline" 
                className={`${colors.bg} ${colors.text} ${colors.border} border font-medium capitalize`}
              >
                {app.category}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <CardDescription className="text-sm leading-relaxed line-clamp-2">
          {app.description}
        </CardDescription>

        {app.connected && app.accounts && app.accounts.length > 0 && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Connected Accounts</span>
              <Badge variant="secondary">{app.accounts.length}</Badge>
            </div>
            <div className="flex -space-x-2">
              {app.accounts.slice(0, 3).map((account, index) => (
                <TooltipProvider key={account.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden">
                          {account.avatarUrl ? (
                            <img 
                              src={account.avatarUrl} 
                              alt={account.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserCircle className="w-full h-full text-muted-foreground" />
                          )}
                        </div>
                        {index === 2 && app.accounts && app.accounts.length > 3 && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white">+{app.accounts.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{account.username}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}

        {app.lastSynced && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            <span>Synced {new Date(app.lastSynced).toLocaleDateString()}</span>
          </div>
        )}

        {app.syncProgress !== undefined && (
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span>Syncing...</span>
              <span>{app.syncProgress}%</span>
            </div>
            <Progress value={app.syncProgress} className="h-1.5" />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t pt-4">
        <div className="flex flex-col gap-2 w-full">
          {app.connected && (
            <Button 
              variant="outline" 
              className="w-full group-hover:bg-primary/5 transition-colors font-medium"
              asChild
            >
              <Link to={`/connections?search=${encodeURIComponent(app.name)}`}>
                <UserCircle className="h-4 w-4 mr-2" />
                Manage Accounts
              </Link>
            </Button>
          )}
          
          <Button 
          variant={app.connected ? "outline" : "default"}
          className={`
            w-full font-semibold transition-all duration-300 relative overflow-hidden
            ${app.connected ? 'border-dashed hover:border-primary hover:bg-primary/5 hover:text-primary' 
             : 'bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-primary/20 hover:scale-[1.02]'}
          `}
          onClick={() => onConnect(app)}
          disabled={connectingApp === app.id}
        >
            {connectingApp === app.id ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                {app.connected ? <Plus className="h-4 w-4 mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
                {app.connected ? "Add Account" : "Connect"}
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const IntegrationListItem = ({ app, onConnect, connectingApp }: { app: IntegrationApp, onConnect: (app: IntegrationApp) => void, connectingApp: string | null }) => {
  const colors = categoryColors[app.category || 'default'] || categoryColors.default;

  return (
    <Card className="group hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`
            p-3 rounded-xl ${colors.bg}
            ${app.connected ? 'ring-2 ring-primary/20' : ''}
          `}>
            <img 
              src={app.icon} 
              alt={app.name} 
              className="w-8 h-8 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=6b7280&color=fff`;
              }}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-lg truncate">{app.name}</h3>
              {app.featured && (
                <Star className="h-3 w-3 text-amber-500 fill-current" />
              )}
              {app.connected && (
                <StatusIndicator status={app.connectionStatus} size="md" />
              )}
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <Badge 
                variant="outline" 
                className={`${colors.bg} ${colors.text} ${colors.border} border font-medium capitalize`}
              >
                {app.category}
              </Badge>
              {app.connected && app.accounts && (
                <Badge variant="secondary">
                  {app.accounts.length} account{app.accounts.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {app.popularity && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  <span>{app.popularity}% popular</span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-1">
              {app.description}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant={app.connected ? "outline" : "default"}
              size="sm"
              onClick={() => onConnect(app)}
              disabled={connectingApp === app.id}
              className="min-w-[120px]"
            >
              {connectingApp === app.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : app.connected ? (
                "Add Account"
              ) : (
                "Connect"
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              asChild
            >
              <Link to={`/connections?search=${encodeURIComponent(app.name)}`}>
                <UserCircle className="h-4 w-4" />
              </Link>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Info className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface IntegrationProps {
  defaultTab?: string;
}

export default function Integration({ defaultTab = 'all' }: IntegrationProps) {
  const { user } = useUser();
  const [apps, setApps] = useState<IntegrationApp[]>([]);
  const [filteredApps, setFilteredApps] = useState<IntegrationApp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [connectingApp, setConnectingApp] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'popular' | 'name' | 'recent'>('popular');
  const [openroutermodel, setOpenroutermodel] = useState(false)

  useEffect(() => {
    fetchConnections();
  }, [user?.id]);

  useEffect(() => {
    filterAndSortApps();
  }, [apps, activeTab, searchQuery, categoryFilter, statusFilter, sortBy]);

  const fetchConnections = () => {
    if (user?.id) {
      setIsLoading(true);
      getServices(user.id)
        .then((data: any) => {
          const services = data.data || [];
          const enhancedList = services.map((service: any) => ({
            ...service,
            category: service.category || 'default',
            lastSynced: service.accounts?.length > 0 ? new Date().toISOString() : undefined,
            connectionStatus: service.accounts?.length > 0 ? 'healthy' : undefined,
            connected: service.accounts && service.accounts.length > 0,
            popularity: Math.floor(Math.random() * 100) + 1,
            featured: Math.random() > 0.7,
          }));
          setApps(enhancedList);
        })
        .catch(async (err) => {
          console.warn("New API failed:", err);
          try {
            const { getConnections } = await import("./api/connectionlist");
            const data = await getConnections(user.id);
            const list = data.data || [];
            
            const transformedList = list.map((app: any) => ({
              ...app,
              category: app.category || 'default',
              lastSynced: app.connected ? new Date().toISOString() : undefined,
              connectionStatus: app.connected ? 'healthy' : undefined,
              accounts: app.connected ? [{
                id: app.id,
                externalId: app.externalId || '',
                username: app.externalUsername || app.name,
                avatarUrl: app.externalAvatar || '',
                connectedAt: new Date().toISOString(),
              }] : [],
              popularity: Math.floor(Math.random() * 100) + 1,
              featured: Math.random() > 0.7,
            }));
            setApps(transformedList);
          } catch (fallbackErr) {
            console.error("Failed to fetch connections", fallbackErr);
            toast.error("Failed to load integrations");
          }
        })
        .finally(() => setIsLoading(false));
    }
  };

  const filterAndSortApps = () => {
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

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.popularity || 0) - (a.popularity || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.lastSynced || 0).getTime() - new Date(a.lastSynced || 0).getTime();
        default:
          return 0;
      }
    });

    setFilteredApps(filtered);
  };

  const handleConnect = (app: IntegrationApp) => {
    setConnectingApp(app.id);
    const returnPath = window.location.pathname; 
    if (app.id === 'github') {
      window.location.href = `${API_URL}/auth/connect/github?userId=${user?.id}&callbackUrl=${returnPath}`;
    } 
    else if (app.id === 'openrouter') {
      handleOpenRouterModel()
    }
    else {
      window.location.href = `${API_URL}/auth/connect/${app.id}?userId=${user?.id}&callbackUrl=${returnPath}`;
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

  const uniqueCategories = useMemo(() => {
    const categories = new Set(apps.map(app => app.category).filter(Boolean));
    return Array.from(categories);
  }, [apps]);

  const handleOpenRouterModel = () => {
    setOpenroutermodel(true);
  }

  const handleOpenRouterChange = (open: boolean) => {
    setOpenroutermodel(open);
    if (!open) {
        setConnectingApp(null);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-linear-to-br from-primary/20 to-primary/10">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Integrations Marketplace
                </h1>
                <p className="text-muted-foreground">
                  Connect and manage your favorite apps and services
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={fetchConnections} 
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="gap-2 shadow-lg">
              <Plus className="h-4 w-4" />
              Request Integration
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Total Integrations" 
            value={apps.length} 
            icon={Globe}
            trend={12}
            color="bg-blue-500/10 text-blue-600"
          />
          <StatsCard 
            title="Connected" 
            value={apps.filter(a => a.connected).length} 
            icon={CheckCircle}
            trend={8}
            color="bg-green-500/10 text-green-600"
          />
          <StatsCard 
            title="Active Accounts" 
            value={apps.reduce((acc, app) => acc + (app.accounts?.length || 0), 0)} 
            icon={UserCircle}
            trend={15}
            color="bg-purple-500/10 text-purple-600"
          />
          <StatsCard 
            title="Synced Today" 
            value={apps.filter(a => a.lastSynced && new Date(a.lastSynced).toDateString() === new Date().toDateString()).length} 
            icon={RefreshCw}
            trend={-3}
            color="bg-amber-500/10 text-amber-600"
          />
        </div>
      </div>

      {/* Controls Bar */}
      <Card className="border-none shadow-sm bg-background/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="h-10">
                  <TabsTrigger value="all" className="px-4">All</TabsTrigger>
                  <TabsTrigger value="connected" className="px-4">Connected</TabsTrigger>
                  <TabsTrigger value="disconnected" className="px-4">Available</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search integrations..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 w-full lg:w-64"
                />
                {searchQuery && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((category: any) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: 'popular' | 'name' | 'recent') => setSortBy(value)}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              
              {getFilterCount() > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9"
                >
                  Clear filters
                  <X className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {activeTab === 'connected' ? 'Connected Services' : 
             activeTab === 'disconnected' ? 'Available Services' : 'All Services'}
            <span className="text-muted-foreground font-normal ml-2">({filteredApps.length})</span>
          </h3>
          
          <div className="text-sm text-muted-foreground">
            {searchQuery && `Search results for "${searchQuery}"`}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <IntegrationCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center py-12 rounded-lg border-2 border-dashed border-border/50 bg-muted/20">
            <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No matching integrations</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              Try adjusting your search terms or filters to find what you're looking for.
            </p>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear all filters
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {filteredApps.map((app) => (
              <IntegrationGridCard 
                key={app.id || app.name} 
                app={app} 
                onConnect={handleConnect}
                connectingApp={connectingApp}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApps.map((app) => (
              <IntegrationListItem 
                key={app.id || app.name} 
                app={app} 
                onConnect={handleConnect}
                connectingApp={connectingApp}
              />
            ))}
          </div>
        )}
      </div>
      <OpenRouterModel 
        open={openroutermodel} 
        onOpenChange={handleOpenRouterChange}
        onSuccess={fetchConnections}
      />
    </div>
  );
}

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Search, X, Grid, List, Globe, CheckCircle, UserCircle } from "lucide-react"
import { getServices } from "../api/connectionlist"
import { useUser } from '@/context/UserContext';
import { API_URL } from '../api/apiurl';
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OpenRouterModel } from "../Utility/openroutermodel"
import { Skeleton } from "@/components/ui/skeleton"

import type { IntegrationApp } from './types';
import { StatsCard } from './StatsCard';
import { IntegrationGridCard } from './IntegrationGridCard';
import { IntegrationListItem } from './IntegrationListItem';

interface IntegrationProps {
  defaultTab?: string;
}

export default function Connectors({ defaultTab = 'all' }: IntegrationProps) {
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
            const { getConnections } = await import("../api/connectionlist");
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

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
               Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden animate-pulse">
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
                  </Card>
               ))
            ) : filteredApps.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed hover:bg-muted/30 transition-colors">
                  <div className="bg-muted p-4 rounded-full w-fit mx-auto mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No integrations found</h3>
                  <p className="max-w-sm mx-auto mt-2">
                    Try different keywords or clear your filters to see more results
                  </p>
                  <Button variant="outline" className="mt-4" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </div>
            ) : (
                filteredApps.map((app) => (
                    <IntegrationGridCard 
                        key={app.id} 
                        app={app} 
                        onConnect={handleConnect} 
                        connectingApp={connectingApp} 
                    />
                ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
             {isLoading ? (
               Array.from({ length: 5 }).map((_, i) => (
                   <div key={i} className="h-24 w-full rounded-xl border bg-card animate-pulse" />
               ))
             ) : filteredApps.length === 0 ? (
                 <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                   No integrations found
                 </div>
             ) : (
                 filteredApps.map((app) => (
                    <IntegrationListItem
                        key={app.id} 
                        app={app} 
                        onConnect={handleConnect} 
                        connectingApp={connectingApp} 
                    />
                 ))
             )}
          </div>
        )}
      </div>

      <OpenRouterModel open={openroutermodel} onOpenChange={handleOpenRouterChange} />
    </div>
  );
}

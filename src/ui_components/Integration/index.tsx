import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Search, X, Grid, List, Globe, CheckCircle, UserCircle, Sparkles } from "lucide-react"
import { getServices } from "../api/connectionlist"
import { useUser } from '@/context/UserContext';
import { API_URL } from '../api/apiurl';
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OpenRouterModel } from "../Utility/openroutermodel"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"

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
    <div className="min-h-full bg-linear-to-br from-slate-50 via-violet-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white overflow-y-scroll relative">
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-size-[50px_50px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 container mx-auto p-8 w-full space-y-8 flex flex-col h-full min-h-screen">
        {/* Header Section */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full" />
                <div className="relative p-3 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl shadow-violet-500/10">
                  <Globe className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                  Integrations Marketplace
                  <div className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-[10px] font-bold uppercase tracking-widest border border-violet-200 dark:border-violet-500/30">
                    Discover
                  </div>
                </h2>
                <p className="text-slate-500 dark:text-violet-200/70 text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                  Connect and manage your favorite apps and services to power your workflows
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchConnections} 
              disabled={isLoading}
              className="gap-2 h-11 px-5 rounded-xl border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300"
            >
              <RefreshCw className={`h-4 w-4 text-violet-600 dark:text-violet-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="font-semibold">Refresh</span>
            </Button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0"
        >
          <StatsCard 
            title="Total Integrations" 
            value={apps.length} 
            icon={Globe}
            trend={12}
            color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <StatsCard 
            title="Connected" 
            value={apps.filter(a => a.connected).length} 
            icon={CheckCircle}
            trend={8}
            color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <StatsCard 
            title="Active Accounts" 
            value={apps.reduce((acc, app) => acc + (app.accounts?.length || 0), 0)} 
            icon={UserCircle}
            trend={15}
            color="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          />
          <StatsCard 
            title="Synced Today" 
            value={apps.filter(a => a.lastSynced && new Date(a.lastSynced).toDateString() === new Date().toDateString()).length} 
            icon={RefreshCw}
            trend={-3}
            color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
        </motion.div>

        {/* Controls Bar */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.1 }} 
          className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between p-4 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-sm shrink-0"
        >
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="h-10 bg-slate-200/50 dark:bg-white/5 rounded-xl p-1 gap-1">
                <TabsTrigger value="all" className="px-5 rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">All</TabsTrigger>
                <TabsTrigger value="connected" className="px-5 rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Connected</TabsTrigger>
                <TabsTrigger value="disconnected" className="px-5 rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">Available</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none" />
              <Input 
                placeholder="Search integrations..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 w-full lg:w-64 bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 rounded-xl focus:ring-violet-500 focus:border-violet-500"
              />
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-slate-100 dark:hover:bg-white/5"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-10 w-[140px] rounded-xl bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-widest">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-white/10">
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map((category: any) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: 'popular' | 'name' | 'recent') => setSortBy(value)}>
              <SelectTrigger className="h-10 w-[140px] rounded-xl bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-widest">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-white/10">
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="recent">Recently Added</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-1 border border-slate-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-slate-900/50 p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className={`h-8 w-8 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-md' : 'text-slate-500'}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className={`h-8 w-8 rounded-lg transition-all ${viewMode === 'list' ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-md' : 'text-slate-500'}`}
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
                className="h-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg px-3 transition-all font-bold text-xs uppercase tracking-widest"
              >
                Clear filters
                <X className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* Results Section */}
        <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-none space-y-6">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {activeTab === 'connected' ? 'Connected Services' : 
                activeTab === 'disconnected' ? 'Available Services' : 'All Services'}
              </h3>
              <div className="px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 text-xs font-black border border-violet-200 dark:border-violet-500/20">
                {filteredApps.length}
              </div>
            </div>
            
            {searchQuery && (
              <div className="text-sm font-medium text-slate-500 dark:text-violet-200/70">
                Search results for <span className="text-violet-600 dark:text-violet-400 font-bold italic">"{searchQuery}"</span>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={`${activeTab}-${viewMode}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                  {isLoading ? (
                    Array.from({ length: 9 }).map((_, i) => (
                      <Card key={i} className="overflow-hidden bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 p-6 space-y-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-16 w-16 rounded-2xl bg-slate-200 dark:bg-white/10" />
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-32 bg-slate-200 dark:bg-white/10" />
                            <Skeleton className="h-4 w-24 bg-slate-200 dark:bg-white/10" />
                          </div>
                        </div>
                        <Skeleton className="h-16 w-full bg-slate-200 dark:bg-white/10 rounded-xl" />
                        <Skeleton className="h-10 w-full bg-slate-200 dark:bg-white/10 rounded-xl" />
                      </Card>
                    ))
                  ) : filteredApps.length === 0 ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="col-span-full py-20 text-center px-4"
                    >
                      <div className="relative w-28 h-28 mx-auto mb-8">
                        <div className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full" />
                        <div className="relative w-full h-full rounded-[2rem] bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/10 flex items-center justify-center shadow-2xl">
                          <Search className="h-12 w-12 text-violet-500/60" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No integrations found</h3>
                      <p className="max-w-md mx-auto text-slate-500 dark:text-violet-200/70 font-medium mb-8">
                        Try different keywords or clear your filters to see more results
                      </p>
                      <Button variant="outline" className="h-12 px-8 rounded-xl border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 font-bold hover:bg-slate-50 transition-all font-bold" onClick={handleClearFilters}>
                        Clear Filters
                      </Button>
                    </motion.div>
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
                <div className="grid grid-cols-1 gap-4 pb-12">
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <Card key={i} className="h-28 w-full bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 p-6 flex gap-6 items-center">
                        <Skeleton className="h-16 w-16 rounded-2xl bg-slate-200 dark:bg-white/10" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-48 bg-slate-200 dark:bg-white/10" />
                          <Skeleton className="h-4 w-96 bg-slate-200 dark:bg-white/10" />
                        </div>
                        <Skeleton className="h-10 w-32 bg-slate-200 dark:bg-white/10 rounded-xl" />
                      </Card>
                    ))
                  ) : filteredApps.length === 0 ? (
                    <div className="py-20 text-center text-slate-500 dark:text-violet-200/70 font-medium bg-white/40 dark:bg-white/5 rounded-2xl border border-dashed border-slate-300 dark:border-white/10">
                      No integrations found matching your criteria.
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
            </motion.div>
          </AnimatePresence>
        </div>

        <OpenRouterModel open={openroutermodel} onOpenChange={handleOpenRouterChange} />
      </div>
    </div>
  );
}

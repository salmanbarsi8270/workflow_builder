import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, RefreshCw, Search, X, Loader2, Shield, UserCircle, ExternalLink, Calendar, Filter, Sparkles, Zap, Globe, Plus, LayoutGrid, List } from "lucide-react"
import { getServices, deleteConnection } from "../api/connectionlist"
import { CustomPagination } from "../Shared/CustomPagination"
import { useUser } from '@/context/UserContext';
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

interface ConnectedAccount {
  id: string;
  externalId: string;
  username: string;
  avatarUrl: string;
  connectedAt: string;
  serviceId: string;
  serviceName: string;
  serviceIcon: string;
  status?: 'active' | 'expired' | 'warning';
  lastUsed?: string;
  permissions?: string[];
  isPublic?: boolean;
  category?: string;
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
    bg: 'bg-blue-500/10 dark:bg-blue-500/20', 
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800'
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

type SortType = 'date' | 'name' | 'service';

export default function Connections() {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Get unique services for filter
  const services = Array.from(new Set(accounts.map(acc => acc.serviceName)));

  // Initialize search from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [location.search]);

  useEffect(() => {
    fetchAccounts();
  }, [user?.id]);

  useEffect(() => {
    filterAndSortAccounts();
    setCurrentPage(1); // Reset to first page on filter change
  }, [accounts, searchQuery, sortBy, selectedService]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAccounts = filteredAccounts.slice(startIndex, startIndex + itemsPerPage);

  const fetchAccounts = () => {
    if (user?.id) {
      setIsLoading(true);
      getServices(user.id)
        .then((data: any) => {
          const services = data.data || [];
          const allAccounts: ConnectedAccount[] = [];
          
          services.forEach((service: any) => {
            if (service.accounts && Array.isArray(service.accounts)) {
              service.accounts.forEach((acc: any) => {
                // Add mock status for demo
                const statuses: Array<'active' | 'expired' | 'warning'> = ['active', 'expired', 'warning'];
                const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
                
                allAccounts.push({
                  ...acc,
                  serviceId: service.id,
                  serviceName: service.name,
                  serviceIcon: service.icon,
                  status: randomStatus,
                  lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                  permissions: ['read', 'write', 'admin'].slice(0, Math.floor(Math.random() * 3) + 1),
                  isPublic: Math.random() > 0.5,
                  category: service.category || 'default'
                });
              });
            }
          });
          
          setAccounts(allAccounts);
        })
        .catch(err => {
          console.error("Failed to fetch services", err);
          toast.error("Failed to load connections");
        })
        .finally(() => setIsLoading(false));
    }
  };

  const filterAndSortAccounts = () => {
    let filtered = [...accounts];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(acc => 
        acc.username.toLowerCase().includes(query) ||
        acc.serviceName.toLowerCase().includes(query) ||
        acc.externalId.toLowerCase().includes(query)
      );
    }
    
    // Apply service filter
    if (selectedService !== 'all') {
      filtered = filtered.filter(acc => acc.serviceName === selectedService);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.username.localeCompare(b.username);
        case 'service':
          return a.serviceName.localeCompare(b.serviceName);
        case 'date':
        default:
          return new Date(b.connectedAt).getTime() - new Date(a.connectedAt).getTime();
      }
    });
    
    setFilteredAccounts(filtered);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Disconnect ${name}? This will remove it from all your active workflows.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await deleteConnection(id);
      if (res.success) {
        toast.success(`Connection removed successfully`);
        fetchAccounts();
      } else {
        toast.error(res.error || "Failed to disconnect");
      }
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("An error occurred during disconnection");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-full bg-linear-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white overflow-y-scroll relative">
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(59,130,246,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.03)_1px,transparent_1px)] bg-size-[50px_50px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 container mx-auto p-8 w-full space-y-8 flex flex-col h-full">
        {/* Header Section */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                <div className="relative p-3 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl shadow-blue-500/10">
                  <Globe className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                  Connected Accounts
                  <div className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-200 dark:border-blue-500/30">
                    Secure
                  </div>
                </h2>
                <p className="text-slate-500 dark:text-blue-200/70 text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  Manage your individual credentials and platform integrations
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" size="sm" onClick={fetchAccounts} disabled={isLoading} className="gap-2 h-11 px-5 rounded-xl border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300">
              <RefreshCw className={`h-4 w-4 text-blue-600 dark:text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="font-semibold">Refresh</span>
            </Button>
            <Button size="sm" onClick={() => navigate('/connectors')} className="gap-2 h-11 px-6 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]">
              <Plus className="h-4 w-4" />
              Add Connector
            </Button>
          </div>
        </motion.div>

        {/* Controls Bar */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.1 }} 
          className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between p-4 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-sm shrink-0"
        >
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-80">
                <Input 
                  placeholder="Search accounts, services, or IDs..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none" />
              {searchQuery && (
                <Button variant="ghost" size="icon" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-slate-100 dark:hover:bg-white/5" onClick={() => setSearchQuery('')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="h-11 w-full sm:w-52 rounded-xl bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-blue-500" />
                  <SelectValue placeholder="Filter by service" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-white/10">
                <SelectItem value="all">All Services</SelectItem>
                {services.map(service => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(v: string) => setSortBy(v as SortType)}>
              <SelectTrigger className="h-11 w-full sm:w-44 rounded-xl bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-white/10">
                <SelectItem value="date">Date Added</SelectItem>
                <SelectItem value="name">Account Name</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-500/20">
              <Shield className="h-3.5 w-3.5" />
              {accounts.length} Total Accounts
            </div>

            <div className="flex items-center border border-slate-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-slate-900/50 p-1 gap-1">
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className={`h-9 w-9 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md' : 'text-slate-500'}`} onClick={() => setViewMode('grid')}>
                <LayoutGrid className="h-4.5 w-4.5" />
              </Button>
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className={`h-9 w-9 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md' : 'text-slate-500'}`} onClick={() => setViewMode('list')}>
                <List className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Scrollable Content Area */}
        <div className="flex-1 pr-2 -mr-2 scrollbar-none space-y-6">
          <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="overflow-hidden bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-2xl bg-slate-200 dark:bg-white/10" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-40 bg-slate-200 dark:bg-white/10" />
                        <Skeleton className="h-4 w-72 bg-slate-200 dark:bg-white/10" />
                      </div>
                      <Skeleton className="h-10 w-24 rounded-xl bg-slate-200 dark:bg-white/10" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          ) : filteredAccounts.length === 0 ? (
            <motion.div key="empty" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                <div className="relative w-28 h-28 rounded-[2rem] bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/10 flex items-center justify-center shadow-2xl">
                  <Shield className="h-14 w-14 text-blue-500/60" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No connections found</h3>
              <p className="text-slate-500 dark:text-blue-200/70 max-w-md mb-8 font-medium">
                {searchQuery ? "We couldn't find any accounts matching your search. Try broadening your criteria." : "Connect your first platform to unlock the full power of automated workflows."}
              </p>
              <div className="flex gap-4">
                <Button variant="outline" className="h-12 px-6 rounded-xl border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 font-semibold" onClick={() => setSearchQuery('')}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Search
                </Button>
                <Button className="h-12 px-8 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/25 transition-all">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Explore Hub
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key={viewMode} layout className={viewMode === 'list' ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
              {paginatedAccounts.map((account) => (
                <motion.div key={account.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                  <Card className="relative bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-xl dark:shadow-2xl group-hover:border-blue-500/30 transition-all duration-300 h-full flex flex-col justify-between overflow-hidden">
                    <CardContent className="p-6 h-full flex flex-col">
                      <div className={`flex ${viewMode === 'list' ? 'items-center gap-6' : 'flex-col gap-5'} flex-1`}>

                        {/* Service Icon */}
                        <div className="relative shrink-0">
                          <div className="absolute inset-0 bg-blue-500/10 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="h-16 w-16 rounded-2xl bg-white/80 dark:bg-white/10 border border-slate-100 dark:border-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                            <img src={account.serviceIcon} alt={account.serviceName} className="w-9 h-9 object-contain" 
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(account.serviceName)}&background=3b82f6&color=fff`;
                              }}
                            />
                          </div>
                          {/* Status Dot */}
                          <div className={`absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 shadow-sm ${
                            account.status === 'active' ? 'bg-emerald-500' : 
                            account.status === 'expired' ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />
                        </div>

                        {/* Account Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <h4 className="font-bold text-lg truncate text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{account.username}</h4>
                            </div>
                            <Badge variant="outline" className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border-opacity-50 ${(categoryColors[account.category || 'default'] || categoryColors.default).bg} ${(categoryColors[account.category || 'default'] || categoryColors.default).text} ${(categoryColors[account.category || 'default'] || categoryColors.default).border}`}>
                              {account.serviceName}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2.5">
                            <div className="flex items-center max-w-[40%] gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium bg-slate-50/50 dark:bg-white/5 p-1.5 rounded-lg border border-slate-100/50 dark:border-white/5">
                              <UserCircle className="h-4 w-4 text-blue-500/70" />
                              <span className="truncate">{account.externalId}</span>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-3 pt-1">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Connected</span>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                                  <Calendar className="h-3 w-3 text-blue-500" />
                                  {new Date(account.connectedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Last Activity</span>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                                  <Zap className="h-3 w-3 text-amber-500" />
                                  {new Date(account.lastUsed || account.connectedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className={`flex items-center ${viewMode === 'grid' ? 'mt-6 pt-4 border-t border-slate-100 dark:border-white/10 w-full justify-between' : 'shrink-0'}`}>
                          {viewMode === 'grid' && (
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {account.permissions?.slice(0, 3).map((p, i) => (
                                <div key={i} className="h-6 w-6 rounded-full bg-slate-100 dark:bg-white/10 border-2 border-white dark:border-slate-900 flex items-center justify-center" title={p}>
                                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <Button variant="ghost" className="h-10 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl px-4 transition-all" onClick={() => handleDelete(account.id, account.username)} disabled={deletingId === account.id}>
                            {deletingId === account.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
                                <Trash2 className="h-4 w-4" />
                                <span>Disconnect</span>
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Pagination Footer */}
        <CustomPagination 
          currentPage={currentPage}
          totalItems={filteredAccounts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw, Search, X, Shield, Filter, Plus, LayoutGrid, List, ArrowUpDown, ExternalLink } from "lucide-react"
import { getServices, deleteConnection } from "../api/connectionlist"
import { CustomPagination } from "../Shared/CustomPagination"
import { useUser } from '@/context/UserContext';
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import type { ConnectedAccount } from './types';
import { ConnectionGridCard } from './components/ConnectionGridCard';
import { ConnectionListCard } from './components/ConnectionListCard';
import { ConnectionCardSkeleton } from './components/ConnectionCardSkeleton';
import { useTheme } from "@/components/theme-provider";

type SortType = 'date' | 'name' | 'service';

export default function Connections() {
  const { user } = useUser();
  const { accentColor } = useTheme();
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

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
    setCurrentPage(1);
  }, [accounts, searchQuery, sortBy, selectedService]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAccounts = filteredAccounts.slice(startIndex, startIndex + itemsPerPage);

  const fetchAccounts = () => {
    if (user?.id) {
      setIsLoading(true);
      getServices(user.id)
        .then((data: any) => {
          const servicesList = data.data || [];
          const allAccounts: ConnectedAccount[] = [];
          
          servicesList.forEach((service: any) => {
            if (service.accounts && Array.isArray(service.accounts)) {
              service.accounts.forEach((acc: any) => {
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
                  category: service.category || 'default',
                  usage: acc.usage || []
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
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(acc => 
        acc.username.toLowerCase().includes(query) ||
        acc.serviceName.toLowerCase().includes(query) ||
        acc.externalId.toLowerCase().includes(query)
      );
    }
    
    if (selectedService !== 'all') {
      filtered = filtered.filter(acc => acc.serviceName === selectedService);
    }
    
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
    <div className="min-h-full bg-transparent text-slate-900 dark:text-white overflow-y-auto relative animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,.015)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-size-[50px_50px] mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)] pointer-events-none" />

      <div className="relative w-full max-w-[90%] mx-auto z-10 p-8 h-full flex flex-col gap-8">
        <div className="mb-4 animate-in fade-in slide-in-from-top duration-500">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
            <div className="flex-1">
              <div className="mb-6">
                <div className="items-center gap-4 mb-3">
                  <h1 className="text-[36px] font-bold text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                    Connections
                  </h1>
                  <div
                    className="h-1.5 w-12 rounded-full shadow-[0_4px_12px_rgba(249,115,22,0.3)]"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
              </div>
              <p className="text-slate-500 dark:text-white/40 text-[14px] max-w-[750px] leading-relaxed font-medium">
                Manage your individual credentials and platform integrations. Securely connect and maintain different account identities to use within your automated workflows.
              </p>
            </div>
          
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={fetchAccounts} disabled={isLoading} className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300 disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 text-blue-600 dark:text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="font-semibold">Refresh</span>
              </button>
              <button onClick={() => navigate('/connectors')} className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02]">
                <Plus className="h-4 w-4" />
                Add Connector
              </button>
            </div>
          </div>
        </div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between p-4 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-sm shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-80">
                <Input placeholder="Search accounts, services, or IDs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-white/10 rounded-xl focus:ring-blue-500 focus:border-blue-500" />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
              {searchQuery && (
                <button className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg" onClick={() => setSearchQuery('')}>
                  <X className="h-4 w-4" />
                </button>
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
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-blue-500" />
                  <SelectValue placeholder="Sort by" />
                </div>
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
              <button className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`} onClick={() => setViewMode('grid')}>
                <LayoutGrid className="h-4.5 w-4.5" />
              </button>
              <button className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`} onClick={() => setViewMode('list')}>
                <List className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="flex-1 pr-2 -mr-2 scrollbar-none space-y-6">
          <AnimatePresence mode="wait">
          {isLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <ConnectionCardSkeleton key={i} viewMode={viewMode} />
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
                <button className="h-12 px-6 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 font-semibold inline-flex items-center justify-center" onClick={() => setSearchQuery('')}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Search
                </button>
                <button className="h-12 px-8 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-500/25 transition-all inline-flex items-center justify-center">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Explore Hub
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key={viewMode} layout className={viewMode === 'list' ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"}>
              {paginatedAccounts.map((account) => (
                viewMode === 'list' ? (
                  <ConnectionListCard 
                    key={account.id} 
                    account={account} 
                    onDelete={handleDelete} 
                    isDeleting={deletingId === account.id} 
                  />
                ) : (
                  <ConnectionGridCard 
                    key={account.id} 
                    account={account} 
                    onDelete={handleDelete} 
                    isDeleting={deletingId === account.id} 
                  />
                )
              ))}
            </motion.div>
          )}
          </AnimatePresence>
        </div>

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

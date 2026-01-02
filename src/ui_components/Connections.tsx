import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, RefreshCw, Search, X, Loader2, Shield, UserCircle, ExternalLink, Calendar, ChevronRight, ChevronLeft, Filter, Sparkles, Zap, ChevronLast, ChevronFirst, Globe, Plus, LayoutGrid, List } from "lucide-react"
import { getServices, deleteConnection } from "./api/connectionlist"
import { useUser } from '@/context/UserContext';
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    setCurrentPage(1); // Reset to first page on filter change
  }, [accounts, searchQuery, sortBy, selectedService]);

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
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
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pr-4 -mr-4 custom-scrollbar space-y-6">
      {/* Header Section */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-linear-to-br from-primary/10 to-primary/5 border border-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Connected Accounts
              </h2>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Manage all individual credentials used in your workflows
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" size="sm" onClick={fetchAccounts} disabled={isLoading} className="gap-2 h-10 px-4">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/integration')} className="gap-2 h-10 px-4 bg-linear-to-r from-primary to-primary/80">
            <Plus className="h-4 w-4" />
            Add Account
          </Button>
        </div>
      </motion.div>

      {/* Controls Bar */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Input 
                placeholder="Search accounts, services, or IDs..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-background/50 backdrop-blur-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            {searchQuery && (
              <Button variant="ghost"  size="icon"  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchQuery('')}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="h-10 w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map(service => (
                <SelectItem key={service} value={service}>{service}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(v: string) => setSortBy(v as SortType)}>
            <SelectTrigger className="h-10 w-full sm:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date Added</SelectItem>
              <SelectItem value="name">Account Name</SelectItem>
              <SelectItem value="service">Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium">
              <Shield className="h-3 w-3" />
              {accounts.length} Total Accounts
            </div>
          </div>

          <div className="flex items-center border rounded-lg bg-background/50 backdrop-blur-sm p-1 gap-1">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

        <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="overflow-hidden border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-9 w-9 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        ) : filteredAccounts.length === 0 ? (
          <motion.div key="empty" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-linear-to-r from-primary/20 to-primary/10 blur-2xl rounded-full" />
              <div className="relative w-24 h-24 rounded-3xl bg-linear-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center">
                <Shield className="h-12 w-12 text-primary/60" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">No connections found</h3>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
              {searchQuery ? "No accounts match your search criteria. Try adjusting your filters." : "Get started by connecting your first account to enable workflows and automations."}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2" onClick={() => setSearchQuery('')}>
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
              <Button className="gap-2 bg-linear-to-r from-primary to-primary/80">
                <ExternalLink className="h-4 w-4" />
                Browse Integrations
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key={viewMode} layout className={viewMode === 'list' ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
            {paginatedAccounts.map((account) => (
              <motion.div key={account.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                <Card className="overflow-hidden border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 group h-full">
                  <CardContent className="p-4 h-full">
                    <div className={`flex ${viewMode === 'list' ? 'items-center gap-4' : 'flex-col gap-4'}`}>

                      {/* Service Icon */}
                      {viewMode === 'list' && (<div className="relative shrink-0">
                        <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <img src={account.serviceIcon} alt={account.serviceName} className="w-7 h-7 object-contain" 
                          onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(account.serviceName)}&background=6b7280&color=fff`;
                            }}
                          />
                        </div>
                      </div>)}

                      {/* Account Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          {viewMode === 'grid' && (
                            <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <img src={account.serviceIcon} alt={account.serviceName} className="w-7 h-7 object-contain" 
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(account.serviceName)}&background=6b7280&color=fff`;
                                  }}
                              />
                            </div>
                          )}
                          <h4 className="font-semibold text-base truncate">{account.username}</h4>
                          <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${(categoryColors[account.category || 'default'] || categoryColors.default).bg} ${(categoryColors[account.category || 'default'] || categoryColors.default).text} ${(categoryColors[account.category || 'default'] || categoryColors.default).border}`}>
                            {account.serviceName}
                          </span>
                        </div>
                        
                        <div className={`flex mt-4 flex-wrap ${viewMode === 'list' ? 'items-center gap-x-4' : 'flex-col items-start gap-y-2'} gap-y-1 text-sm text-muted-foreground`}>
                          <div className='flex gap-x-4'>
                            <div className="flex items-center gap-1.5">
                              <UserCircle className="h-3.5 w-3.5" />
                              <span className="truncate">{account.externalId}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Connected {new Date(account.connectedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5" />
                            <span>Last used {new Date(account.lastUsed || account.connectedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className={`flex items-center ${viewMode === 'grid' ? 'mt-2 pt-4 border-t w-full justify-end' : ''}`}>

                        <Button variant="ghost" className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 px-3" onClick={() => handleDelete(account.id, account.username)} disabled={deletingId === account.id}>
                          {deletingId === account.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              <span>Disconnect</span>
                            </>
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

      {/* Pagination Controls */}
      {filteredAccounts.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t mt-auto bg-background/50 backdrop-blur-sm sticky bottom-0 z-20">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(startIndex + itemsPerPage, filteredAccounts.length)}
              </span>{" "}
              of <span className="font-medium">{filteredAccounts.length}</span> connections
            </p>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Items per page:</span>
              <Select value={itemsPerPage.toString()} onValueChange={(v) => {setItemsPerPage(parseInt(v));setCurrentPage(1);}}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={itemsPerPage.toString()} />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map(size => (
                    <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                  <ChevronFirst className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1 px-2">
                  <span className="text-sm font-medium">Page {currentPage}</span>
                  <span className="text-sm text-muted-foreground text-nowrap">of {totalPages}</span>
                </div>

                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                  <ChevronLast className="h-4 w-4" />
                </Button>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
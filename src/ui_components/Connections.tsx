import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, RefreshCw, Search, X, Loader2, Shield, UserCircle, ExternalLink, Calendar } from "lucide-react"
import { getServices, deleteConnection } from "./api/connectionlist"
import { useUser } from '@/context/UserContext';
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"

interface ConnectedAccount {
  id: string;
  externalId: string;
  username: string;
  avatarUrl: string;
  connectedAt: string;
  serviceId: string;
  serviceName: string;
  serviceIcon: string;
}

export default function Connections() {
  const { user } = useUser();
  const location = useLocation();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    filterAccounts();
  }, [accounts, searchQuery]);

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
                allAccounts.push({
                  ...acc,
                  serviceId: service.id,
                  serviceName: service.name,
                  serviceIcon: service.icon
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

  const filterAccounts = () => {
    let filtered = [...accounts];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(acc => 
        acc.username.toLowerCase().includes(query) ||
        acc.serviceName.toLowerCase().includes(query) ||
        acc.externalId.toLowerCase().includes(query)
      );
    }
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
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Connected Accounts</h2>
          <p className="text-muted-foreground italic text-sm">Manage all individual credentials used in your workflows</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search accounts..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
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
          <Button variant="outline" size="icon" onClick={fetchAccounts} disabled={isLoading} className="h-9 w-9">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-muted/20 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border animate-pulse">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center mb-4 border border-primary/10">
                <Shield className="h-8 w-8 text-primary/40" />
              </div>
              <h3 className="text-lg font-semibold">No accounts found</h3>
              <p className="text-muted-foreground text-sm max-w-[280px]">
                {searchQuery ? "No accounts match your search query." : "You haven't connected any accounts yet."}
              </p>
              {!searchQuery && (
                <Button variant="outline" className="mt-6 gap-2" asChild>
                    <a href="/integration">
                        <ExternalLink className="h-4 w-4" />
                        Explore Integrations
                    </a>
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredAccounts.map((account) => (
                <div 
                  key={account.id} 
                  className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 lg:p-6 hover:bg-muted/40 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Service Badge & Icon */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="relative shrink-0">
                        <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center border shadow-sm group-hover:scale-105 transition-transform">
                            <img 
                            src={account.serviceIcon} 
                            alt={account.serviceName} 
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(account.serviceName)}&background=6b7280&color=fff`;
                            }}
                            />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base truncate">{account.username}</span>
                        <div className="h-1 w-1 rounded-full bg-muted-foreground/30 hidden sm:block" />
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold hidden sm:block">Active</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground uppercase tracking-widest font-medium">
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <UserCircle className="h-3 w-3 text-primary/50" />
                          <span className="truncate">{account.externalId}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-primary/50" />
                          <span>Joined {new Date(account.connectedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-auto">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 px-3 gap-2"
                      onClick={() => handleDelete(account.id, account.username)}
                      disabled={deletingId === account.id}
                    >
                      {deletingId === account.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="text-xs font-semibold">DISCONNECT</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-center gap-2 p-8 border-2 border-dashed rounded-3xl bg-primary/5 border-primary/10">
        <div className="text-center space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-widest text-primary/60">Need more connections?</h4>
            <p className="text-xs text-muted-foreground">Add new accounts for any service by visiting the Integrations Marketplace.</p>
            <Button size="sm" className="mt-4 rounded-full px-6 font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform" asChild>
                <a href="/integration">ADD NEW ACCOUNT</a>
            </Button>
        </div>
      </div>
    </div>
  );
}

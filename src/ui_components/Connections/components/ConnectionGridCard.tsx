import { motion } from 'framer-motion';
import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCircle, Calendar, Zap, Sparkles, Loader2, X, Database, RefreshCw } from 'lucide-react';
import type { ConnectedAccount } from '../types';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUser } from "../../../context/UserContext";
import { API_URL } from "../../api/apiurl";

interface ConnectionGridCardProps {
  account: ConnectedAccount;
  onDelete: (id: string, name: string) => void;
  isDeleting: boolean;
}

export function ConnectionGridCard({ account, onDelete, isDeleting }: ConnectionGridCardProps) {
  const { user } = useUser();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleFetchSchema = async () => {
    setIsRefreshing(true);
    try {
      // Fallback to guest if no user (though UI should prevent this state ideally)
      const userId = user?.id || localStorage.getItem('userId');
      if (!userId) {
        alert("User not identified. Please login.");
        return;
      }

      const res = await fetch(`${API_URL}/api/catalogs/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId: account.id, userId: userId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to refresh');

      alert(`Schema successfully fetched! Found ${data.tableCount || 0} tables.`);
    } catch (e: any) {
      console.error(e);
      alert(`Failed to fetch schema: ${e.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isDatabase = account.serviceName.toLowerCase().includes('postgres') ||
    account.serviceName.toLowerCase().includes('sql') ||
    account.serviceName.toLowerCase().includes('mysql');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card className="relative bg-white/70 dark:bg-[#0f172a]/40 backdrop-blur-3xl border border-slate-200/50 dark:border-white/5 rounded-[2.5rem] shadow-2xl group transition-all duration-500 h-full flex flex-col justify-between overflow-hidden hover:border-blue-500/50 hover:shadow-blue-500/10 p-8">

        {/* Status Dot (Top Right) */}
        <div className={`absolute top-6 right-6 h-2.5 w-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] ${account.status === 'active' ? 'bg-emerald-500 shadow-emerald-500/50' :
          account.status === 'expired' ? 'bg-rose-500 shadow-rose-500/50' : 'bg-amber-500 shadow-amber-500/50'
          }`} />

        <CardContent className="p-0 h-full flex flex-col">
          <div className="flex flex-col gap-6 flex-1">

            {/* Service Icon Area */}
            <div className="relative shrink-0 w-fit">
              <div className="h-14 w-14 rounded-[1.25rem] bg-white dark:bg-[#1e293b]/50 border border-slate-100 dark:border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-500 relative z-10">
                <img
                  src={account.serviceIcon}
                  alt={account.serviceName}
                  className="w-7 h-7 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(account.serviceName)}&background=3b82f6&color=fff`;
                  }}
                />
              </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0 space-y-6">
              <div className="space-y-2">
                <h4 className="font-black tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-xl">
                  {account.username}
                </h4>
                <div className="flex gap-2">
                  <Badge variant="outline" className="h-5 px-2 text-[9px] font-black uppercase tracking-widest rounded-md bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                    {account.serviceName}
                  </Badge>
                  {isDatabase && (
                    <Badge variant="outline" className="h-5 px-2 text-[9px] font-black uppercase tracking-widest rounded-md bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-500">
                      Database
                    </Badge>
                  )}
                </div>
              </div>

              {/* Account ID Pill */}
              <div className="flex items-center gap-3 bg-slate-900/5 dark:bg-black/40 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                <UserCircle className="h-4 w-4 text-blue-500/70 shrink-0" />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{account.externalId}</span>
              </div>

              {/* Metadata Row */}
              <div className="flex items-center gap-8 justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Connected</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                    {new Date(account.connectedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Activity</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    {new Date(account.lastUsed || account.connectedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Usage Section */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Currently Used In</span>
                <div className="flex -space-x-2">
                  {account.usage && account.usage.length > 0 ? (
                    account.usage.slice(0, 4).map((item, i) => (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <div
                            className="h-8 w-8 rounded-full bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-800 flex items-center justify-center shadow-md hover:-translate-y-1 transition-all cursor-pointer relative z-1"
                            style={{ zIndex: 10 - i }}
                          >
                            <div className={`h-full w-full rounded-full flex items-center justify-center ${item.type === 'flow' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                              {item.type === 'flow' ? <Zap className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className='font-bold lowercase tracking-widest text-xs'><span className="font-bold uppercase tracking-widest">{item.type}</span>: {item.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))
                  ) : (
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic opacity-50">Not currently used</div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row justify-end pt-6 border-t border-slate-100 dark:border-slate-800 gap-3">

                {/* Fetch Schema Button (Only for Databases) */}
                {isDatabase && (
                  <Button
                    variant="outline"
                    onClick={handleFetchSchema}
                    disabled={isRefreshing || isDeleting}
                    className="h-10 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 font-bold tracking-wider text-[10px] uppercase transition-all shadow-sm"
                  >
                    {isRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Database className="h-3.5 w-3.5 mr-2" />}
                    {isRefreshing ? 'Fetching...' : 'Fetch Schema'}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => onDelete(account.id, account.username)}
                  disabled={isDeleting}
                  className="h-10 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/10 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border-slate-200 dark:border-slate-700 hover:border-red-200 font-bold tracking-wider text-[10px] uppercase transition-all shadow-sm"
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      <X className="h-3.5 w-3.5" />
                      Disconnect
                    </span>
                  )}
                </Button>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

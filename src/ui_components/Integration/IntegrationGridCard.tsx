import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, Plus, ExternalLink, UserCircle, RefreshCw } from "lucide-react"

import type { IntegrationApp } from './types';
import { StatusIndicator } from './StatusIndicator';
import { categoryColors } from './constants';

interface IntegrationGridCardProps {
    app: IntegrationApp;
    onConnect: (app: IntegrationApp) => void;
    connectingApp: string | null;
}

export const IntegrationGridCard = ({ app, onConnect, connectingApp }: IntegrationGridCardProps) => {
  const colors = categoryColors[app.category || 'default'] || categoryColors.default;
  
  return (
    <Card className="overflow-hidden bg-white/70 dark:bg-white/5 backdrop-blur-xl border-slate-200 dark:border-white/10 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group h-full shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl flex flex-col">
      <CardHeader className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`
                relative h-16 w-16 rounded-2xl flex items-center justify-center shadow-sm 
                group-hover:scale-110 group-hover:rotate-3 transition-all duration-500
                bg-white/80 dark:bg-white/10 border border-slate-100 dark:border-white/10
              `}>
                <img 
                  src={app.icon} 
                  alt={app.name} 
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(app.name)}&background=3b82f6&color=fff`;
                  }}
                />
              </div>
              {app.connected && (
                <div className="absolute -top-1 -right-1">
                  <StatusIndicator status={app.connectionStatus} />
                </div>
              )}
            </div>
            
            <div className="min-w-0">
              <h4 className="font-bold text-lg truncate text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                {app.name}
              </h4>
              <Badge 
                variant="outline" 
                className={`mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg border-opacity-50 ${colors.bg} ${colors.text} ${colors.border}`}
              >
                {app.category}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-6 pb-6 flex-1 flex flex-col">
        <p className="text-sm font-medium text-slate-500 dark:text-blue-200/70 leading-relaxed mb-6 line-clamp-2">
          {app.description}
        </p>

        {app.connected && app.accounts && app.accounts.length > 0 && (
          <div className="mt-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Connected Accounts</span>
              <div className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black border border-blue-200 dark:border-blue-500/30">
                {app.accounts.length}
              </div>
            </div>
            <div className="flex -space-x-2">
              {app.accounts.slice(0, 3).map((account, index) => (
                <TooltipProvider key={account.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative group/avatar cursor-pointer">
                        <div className="h-9 w-9 rounded-full border-2 border-white dark:border-slate-900 shadow-md overflow-hidden bg-slate-100 dark:bg-white/10 group-hover/avatar:scale-110 transition-transform">
                          {account.avatarUrl ? (
                            <img src={account.avatarUrl} alt={account.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-blue-500">
                              <UserCircle className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        {index === 2 && app.accounts && app.accounts.length > 3 && (
                          <div className="absolute inset-0 bg-slate-900/60 rounded-full flex items-center justify-center backdrop-blur-[1px]">
                            <span className="text-[10px] font-black text-white">+{app.accounts.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl border-slate-200 dark:border-white/10 dark:bg-slate-900 shadow-xl">
                      <p className="text-xs font-bold dark:text-white">{account.username}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {app.lastSynced && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              <RefreshCw className="h-3 w-3 text-blue-500" />
              <span>Synced {new Date(app.lastSynced).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {app.syncProgress !== undefined && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-[10px] uppercase tracking-widest font-black text-slate-400">
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                Syncing
              </span>
              <span className="text-blue-600 dark:text-blue-400">{app.syncProgress}%</span>
            </div>
            <Progress value={app.syncProgress} className="h-1.5 bg-slate-100 dark:bg-white/10" indicatorClassName="bg-linear-to-r from-blue-600 to-indigo-600" />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-6 py-6 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/2 mt-auto">
        <div className="flex flex-col gap-3 w-full">
          {app.connected && (
            <Button 
              variant="outline" 
              className="h-11 rounded-xl border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-md hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300 font-bold text-xs uppercase tracking-widest"
              asChild
            >
              <Link to={`/connections?search=${encodeURIComponent(app.name)}`}>
                <UserCircle className="h-4 w-4 mr-2 text-blue-500" />
                Manage Accounts
              </Link>
            </Button>
          )}
          
          <Button 
            variant={app.connected ? "outline" : "default"}
            className={`
              h-11 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-500 relative overflow-hidden
              ${app.connected 
                ? 'border-dashed border-blue-400 dark:border-blue-500/50 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                : 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]'}
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
                {app.connected ? "Add Account" : "Connect Now"}
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

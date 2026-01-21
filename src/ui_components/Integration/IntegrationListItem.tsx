import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loader2, UserCircle, Star, Zap, MoreVertical, Info, RefreshCw } from "lucide-react"

import type { IntegrationApp } from './types';
import { StatusIndicator } from './StatusIndicator';
import { categoryColors } from './constants';

interface IntegrationListItemProps {
  app: IntegrationApp;
  onConnect: (app: IntegrationApp) => void;
  connectingApp: string | null;
  onShowDetails: (app: IntegrationApp) => void;
}

export const IntegrationListItem = ({ app, onConnect, connectingApp, onShowDetails }: IntegrationListItemProps) => {
  const colors = categoryColors[app.category || 'default'] || categoryColors.default;

  return (
    <Card
      className="overflow-hidden bg-white/70 dark:bg-white/5 backdrop-blur-xl border-slate-200 dark:border-white/10 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 group rounded-2xl shadow-sm shadow-slate-200/50 dark:shadow-none cursor-pointer"
      onClick={() => onShowDetails(app)}
    >
      <CardContent className="p-4 lg:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
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

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <h3 className="font-black text-xl text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                {app.name}
              </h3>
              {app.featured && (
                <div className="bg-amber-100 dark:bg-amber-500/10 p-1 rounded-lg">
                  <Star className="h-4 w-4 text-amber-500 fill-current" />
                </div>
              )}
              <Badge
                variant="outline"
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-lg border-opacity-50 ${colors.bg} ${colors.text} ${colors.border}`}
              >
                {app.category}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-3">
              {app.connected && app.accounts && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <UserCircle className="h-4 w-4" />
                  <span>{app.accounts.length} {app.accounts.length === 1 ? 'Account' : 'Accounts'}</span>
                </div>
              )}
              {app.popularity && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500">
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  <span>{app.popularity}% POULAR</span>
                </div>
              )}
            </div>

            <p className="text-sm font-medium text-slate-500 dark:text-blue-200/70 line-clamp-1 italic">
              {app.description}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <Button
              variant={app.connected ? "outline" : "default"}
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                onConnect(app);
              }}
              disabled={connectingApp === app.id}
              className={`
                flex-1 sm:flex-none min-w-[140px] h-11 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-500 relative overflow-hidden
                ${app.connected
                  ? 'border-dashed border-blue-400 dark:border-blue-500/50 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                }
              `}
            >
              {connectingApp === app.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                app.connected ? "Add Account" : "Connect Now"
              )}
            </Button>

            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 shadow-sm"
                asChild
              >
                <Link to={`/connections?search=${encodeURIComponent(app.name)}`}>
                  <UserCircle className="h-5 w-5 text-blue-500" />
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 shadow-sm">
                    <MoreVertical className="h-5 w-5 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border-slate-200 dark:border-white/10 shadow-xl p-1">
                  <DropdownMenuItem
                    className="rounded-lg font-bold text-[10px] uppercase tracking-wider py-2.5"
                    onClick={() => onShowDetails(app)}
                  >
                    <Info className="h-4 w-4 mr-2 text-blue-500" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-lg font-bold text-[10px] uppercase tracking-wider py-2.5">
                    <RefreshCw className="h-4 w-4 mr-2 text-blue-500" />
                    Sync Now
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

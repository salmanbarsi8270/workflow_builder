import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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

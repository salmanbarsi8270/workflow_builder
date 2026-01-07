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
}

export const IntegrationListItem = ({ app, onConnect, connectingApp }: IntegrationListItemProps) => {
  const colors = categoryColors[app.category || 'default'] || categoryColors.default;

  return (
    <Card className="group hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`
            p-3 rounded-xl ${colors.bg}
            ${app.connected ? 'ring-2 ring-primary/20' : ''}
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
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-lg truncate">{app.name}</h3>
              {app.featured && (
                <Star className="h-3 w-3 text-amber-500 fill-current" />
              )}
              {app.connected && (
                <StatusIndicator status={app.connectionStatus} size="md" />
              )}
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <Badge 
                variant="outline" 
                className={`${colors.bg} ${colors.text} ${colors.border} border font-medium capitalize`}
              >
                {app.category}
              </Badge>
              {app.connected && app.accounts && (
                <Badge variant="secondary">
                  {app.accounts.length} account{app.accounts.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {app.popularity && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3" />
                  <span>{app.popularity}% popular</span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-1">
              {app.description}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant={app.connected ? "outline" : "default"}
              size="sm"
              onClick={() => onConnect(app)}
              disabled={connectingApp === app.id}
              className="min-w-[120px]"
            >
              {connectingApp === app.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : app.connected ? (
                "Add Account"
              ) : (
                "Connect"
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              asChild
            >
              <Link to={`/connections?search=${encodeURIComponent(app.name)}`}>
                <UserCircle className="h-4 w-4" />
              </Link>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Info className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

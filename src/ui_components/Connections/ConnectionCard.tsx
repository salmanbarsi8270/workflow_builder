import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Trash2, ExternalLink, RefreshCw, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import type { Connection } from './types';

interface ConnectionCardProps {
    connection: Connection;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onRefresh: (connection: Connection, e: React.MouseEvent) => void;
}

export const ConnectionCard = ({ connection, onDelete, onRefresh }: ConnectionCardProps) => {
  return (
    <Card className="group hover:shadow-md transition-all border-l-4 border-l-primary/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center p-2">
              <img 
                src={connection.icon} 
                alt={connection.name} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(connection.name)}&background=6b7280&color=fff`;
                }}
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{connection.name}</h3>
                <Badge 
                  variant={connection.status === 'active' ? 'default' : 'destructive'}
                  className="capitalize text-[10px] px-1.5 py-0 h-5"
                >
                  {connection.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                {connection.externalUsername}
              </p>
              <p className="text-xs text-muted-foreground/60">
                Connected {formatDistanceToNow(new Date(connection.connectedAt))} ago
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => onRefresh(connection, e)}>
                <RefreshCw className="h-4 w-4" />
             </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => onDelete(connection.id, e)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Connection
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {connection.status !== 'active' && (
                     <DropdownMenuItem>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Troubleshoot
                     </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

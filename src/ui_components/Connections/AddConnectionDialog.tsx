import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Plus } from "lucide-react"

import type { ServiceDefinition } from './types';
// import { categoryColors } from '../Integration/constants'; // Removed unused import
// Actually I should probably check if Integration/constants exists now. It does.

interface AddConnectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    services: ServiceDefinition[];
    onConnect: (serviceId: string) => void;
}

export const AddConnectionDialog = ({ open, onOpenChange, services, onConnect }: AddConnectionDialogProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    // Filter services based on search
    const filteredServices = useMemo(() => {
        if (!searchQuery.trim()) return services;
        return services.filter(service => 
            service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            service.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [services, searchQuery]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Connection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add New Connection</DialogTitle>
              <DialogDescription>
                Select a service to connect to your account.
              </DialogDescription>
            </DialogHeader>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search services (e.g. Google Sheets, Slack)..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-2">
               {filteredServices.map(service => (
                   <button 
                    key={service.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                    onClick={() => onConnect(service.id)}
                   >
                     <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
                        <img 
                            src={service.icon} 
                            alt={service.name} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(service.name)}&background=6b7280&color=fff`;
                            }}
                        />
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{service.name}</h4>
                        <Badge variant="secondary" className="text-[10px] px-1.5 h-5 mt-1">
                            {service.category}
                        </Badge>
                     </div>
                     <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                   </button>
               ))}
               {filteredServices.length === 0 && (
                   <div className="col-span-full py-8 text-center text-muted-foreground">
                       No services found matching "{searchQuery}"
                   </div>
               )}
            </div>
          </DialogContent>
        </Dialog>
    );
};

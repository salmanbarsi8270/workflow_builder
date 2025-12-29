import { useState, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/dialog"
import { ExternalLink, Loader2 } from "lucide-react"
import { useUser } from '@/context/UserContext';
import { getConnections } from "../api/connectionlist";
import { API_URL } from '../api/apiurl';

interface ConnectionSelectorProps {
    appName: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export default function ConnectionSelector({ appName, value, onChange, disabled }: ConnectionSelectorProps) {
    const { user } = useUser();
    const [connections, setConnections] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLocalLoading, setIsLocalLoading] = useState(false);

    const fetchConnections = async () => {
        if (!user?.id) return;
        setIsLocalLoading(true);
        try {
            const data = await getConnections(user.id);
            const allApps = data.data || [];
            
            // Refined filtering: handle case-insensitivity and potential underscores or spaces
            const target = appName.toLowerCase().replace(/\s+/g, '_');
            const relevantApps = allApps.filter((app: any) => {
                const name = app.name.toLowerCase().replace(/\s+/g, '_');
                return name === target || name.includes(target) || target.includes(name);
            });
            
            setConnections(relevantApps);

            const connectedApp = relevantApps.find((app: any) => app.connected);
            if (connectedApp && !value) {
                onChange(connectedApp.id); 
            }
        } catch (error) {
            console.error("Failed to fetch connections", error);
        } finally {
            setIsLocalLoading(false);
        }
    };

    useEffect(() => {
        fetchConnections();
    }, [user?.id, appName]);

    const handleConnectClick = () => {
         setIsModalOpen(true);
    };

    const handleConfirmConnect = () => {
        const target = appName.toLowerCase().replace(/\s+/g, '_');
        const appToConnect = connections.find((app: any) => {
             const name = app.name.toLowerCase().replace(/\s+/g, '_');
             return name === target || name.includes(target) || target.includes(name);
        }) || connections[0]; 
        
        if (appToConnect && user?.id) {
             const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
             window.location.href = `${API_URL}/auth/connect/${appToConnect.id}?userId=${user.id}&callbackUrl=${callbackUrl}`;
        } else {
            console.error("Cannot find app to connect");
        }
    };
    
    const activeConnection = connections.find(c => c.connected);
    const selectedConnection = connections.find(c => c.id === value);

    const handleReconnect = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleConnectClick();
    };

    return (
        <div className="flex items-center gap-2 flex-1">
            {!activeConnection && !isLocalLoading ? (
                <Button 
                    variant="outline" 
                    className="w-full justify-between h-9 px-2.5 text-xs" 
                    onClick={handleConnectClick}
                    disabled={disabled}
                >
                    <span>Connect {appName}</span>
                    <ExternalLink className="h-4 w-4 ml-2 opacity-50" />
                </Button>
            ) : (
                <div className="flex items-center gap-2 flex-1">
                    <Select value={value} onValueChange={onChange} disabled={disabled || isLocalLoading}>
                        <SelectTrigger className="h-9 px-2.5 flex-1 bg-background border-input">
                            {isLocalLoading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span className="text-xs text-muted-foreground italic">Fetching...</span>
                                </div>
                            ) : selectedConnection ? (
                                <div className="flex flex-col items-start overflow-hidden">
                                    <span className="text-[10px] text-muted-foreground uppercase leading-tight">{appName}</span>
                                    <span className="truncate w-full text-left">
                                        {selectedConnection.externalId || selectedConnection.name}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-muted-foreground italic text-sm">Select Connection</span>
                            )}
                        </SelectTrigger>
                        <SelectContent side="bottom" align="start">
                            {connections.map((conn) => (
                                <SelectItem key={conn.id} value={conn.id}>
                                    <div className="flex flex-col py-0.5">
                                        <span className="font-medium">{conn.name}</span>
                                        {conn.externalId && (
                                            <span className="text-[10px] text-muted-foreground italic">{conn.externalId}</span>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-xs font-normal px-2 py-1.5 h-auto text-primary"
                                onClick={handleConnectClick}
                                disabled={disabled}
                            >
                                + Add New {appName} Connection
                            </Button>
                        </SelectContent>
                    </Select>

                    {selectedConnection && !isLocalLoading && (
                        <div className="flex items-center gap-2 px-2 py-1 rounded bg-muted/30 border border-muted-foreground/10 shrink-0">
                            <div className={`w-1.5 h-1.5 rounded-full ${selectedConnection.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-[10px] font-medium text-muted-foreground">
                                {selectedConnection.connected ? 'Connected' : 'Disconnected'}
                            </span>
                            {!selectedConnection.connected && (
                                <Button 
                                    variant="link" 
                                    className="h-auto p-0 text-[10px] text-primary" 
                                    onClick={handleReconnect}
                                    disabled={disabled}
                                >
                                    Reconnect
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Connect {appName}</DialogTitle>
                        <DialogDescription>
                            You will be redirected to authenticate with {appName}. You can close this dialog after connecting.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={disabled}>Cancel</Button>
                        <Button onClick={handleConfirmConnect} disabled={disabled}>Connect {appName}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

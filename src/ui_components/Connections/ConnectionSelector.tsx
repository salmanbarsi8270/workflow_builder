import { useState, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/dialog"
import { ExternalLink, RefreshCw } from "lucide-react"
import { useUser } from '@/context/UserContext';
import { getConnections } from "../api/connectionlist";
import { API_URL } from '../api/apiurl';

interface ConnectionSelectorProps {
    appName: string;
    value: string;
    onChange: (value: string) => void;
}

export default function ConnectionSelector({ appName, value, onChange }: ConnectionSelectorProps) {
    const { user } = useUser();
    const [connections, setConnections] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchConnections = async () => {
        if (!user?.id) return;
        if (!user?.id) return;
        try {
            const data = await getConnections(user.id);
            // Filter by appName (loose matching or by ID logic)
            // The API returns a list of all apps. We need to find the one matching 'appName'.
            // In Integration.tsx logic: app.name matches appName usually.
            const allApps = data.data || [];
            // We want to show connections for THIS app.
            // But the API seems to return "Services" (Apps) available to connect, and their status.
            // So we find the app definition from the list.
            const relevantApps = allApps.filter((app: any) => app.name.toLowerCase() === appName.toLowerCase());
            
            // If the app is found and connected
            setConnections(relevantApps);

            // If we have a value but it's not valid/connected, maybe warn?
            // If we have no value, and there is exactly one connected account, auto-select it?
            const connectedApp = relevantApps.find((app: any) => app.connected);
            if (connectedApp && !value) {
                // Determine what ID to save. Usually 'account-1' isn't real. 
                // We should save the connection ID.
                // Looking at Integration.tsx, `app.id` is the integration ID.
                // But does `app.id` represent the *connection* or the *service*?
                // It seems `app.id` is the Service ID (e.g. 'gmail').
                // If so, `value` should probably be the App ID + maybe user specific ID if multiple allowed?
                // For now, let's assume one connection per service per user as implied by the integration list.
                // So if connected, we select it.
                onChange(connectedApp.id); 
            }

        } catch (error) {
            console.error("Failed to fetch connections", error);
        }
    };

    useEffect(() => {
        fetchConnections();
    }, [user?.id, appName]);

    const handleConnectClick = () => {
         setIsModalOpen(true);
    };

    const handleConfirmConnect = () => {
        // Find the app ID to connect
        // We might not have it if the app isn't in the list?
        // But `connections` should have it even if not connected.
        const appToConnect = connections.find(c => c.name.toLowerCase() === appName.toLowerCase());
        
        if (appToConnect && user?.id) {
             // Redirect current page to preserve flow context via callback (relative path)
             const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
             window.location.href = `${API_URL}/auth/connect/${appToConnect.id}?userId=${user.id}&callbackUrl=${callbackUrl}`;
             // Maybe start polling or offer refresh?
        } else {
            console.error("Cannot find app to connect");
        }
    };
    
    // Derived state: Do we have ANY connected account for this app?
    const activeConnection = connections.find(c => c.connected);
    const selectedConnection = connections.find(c => c.id === value);

    const handleReconnect = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleConnectClick();
    };

    return (
        <div className="space-y-2">
            {!activeConnection ? (
                 <div>
                    <Button variant="outline" className="w-full justify-between h-9 px-2.5" onClick={handleConnectClick}>
                        <span>Connect {appName}</span>
                        <ExternalLink className="h-4 w-4 ml-2 opacity-50" />
                    </Button>
                 </div>
            ) : (
                <div className="relative">
                     <Select value={value} onValueChange={(val) => {
                         if (val === 'add_new') {
                             handleConnectClick();
                         } else {
                             onChange(val);
                         }
                     }}>
                        <SelectTrigger className="w-full h-9 px-2.5 [&>span]:w-full">
                            {selectedConnection ? (
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2 truncate">
                                        {/* Potentially add App Icon here if available */}
                                        <span className="font-medium text-sm">{appName}</span>
                                        <span className="text-muted-foreground text-xs truncate">
                                            {selectedConnection.name !== appName ? `(${selectedConnection.name})` : ''}
                                        </span>
                                    </div>
                                    {selectedConnection.connected ? (
                                        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium pl-2">
                                             <span className="h-2 w-2 rounded-full bg-green-500" />
                                             <span>Connected</span>
                                        </div>
                                    ) : (
                                        <div 
                                            role="button"
                                            className="flex items-center gap-1.5 text-xs text-destructive font-medium pl-2 cursor-pointer hover:underline"
                                            onClick={handleReconnect}
                                        >
                                             <span className="h-2 w-2 rounded-full bg-destructive" />
                                             <span>Connect</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <SelectValue placeholder="Select connection" />
                            )}
                        </SelectTrigger>
                        <SelectContent>
                             {connections.map(conn => (
                                 <SelectItem key={conn.id} value={conn.id} disabled={!conn.connected}>
                                     {conn.connected ? (
                                         <span className="flex items-center gap-2">
                                             <span className="h-2 w-2 rounded-full bg-green-500" />
                                             {conn.name}
                                         </span>
                                     ) : (
                                         <span className="flex items-center gap-2 opacity-50">
                                             {conn.name} (Not Connected)
                                         </span>
                                     )}
                                 </SelectItem>
                             ))}
                             <SelectItem value="add_new" className="font-medium text-primary cursor-pointer focus:text-primary">
                                 + Add New Connection
                             </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Connect {appName}</DialogTitle>
                        <DialogDescription>
                            You need to authenticate with {appName} to use this integration.
                            This will redirect you to the service provider to complete the secure authentication process.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 flex justify-center">
                        <div className="p-4 bg-muted/50 rounded-full">
                            <RefreshCw className="h-12 w-12 text-muted-foreground opacity-20" /> 
                            {/* Placeholder for app icon if passed */}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmConnect}>Connect {appName}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

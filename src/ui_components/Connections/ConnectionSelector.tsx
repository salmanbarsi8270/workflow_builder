import { useState, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react"
import { useUser } from '@/context/UserContext';
import { getServices, deleteConnection } from "../api/connectionlist";
import { API_URL } from '../api/apiurl';
import { toast as sonner } from "sonner";

interface ConnectionSelectorProps {
    appName: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

const SERVICE_MAP: Record<string, string> = {
    'gmail': 'gmail',
    'google sheets': 'sheets',
    'google drive': 'drive',
    'google docs': 'docs',
    'google calendar': 'calendar',
    'github': 'github'
};

export default function ConnectionSelector({ appName, value, onChange, disabled }: ConnectionSelectorProps) {
    const { user } = useUser();
    const [connections, setConnections] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLocalLoading, setIsLocalLoading] = useState(false);
    const [connectionName, setConnectionName] = useState('');
    const [apiKey, setApiKey] = useState('');

    const mappedService = SERVICE_MAP[appName.toLowerCase()] || appName.toLowerCase().replace(/\s+/g, '_');

    const fetchConnections = async () => {
        if (!user?.id) return;
        setIsLocalLoading(true);
        try {
            // Use getServices to get the full list of services and their accounts
            const data = await getServices(user.id);
            const allServices = Array.isArray(data) ? data : (data.data || []);

            // Find the service matching the current appName
            const matchingService = allServices.find((svc: any) => {
                const svcId = (svc.id || '').toLowerCase();
                const svcName = (svc.name || '').toLowerCase();

                // Strict check for Google Drive to avoid matching 'microsft-onedrive' or 'onedrive'
                if (mappedService === 'drive') {
                    return svcId === 'drive' || svcName === 'google drive';
                }

                return svcId === mappedService || svcName === appName.toLowerCase() || svcId.includes(mappedService);
            });

            if (matchingService && matchingService.accounts) {
                // Map accounts to the format expected by the selector
                const serviceAccounts = matchingService.accounts.map((acc: any) => ({
                    id: acc.id,
                    name: acc.username, // Use username as the primary display name
                    externalId: acc.externalId,
                    // If backend supports alias name in future, we can prioritize it: acc.name || acc.username
                }));
                setConnections(serviceAccounts);

                if (serviceAccounts.length > 0 && !value) {
                    // Auto-select first if nothing selected
                    onChange(serviceAccounts[0].id);
                }
            } else {
                setConnections([]);
            }
        } catch (error) {
            console.error("Failed to fetch connections", error);
            // Fallback for resiliency? 
            // If getServices fails, we could try getConnections (legacy) if we imported it, 
            // but for now let's rely on the main endpoint.
        } finally {
            setIsLocalLoading(false);
        }
    };

    useEffect(() => {
        fetchConnections();
    }, [user?.id, appName]);

    const handleConnectClick = () => {
        setConnectionName(`${appName} Account ${connections.length + 1}`);
        setApiKey('');
        setIsModalOpen(true);
    };

    const handleConfirmConnect = async () => {
        if (!user?.id) {
            console.error("User ID missing");
            return;
        }

        if (mappedService === 'openrouter') {
             try {
                 const response = await fetch(`${API_URL}/api/connections/key`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: user.id,
                      service: 'openrouter',
                      apiKey: apiKey,
                      name: connectionName
                    })
                 });
                 const data = await response.json();
                 if (data.success) {
                     sonner.success("Connection saved!");
                     setIsModalOpen(false);
                     await fetchConnections();
                 } else {
                     sonner.error(data.error || "Failed to save key");
                 }
             } catch (err) {
                 console.error(err);
                 sonner.error("Failed to save key");
             }
             return;
        }

        const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
        const nameParam = connectionName ? `&name=${encodeURIComponent(connectionName)}` : '';
        window.location.href = `${API_URL}/auth/connect/${mappedService}?userId=${user.id}&callbackUrl=${callbackUrl}${nameParam}`;
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        console.log(`[ConnectionSelector] Attempting to disconnect ${appName} (ID: ${id})`);

        if (!confirm(`Disconnect this ${appName} account? This will remove these credentials from all your workflows.`)) return;

        try {
            const res = await deleteConnection(id);
            console.log(`[ConnectionSelector] Delete result:`, res);

            if (res.success) {
                sonner.success(`Successfully disconnected ${appName} account`);
                // If the currently selected one was deleted, clear it
                if (value === id) {
                    console.log(`[ConnectionSelector] Clearing currently selected value`);
                    onChange('');
                }
                await fetchConnections();
            } else {
                console.error(`[ConnectionSelector] Delete failed:`, res.error);
                sonner.error(res.error || "Failed to disconnect account");
            }
        } catch (err: any) {
            console.error("[ConnectionSelector] Error during deletion:", err);
            sonner.error("An error occurred while disconnecting");
        }
    };

    const activeConnectionId = value;
    const selectedConnection = connections.find(c => c.id === activeConnectionId);

    // If no connections and not loading, show direct Connect button as requested ("minimum requirement")
    if (connections.length === 0 && !isLocalLoading) {
        return (
            <div className="flex items-center gap-2 flex-1 w-full">
                <Button
                    variant="outline"
                    className="w-full justify-between h-9 px-2.5 text-xs font-medium border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                    onClick={handleConnectClick}
                    disabled={disabled}
                >
                    <span className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                        Connect {appName}
                    </span>
                    <Plus className="h-3.5 w-3.5 opacity-50" />
                </Button>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{mappedService === 'openrouter' ? "Add OpenRouter Provider" : `Connect ${appName}`}</DialogTitle>
                            <DialogDescription>
                                {mappedService === 'openrouter' 
                                    ? "Configure credentials for OpenRouter." 
                                    : "Give this connection a name to identify it later."}
                            </DialogDescription>
                        </DialogHeader>

                        {mappedService === 'openrouter' ? (
                            <div className="space-y-4 py-2">
                                <div className="rounded-md bg-muted p-4 border text-sm text-muted-foreground flex flex-col gap-2">
                                    <div className="flex items-center gap-2 font-medium text-foreground">
                                        <div className="h-4 w-4 rounded-full border border-foreground/30 flex items-center justify-center text-[10px]">i</div>
                                         Follow these instructions to get your OpenRouter API Key:
                                    </div>
                                    <ol className="list-decimal pl-5 space-y-1">
                                        <li>
                                            Visit the following website: <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://openrouter.ai/settings/keys</a>.
                                        </li>
                                        <li>
                                            Once on the website, locate and click on the option to obtain your OpenRouter API Key.
                                        </li>
                                    </ol>
                                </div>

                                <div className="space-y-2">
                                    <Label>API Key <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="sk-or-..."
                                        type="password"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Your key is encrypted and stored securely.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Connection Name</Label>
                                    <Input
                                        value={connectionName}
                                        onChange={(e) => setConnectionName(e.target.value)}
                                        placeholder="e.g. My Work Gmail"
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={disabled}>Cancel</Button>
                            <Button 
                                onClick={handleConfirmConnect} 
                                disabled={disabled || (mappedService === 'openrouter' ? !apiKey.trim() : !connectionName.trim())}
                            >
                                {mappedService === 'openrouter' ? "Save" : "Connect & Authenticate"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 flex-1 w-full">
            <Select value={value} onValueChange={onChange} disabled={disabled || isLocalLoading}>
                <SelectTrigger className="h-9 px-2.5 flex-1 bg-background border-input w-full">
                    <SelectValue placeholder={appName}>
                        {isLocalLoading ? (
                            <div className="flex items-center gap-2 text-muted-foreground italic text-xs">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Syncing...</span>
                            </div>
                        ) : selectedConnection ? (
                            <div className="flex items-center gap-2 overflow-hidden w-full">
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                                <div className="flex flex-col items-start overflow-hidden text-left">
                                    <span className="text-[10px] text-muted-foreground uppercase leading-none mb-0.5">{selectedConnection.externalId}</span>
                                    <span className="text-xs font-medium truncate w-full">
                                        {selectedConnection.name}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <span className="text-muted-foreground italic text-xs">Choose {appName} Account...</span>
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent side="bottom" align="start" className="w-[300px] p-1">
                    <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/50 uppercase border-b mb-1">
                        Connected Accounts
                    </div>
                    {connections.map((conn) => (
                        <div key={conn.id} className="relative flex items-center pr-8 hover:bg-muted/50 rounded-sm">
                            <SelectItem value={conn.id} className="flex-1 cursor-pointer focus:bg-transparent">
                                <div className="flex flex-col py-0.5">
                                    <span className="text-xs font-medium leading-none mb-0.5">{conn.name}</span>
                                    <span className="text-[9px] text-muted-foreground italic">
                                        {conn.externalId ? conn.externalId : `ID: ${conn.id.slice(0, 8)}`}
                                    </span>
                                </div>
                            </SelectItem>
                            <button
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-colors z-50 pointer-events-auto"
                                style={{ pointerEvents: 'auto' }}
                                onClick={(e) => handleDelete(conn.id, e)}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}

                    <div className="p-1 border-t mt-1">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-[11px] font-medium px-2 py-1.5 h-auto text-primary hover:bg-primary/5 rounded-sm"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleConnectClick();
                            }}
                            disabled={disabled}
                        >
                            <Plus className="h-3 w-3 mr-2" />
                            Add Another Account
                        </Button>
                    </div>
                </SelectContent>
            </Select>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Connect {appName}</DialogTitle>
                        <DialogDescription>
                            {mappedService === 'openrouter' 
                                ? "Enter your OpenRouter API Key." 
                                : "Give this connection a name to identify it later."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Connection Name</Label>
                            <Input
                                value={connectionName}
                                onChange={(e) => setConnectionName(e.target.value)}
                                placeholder="e.g. My API Key"
                            />
                        </div>
                        {mappedService === 'openrouter' && (
                            <div className="space-y-2">
                                <Label>API Key</Label>
                                <Input
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-or-..."
                                    type="password"
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={disabled}>Cancel</Button>
                        <Button 
                            onClick={handleConfirmConnect} 
                            disabled={disabled || !connectionName.trim() || (mappedService === 'openrouter' && !apiKey.trim())}
                        >
                            {mappedService === 'openrouter' ? "Save Connection" : "Connect & Authenticate"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

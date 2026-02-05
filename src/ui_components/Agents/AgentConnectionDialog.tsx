import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Key, Link as LinkIcon } from "lucide-react";
import ConnectionSelector from "../Connections/ConnectionSelector"; // Assuming this exists and works
import { API_URL } from "../api/apiurl";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";


interface AgentConnectionDialogProps {
    agent: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved?: () => void;
}

export function AgentConnectionDialog({ agent, open, onOpenChange, onSaved }: AgentConnectionDialogProps) {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // State
    const [apiKey, setApiKey] = useState("");
    const [connectionId, setConnectionId] = useState(""); // For LLM
    const [connectionMap, setConnectionMap] = useState<Record<string, string>>({});
    const [showManualInput, setShowManualInput] = useState(false);

    // Tools State (enabled/disabled if we want that, or just connections)
    // The user image shows toggles. 
    const [toolStates, setToolStates] = useState<Record<string, boolean>>({});

    const tools = agent?.tools || [];

    useEffect(() => {
        if (open && agent?.id && user?.id) {
            fetchExistingLink();
            // Init tool states
            const initialToolStates: Record<string, boolean> = {};
            tools.forEach((tool: any) => {
                const name = tool.name || tool.piece;
                initialToolStates[name] = true; // Default to enabled?
            });
            setToolStates(initialToolStates);
        }
    }, [open, agent?.id, user?.id]);

    const fetchExistingLink = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/v1/agents/${agent.id}/user-link?userId=${user?.id}`);
            const data = await res.json();

            if (data) {
                if (data.api_key) setApiKey(data.api_key);
                if (data.connection_id) setConnectionId(data.connection_id);
                if (data.connection_map) setConnectionMap(data.connection_map);

                // If we have an API key but no connection ID, show manual input by default
                if (data.api_key && !data.connection_id) {
                    setShowManualInput(true);
                }
            }
        } catch (error) {
            console.error("Failed to fetch agent link:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user?.id) return;
        setIsSaving(true);
        try {
            // Filter connection map based on enabled tools? 
            // Or just save everything. Let's save what's configured.

            const payload = {
                userId: user.id,
                agentId: agent.id,
                connectionId: showManualInput ? null : (connectionId || null),
                apiKey: showManualInput ? (apiKey || null) : null,
                connectionMap: connectionMap
            };

            const res = await fetch(`${API_URL}/api/v1/agents/${agent.id}/user-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success("Configuration saved!");
            onOpenChange(false);
            if (onSaved) onSaved();

        } catch (error) {
            console.error(error);
            toast.error("Failed to save configuration");
        } finally {
            setIsSaving(false);
        }
    };

    if (!agent) return null;

    // Determine publisher text - simplified
    // If agent.user_id matches a known user pattern or we can fetch it, great. 
    // For now, static text or simple ID.

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0">
                <div className="p-6 border-b bg-muted/30">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg">Configure Agent Tools</DialogTitle>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">Public</Badge>
                                <span>Published by {agent.user_id || "Unknown"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="p-6 space-y-6">

                        {/* AI Service Connection */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium">AI Service Connection</h3>
                            </div>

                            <div className="border rounded-lg p-4 bg-card shadow-sm transition-all duration-200">
                                <div className="flex items-center justify-between mb-3">
                                    <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Key className="h-3 w-3" />
                                        {showManualInput ? "Manual API Key" : "Primary AI Connection"}
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground">
                                            {showManualInput ? "Use Saved Connection" : "Enter Key Manually"}
                                        </span>
                                        <Switch
                                            checked={showManualInput}
                                            onCheckedChange={setShowManualInput}
                                            className="scale-75 data-[state=checked]:bg-blue-600"
                                        />
                                    </div>
                                </div>

                                {showManualInput ? (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <Input
                                            type="password"
                                            placeholder="sk-..."
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            className="h-9 font-mono text-xs"
                                            autoFocus
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            This key will be encrypted and stored only for your user.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                        <ConnectionSelector
                                            appName="OpenRouter"
                                            value={connectionId}
                                            onChange={(val) => setConnectionId(val)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selected Connections */}
                        {tools.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium">Selected Connections</h3>
                                </div>

                                <div className="grid gap-3">
                                    {tools.map((tool: any, idx: number) => {
                                        const toolName = tool.name || tool.piece;
                                        const serviceName = tool.piece || tool.name;
                                        // Mock color/icon logic if not available

                                        return (
                                            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                                        <LinkIcon className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div className="flex flex-col gap-1 w-full max-w-[200px]">
                                                        <span className="text-sm font-medium leading-none capitalize">{toolName}</span>
                                                        <span className="text-[10px] text-muted-foreground">Required authentication</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 flex-1 justify-end">
                                                    <div className="w-full max-w-[200px]">
                                                        <ConnectionSelector
                                                            appName={serviceName}
                                                            value={connectionMap[toolName] || ""}
                                                            onChange={(val) => setConnectionMap(prev => ({ ...prev, [toolName]: val }))}
                                                        />
                                                    </div>
                                                    <Switch
                                                        checked={toolStates[toolName]}
                                                        onCheckedChange={(c) => setToolStates(prev => ({ ...prev, [toolName]: c }))}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {tools.length === 0 && (
                            <div className="flex items-center justify-center p-6 border border-dashed rounded-lg bg-muted/20">
                                <span className="text-sm text-muted-foreground">No external tools require configuration.</span>
                            </div>
                        )}

                    </div>
                )}

                <DialogFooter className="p-6 pt-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving} className="ml-2">
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Configuration
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

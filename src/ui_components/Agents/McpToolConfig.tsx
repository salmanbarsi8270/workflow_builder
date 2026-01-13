import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, RefreshCw, CheckSquare } from "lucide-react";
import { API_URL } from '../api/apiurl';
import type { MCPConfig, ConnectionOption } from './types';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface McpToolConfigProps {
    config: MCPConfig;
    onChange: (config: MCPConfig) => void;
    onRemove: () => void;
    connections: ConnectionOption[];
}

export function McpToolConfig({ config, onChange, onRemove, connections }: McpToolConfigProps) {
    const [loading, setLoading] = useState(false);
    const [availableTools, setAvailableTools] = useState<any[]>([]);
    const [fetched, setFetched] = useState(false);

    // Auto-fetch if connectionId is already present (e.g. edit mode) and tools haven't been fetched
    useEffect(() => {
        if (config.connectionId && !fetched && availableTools.length === 0) {
            // Optional: Auto fetch on load? Maybe better to let user click fetch to avoid slam
            // But user expects to see tools if they selected them previously.. 
            // Actually, we don't store the tool definitions, just the names. 
            // So we DO need to fetch to show the list.
            // Let's rely on explicit fetch for now or if enabledTools is populated try to fetch.
            if (config.enabledTools && config.enabledTools.length > 0) {
                fetchTools(config.connectionId);
            }
        }
    }, []);

    const fetchTools = async (connId: string) => {
        console.log("Fetching tools for connection:", connId);
        if (!connId) {
            toast.error("Please select a connection");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/mcp/tools`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ connectionId: connId })
            });

            console.log("Fetch response status:", response.status);

            if (!response.ok) {
                const err = await response.json();
                console.error("Fetch error:", err);
                throw new Error(err.error || "Failed to fetch tools");
            }

            const data = await response.json();
            console.log("Fetch data:", data);
            setAvailableTools(data.tools || []);
            setFetched(true);
            toast.success(`Found ${data.tools?.length || 0} tools`);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectionChange = (connId: string) => {
        const conn = connections.find(c => c.id === connId);
        // Reset tools when connection changes
        onChange({
            ...config,
            connectionId: connId,
            name: conn?.name || '',
            enabledTools: []
        });
        setAvailableTools([]);
        setFetched(false);
    };

    const toggleTool = (toolName: string) => {
        const current = config.enabledTools || [];
        const newTools = current.includes(toolName)
            ? current.filter(t => t !== toolName)
            : [...current, toolName];

        onChange({ ...config, enabledTools: newTools });
    };

    const toggleAll = () => {
        if (availableTools.length === 0) return;
        const current = config.enabledTools || [];

        if (current.length === availableTools.length) {
            onChange({ ...config, enabledTools: [] });
        } else {
            onChange({ ...config, enabledTools: availableTools.map(t => t.name) });
        }
    };

    return (
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg flex flex-col gap-3 relative group">
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-red-500"
                    onClick={onRemove}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>

            <div className="space-y-1 pr-6">
                <Label className="text-xs text-muted-foreground">Select Connection</Label>
                <div className="flex gap-2">
                    <Select value={config.connectionId} onValueChange={handleConnectionChange}>
                        <SelectTrigger className="h-9 bg-white dark:bg-black/20">
                            <SelectValue placeholder="Select MCP Connection" />
                        </SelectTrigger>
                        <SelectContent>
                            {connections.length === 0 ? (
                                <div className="p-2 text-xs text-muted-foreground text-center">No MCP connections found</div>
                            ) : (
                                connections.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>

                    <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 shrink-0"
                        onClick={() => config.connectionId && fetchTools(config.connectionId)}
                        disabled={loading || !config.connectionId}
                    >
                        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        <span className="ml-2 text-xs">Fetch Tools</span>
                    </Button>
                </div>
            </div>

            {/* Tools List */}
            {fetched && (
                <div className="mt-2 border-t border-slate-200 dark:border-white/10 pt-2">
                    <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-semibold">Available Tools ({availableTools.length})</Label>
                        <Button variant="ghost" size="sm" className="h-5 text-[10px]" onClick={toggleAll}>
                            {(config.enabledTools?.length || 0) === availableTools.length ? "Deselect All" : "Select All"}
                        </Button>
                    </div>

                    <div className="max-h-[200px] overflow-y-auto space-y-1 bg-white dark:bg-black/20 p-2 rounded border border-slate-100 dark:border-white/5">
                        {availableTools.map(tool => {
                            const isChecked = config.enabledTools?.includes(tool.name);
                            return (
                                <div
                                    key={tool.name}
                                    className="flex items-start gap-2 p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-white/5 transition-all"
                                    onClick={() => toggleTool(tool.name)}
                                >
                                    <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-transparent'}`}>
                                        {isChecked && <CheckSquare className="h-3 w-3 text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate text-slate-700 dark:text-slate-200">{tool.name}</div>
                                        {tool.description && <div className="text-xs text-slate-500 truncate mt-0.5">{tool.description}</div>}
                                    </div>
                                </div>
                            );
                        })}
                        {availableTools.length === 0 && (
                            <div className="text-xs text-slate-400 text-center py-4">No tools returned from server</div>
                        )}
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400 text-right font-mono">
                        {config.enabledTools?.length || 0} selected
                    </div>
                </div>
            )}
        </div>
    );
}

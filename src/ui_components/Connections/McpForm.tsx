import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Server, Globe, Trash2 } from "lucide-react"
import { toast } from "sonner"
import axios from 'axios';
import { API_URL } from '@/ui_components/api/apiurl';
import { useUser } from '@/context/UserContext';
import { useNavigate } from 'react-router-dom';

interface McpFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function McpForm({ open, onOpenChange }: McpFormProps) {
    const { user } = useUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'streamable-http', // Default to Streamable HTTP
        url: '',
        command: '',
        args: [] as string[],
        env: {} as Record<string, string>,
        auth: {
            type: 'none',
            apiKeyHeader: 'X-API-Key',
            apiKeyValue: '',
            accessToken: '',
            headers: {}
        }
    });

    const [headerList, setHeaderList] = useState<{ key: string, value: string }[]>([]);
    const [envList, setEnvList] = useState<{ key: string, value: string }[]>([]);
    const [argList, setArgList] = useState<string[]>([]);

    const updateAuthType = (type: any) => {
        setFormData({
            ...formData,
            auth: { ...formData.auth, type }
        });
    };

    // --- Header Management ---
    const addHeader = () => {
        setHeaderList([...headerList, { key: '', value: '' }]);
    };

    const updateHeader = (index: number, key: string, value: string) => {
        const newList = [...headerList];
        newList[index] = { key, value };
        setHeaderList(newList);

        const headerObj: Record<string, string> = {};
        newList.forEach(h => {
            if (h.key) headerObj[h.key] = h.value;
        });
        setFormData(prev => ({
            ...prev,
            auth: { ...prev.auth, headers: headerObj }
        }));
    };

    const removeHeader = (index: number) => {
        const newList = headerList.filter((_, i) => i !== index);
        setHeaderList(newList);
        const headerObj: Record<string, string> = {};
        newList.forEach(h => {
            if (h.key) headerObj[h.key] = h.value;
        });
        setFormData(prev => ({
            ...prev,
            auth: { ...prev.auth, headers: headerObj }
        }));
    };

    // --- Env Management ---
    const addEnv = () => {
        setEnvList([...envList, { key: '', value: '' }]);
    };
    const updateEnv = (index: number, key: string, value: string) => {
        const newList = [...envList];
        newList[index] = { key, value };
        setEnvList(newList);

        const envObj: Record<string, string> = {};
        newList.forEach(h => { if (h.key) envObj[h.key] = h.value; });
        setFormData(prev => ({ ...prev, env: envObj }));
    };
    const removeEnv = (index: number) => {
        const newList = envList.filter((_, i) => i !== index);
        setEnvList(newList);
        const envObj: Record<string, string> = {};
        newList.forEach(h => { if (h.key) envObj[h.key] = h.value; });
        setFormData(prev => ({ ...prev, env: envObj }));
    };

    // --- Args Management ---
    const addArg = () => setArgList([...argList, '']);
    const updateArg = (index: number, value: string) => {
        const newList = [...argList];
        newList[index] = value;
        setArgList(newList);
        setFormData(prev => ({ ...prev, args: newList }));
    };
    const removeArg = (index: number) => {
        const newList = argList.filter((_, i) => i !== index);
        setArgList(newList);
        setFormData(prev => ({ ...prev, args: newList }));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error("Name is required");
            return;
        }

        if (formData.type === 'stdio' && !formData.command) {
            toast.error("Command is required for Stdio");
            return;
        }
        if (formData.type !== 'stdio' && !formData.url) {
            toast.error("URL is required for Web Connection");
            return;
        }

        setLoading(true);

        try {
            await axios.post(`${API_URL}/api/connections/mcp`, {
                userId: user?.id,
                name: formData.name,
                serverType: formData.type,
                // Pass either URL or Command/Args/Env depending on type
                serverUrl: formData.url,
                command: formData.command,
                args: formData.args,
                env: formData.env,
                authConfig: formData.auth
            });

            toast.success("MCP Server connected successfully!");
            onOpenChange(false);

            // Optionally refresh the page or list
            navigate(0);

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Failed to connect to MCP server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                            <Server className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        Connect MCP Server
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                        Add an external Model Context Protocol server.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                Server Name
                            </Label>
                            <Input
                                placeholder="e.g. My Local Tools"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                    Type
                                </Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val) => setFormData({ ...formData, type: val })}
                                >
                                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="streamable-http">Streamable HTTP</SelectItem>
                                        <SelectItem value="sse">SSE (Legacy)</SelectItem>
                                        <SelectItem value="stdio">Stdio (Local)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {formData.type === 'stdio' ? (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                        Command
                                    </Label>
                                    <Input
                                        placeholder="npx or /path/to/python"
                                        value={formData.command}
                                        onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 font-mono text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Arguments</Label>
                                        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={addArg}>+ Add Arg</Button>
                                    </div>
                                    <div className="space-y-2">
                                        {argList.map((arg, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <Input
                                                    value={arg}
                                                    onChange={(e) => updateArg(idx, e.target.value)}
                                                    className="h-9 font-mono text-xs rounded-lg flex-1"
                                                    placeholder={`Arg ${idx + 1}`}
                                                />
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400" onClick={() => removeArg(idx)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Environment Vars</Label>
                                        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={addEnv}>+ Add Env</Button>
                                    </div>
                                    <div className="space-y-2">
                                        {envList.map((env, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <Input
                                                    value={env.key}
                                                    onChange={(e) => updateEnv(idx, e.target.value, env.value)}
                                                    className="h-9 font-mono text-xs rounded-lg w-1/3"
                                                    placeholder="KEY"
                                                />
                                                <Input
                                                    value={env.value}
                                                    onChange={(e) => updateEnv(idx, env.key, e.target.value)}
                                                    className="h-9 font-mono text-xs rounded-lg flex-1"
                                                    placeholder="VALUE"
                                                />
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400" onClick={() => removeEnv(idx)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                    Server URL
                                </Label>
                                <div className="relative">
                                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder={formData.type === 'sse' ? "http://localhost:3000/sse" : "https://my-mcp-server.com/message"}
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 font-mono text-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Auth Configuration */}
                        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                Authentication
                            </Label>

                            <Select
                                value={formData.auth.type}
                                onValueChange={updateAuthType}
                            >
                                <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10">
                                    <SelectValue placeholder="Auth Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="bearer">Bearer Token</SelectItem>
                                    <SelectItem value="apiKey">API Key</SelectItem>
                                    <SelectItem value="headers">Custom Headers</SelectItem>
                                </SelectContent>
                            </Select>

                            {formData.auth.type === 'bearer' && (
                                <div className="space-y-2 pt-2">
                                    <Label className="text-[10px] font-bold text-slate-400">ACCESS TOKEN</Label>
                                    <Input
                                        type="password"
                                        placeholder="sk-..."
                                        value={formData.auth.accessToken}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            auth: { ...formData.auth, accessToken: e.target.value }
                                        })}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                                    />
                                </div>
                            )}

                            {formData.auth.type === 'apiKey' && (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-400">HEADER NAME</Label>
                                        <Input
                                            placeholder="X-API-Key"
                                            value={formData.auth.apiKeyHeader}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                auth: { ...formData.auth, apiKeyHeader: e.target.value }
                                            })}
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-slate-400">KEY VALUE</Label>
                                        <Input
                                            type="password"
                                            placeholder="secret-key"
                                            value={formData.auth.apiKeyValue}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                auth: { ...formData.auth, apiKeyValue: e.target.value }
                                            })}
                                            className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                                        />
                                    </div>
                                </div>
                            )}

                            {formData.auth.type === 'headers' && (
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold text-slate-400">CUSTOM HEADERS</Label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-[10px] px-2 rounded-lg"
                                            onClick={addHeader}
                                        >
                                            Add Header
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {headerList.map((header, idx) => (
                                            <div key={idx} className="flex gap-2 items-center">
                                                <Input
                                                    placeholder="Key"
                                                    value={header.key}
                                                    onChange={(e) => updateHeader(idx, e.target.value, header.value)}
                                                    className="h-9 text-xs rounded-lg"
                                                />
                                                <Input
                                                    placeholder="Value"
                                                    value={header.value}
                                                    onChange={(e) => updateHeader(idx, header.key, e.target.value)}
                                                    className="h-9 text-xs rounded-lg"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 shrink-0 text-red-400"
                                                    onClick={() => removeHeader(idx)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {headerList.length === 0 && (
                                            <div className="text-center py-4 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-xl text-slate-400 text-xs">
                                                No custom headers added
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 pt-2 bg-slate-50 dark:bg-white/5 flex gap-3 justify-end">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl h-11 px-6 hover:bg-slate-200/50 dark:hover:bg-white/10"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="rounded-xl h-11 px-8 bg-purple-600 hover:bg-purple-700 text-white font-bold"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            "Connect Server"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

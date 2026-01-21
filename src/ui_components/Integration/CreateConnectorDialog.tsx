import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Zap, Globe, Shield, Lock, Key, Link2 } from "lucide-react"
import { toast } from "sonner"
import axios from 'axios';
import { API_URL } from '@/ui_components/api/apiurl';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';

interface CreateConnectorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateConnectorDialog({ open, onOpenChange }: CreateConnectorDialogProps) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        // connector_apps table
        id: '',
        name: '',
        description: '',
        icon: '',
        color: 'text-blue-500',
        category: 'productivity',
        baseUrl: '',

        // connector_auth table
        auth: {
            type: 'none' as any,
            // Settings for OAuth2
            authUrl: '',
            tokenUrl: '',
            clientId: '',
            clientSecret: '',
            scope: '',
            // Settings for Header/Query/Basic
            headerName: 'Authorization',
            queryParam: 'api_key',
        }
    });

    const handleSubmit = async () => {
        if (!formData.id || !formData.baseUrl) {
            toast.error("Connector ID and Base URL are required");
            return;
        }

        setLoading(true);

        try {
            // Construct backend payload
            const payload = {
                name: formData.id, // Primary key id in backend
                displayName: formData.name || formData.id,
                description: formData.description,
                icon: formData.icon,
                color: formData.color,
                category: formData.category,
                baseUrl: formData.baseUrl,
                auth: {
                    type: formData.auth.type,
                    // If OAuth2, include specific settings
                    ...(formData.auth.type === 'oauth2' ? {
                        authUrl: formData.auth.authUrl,
                        tokenUrl: formData.auth.tokenUrl,
                        clientId: formData.auth.clientId,
                        clientSecret: formData.auth.clientSecret,
                        scope: formData.auth.scope
                    } : {}),
                    // If header/query, include those settings
                    ...(formData.auth.type === 'header' ? { headerName: formData.auth.headerName } : {}),
                    ...(formData.auth.type === 'query' ? { queryParam: formData.auth.queryParam } : {}),
                },
                actions: {} // Default empty for auth creation
            };

            await axios.post(`${API_URL}/api/v1/pieces`, payload);

            toast.success("Connector created successfully!");
            onOpenChange(false);
            navigate(0);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Failed to create connector");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto border-border bg-background p-6 custom-scrollbar text-foreground">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-foreground">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        Create Connector
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Define app metadata and dynamic authentication configuration.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-8">
                    {/* App Metadata Section */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Application Metadata</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground">Connector ID (Unique)</Label>
                                <Input
                                    placeholder="e.g. gmail or drive"
                                    value={formData.id}
                                    onChange={e => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    className="h-11 rounded-xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/60"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground">Display Name</Label>
                                <Input
                                    placeholder="e.g. Google Drive"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="h-11 rounded-xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/60"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">Description</Label>
                            <Textarea
                                placeholder="Describe what this connector enables..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="min-h-[80px] rounded-xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/60 resize-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">Base URL</Label>
                            <Input
                                placeholder="https://api.example.com/v1"
                                value={formData.baseUrl}
                                onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
                                className="h-11 rounded-xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/60 font-mono text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground">Icon URL</Label>
                                <Input
                                    placeholder="https://img.icons8.com/..."
                                    value={formData.icon}
                                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                    className="h-11 rounded-xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/60 text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground">Category</Label>
                                <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border text-foreground">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border-border text-foreground">
                                        <SelectItem value="productivity">Productivity</SelectItem>
                                        <SelectItem value="communication">Communication</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                        <SelectItem value="development">Development</SelectItem>
                                        <SelectItem value="ai">AI</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground">Theme Color</Label>
                                <Input
                                    placeholder="e.g. text-blue-500"
                                    value={formData.color}
                                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                                    className="h-11 rounded-xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/60 font-mono text-xs"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="h-px bg-border" />

                    {/* Authentication Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <Lock className="h-4 w-4 text-emerald-500" />
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500">Authentication Strategy</h3>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">Auth Type</Label>
                            <Select value={formData.auth.type} onValueChange={v => setFormData({ ...formData, auth: { ...formData.auth, type: v } })}>
                                <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-emerald-500/20 text-emerald-500 font-bold uppercase tracking-wider text-[10px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground">
                                    <SelectItem value="none">No Auth</SelectItem>
                                    <SelectItem value="bearer">Bearer Token</SelectItem>
                                    <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                                    <SelectItem value="header">Custom Header</SelectItem>
                                    <SelectItem value="query">Query Parameter</SelectItem>
                                    <SelectItem value="basic">Basic Auth</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.auth.type === 'oauth2' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 p-4 rounded-2xl bg-muted/30 border border-border">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Authorize URL</Label>
                                        <div className="relative">
                                            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                placeholder="https://..."
                                                value={formData.auth.authUrl}
                                                onChange={e => setFormData({ ...formData, auth: { ...formData.auth, authUrl: e.target.value } })}
                                                className="pl-9 h-9 rounded-lg bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/60 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Token URL</Label>
                                        <div className="relative">
                                            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                placeholder="https://..."
                                                value={formData.auth.tokenUrl}
                                                onChange={e => setFormData({ ...formData, auth: { ...formData.auth, tokenUrl: e.target.value } })}
                                                className="pl-9 h-9 rounded-lg bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/60 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Client ID</Label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                placeholder="Enter Client ID"
                                                value={formData.auth.clientId}
                                                onChange={e => setFormData({ ...formData, auth: { ...formData.auth, clientId: e.target.value } })}
                                                className="pl-9 h-9 rounded-lg bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/60 text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Client Secret</Label>
                                        <div className="relative">
                                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                type="password"
                                                placeholder="Enter Secret"
                                                value={formData.auth.clientSecret}
                                                onChange={e => setFormData({ ...formData, auth: { ...formData.auth, clientSecret: e.target.value } })}
                                                className="pl-9 h-9 rounded-lg bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/60 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Scopes (Space-separated)</Label>
                                    <Input
                                        placeholder="openid profile email https://..."
                                        value={formData.auth.scope}
                                        onChange={e => setFormData({ ...formData, auth: { ...formData.auth, scope: e.target.value } })}
                                        className="h-9 rounded-lg bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/60 text-xs"
                                    />
                                </div>
                            </div>
                        )}

                        {formData.auth.type === 'header' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Header Name</Label>
                                <Input
                                    placeholder="e.g. X-API-Key or Authorization"
                                    value={formData.auth.headerName}
                                    onChange={e => setFormData({ ...formData, auth: { ...formData.auth, headerName: e.target.value } })}
                                    className="h-10 rounded-xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/60"
                                />
                            </div>
                        )}

                        {formData.auth.type === 'query' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Parameter Name</Label>
                                <Input
                                    placeholder="e.g. api_key or token"
                                    value={formData.auth.queryParam}
                                    onChange={e => setFormData({ ...formData, auth: { ...formData.auth, queryParam: e.target.value } })}
                                    className="h-10 rounded-xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/60"
                                />
                            </div>
                        )}
                    </section>
                </div>

                <div className="flex gap-4 mt-10 p-2">
                    <Button variant="ghost" className="flex-1 h-12 rounded-2xl font-bold text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        className="flex-[2] h-12 rounded-2xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold shadow-lg shadow-blue-500/25 transition-all active:scale-95"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Zap className="h-5 w-5 mr-2 fill-current" />}
                        Launch Dynamic Connector
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Zap, Settings } from "lucide-react"
import { toast } from "sonner"
import axios from 'axios';
import { API_URL } from '@/ui_components/api/apiurl';
import { Textarea } from '@/components/ui/textarea';
import { getServices } from "../api/connectionlist";
import { useUser } from '@/context/UserContext';

interface CreateTriggerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    connectorId?: string;
    initialData?: { name: string; definition: any };
}

export function CreateTriggerDialog({ open, onOpenChange, connectorId, initialData }: CreateTriggerDialogProps) {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [connectors, setConnectors] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        connector_id: '',
        name: '',
        definition: ''
    });

    useEffect(() => {
        if (open && user?.id) {
            getServices(user.id).then((res: any) => {
                setConnectors(res.data || []);
                setFormData(prev => ({
                    ...prev,
                    connector_id: connectorId || prev.connector_id,
                    name: initialData?.name || prev.name,
                    definition: initialData?.definition ? JSON.stringify(initialData.definition, null, 2) : prev.definition
                }));
            }).catch(err => {
                console.error("Failed to load connectors", err);
            });
        }
    }, [open, user?.id, connectorId, initialData]);

    const handleSubmit = async () => {
        if (!formData.connector_id || !formData.name || !formData.definition) {
            toast.error("All fields are required");
            return;
        }

        let parsedDefinition;
        try {
            parsedDefinition = JSON.parse(formData.definition);
        } catch (e) {
            toast.error("Invalid JSON in definition");
            return;
        }

        setLoading(true);

        try {
            await axios.post(`${API_URL}/api/v1/pieces/triggers`, {
                connector_id: formData.connector_id,
                name: formData.name,
                definition: parsedDefinition
            });

            toast.success("Trigger created successfully!");
            onOpenChange(false);
            setFormData({ connector_id: '', name: '', definition: '' });
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Failed to create trigger");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] border-border bg-background p-6 text-foreground">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-foreground">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <Zap className="h-6 w-6 text-emerald-400" />
                        </div>
                        Create Trigger
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Define a new event trigger for a connector.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">Select Connector</Label>
                            <Select value={formData.connector_id} onValueChange={v => setFormData({ ...formData, connector_id: v })}>
                                <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border text-foreground">
                                    <SelectValue placeholder="Choose a connector" />
                                </SelectTrigger>
                                <SelectContent className="bg-background border-border text-foreground">
                                    {connectors.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.id})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground">Trigger Name</Label>
                            <Input
                                placeholder="e.g. onIssueOpened"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="h-11 rounded-xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/60"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-muted-foreground">Definition (JSON)</Label>
                                <span className="text-[10px] text-muted-foreground/50 font-mono">Accepts JSON object</span>
                            </div>
                            <Textarea
                                placeholder='{"type": "webhook", ...}'
                                value={formData.definition}
                                onChange={e => setFormData({ ...formData, definition: e.target.value })}
                                className="min-h-[300px] rounded-xl bg-muted/50 border-border text-foreground placeholder:text-muted-foreground/60 font-mono text-xs resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <Button variant="ghost" className="flex-1 h-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        className="flex-[2] h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Settings className="h-5 w-5 mr-2" />}
                        Create Trigger
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

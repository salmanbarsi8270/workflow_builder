import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Settings, Play } from "lucide-react"
import { toast } from "sonner"
import axios from 'axios';
import { API_URL } from '@/ui_components/api/apiurl';
import { Textarea } from '@/components/ui/textarea';
import { getServices } from "../api/connectionlist";
import { useUser } from '@/context/UserContext';

interface CreateActionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateActionDialog({ open, onOpenChange }: CreateActionDialogProps) {
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
            }).catch(err => {
                console.error("Failed to load connectors", err);
            });
        }
    }, [open, user?.id]);

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
            await axios.post(`${API_URL}/api/v1/pieces/actions`, {
                connector_id: formData.connector_id,
                name: formData.name,
                definition: parsedDefinition
            });

            toast.success("Action created successfully!");
            onOpenChange(false);
            setFormData({ connector_id: '', name: '', definition: '' });
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Failed to create action");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] border-slate-200 dark:border-white/10 bg-[#020617] p-6 text-white">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                        <div className="p-2 rounded-lg bg-violet-500/10">
                            <Play className="h-6 w-6 text-violet-400" />
                        </div>
                        Create Action
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Define a new action for a connector.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-300">Select Connector</Label>
                            <Select value={formData.connector_id} onValueChange={v => setFormData({ ...formData, connector_id: v })}>
                                <SelectTrigger className="h-11 rounded-xl bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Choose a connector" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0f172a] border-white/10 text-white">
                                    {connectors.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.id})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-300">Action Name</Label>
                            <Input
                                placeholder="e.g. createRepository"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-slate-300">Definition (JSON)</Label>
                                <span className="text-[10px] text-slate-500 font-mono">Accepts JSON object</span>
                            </div>
                            <Textarea
                                placeholder='{"url": "/repos", "method": "POST", ...}'
                                value={formData.definition}
                                onChange={e => setFormData({ ...formData, definition: e.target.value })}
                                className="min-h-[300px] rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-600 font-mono text-xs resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <Button variant="ghost" className="flex-1 h-12 rounded-xl text-slate-300 hover:text-white hover:bg-white/10" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        className="flex-[2] h-12 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Settings className="h-5 w-5 mr-2" />}
                        Create Action
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

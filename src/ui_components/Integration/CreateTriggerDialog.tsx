import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Zap, Sparkles, Code2, Lightbulb } from "lucide-react"
import { toast } from "sonner"
import axios from 'axios';
import { API_URL } from '@/ui_components/api/apiurl';
import { Textarea } from '@/components/ui/textarea';
import { getServices } from "../api/connectionlist";
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';

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
    const [connecting, setConnecting] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [isUpdate, setIsUpdate] = useState(false);

    const [formData, setFormData] = useState({
        connector_id: '',
        name: '',
        definition: ''
    });

    useEffect(() => {
        if (open) {
            const isUpdateMode = !!initialData;
            setIsUpdate(isUpdateMode);
            
            if (user?.id) {
                setConnecting(true);
                getServices(user.id).then((res: any) => {
                    setConnectors(res.data || []);
                }).catch(err => {
                    console.error("Failed to load connectors", err);
                }).finally(() => {
                    setConnecting(false);
                });
            }

            if (initialData) {
                setFormData({
                    connector_id: connectorId || '',
                    name: initialData.name || '',
                    definition: initialData.definition ? JSON.stringify(initialData.definition, null, 2) : ''
                });
            } else {
                setFormData({
                    connector_id: connectorId || '',
                    name: '',
                    definition: ''
                });
            }
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

            toast.success(isUpdate ? "Trigger updated successfully!" : "Trigger created successfully!");
            onOpenChange(false);
            setFormData({ connector_id: '', name: '', definition: '' });
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Failed to create trigger");
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = formData.connector_id && formData.name && formData.definition;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] border-0 bg-white dark:bg-slate-900 p-0 text-foreground overflow-hidden shadow-2xl">
                {/* Animated background glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>

                <div className="relative">
                    {/* Header with gradient accent */}
                    <DialogHeader className="border-b border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/10 p-6 backdrop-blur-sm">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-linear-to-br from-emerald-500 to-emerald-600 shadow-lg">
                                    <Zap className="h-5 w-5 text-white" />
                                </div>
                                <DialogTitle className="text-2xl font-bold bg-linear-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">
                                    {isUpdate ? 'Update Trigger' : 'Create Trigger'}
                                </DialogTitle>
                                {isUpdate && (
                                    <span className="ml-auto px-3 py-1 text-xs font-semibold rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/20 dark:border-amber-500/30">
                                        Edit Mode
                                    </span>
                                )}
                            </div>
                            <DialogDescription className="text-slate-500 dark:text-slate-400 ml-11">
                                {isUpdate ? `Update existing trigger: ${initialData?.name}` : 'Define a new event trigger for a connector.'}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    {/* Content */}
                    <div className="max-h-[65vh] overflow-y-auto p-6 custom-scrollbar space-y-5">
                        {/* Connector Select */}
                        <div className="space-y-2.5 group">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300 flex items-center gap-2">
                                <Code2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                                Select Connector
                            </Label>
                            <Select 
                                disabled
                                value={formData.connector_id} 
                                onValueChange={v => setFormData({ ...formData, connector_id: v })}
                            >
                                <SelectTrigger className={cn(
                                    "h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-foreground transition-all duration-300 hover:border-emerald-500/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800",
                                    focusedField === 'connector' && "border-emerald-500 bg-white dark:bg-slate-800"
                                )}
                                    onFocus={() => setFocusedField('connector')}
                                    onBlur={() => setFocusedField(null)}
                                >
                                    <div className="flex items-center gap-2">
                                        {connecting && <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />}
                                        <SelectValue placeholder="Choose a connector" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-foreground">
                                    {connecting ? (
                                        <div className="flex items-center justify-center p-4">
                                            <Loader2 className="h-4 w-4 animate-spin mr-2 text-emerald-500 dark:text-emerald-400" />
                                            <span className="text-sm text-slate-500 dark:text-slate-400">Loading connectors...</span>
                                        </div>
                                    ) : (
                                        connectors.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20">{c.name} ({c.id})</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {isUpdate && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1">
                                    <Lightbulb className="h-3 w-3" />
                                    Connector cannot be changed in edit mode
                                </p>
                            )}
                        </div>

                        {/* Trigger Name */}
                        <div className="space-y-2.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300 flex items-center gap-2">
                                <Sparkles className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                                Trigger Name
                            </Label>
                            <Input
                                placeholder="e.g. onIssueOpened"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => setFocusedField(null)}
                                className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-foreground placeholder:text-slate-400 transition-all duration-300 hover:border-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800"
                            />
                        </div>

                        {/* Definition JSON */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300 flex items-center gap-2">
                                    <Code2 className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
                                    Definition (JSON)
                                </Label>
                                <span className="text-[10px] text-slate-500 font-mono bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                    JSON Object
                                </span>
                            </div>
                            <Textarea
                                placeholder='{"type": "webhook", ...}'
                                value={formData.definition}
                                onChange={e => setFormData({ ...formData, definition: e.target.value })}
                                onFocus={() => setFocusedField('definition')}
                                onBlur={() => setFocusedField(null)}
                                className="min-h-[280px] rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-foreground placeholder:text-slate-400 font-mono text-xs resize-none transition-all duration-300 hover:border-purple-500/50 focus:border-purple-500 focus:bg-white dark:focus:bg-slate-800 p-4"
                            />
                            <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <Lightbulb className="h-3 w-3" />
                                Ensure valid JSON format for successful trigger creation
                            </p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm p-6 flex gap-3">
                        <Button 
                            variant="ghost" 
                            className="flex-1 h-11 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-700 transition-all duration-300 font-medium" 
                            onClick={() => onOpenChange(false)} 
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            className={cn(
                                "flex-1 h-11 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2",
                                isFormValid && !loading
                                    ? "bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg hover:shadow-xl"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                            )}
                            onClick={handleSubmit}
                            disabled={loading || !isFormValid}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Zap className="h-4 w-4" />
                                    {isUpdate ? 'Update Trigger' : 'Create Trigger'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
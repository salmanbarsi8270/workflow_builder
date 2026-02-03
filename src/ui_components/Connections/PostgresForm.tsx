import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Database, Loader2 } from "lucide-react"
import { toast } from "sonner"
import axios from 'axios';
import { API_URL } from '@/ui_components/api/apiurl';
import { useUser } from '@/context/UserContext';
import { useNavigate } from 'react-router-dom';

interface PostgresFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    serviceId?: string;
}

export function PostgresForm({ open, onOpenChange, serviceId = 'database' }: PostgresFormProps) {
    const { user } = useUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [useConnectionString, setUseConnectionString] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        connectionString: '',
        host: 'localhost',
        port: 5432,
        database: '',
        user: '',
        password: '',
        ssl: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error("Name is required");
            return;
        }

        if (useConnectionString && !formData.connectionString) {
            toast.error("Connection string is required");
            return;
        }

        if (!useConnectionString) {
            if (!formData.host || !formData.database || !formData.user) {
                toast.error("Host, Database, and User are required");
                return;
            }
        }

        setLoading(true);

        try {
            await axios.post(`${API_URL}/api/connections/database`, {
                userId: user?.id,
                name: formData.name,
                serviceId: serviceId,
                connectionString: useConnectionString ? formData.connectionString : undefined,
                host: !useConnectionString ? formData.host : undefined,
                port: !useConnectionString ? formData.port : undefined,
                database: !useConnectionString ? formData.database : undefined,
                user: !useConnectionString ? formData.user : undefined,
                password: !useConnectionString ? formData.password : undefined,
                ssl: !useConnectionString ? formData.ssl : undefined
            });

            toast.success("Database connected successfully!");
            onOpenChange(false);
            navigate(0); // Refresh page to show new connection

        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || "Failed to connect to database");
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
                            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        Connect PostgreSQL Database
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400">
                        Add a PostgreSQL database connection.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                Connection Name
                            </Label>
                            <Input
                                placeholder="e.g. Production DB"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                            />
                        </div>

                        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                            <Label className="text-sm font-medium">Use Connection String</Label>
                            <Switch checked={useConnectionString} onCheckedChange={setUseConnectionString} />
                        </div>

                        {useConnectionString ? (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                    Connection String
                                </Label>
                                <Input
                                    placeholder="postgres://user:pass@host:5432/db?sslmode=require"
                                    value={formData.connectionString}
                                    onChange={(e) => setFormData({ ...formData, connectionString: e.target.value })}
                                    className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 font-mono text-sm"
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Host</Label>
                                    <Input
                                        placeholder="localhost"
                                        value={formData.host}
                                        onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Port</Label>
                                    <Input
                                        type="number"
                                        placeholder="5432"
                                        value={formData.port}
                                        onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 5432 })}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Database Name</Label>
                                    <Input
                                        placeholder="my_database"
                                        value={formData.database}
                                        onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">User</Label>
                                    <Input
                                        placeholder="postgres"
                                        value={formData.user}
                                        onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="Min 8 chars"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="h-11 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                                    />
                                </div>
                                <div className="col-span-2 flex items-center justify-between pt-2">
                                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable SSL</Label>
                                    <Switch checked={formData.ssl} onCheckedChange={(checked) => setFormData({ ...formData, ssl: checked })} />
                                </div>
                            </div>
                        )}
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
                        className="rounded-xl h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            "Connect Database"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

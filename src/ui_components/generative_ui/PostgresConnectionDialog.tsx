import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Database, Server, Globe, Lock, Key, ShieldCheck, Info, ChevronRight, Loader2, Link2 } from 'lucide-react';
import { API_URL } from '../api/apiurl';
import { useUser } from '../../context/UserContext';
import { toast } from 'sonner';

interface PostgresConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PostgresConnectionDialog({ open, onOpenChange, onSuccess }: PostgresConnectionDialogProps) {
    const { user } = useUser();
    const [isConnecting, setIsConnecting] = useState(false);
    const [mode, setMode] = useState('parameters'); // 'parameters' or 'string'
    const [name, setName] = useState('PostgreSQL Connection');
    
    // Parameters state
    const [host, setHost] = useState('');
    const [port, setPort] = useState('5432');
    const [database, setDatabase] = useState('');
    const [dbUser, setDbUser] = useState('');
    const [password, setPassword] = useState('');
    const [ssl, setSsl] = useState(false);

    // Connection String state
    const [connectionString, setConnectionString] = useState('');

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user) {
            toast.error("User not authenticated");
            return;
        }

        let finalConnectionString = '';

        if (mode === 'parameters') {
            if (!host || !database || !dbUser || !password) {
                toast.error("Please fill in all required fields");
                return;
            }
            
            // Format connection string: postgresql://user:password@host:port/database
            const encodedUser = encodeURIComponent(dbUser);
            const encodedPassword = encodeURIComponent(password);
            finalConnectionString = `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${database}${ssl ? '?ssl=true' : ''}`;
        } else {
            if (!connectionString) {
                toast.error("Please provide a connection string");
                return;
            }
            if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
                toast.error("Invalid connection string format (must start with postgresql://)");
                return;
            }
            finalConnectionString = connectionString;
        }

        setIsConnecting(true);

        try {
            const response = await fetch(`${API_URL}/api/connections/key`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    service: 'postgres',
                    apiKey: finalConnectionString,
                    name: name
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success("PostgreSQL connected successfully!");
                onOpenChange(false);
                if (onSuccess) onSuccess();
                
                // Clear form
                setHost('');
                setDatabase('');
                setDbUser('');
                setPassword('');
                setConnectionString('');
            } else {
                toast.error(data.error || "Failed to connect to database");
            }
        } catch (error: any) {
            console.error("Postgres connection error:", error);
            toast.error("An unexpected error occurred during connection");
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl p-0 gap-0 flex flex-col">
                <div className="bg-linear-to-br from-indigo-500/10 via-transparent to-blue-500/5 p-8 border-b border-border/40 shrink-0">
                    <div className="h-14 w-14 rounded-2xl bg-white dark:bg-white/5 shadow-xl border border-border/40 flex items-center justify-center mb-6">
                        <Database className="h-7 w-7 text-indigo-500" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold tracking-tight">Connect PostgreSQL</DialogTitle>
                        <DialogDescription className="text-muted-foreground/80 mt-2 leading-relaxed">
                            Configure your database credentials to enable automated queries and schema discovery.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                
                <form onSubmit={handleConnect} className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                        <Tabs value={mode} onValueChange={setMode} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 dark:bg-white/5 p-1 rounded-xl h-12">
                                <TabsTrigger 
                                    value="parameters" 
                                    className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest transition-all"
                                >
                                    <Server className="h-3.5 w-3.5 mr-2" /> Parameters
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="string" 
                                    className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest transition-all"
                                >
                                    <Link2 className="h-3.5 w-3.5 mr-2" /> Connection String
                                </TabsTrigger>
                            </TabsList>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label htmlFor="pg-name" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                        Connection Name
                                    </Label>
                                    <Input 
                                        id="pg-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="My Production DB" 
                                        className="bg-slate-50/50 dark:bg-white/5 border-border/40 h-11 focus-visible:ring-indigo-500/30" 
                                    />
                                </div>

                                <TabsContent value="parameters" className="mt-0 space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Server className="h-3 w-3" /> Host Connection
                                        </Label>
                                        <div className="flex gap-3">
                                            <div className="grow">
                                                <Input 
                                                    placeholder="db.example.com" 
                                                    value={host}
                                                    onChange={(e) => setHost(e.target.value)}
                                                    className="bg-slate-50/50 dark:bg-white/5 border-border/40 h-11 focus-visible:ring-indigo-500/30" 
                                                />
                                            </div>
                                            <div className="w-24">
                                                <Input 
                                                    placeholder="5432" 
                                                    value={port}
                                                    onChange={(e) => setPort(e.target.value)}
                                                    className="bg-slate-50/50 dark:bg-white/5 border-border/40 h-11 focus-visible:ring-indigo-500/30" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Globe className="h-3 w-3" /> Database & User
                                        </Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input 
                                                placeholder="database_name" 
                                                value={database}
                                                onChange={(e) => setDatabase(e.target.value)}
                                                className="bg-slate-50/50 dark:bg-white/5 border-border/40 h-11 focus-visible:ring-indigo-500/30" 
                                            />
                                            <Input 
                                                placeholder="postgres" 
                                                value={dbUser}
                                                onChange={(e) => setDbUser(e.target.value)}
                                                className="bg-slate-50/50 dark:bg-white/5 border-border/40 h-11 focus-visible:ring-indigo-500/30" 
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Lock className="h-3 w-3" /> Security
                                        </Label>
                                        <div className="relative">
                                            <Input 
                                                type="password" 
                                                placeholder="••••••••••••" 
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="bg-slate-50/50 dark:bg-white/5 border-border/40 h-11 focus-visible:ring-indigo-500/30 pl-10" 
                                            />
                                            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-slate-50/50 dark:bg-white/5 border border-border/40 rounded-xl p-4">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="h-5 w-5 text-indigo-500" />
                                            <div>
                                                <div className="text-sm font-bold">SSL Connection</div>
                                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Encrypt data in transit</div>
                                            </div>
                                        </div>
                                        <Switch checked={ssl} onCheckedChange={setSsl} />
                                    </div>
                                </TabsContent>

                                <TabsContent value="string" className="mt-0 space-y-6">
                                    <div className="space-y-3">
                                        <Label htmlFor="pg-string" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Link2 className="h-3 w-3" /> Connection URL
                                        </Label>
                                        <Textarea 
                                            id="pg-string"
                                            value={connectionString}
                                            onChange={(e) => setConnectionString(e.target.value)}
                                            placeholder="postgresql://user:password@localhost:5432/database_name?ssl=true" 
                                            className="bg-slate-50/50 dark:bg-white/5 border-border/40 min-h-[120px] focus-visible:ring-indigo-500/30 font-mono text-xs leading-relaxed" 
                                        />
                                        <p className="text-[10px] text-muted-foreground px-1 leading-relaxed">
                                            Supports full PostgreSQL URLs including <strong>user</strong>, <strong>password</strong>, <strong>host</strong>, <strong>port</strong>, and <strong>query parameters</strong> like <strong>ssl=true</strong>.
                                        </p>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>

                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 flex gap-3">
                            <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-[12px] text-amber-700 dark:text-amber-400/80 leading-relaxed italic">
                                Ensure your database allows connections from our IP range. Use read-only users for maximum security.
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-8 border-t border-border/40 flex gap-3 shrink-0">
                        <Button 
                            variant="ghost" 
                            type="button" 
                            className="grow h-12 font-bold tracking-tight rounded-xl"
                            onClick={() => onOpenChange(false)}
                        >
                            CANCEL
                        </Button>
                        <Button 
                            className="grow-2 h-12 font-bold tracking-tight rounded-xl shadow-xl shadow-indigo-500/20 relative overflow-hidden group/btn"
                            disabled={isConnecting}
                            type="submit"
                        >
                            {isConnecting ? (
                                <div className="flex items-center gap-2 relative z-10">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>CONNECTING...</span>
                                </div>
                            ) : (
                                <span className="relative z-10 flex items-center gap-2">
                                    TEST & CONNECT <ChevronRight className="h-4 w-4" />
                                </span>
                            )}
                            <div className="absolute inset-0 bg-linear-to-r from-indigo-600 to-blue-600 opacity-90" />
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

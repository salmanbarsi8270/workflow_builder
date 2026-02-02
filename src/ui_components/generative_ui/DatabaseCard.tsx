import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Database, Zap, Shield, Globe, ChevronRight, Check, Activity, Server, Key, Table } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PostgresConnectionDialog } from './PostgresConnectionDialog';

export const DatabaseCard = ({ 
    name = "PostgreSQL",
    host = "localhost",
    database = "main_db",
    status = "connected",
    latency = "24ms",
    usage = 45,
    capabilities = ["Query", "Schema", "AI-Optimized"],
    description = "Enterprise-grade relational database for structured data management.",
    version = "15.4",
    onConnect,
    className
}: any) => {
    const [isHovered, setIsHovered] = useState(false);
    const [connectDialogOpen, setConnectDialogOpen] = useState(false);

    const getStatusColor = (s: string) => {
        switch (s.toLowerCase()) {
            case 'connected': return 'bg-emerald-500';
            case 'connecting': return 'bg-amber-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-slate-400';
        }
    };

    return (
        <>
            <Card 
                className={cn(
                    "overflow-hidden border-border/40 bg-card/60 backdrop-blur-md transition-all duration-300 group",
                    isHovered ? "shadow-xl shadow-primary/5 border-primary/20 -translate-y-1" : "shadow-sm",
                    className
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1">
                        <Activity className="h-2.5 w-2.5" /> Live
                    </Badge>
                </div>

                <CardHeader className="p-5 pb-2">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="h-12 w-12 rounded-xl bg-linear-to-br from-indigo-500/10 to-blue-500/10 border border-blue-500/20 flex items-center justify-center relative overflow-hidden">
                                <Database className="h-6 w-6 text-indigo-500 relative z-10" />
                                <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg tracking-tight">{name}</h3>
                                    <div className={cn("h-2 w-2 rounded-full", getStatusColor(status))} />
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 font-mono">
                                    <Server className="h-3 w-3" /> {host}
                                    <span className="opacity-30">•</span>
                                    <Globe className="h-3 w-3" /> {database}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-5 py-4 space-y-5">
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                        {description}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Latency</span>
                            <div className="flex items-center gap-2">
                                <Zap className="h-3.5 w-3.5 text-amber-500" />
                                <span className="font-bold font-mono">{latency}</span>
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Version</span>
                            <div className="flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5 text-blue-500" />
                                <span className="font-bold font-mono">v{version}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Resource Usage</span>
                            <span className="font-mono font-bold text-primary">{usage}%</span>
                        </div>
                        <Progress value={usage} className="h-1.5 bg-primary/10" />
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {capabilities.map((cap: string) => (
                            <div key={cap} className="px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10 text-[10px] font-bold uppercase tracking-wider text-primary/80 flex items-center gap-1">
                               <Check className="h-2.5 w-2.5" /> {cap}
                            </div>
                        ))}
                    </div>
                </CardContent>

                <CardFooter className="p-4 bg-slate-50/50 dark:bg-white/2 border-t border-border/40 flex justify-between items-center">
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white dark:hover:bg-white/10 shadow-sm border border-transparent hover:border-border">
                            <Key className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white dark:hover:bg-white/10 shadow-sm border border-transparent hover:border-border">
                            <Table className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                    </div>
                    
                    <Button 
                        onClick={() => setConnectDialogOpen(true)}
                        className="gap-2 text-xs font-bold rounded-lg shadow-lg shadow-primary/20 px-4 h-9 group/btn overflow-hidden relative"
                    >
                        <span className="relative z-10 flex items-center gap-2 text-primary-foreground">
                            ADD ACCOUNT <ChevronRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-linear-to-r from-primary to-blue-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </Button>
                </CardFooter>
            </Card>

            <PostgresConnectionDialog 
                open={connectDialogOpen} 
                onOpenChange={setConnectDialogOpen} 
                onSuccess={onConnect}
            />
        </>
    );
};

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    XCircle,
    TrendingUp,
    Trash2,
    ChevronRight,
    Search,
    Clock,
    Cpu,
    Zap,
    History
} from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { io, type Socket } from 'socket.io-client';
import { API_URL } from '../api/apiurl';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EvalsSummary {
    total: number;
    passed: number;
    failed: number;
    avgScore: number;
}

interface RecentEvalLog {
    id: string;
    agentName: string;
    model: string;
    score: number;
    latency: number;
    promptTokens: number;
    completionTokens: number;
    status: string;
    timestamp: string;
    conversationId: string;
    userMessage: string;
    agentOutput: string;
    reasoning: string;
}

export default function LiveEvals() {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [summary, setSummary] = useState<EvalsSummary>({ total: 0, passed: 0, failed: 0, avgScore: 0 });
    const [recentLogs, setRecentLogs] = useState<RecentEvalLog[]>([]);
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const socketRef = useRef<Socket | null>(null);
    const isInitialLoad = useRef(true);

    // Persist selection stability
    const selectedLog = useMemo(() =>
        recentLogs.find(l => l.id === selectedLogId) || null
        , [recentLogs, selectedLogId]);

    useEffect(() => {
        if (user?.id) {
            const newSocket = io(API_URL, {
                withCredentials: true,
            });
            socketRef.current = newSocket;

            newSocket.on('connect', () => {
                fetchData(newSocket);
            });

            const interval = setInterval(() => fetchData(newSocket), 5000);

            return () => {
                newSocket.disconnect();
                clearInterval(interval);
                socketRef.current = null;
            };
        }
    }, [user?.id]);

    useEffect(() => {
        if (isInitialLoad.current && recentLogs.length > 0) {
            setSelectedLogId(recentLogs[0].id);
            isInitialLoad.current = false;
        }
    }, [recentLogs]);

    const fetchData = (s: Socket) => {
        if (!s || !user?.id) return;

        s.emit('get-evals-summary', { userId: user.id }, (response: any) => {
            if (response.success) setSummary(response.summary);
        });

        s.emit('get-recent-evals-log', { userId: user.id }, (response: any) => {
            if (response.success) {
                setRecentLogs(response.logs);
            }
            setIsLoading(false);
        });
    };

    const handleDelete = (e: React.MouseEvent, logId: string) => {
        e.stopPropagation();
        if (!socketRef.current || !user?.id) return;

        if (confirm('Are you sure you want to delete this evaluation log?')) {
            socketRef.current.emit('delete-eval-log', { evalId: logId, userId: user.id }, (res: any) => {
                if (res.success) {
                    setRecentLogs(prev => prev.filter(l => l.id !== logId));
                    if (selectedLogId === logId) {
                        // Select the next best thing
                        const currentIndex = recentLogs.findIndex(l => l.id === logId);
                        const nextLog = recentLogs[currentIndex + 1] || recentLogs[currentIndex - 1];
                        setSelectedLogId(nextLog ? nextLog.id : null);
                    }
                }
            });
        }
    };

    const filteredLogs = recentLogs.filter(log =>
        log.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const statCards = [
        { label: 'Total Runs', value: summary.total, icon: History, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Passed Tests', value: summary.passed, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Failed Tests', value: summary.failed, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { label: 'Health Score', value: `${(summary.avgScore * 100).toFixed(0)}%`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];

    if (isLoading && recentLogs.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative h-16 w-16">
                        <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full" />
                        <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Synchronizing Intelligence...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-[#f8fafc] dark:bg-[#020617] p-8 space-y-8 flex flex-col overflow-hidden font-sans">
            {/* Superly Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
                <div className="space-y-1">
                    <h1 className="text-3xl font-[900] text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                            <Cpu className="h-6 w-6 text-white" />
                        </div>
                        Dynamic Evals
                    </h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-12 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Monitoring
                    </p>
                </div>

                <div className="relative group min-w-[320px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Filter intelligence..."
                        className="w-full pl-12 pr-6 py-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </header>

            {/* Premium Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 shrink-0">
                {statCards.map((stat) => (
                    <Card key={stat.label} className="border-none bg-white dark:bg-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] backdrop-blur-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 group overflow-hidden rounded-2xl ring-1 ring-slate-100 dark:ring-white/5">
                        <CardContent className="p-6 flex items-center gap-5 relative">
                            <div className={cn("p-4 rounded-2xl transition-all duration-500 group-hover:scale-110 shadow-inner", stat.bg)}>
                                <stat.icon className={cn("h-7 w-7", stat.color)} />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{stat.label}</p>
                                <h3 className="text-3xl font-[900] text-slate-900 dark:text-white">{stat.value}</h3>
                            </div>
                            <div className="absolute top-0 right-0 h-full w-[2px] opacity-0 group-hover:opacity-100 bg-blue-500 transition-all" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Superly Split View */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
                {/* Left Pane: Log List */}
                <div className="lg:col-span-5 flex flex-col min-h-0 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                            <Zap className="h-3 w-3 text-amber-500" />
                            Intelligence Stream
                        </h2>
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-[10px] font-black">{filteredLogs.length} LOGS</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none">
                        <AnimatePresence mode="popLayout">
                            {filteredLogs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => setSelectedLogId(log.id)}
                                    className={cn(
                                        "group p-5 cursor-pointer rounded-2xl transition-all duration-300 relative border",
                                        selectedLogId === log.id
                                            ? "bg-white dark:bg-white/10 border-blue-500/50 shadow-[0_10px_40px_-10px_rgba(59,130,246,0.1)] ring-1 ring-blue-500/20"
                                            : "bg-white/50 dark:bg-white/5 border-slate-200/50 dark:border-white/10 hover:border-blue-500/30 hover:shadow-xl"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className={cn(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider",
                                            log.score >= 70 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                        )}>
                                            {log.score >= 70 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                            SCORE: {log.score}%
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(e, log.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-500/20 hover:text-rose-500 rounded-xl transition-all text-slate-400/50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <h4 className="text-[13px] font-[800] text-slate-900 dark:text-white mb-2 line-clamp-1 leading-tight">{log.userMessage}</h4>
                                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed mb-4">
                                        {log.reasoning || "No execution reasoning available."}
                                    </p>
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-white/10" />
                                            <span>{log.latency}MS</span>
                                        </div>
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] bg-blue-500/5 px-2 py-1 rounded-lg">
                                            {log.agentName}
                                        </span>
                                    </div>
                                    {selectedLogId === log.id && (
                                        <motion.div
                                            layoutId="active-indicator"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-blue-500 rounded-r-full"
                                        />
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Pane: Detail View */}
                <div className="lg:col-span-7 flex flex-col min-h-0">
                    <Card className="flex-1 flex flex-col border-none bg-white dark:bg-white/5 shadow-2xl overflow-hidden rounded-[2rem] ring-1 ring-slate-100 dark:ring-white/5">
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Deep Analysis Repository</h2>
                            {selectedLog && (
                                <div className="flex items-center gap-4">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase">Live Context</span>
                                </div>
                            )}
                        </div>

                        {selectedLog ? (
                            <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-none">
                                <motion.div
                                    key={selectedLog.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-10"
                                >
                                    {/* Header Info */}
                                    <div className="flex flex-wrap items-center gap-6">
                                        <div className={cn(
                                            "px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-lg",
                                            selectedLog.score >= 70 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                        )}>
                                            {selectedLog.score >= 70 ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                            {selectedLog.score >= 70 ? "PASSED VERIFICATION" : "FAILED QUALITY CHECK"}
                                        </div>
                                        <div className="px-6 py-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white text-xs font-black tracking-[0.2em] border border-slate-200 dark:border-white/10 uppercase">
                                            SCORE: {(selectedLog.score / 100).toFixed(2)}
                                        </div>
                                    </div>

                                    {/* Content Pairs */}
                                    <div className="grid grid-cols-1 gap-12">
                                        <section className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">Query Source</h3>
                                                <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
                                            </div>
                                            <div className="p-8 rounded-3xl bg-slate-50/80 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed shadow-inner">
                                                "{selectedLog.userMessage}"
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 px-4 py-1.5 bg-purple-500/10 rounded-full border border-purple-500/20">Agent Synthesis</h3>
                                                <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
                                            </div>
                                            <div className="p-8 rounded-3xl bg-white dark:bg-[#020617] border border-slate-200 dark:border-white/5 text-[15px] font-medium text-slate-700 dark:text-slate-200 leading-[1.8] shadow-2xl whitespace-pre-wrap ring-1 ring-slate-100 dark:ring-white/5">
                                                {selectedLog.agentOutput || <span className="opacity-30 italic">Target output was not captured for this process.</span>}
                                            </div>
                                        </section>
                                    </div>

                                    {/* Metadata Footer */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 bg-slate-50/50 dark:bg-white/5 p-6 rounded-3xl border border-slate-100 dark:border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Process Latency</p>
                                            <p className="text-xl font-black text-blue-500">{selectedLog.latency}ms</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Token Density</p>
                                            <p className="text-[13px] font-black text-slate-900 dark:text-white uppercase">{selectedLog.promptTokens + selectedLog.completionTokens} <span className="text-[9px] opacity-40 ml-1">TOTAL</span></p>
                                        </div>
                                        <div className="space-y-1 col-span-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conversation Nexus</p>
                                            <p className="text-[11px] font-bold text-slate-500 truncate" title={selectedLog.conversationId}>{selectedLog.conversationId}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                                <div className="p-8 rounded-[3rem] bg-slate-50 dark:bg-white/5 animate-pulse">
                                    <ChevronRight className="h-20 w-20 text-slate-200 dark:text-slate-800" />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Neural Repository Empty</p>
                                    <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase">Select a stream entry to begin deep analysis</p>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}

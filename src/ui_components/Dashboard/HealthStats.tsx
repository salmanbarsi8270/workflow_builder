import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import { Database01Icon } from "@hugeicons/core-free-icons";
import type { DashboardStats } from './types';
import { motion } from 'framer-motion';

interface HealthStatsProps {
    stats: DashboardStats;
}

export function HealthStats({ stats }: HealthStatsProps) {
    return (
        <Card className="col-span-4 lg:col-span-2 bg-white/70 dark:bg-white/5 backdrop-blur-xl border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl flex flex-col">
            <CardHeader className="pb-4">
                <CardTitle className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-violet-300/50 font-black">System Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 flex-1">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Success Rate</span>
                        <span className="text-xl font-black text-emerald-500 dark:text-emerald-400">{stats.successRate}%</span>
                    </div>
                    <div className="relative h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/10">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.successRate}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="absolute inset-y-0 left-0 bg-linear-to-r from-emerald-500 to-teal-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        />
                    </div>
                </div>
                
                <Separator className="bg-slate-200/50 dark:bg-white/10" />

                <div className="space-y-4">
                    <div className="flex items-center gap-4 group">
                        <div className="h-12 w-12 rounded-2xl bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                            <HugeiconsIcon icon={Database01Icon} className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Most Used App</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{stats.mostUsedApp}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

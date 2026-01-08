import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import type { ActivityChartData } from './types';

interface ActivityChartProps {
    data: ActivityChartData[];
}

export function ActivityChart({ data }: ActivityChartProps) {
    return (
        <Card className="col-span-4 lg:col-span-5 bg-white/70 dark:bg-white/5 backdrop-blur-xl border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl">
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                    <CardTitle className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-violet-300/50 font-black">Activity Overview</CardTitle>
                </div>
                <CardDescription className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Executions History</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                        />
                        <RechartsTooltip 
                            contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                                backdropFilter: 'blur(12px)',
                                borderRadius: '12px',
                                border: '1px solid rgba(226, 232, 240, 0.5)',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                padding: '12px'
                            }}
                            itemStyle={{ color: '#6366f1', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}
                            labelStyle={{ color: '#64748b', fontWeight: 700, fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase' }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="runs" 
                            stroke="#8b5cf6" 
                            fillOpacity={1} 
                            fill="url(#colorRuns)" 
                            strokeWidth={4}
                            dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

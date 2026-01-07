import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import type { ActivityChartData } from './types';

interface ActivityChartProps {
    data: ActivityChartData[];
}

export function ActivityChart({ data }: ActivityChartProps) {
    return (
        <Card className="col-span-4 lg:col-span-5">
            <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Executions over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="runs" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRuns)" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

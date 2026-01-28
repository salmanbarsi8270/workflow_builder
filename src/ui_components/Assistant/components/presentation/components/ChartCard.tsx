"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart, Area, AreaChart, Pie, PieChart, Cell } from "recharts"
import { cn } from "@/lib/utils"
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

export const ChartCard = ({
    title,
    type = 'bar',
    data = [],
    config = {},
    dataKey = 'value',
    categoryKey = 'name',
    className
}: any) => {
    // Dynamic config generation: ensure primary color is applied to detected keys
    const chartConfig = React.useMemo(() => {
        const mergedConfig: ChartConfig = { ...config };

        // Find all keys in the data that are not the category key
        const keysInData = data.length > 0
            ? Object.keys(data[0]).filter(k => k !== categoryKey)
            : [dataKey];

        // Ensure every key has a color, defaulting to primary tints
        keysInData.forEach((key, index) => {
            if (!mergedConfig[key]) {
                mergedConfig[key] = {
                    label: key.charAt(0).toUpperCase() + key.slice(1)
                };
            }
            if (!mergedConfig[key].color) {
                // First key gets pure primary, subsequent keys get lighter tints
                const opacity = index === 0 ? 1 : Math.max(0.3, 1 - (index * 0.25));
                mergedConfig[key].color = `hsl(var(--primary) / ${opacity})`;
            }
        });

        return mergedConfig as ChartConfig;
    }, [config, data, dataKey, categoryKey]);

    // Get the first few keys for multi-series support (max 4)
    const activeKeys = React.useMemo(() => {
        return data.length > 0
            ? Object.keys(data[0]).filter(k => k !== categoryKey).slice(0, 4)
            : [dataKey];
    }, [data, categoryKey, dataKey]);

    return (
        <div className={cn("flex flex-col w-full h-full min-h-[350px] bg-card/40 border-0", className)}>
            {title && (
                <div className="px-6 py-4 border-b border-white/10">
                    <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                </div>
            )}
            {/*
                CRITICAL FIX:
                Recharts ResponsiveContainer requires a parent with concrete, non-zero dimensions.
                We use w-full and a fixed/min height here, and 'flex-1' to allow it to grow if needed,
                but 'min-h-[300px]' ensures it never collapses to 0 height during flex calculations.
            */}
            <div className="flex-1 p-6 w-full min-h-[300px]">
                <ChartContainer config={chartConfig} className="h-full w-full min-h-[300px]">
                    {type === 'bar' && (
                        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                            <CartesianGrid vertical={false} strokeOpacity={0.1} />
                            <XAxis
                                dataKey={categoryKey}
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                className="text-[10px] font-medium"
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            {activeKeys.map((key) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={`var(--color-${key})`}
                                    radius={[4, 4, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    )}
                    {type === 'line' && (
                        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                            <CartesianGrid vertical={false} strokeOpacity={0.1} />
                            <XAxis
                                dataKey={categoryKey}
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                className="text-[10px] font-medium"
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            {activeKeys.map((key) => (
                                <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={`var(--color-${key})`}
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 4, strokeWidth: 0 }}
                                />
                            ))}
                        </LineChart>
                    )}
                    {type === 'area' && (
                        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                            <CartesianGrid vertical={false} strokeOpacity={0.1} />
                            <XAxis
                                dataKey={categoryKey}
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                className="text-[10px] font-medium"
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <defs>
                                {activeKeys.map((key, index) => (
                                    <linearGradient key={`gradient-${key}`} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            {activeKeys.map((key) => (
                                <Area
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={`var(--color-${key})`}
                                    fill={`url(#fill-${key})`}
                                    strokeWidth={2}
                                />
                            ))}
                        </AreaChart>
                    )}
                    {type === 'pie' && (
                        <PieChart>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Pie
                                data={dataLinesToPie(data, activeKeys[0] || dataKey, categoryKey)}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={60}
                                strokeWidth={2}
                                stroke="hsl(var(--background))"
                            >
                                {data.map((_: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={`hsl(var(--primary) / ${Math.max(0.2, 1 - (index * 0.15))})`} />
                                ))}
                            </Pie>
                        </PieChart>
                    )}
                </ChartContainer>
            </div>
        </div>
    )
}

const dataLinesToPie = (data: any[], dataKey: string, categoryKey: string) => {
    return data.map(item => ({
        name: item[categoryKey],
        value: item[dataKey]
    }))
}

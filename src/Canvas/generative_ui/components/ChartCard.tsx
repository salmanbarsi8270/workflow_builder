"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart, Area, AreaChart, Pie, PieChart, Cell, YAxis } from "recharts"
import { cn } from "@/lib/utils"
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/chart"

export const ChartCard = ({
    title,
    type = 'bar',
    data = [],
    config = {},
    dataKey = 'value',
    categoryKey = 'name',
    className
}: any) => {
    const chartConfig = React.useMemo(() => {
        const mergedConfig: ChartConfig = { ...config };

        const keysInData = data.length > 0
            ? Object.keys(data[0]).filter(k => k !== categoryKey)
            : [dataKey];

        keysInData.forEach((key, index) => {
            if (!mergedConfig[key]) {
                mergedConfig[key] = {
                    label: key.charAt(0).toUpperCase() + key.slice(1)
                };
            }
            if (!mergedConfig[key].color) {
                mergedConfig[key].color = `var(--color-chart-${(index % 5) + 1})`;
            }
        });

        return mergedConfig as ChartConfig;
    }, [config, data, dataKey, categoryKey]);

    const activeKeys = React.useMemo(() => {
        return data.length > 0
            ? Object.keys(data[0]).filter(k => k !== categoryKey).slice(0, 4)
            : [dataKey];
    }, [data, categoryKey, dataKey]);

    const renderChartContent = () => {
        const commonProps = {
            data,
            margin: { top: 10, right: 10, bottom: 30, left: 0 }
        };

        switch (type) {
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.3} strokeDasharray="3 3" />
                        <XAxis
                            dataKey={categoryKey}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            tickMargin={12}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            width={35}
                        />
                        <ChartTooltip 
                            cursor={{ fill: 'var(--muted)', fillOpacity: 0.2 }}
                            content={<ChartTooltipContent 
                                className="bg-background border shadow-lg"
                                labelClassName="font-medium"
                                formatter={(value, name) => [
                                    <span className="font-semibold" key="value">{value}</span>,
                                    <span key="name" className="text-muted-foreground ml-2">• {name}</span>
                                ]}
                            />}
                        />
                        {activeKeys.map((key, index) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                fill={`var(--color-chart-${index + 1})`}
                                radius={[6, 6, 0, 0]}
                                animationDuration={800}
                                animationEasing="ease-out"
                            />
                        ))}
                    </BarChart>
                );

            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.3} strokeDasharray="3 3" />
                        <XAxis
                            dataKey={categoryKey}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            tickMargin={12}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            width={35}
                        />
                        <ChartTooltip 
                            cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: "3 3" }}
                            content={<ChartTooltipContent 
                                className="bg-background border shadow-lg"
                                labelClassName="font-medium"
                            />}
                        />
                        {activeKeys.map((key, index) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={`var(--color-chart-${index + 1})`}
                                strokeWidth={2.5}
                                dot={{ r: 4, strokeWidth: 2, stroke: 'var(--background)' }}
                                activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--background)' }}
                                animationDuration={800}
                                animationEasing="ease-out"
                            />
                        ))}
                    </LineChart>
                );

            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.3} strokeDasharray="3 3" />
                        <XAxis
                            dataKey={categoryKey}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            tickMargin={12}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            width={35}
                        />
                        <ChartTooltip 
                            cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: "3 3" }}
                            content={<ChartTooltipContent 
                                className="bg-background border shadow-lg"
                                labelClassName="font-medium"
                            />}
                        />
                        <defs>
                            {activeKeys.map((key, index) => (
                                <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={`var(--color-chart-${index + 1})`} stopOpacity={0.3} />
                                    <stop offset="100%" stopColor={`var(--color-chart-${index + 1})`} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        {activeKeys.map((key, index) => (
                            <Area
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={`var(--color-chart-${index + 1})`}
                                fill={`url(#gradient-${key})`}
                                strokeWidth={2}
                                animationDuration={800}
                                animationEasing="ease-out"
                            />
                        ))}
                    </AreaChart>
                );

            case 'pie':
                const pieData = data.map((item:any) => ({
                    name: item[categoryKey],
                    value: item[dataKey]
                }));

                return (
                    <PieChart>
                        <ChartTooltip 
                            content={<ChartTooltipContent 
                                className="bg-background border shadow-lg"
                                formatter={(value) => [
                                    <span className="font-semibold" key="value">{value}</span>,
                                    <span key="percent" className="text-muted-foreground ml-2">
                                        ({(Number(value) / pieData.reduce((sum:any, d:any) => sum + d.value, 0) * 100).toFixed(1)}%)
                                    </span>
                                ]}
                            />}
                        />
                        <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={2}
                            strokeWidth={2}
                            stroke="var(--background)"
                            animationDuration={800}
                            animationEasing="ease-out"
                        >
                            {pieData.map((_:any, index:number) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={`var(--color-chart-${(index % 5) + 1})`}
                                    strokeWidth={2}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                );

            default:
                return null;
        }
    };

    return (
        <div className={cn("bg-card rounded-xl border shadow-sm overflow-hidden", className)}>
            {title && (
                <div className="px-6 pt-5 pb-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                        {type !== 'pie' && activeKeys.length > 1 && (
                            <div className="flex items-center gap-3">
                                {activeKeys.map((key, index) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <div 
                                            className="h-2.5 w-2.5 rounded-full"
                                            style={{ backgroundColor: `var(--color-chart-${index + 1})` }}
                                        />
                                        <span className="text-xs text-muted-foreground font-medium">
                                            {chartConfig[key]?.label || key}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="p-6 pt-0 w-full h-[200px]">
                <ChartContainer config={chartConfig} className="h-full w-full">
                    {renderChartContent()}
                </ChartContainer>
            </div>
        </div>
    );
};
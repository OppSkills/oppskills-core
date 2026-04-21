"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import NoDataPlaceholder from "./NoDataPlaceholder";
import { cn } from "@/lib/utils";

export interface RegistrationData {
    date: string;
    [key: string]: any;
}

interface ChartConfig {
    key: string;
    color: string;
    label: string;
}

interface RegistrationLineChartProps {
    data: RegistrationData[];
    lines?: ChartConfig[];
    title?: string;
}

const DefaultLines: ChartConfig[] = [
    { key: "men", color: "#8b5cf6", label: "Male" },
    { key: "women", color: "#ec4899", label: "Female" },
    { key: "other", color: "#64748b", label: "Others" },
];

const CustomLegend = ({ lines }: { lines: ChartConfig[] }) => (
    <div className="flex gap-6 items-center text-sm font-medium text-muted-foreground">
        {lines.map((line) => (
            <div key={line.key} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }}></span>
                <span>{line.label}</span>
            </div>
        ))}
    </div>
);

export default function RegistrationLineChart({
    data,
    lines = DefaultLines,
    title = "Registration Overview"
}: RegistrationLineChartProps) {
    // Add total
    const chartData = data.map(item => {
        const total = lines.reduce((acc, line) => acc + (item[line.key] || 0), 0);
        return {
            ...item,
            total
        };
    });

    const isDataEmpty = chartData.length === 0 || chartData.every(d => d.total === 0);

    const maxValue = Math.max(...chartData.map((d) => d.total || 0), 10);
    const tickInterval = Math.ceil(maxValue / 4);
    const ticks = [0, tickInterval, tickInterval * 2, tickInterval * 3, tickInterval * 4];
    const domainMax = tickInterval * 4;

    return (
        <div className="w-full bg-background rounded-[20px] p-6 border border-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold">{title}</h2>
                <CustomLegend lines={lines} />
            </div>

            <div className="w-full h-[260px]">
                {isDataEmpty ? (
                    <NoDataPlaceholder message="No data available" className="h-full border-none p-0" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e5e7eb" />

                            <XAxis
                                dataKey="date"
                                axisLine={true}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 10 }}
                                dy={10}
                                stroke="#e5e7eb"
                                minTickGap={40}
                                interval="preserveStartEnd"
                                tickFormatter={(val) => {
                                    // If it's a long date like "dd-mm-yyyy", maybe shorten it
                                    // but for now the grouping logic in backend already handles this
                                    return val;
                                }}
                            />

                            <YAxis
                                ticks={ticks}
                                domain={[0, domainMax]}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                            />

                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />

                            {lines.map((line) => (
                                <Line
                                    key={line.key}
                                    type="monotone"
                                    dataKey={line.key}
                                    stroke={line.color}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "white", stroke: line.color, strokeWidth: 2 }}
                                    activeDot={{ r: 5, strokeWidth: 0 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

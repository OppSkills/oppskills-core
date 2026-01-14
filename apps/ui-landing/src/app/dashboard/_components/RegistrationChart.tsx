"use client";

import Image from "next/image";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import NoDataPlaceholder from "./NoDataPlaceholder";

export interface RegistrationData {
    date: string;
    men: number;
    women: number;
    total?: number;
}
const CustomLegend = () => (
    <div className="flex gap-6 items-center text-sm font-medium text-muted-foreground">
        <div className="flex items-center gap-2">
            <Image src={"/icons/chart/male.svg"} width={16} height={16} alt="Male" />
            <span>Male</span>
        </div>
        <div className="flex items-center gap-2">
            <Image src={"/icons/chart/female.svg"} width={16} height={16} alt="Female" />
            <span>Female</span>
        </div>
        <div className="flex items-center gap-2">
            <Image src={"/icons/chart/total.svg"} width={16} height={16} alt="Female" />
            <span>Total</span>
        </div>
    </div>
);

export default function RegistrationLineChart({ data }: { data: RegistrationData[] }) {
    // Add total
    const chartData = data.map(item => ({
        ...item,
        total: (item.men || 0) + (item.women || 0)
    }));

    const isDataEmpty = chartData.length === 0 || chartData.every(d => d.total === 0);

    const maxValue = Math.max(...chartData.map((d) => d.total || 0), 10); // Default to 10 to avoid 0 scale
    // Create 5 roughly equal ticks
    const tickInterval = Math.ceil(maxValue / 4);
    const ticks = [0, tickInterval, tickInterval * 2, tickInterval * 3, tickInterval * 4];
    const domainMax = tickInterval * 4;

    return (
        <div className="w-full bg-background rounded-[20px] p-6 border border-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-xl font-bold">Registration Overview</h2>
                <CustomLegend />
            </div>

            <div className="w-full h-[260px]">
                {isDataEmpty ? (
                    <NoDataPlaceholder message="No registration data available" className="h-full border-none p-0" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e5e7eb" />

                            <XAxis
                                dataKey="date"
                                axisLine={true}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 14 }}
                                dy={10}
                                stroke="#e5e7eb"
                            />

                            <YAxis
                                ticks={ticks}
                                domain={[0, domainMax]}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 14 }}
                            />

                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />

                            <Line
                                type="monotone"
                                dataKey="men"
                                stroke="#8b5cf6"
                                strokeWidth={1}
                                dot={{ r: 3, fill: "white", stroke: "#8b5cf6", strokeWidth: 1 }}
                                activeDot={{ r: 3, strokeWidth: 0 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="women"
                                stroke="#ec4899"
                                strokeWidth={1}
                                dot={{ r: 3, fill: "white", stroke: "#ec4899", strokeWidth: 1 }}
                                activeDot={{ r: 3, strokeWidth: 0 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="total"
                                stroke="#14b8a6"
                                strokeWidth={1}
                                dot={{ r: 3, fill: "white", stroke: "#14b8a6", strokeWidth: 1 }}
                                activeDot={{ r: 3, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

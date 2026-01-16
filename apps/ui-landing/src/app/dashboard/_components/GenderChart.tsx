"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import NoDataPlaceholder from "./NoDataPlaceholder";

interface GenderData {
    name: string;
    value: number;
    color?: string;
}

export default function GenderChart({ data }: { data: GenderData[] }) {
    const isDataEmpty = data.length === 0 || data.every(d => d.value === 0);

    const COLORS = ["#8b5cf6", "#ec4899", "#14b8a6"]; // Default colors

    return (
        <div className="w-full bg-background rounded-[20px] p-6 border border-border h-[400px] flex flex-col">
            <h2 className="text-xl font-bold mb-6">Gender Distribution</h2>
            <div className="flex-1 w-full min-h-0">
                {isDataEmpty ? (
                    <NoDataPlaceholder message="No gender data available" className="h-full border-none p-0" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
    { date: "2-4", value: 1000 },
    { date: "4-4", value: 2500 },
    { date: "6-4", value: 4000 },
    { date: "8-4", value: 7000 },
    { date: "10-4", value: 11000 },
    { date: "12-4", value: 16000 },
    { date: "14-4", value: 20000 },
    { date: "16-4", value: 26000 },
    { date: "18-4", value: 33000 },
    { date: "20-4", value: 37000 },
    { date: "22-4", value: 43000 },
];

export default function ImpressionsChart() {
    return (
        <div className="w-full bg-background rounded-[20px] p-6 border border-border h-[400px] flex flex-col">
            <h2 className="text-xl font-bold mb-6">Impressions</h2>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12 }}
                            domain={[0, 50000]}
                            ticks={[0, 10000, 20000, 30000, 40000, 50000]}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#a855f7"
                            strokeWidth={2}
                            dot={{ r: 4, fill: "white", stroke: "#a855f7", strokeWidth: 2 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

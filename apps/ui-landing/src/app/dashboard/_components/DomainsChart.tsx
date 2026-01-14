"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import NoDataPlaceholder from "./NoDataPlaceholder";

const data = [
    { name: "Engineering", value: 190, percentage: "63%" },
    { name: "Management", value: 50, percentage: "17%" },
    { name: "Corporate", value: 20, percentage: "7%" },
    { name: "Other", value: 40, percentage: "13%" },
];

export default function DomainsChart() {
    return (
        <div className="w-full bg-background rounded-[20px] p-6 border border-border h-[400px] flex flex-col">
            <h2 className="text-xl font-bold mb-6">Domains</h2>
            <div className="flex-1 w-full min-h-0">
                {data.length === 0 ? (
                    <NoDataPlaceholder message="No domain data available" className="h-full border-none p-0" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 60, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                            <XAxis type="number" axisLine={false} tickLine={false} orientation="top" tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                width={80}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="value" fill="#8979FF" radius={[0, 10, 10, 0]} barSize={40}>
                                <LabelList
                                    dataKey="value"
                                    position="right"
                                    content={({ x, y, width, height, value, index }: any) => {
                                        const item = data[index];
                                        const percentageVal = parseInt(item.percentage.replace('%', ''));
                                        const isSmall = percentageVal < 30;

                                        return (
                                            <text
                                                x={isSmall ? Number(x) + Number(width) + 10 : Number(x) + Number(width) - 10}
                                                y={Number(y) + Number(height) / 2}
                                                dy={4}
                                                textAnchor={isSmall ? "start" : "end"}
                                                fill={isSmall ? "black" : "white"}
                                                fontSize={12}
                                                fontWeight="bold"
                                            >
                                                {value} | {item.percentage}
                                            </text>
                                        )
                                    }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

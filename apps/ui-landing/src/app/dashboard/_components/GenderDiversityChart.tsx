"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Label } from "recharts";
import NoDataPlaceholder from "./NoDataPlaceholder";

// { male: 100, female: 50 }
export interface GenderData {
    [key: string]: number;
}

const CustomLegend = ({ data }: { data: any[] }) => (
    <div className="flex flex-col gap-2 justify-center ml-4">
        {data.map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{entry.name}</span>
                    <span className="text-sm font-bold text-foreground" style={{ color: entry.color }}>{entry.value}</span>
                </div>
            </div>
        ))}
    </div>
);

export default function GenderDiversityChart({ data }: { data: GenderData }) {
    const chartData = [
        { name: "Female", value: data['female'] || data['women'] || 0, color: "#f472b6" }, // Pink
        { name: "Male", value: data['male'] || data['men'] || 0, color: "#818cf8" },   // Blue/Purple
    ];

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    const isDataEmpty = total === 0;

    return (
        <div className="w-full bg-background rounded-[20px] p-6 border border-border h-[400px] flex flex-col">
            <h2 className="text-xl font-bold mb-4">Gender Diversity</h2>
            <div className="flex-1 w-full min-h-0 relative">
                {isDataEmpty ? (
                    <NoDataPlaceholder message="No gender data available" className="h-full border-none p-0" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={5}
                                dataKey="value"
                                cornerRadius={10}
                                startAngle={90}
                                endAngle={450}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                                <Label
                                    value={total}
                                    position="center"
                                    fill="var(--foreground)"
                                    style={{
                                        fontSize: '32px',
                                        fontWeight: 'bold',
                                        fontFamily: 'var(--font-inter)'
                                    }}
                                />
                            </Pie>
                            <Legend
                                layout="vertical"
                                verticalAlign="middle"
                                align="right"
                                content={<CustomLegend data={chartData} />}
                            />
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

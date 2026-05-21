"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import NoDataPlaceholder from "./NoDataPlaceholder";

const data = [
  { name: "Registered", value: 232 },
  { name: "R1 - Synopsis", value: 150 },
  { name: "R2 - Presentation", value: 60 }, // Wrapped text handled via custom tick or just abbreviating
  { name: "R3 - Final Round", value: 30 },
];

const renderCustomAxisTick = ({ x, y, payload }: any) => {
  return (
    <text x={x} y={y} dy={16} textAnchor="middle" fill="#666" fontSize={10}>
      {payload.value.split("-").map((line: string, index: number) => (
        <tspan x={x} dy={index === 0 ? 0 : 12} key={index}>
          {line.trim()}
        </tspan>
      ))}
    </text>
  );
};

export default function RoundStats() {
  return (
    <div className="w-full bg-background rounded-[20px] p-6 border border-border h-[400px] flex flex-col">
      <h2 className="text-xl font-bold mb-6">Round Stats</h2>
      <div className="flex-1 w-full min-h-0">
        {data.length === 0 ? (
          <NoDataPlaceholder
            message="No round stats available"
            className="h-full border-none p-0"
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                interval={0}
                tickFormatter={(value) => {
                  if (value.includes("Presentation"))
                    return "R2 - Presentation\nSubmission";
                  return value;
                }}
              />
              <YAxis hide domain={[0, 300]} />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Bar
                dataKey="value"
                fill="#d8b4fe"
                radius={[10, 10, 0, 0]}
                barSize={60}
              >
                <LabelList
                  dataKey="value"
                  position="top"
                  fill="#6b7280"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

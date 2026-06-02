"use client";

import dynamic from "next/dynamic";
import NoDataPlaceholder from "./NoDataPlaceholder";

const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), {
  ssr: false,
});
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), {
  ssr: false,
});
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  {
    ssr: false,
  },
);
const Legend = dynamic(() => import("recharts").then((mod) => mod.Legend), {
  ssr: false,
});

interface GenderData {
  name: string;
  value: number;
  color?: string;
}

const COLORS = ["#8b5cf6", "#ec4899", "#14b8a6"]; // Default colors

export default function GenderChart({ data }: { data: GenderData[] }) {
  const isDataEmpty = data.length === 0 || data.every((d) => d.value === 0);

  return (
    <div className="w-full bg-background rounded-[20px] p-6 border border-border h-[400px] flex flex-col">
      <h2 className="text-xl font-bold mb-6">Gender Distribution</h2>
      <div className="flex-1 w-full min-h-0">
        {isDataEmpty ? (
          <NoDataPlaceholder
            message="No gender data available"
            className="h-full border-none p-0"
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

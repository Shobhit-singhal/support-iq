"use client";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SlaAnalytics } from "@/lib/types";

const COLORS: Record<string, string> = {
  "On Track": "#10b981",
  "At Risk": "#f59e0b",
  Breached: "#f43f5e",
};

export default function SlaBreakdownChart({ onTrack, atRisk, breached }: Pick<SlaAnalytics, "onTrack" | "atRisk" | "breached">) {
  const data = [
    { name: "On Track", value: onTrack },
    { name: "At Risk", value: atRisk },
    { name: "Breached", value: breached },
  ];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label={{ fill: "#94a3b8", fontSize: 12 }}>
          {data.map((entry) => (<Cell key={entry.name} fill={COLORS[entry.name]} />))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.5rem", color: "#f8fafc", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)" }} itemStyle={{ color: "#e2e8f0" }} />
        <Legend wrapperStyle={{ color: "#94a3b8" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

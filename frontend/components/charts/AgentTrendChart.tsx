"use client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AgentAnalytics } from "@/lib/types";

export default function AgentTrendChart({ data }: { data: AgentAnalytics[] }) {
  const chartData = data.map((d) => ({
    name: d.name.split(" ")[0], // Use first name for cleaner X axis
    "Tickets Resolved": d.ticketsResolved,
    "SLA Compliance %": Number(d.slaCompliancePct?.toFixed?.(1) ?? d.slaCompliancePct),
  }));
  return (
    <ResponsiveContainer width="100%" height={360}>
      <BarChart data={chartData} margin={{ top: 20, right: 16, left: 0, bottom: 8 }} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
        <Tooltip 
          cursor={{ fill: '#1e293b' }}
          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", color: "#f8fafc", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)", padding: "12px 16px" }} 
          itemStyle={{ color: "#e2e8f0", paddingTop: "4px" }}
          labelStyle={{ fontWeight: "600", marginBottom: "8px", color: "#94a3b8" }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
        <Bar dataKey="Tickets Resolved" fill="#818cf8" radius={[6, 6, 6, 6]} />
        <Bar dataKey="SLA Compliance %" fill="#14b8a6" radius={[6, 6, 6, 6]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

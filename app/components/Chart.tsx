"use client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface ChartData {
  month: string;
  amount: number;
}

interface ChartProps {
  data: ChartData[];
  type?: "bar" | "line";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm">
        <div className="text-slate-400 mb-1">{label}</div>
        <div className="text-white font-semibold">
          {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(payload[0].value)}
        </div>
      </div>
    );
  }
  return null;
};

export default function Chart({ data, type = "bar" }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        Sin datos disponibles
      </div>
    );
  }

  const commonProps = {
    data,
    margin: { top: 5, right: 10, left: 10, bottom: 5 },
  };

  const axisProps = {
    stroke: "#475569",
    tick: { fill: "#94a3b8", fontSize: 11 },
  };

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis {...axisProps} tickFormatter={(v) => `${v}€`} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#4ECDC4"
            strokeWidth={2}
            dot={{ fill: "#4ECDC4", r: 4 }}
            activeDot={{ r: 6, fill: "#2ECC71" }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="month" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => `${v}€`} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell
              key={i}
              fill={i === data.length - 1 ? "#2ECC71" : "#4ECDC4"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

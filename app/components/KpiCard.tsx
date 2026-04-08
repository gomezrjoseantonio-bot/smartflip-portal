import { ReactNode } from "react";

interface KpiCardProps {
  icon: ReactNode;
  value: string;
  label: string;
  gradient?: string;
  trend?: number;
  sub?: string;
}

export default function KpiCard({ icon, value, label, gradient, trend, sub }: KpiCardProps) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-3 hover:border-slate-600 transition-all">
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
          style={{ background: gradient || 'linear-gradient(135deg, #4ECDC4, #2ECC71)' }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm text-slate-400 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

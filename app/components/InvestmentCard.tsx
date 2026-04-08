"use client";
import { useState } from "react";
import ProgressBar from "./ProgressBar";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface Loan {
  id: string;
  title: string;
  principal: number;
  rate: number;
  start_date: string;
  end_date?: string;
  total_paid?: number;
  payments?: Array<{
    period: string;
    gross: number;
    retention: number;
    net: number;
  }>;
}

export default function InvestmentCard({ loan }: { loan: Loan }) {
  const [expanded, setExpanded] = useState(false);
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

  const totalPaid = loan.total_paid || 0;

  const start = new Date(loan.start_date);
  const end = loan.end_date ? new Date(loan.end_date) : null;
  const totalMonths = end
    ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : 0;
  const elapsedMonths = Math.ceil((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const timeProgress = totalMonths > 0 ? Math.min(100, (elapsedMonths / totalMonths) * 100) : 0;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold">{loan.title}</h3>
            <div className="text-sm text-slate-400 mt-0.5">
              {loan.start_date} {end ? `→ ${loan.end_date}` : '(en curso)'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[#4ECDC4] font-bold text-lg">{fmt(loan.principal)}</div>
            <div className="text-xs text-slate-400">{loan.rate.toFixed(2)}% anual</div>
          </div>
        </div>

        <div className="space-y-3">
          <ProgressBar value={timeProgress} label="Tiempo transcurrido" />
          {totalPaid > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total cobrado</span>
              <span className="text-[#2ECC71] font-medium">{fmt(totalPaid)}</span>
            </div>
          )}
        </div>

        {loan.payments && loan.payments.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            style={{background:'none',border:'none',cursor:'pointer',padding:0}}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Ocultar' : 'Ver'} tabla de pagos
          </button>
        )}
      </div>

      {expanded && loan.payments && loan.payments.length > 0 && (
        <div className="border-t border-slate-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-700/50">
                <th className="text-left text-slate-400 font-medium px-4 py-2">Periodo</th>
                <th className="text-right text-slate-400 font-medium px-4 py-2">Bruto</th>
                <th className="text-right text-slate-400 font-medium px-4 py-2">Retención</th>
                <th className="text-right text-slate-400 font-medium px-4 py-2">Neto</th>
              </tr>
            </thead>
            <tbody>
              {loan.payments.map((p, i) => (
                <tr key={i} className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="text-white px-4 py-2">{p.period}</td>
                  <td className="text-right text-slate-300 px-4 py-2">
                    {fmt(p.gross)}
                  </td>
                  <td className="text-right text-red-400 px-4 py-2">-{fmt(p.retention)}</td>
                  <td className="text-right text-[#2ECC71] font-medium px-4 py-2">{fmt(p.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

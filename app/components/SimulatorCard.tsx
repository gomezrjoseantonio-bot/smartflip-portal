"use client";
import { useState } from "react";
import { Calculator } from "lucide-react";

interface SimulatorCardProps {
  averageRate: number;
}

export default function SimulatorCard({ averageRate }: SimulatorCardProps) {
  const [amount, setAmount] = useState("");
  const rate = averageRate > 0 ? averageRate : 8;

  const parsed = parseFloat(amount.replace(",", ".")) || 0;
  const monthly = (parsed * rate) / 100 / 12;
  const annual = (parsed * rate) / 100;

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={18} className="text-[#4ECDC4]" />
        <h3 className="text-white font-semibold">Simulador de Inversión</h3>
      </div>
      <div className="mb-4">
        <label className="text-sm text-slate-400 mb-1 block">
          Si invirtieras esta cantidad adicional:
        </label>
        <div className="relative">
          <input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#4ECDC4] transition-colors"
            style={{border:'1px solid #475569'}}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">€</span>
        </div>
        <div className="text-xs text-slate-500 mt-1">Tasa media aplicada: {rate.toFixed(1)}% anual</div>
      </div>
      {parsed > 0 && (
        <div className="space-y-2">
          <div className="bg-slate-700/50 rounded-lg p-3 flex justify-between items-center">
            <span className="text-slate-400 text-sm">Ganancia mensual extra</span>
            <span className="text-[#4ECDC4] font-bold">{fmt(monthly)}</span>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 flex justify-between items-center">
            <span className="text-slate-400 text-sm">Ganancia anual extra</span>
            <span className="text-[#2ECC71] font-bold">{fmt(annual)}</span>
          </div>
          <div className="bg-gradient-to-r from-[#4ECDC4]/10 to-[#2ECC71]/10 border border-[#4ECDC4]/20 rounded-lg p-3 mt-2">
            <p className="text-sm text-white">
              💡 Si invirtieras <strong>{fmt(parsed)}</strong> más, ganarías{" "}
              <strong className="text-[#4ECDC4]">{fmt(monthly)}</strong> extra al mes
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

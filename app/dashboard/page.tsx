"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";
import Navbar from "@/app/components/Navbar";
import KpiCard from "@/app/components/KpiCard";
import Chart from "@/app/components/Chart";
import SimulatorCard from "@/app/components/SimulatorCard";
import ReceiptRow from "@/app/components/ReceiptRow";
import InvestmentCard from "@/app/components/InvestmentCard";
import type { Receipt } from "@/app/components/ReceiptRow";
import type { Loan } from "@/app/components/InvestmentCard";
import { TrendingUp, Wallet, Percent, Calendar, Euro, Loader2 } from "lucide-react";

interface Stats {
  totalInvested: number;
  totalEarnings: number;
  avgRate: number;
  nextPayment: string | null;
  thisMonthEarnings: number;
  monthlyData: Array<{ month: string; amount: number }>;
  loans: Loan[];
  recentReceipts: Receipt[];
}

const MOCK_STATS: Stats = {
  totalInvested: 0,
  totalEarnings: 0,
  avgRate: 0,
  nextPayment: null,
  thisMonthEarnings: 0,
  monthlyData: [],
  loans: [],
  recentReceipts: [],
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

export default function Dashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [stats, setStats] = useState<Stats>(MOCK_STATS);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }
        setUserEmail(user.email || "");

        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const res = await fetch("/api/stats", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // Use mock data on error
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-[#4ECDC4] animate-spin" />
          <span className="text-slate-400">Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Navbar userEmail={userEmail} />
      <main className="flex-1 overflow-auto md:ml-0">
        <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Bienvenido de vuelta 👋
            </h1>
            <p className="text-slate-400 mt-1 text-sm md:text-base">
              {userEmail} · Resumen de tu cartera de inversión
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <KpiCard
              icon={<Wallet size={18} className="text-slate-900" />}
              value={fmt(stats.totalInvested)}
              label="Total invertido"
            />
            <KpiCard
              icon={<TrendingUp size={18} className="text-slate-900" />}
              value={fmt(stats.totalEarnings)}
              label="Ganancia total"
              gradient="linear-gradient(135deg, #2ECC71, #16a34a)"
            />
            <KpiCard
              icon={<Percent size={18} className="text-slate-900" />}
              value={`${stats.avgRate.toFixed(1)}%`}
              label="Rentabilidad media"
              gradient="linear-gradient(135deg, #f59e0b, #d97706)"
            />
            <KpiCard
              icon={<Calendar size={18} className="text-slate-900" />}
              value={stats.nextPayment || "—"}
              label="Próximo cobro"
              gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
            />
            <KpiCard
              icon={<Euro size={18} className="text-slate-900" />}
              value={fmt(stats.thisMonthEarnings)}
              label="Ganancia este mes"
              gradient="linear-gradient(135deg, #ec4899, #db2777)"
            />
          </div>

          {/* Chart */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Evolución de ganancias</h2>
              <div className="flex gap-2">
                {(["bar", "line"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartType(t)}
                    className={`text-xs px-3 py-1 rounded-lg transition-all ${
                      chartType === t
                        ? "bg-[#4ECDC4] text-slate-900 font-semibold"
                        : "text-slate-400 bg-slate-700 hover:text-white"
                    }`}
                    style={{border:'none',cursor:'pointer'}}
                  >
                    {t === "bar" ? "Barras" : "Línea"}
                  </button>
                ))}
              </div>
            </div>
            {stats.monthlyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                <TrendingUp size={32} className="mb-2 opacity-50" />
                <p className="text-sm">Sin datos de ganancias todavía</p>
                <p className="text-xs mt-1">Los datos aparecerán cuando recibas tus primeros recibos</p>
              </div>
            ) : (
              <Chart data={stats.monthlyData} type={chartType} />
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Investments */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Inversiones activas</h2>
                <a href="/dashboard/investments" className="text-xs text-[#4ECDC4] hover:underline" style={{textDecoration:'none'}}>Ver todas →</a>
              </div>
              {stats.loans.length === 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
                  <div className="text-3xl mb-3">📊</div>
                  <p className="text-slate-400 text-sm">No hay inversiones registradas</p>
                  <p className="text-xs text-slate-500 mt-1">Contacta con SmartFlip para comenzar a invertir</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.loans.slice(0, 3).map((loan) => (
                    <InvestmentCard key={loan.id} loan={loan} />
                  ))}
                </div>
              )}
            </div>

            {/* Simulator */}
            <div>
              <div className="mb-4">
                <h2 className="text-white font-semibold">Simulador</h2>
              </div>
              <SimulatorCard averageRate={stats.avgRate} />
            </div>
          </div>

          {/* Recent receipts */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Últimos recibos</h2>
              <a href="/dashboard/receipts" className="text-xs text-[#4ECDC4] hover:underline" style={{textDecoration:'none'}}>Ver todos →</a>
            </div>
            {stats.recentReceipts.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
                <div className="text-3xl mb-3">📄</div>
                <p className="text-slate-400 text-sm">No hay recibos disponibles</p>
                <p className="text-xs text-slate-500 mt-1">Los recibos se generan automáticamente cada mes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentReceipts.map((r) => (
                  <ReceiptRow key={r.id} receipt={r} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

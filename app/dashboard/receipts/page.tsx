"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";
import Navbar from "@/app/components/Navbar";
import ReceiptRow from "@/app/components/ReceiptRow";
import type { Receipt } from "@/app/components/ReceiptRow";
import { FileText, Loader2, Filter } from "lucide-react";

export default function ReceiptsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }
        setUserEmail(user.email || "");

        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const res = await fetch("/api/receipts", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setReceipts(data.receipts || []);
        }
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const years = useMemo(() => {
    const s = new Set<string>();
    receipts.forEach((r) => {
      const y = r.periodo?.split("-")[0] || r.periodo?.substring(0, 4);
      if (y) s.add(y);
    });
    return Array.from(s).sort().reverse();
  }, [receipts]);

  const filtered = yearFilter
    ? receipts.filter((r) => r.periodo?.startsWith(yearFilter))
    : receipts;

  const totals = filtered.reduce(
    (acc, r) => ({ bruto: acc.bruto + r.bruto, retencion: acc.retencion + r.retencion, neto: acc.neto + r.neto }),
    { bruto: 0, retencion: 0, neto: 0 }
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 size={32} className="text-[#4ECDC4] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Navbar userEmail={userEmail} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText size={24} className="text-[#4ECDC4]" />
              Recibos
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Historial de todos tus recibos de intereses</p>
          </div>

          {/* Filters */}
          {years.length > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <Filter size={14} className="text-slate-500" />
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setYearFilter("")}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all ${!yearFilter ? 'bg-[#4ECDC4] text-slate-900 font-semibold' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                  style={{border:'none',cursor:'pointer'}}
                >
                  Todos
                </button>
                {years.map((y) => (
                  <button
                    key={y}
                    onClick={() => setYearFilter(y)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${yearFilter === y ? 'bg-[#4ECDC4] text-slate-900 font-semibold' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                    style={{border:'none',cursor:'pointer'}}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          {filtered.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Bruto total", value: totals.bruto, color: "text-white" },
                { label: "Retenciones", value: totals.retencion, color: "text-red-400" },
                { label: "Neto total", value: totals.neto, color: "text-[#2ECC71]" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
                  <div className="text-xs text-slate-400 mb-1">{item.label}</div>
                  <div className={`font-bold text-lg ${item.color}`}>{fmt(item.value)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Receipts list */}
          {filtered.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
              <div className="text-5xl mb-4">📄</div>
              <h2 className="text-white font-semibold text-lg mb-2">Sin recibos disponibles</h2>
              <p className="text-slate-400 text-sm">Los recibos se generan automáticamente cada mes.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((r) => (
                <ReceiptRow key={r.id} receipt={r} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

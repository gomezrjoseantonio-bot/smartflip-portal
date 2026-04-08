"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";
import Navbar from "@/app/components/Navbar";
import InvestmentCard from "@/app/components/InvestmentCard";
import type { Loan } from "@/app/components/InvestmentCard";
import { Loader2, TrendingUp } from "lucide-react";

export default function InvestmentsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

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
          setLoans(data.loans || []);
        }
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

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
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp size={24} className="text-[#4ECDC4]" />
              Mis Inversiones
            </h1>
            <p className="text-slate-400 mt-1 text-sm">Detalle de tus préstamos e inversiones activas</p>
          </div>

          {loans.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h2 className="text-white font-semibold text-lg mb-2">Sin inversiones registradas</h2>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Cuando tengas inversiones activas, aparecerán aquí con el detalle de tu cartera.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {loans.map((loan) => (
                <InvestmentCard key={loan.id} loan={loan} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

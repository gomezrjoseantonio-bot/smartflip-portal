"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabaseClient";
import Navbar from "@/app/components/Navbar";
import GoalCard from "@/app/components/GoalCard";
import type { Goal } from "@/app/components/GoalCard";
import { useConfetti } from "@/app/components/Confetti";
import { Target, Plus, X, Loader2 } from "lucide-react";

const CATEGORIES = [
  { id: "viaje", label: "Viaje", emoji: "✈️" },
  { id: "coche", label: "Coche", emoji: "🚗" },
  { id: "casa", label: "Casa", emoji: "🏠" },
  { id: "educacion", label: "Educación", emoji: "📚" },
  { id: "emergencia", label: "Emergencia", emoji: "🛡️" },
  { id: "retiro", label: "Retiro", emoji: "🌅" },
  { id: "negocio", label: "Negocio", emoji: "💼" },
  { id: "otro", label: "Otro", emoji: "⭐" },
];

const SUGGESTED: Partial<Goal>[] = [
  { title: "Fondo de emergencia", category: "emergencia", target_amount: 5000 },
  { title: "Vacaciones de verano", category: "viaje", target_amount: 2000 },
  { title: "Nuevo coche", category: "coche", target_amount: 15000 },
  { title: "Entrada para casa", category: "casa", target_amount: 30000 },
];

interface GoalForm {
  title: string;
  category: string;
  target_amount: string;
  current_amount: string;
  deadline: string;
}

export default function GoalsPage() {
  const router = useRouter();
  const triggerConfetti = useConfetti();
  const [userEmail, setUserEmail] = useState("");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [token, setToken] = useState("");
  const [form, setForm] = useState<GoalForm>({
    title: "", category: "otro", target_amount: "", current_amount: "", deadline: "",
  });

  const fetchGoals = async (tok: string) => {
    const res = await fetch("/api/goals", {
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    });
    if (res.ok) {
      const data = await res.json();
      setGoals(data.goals || []);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/login"); return; }
        setUserEmail(user.email || "");
        const session = await supabase.auth.getSession();
        const tok = session.data.session?.access_token || "";
        setToken(tok);
        await fetchGoals(tok);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const openCreate = (suggested?: Partial<Goal>) => {
    setEditGoal(null);
    setForm({
      title: suggested?.title || "",
      category: suggested?.category || "otro",
      target_amount: suggested?.target_amount?.toString() || "",
      current_amount: "",
      deadline: "",
    });
    setShowForm(true);
  };

  const openEdit = (goal: Goal) => {
    setEditGoal(goal);
    setForm({
      title: goal.title,
      category: goal.category,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      deadline: goal.deadline || "",
    });
    setShowForm(true);
  };

  const submitGoal = async () => {
    const body = {
      title: form.title,
      category: form.category,
      target_amount: parseFloat(form.target_amount) || 0,
      current_amount: parseFloat(form.current_amount) || 0,
      deadline: form.deadline || null,
    };
    const url = editGoal ? `/api/goals/${editGoal.id}` : "/api/goals";
    const method = editGoal ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      await fetchGoals(token);
      setShowForm(false);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!confirm("¿Eliminar esta meta?")) return;
    await fetch(`/api/goals/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    await fetchGoals(token);
  };

  const completeGoal = async (id: string) => {
    await fetch(`/api/goals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ completed: true }),
    });
    await fetchGoals(token);
    triggerConfetti();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 size={32} className="text-[#4ECDC4] animate-spin" />
      </div>
    );
  }

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <Navbar userEmail={userEmail} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Target size={24} className="text-[#4ECDC4]" />
                Metas de Inversión
              </h1>
              <p className="text-slate-400 mt-1 text-sm">Define y sigue tus objetivos financieros</p>
            </div>
            <button
              onClick={() => openCreate()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-slate-900 text-sm"
              style={{ background: "linear-gradient(135deg, #4ECDC4, #2ECC71)", border: "none", cursor: "pointer" }}
            >
              <Plus size={16} /> Nueva meta
            </button>
          </div>

          {/* Active goals */}
          {activeGoals.length > 0 && (
            <div className="mb-8">
              <h2 className="text-white font-semibold mb-4">En progreso ({activeGoals.length})</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {activeGoals.map((g) => (
                  <GoalCard key={g.id} goal={g} onEdit={openEdit} onDelete={deleteGoal} onComplete={completeGoal} />
                ))}
              </div>
            </div>
          )}

          {/* Completed goals */}
          {completedGoals.length > 0 && (
            <div className="mb-8">
              <h2 className="text-white font-semibold mb-4">Completadas ({completedGoals.length})</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {completedGoals.map((g) => (
                  <GoalCard key={g.id} goal={g} onDelete={deleteGoal} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {goals.length === 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center mb-8">
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-white font-semibold text-lg mb-2">Sin metas todavía</h2>
              <p className="text-slate-400 text-sm mb-4">Crea tu primera meta para hacer seguimiento de tus objetivos financieros.</p>
              <button
                onClick={() => openCreate()}
                className="px-6 py-2.5 rounded-xl text-slate-900 font-semibold text-sm"
                style={{ background: "linear-gradient(135deg, #4ECDC4, #2ECC71)", border: "none", cursor: "pointer" }}
              >
                Crear primera meta
              </button>
            </div>
          )}

          {/* Suggested goals */}
          <div>
            <h2 className="text-white font-semibold mb-4">Metas sugeridas</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {SUGGESTED.map((s) => (
                <button
                  key={s.title}
                  onClick={() => openCreate(s)}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-left hover:border-[#4ECDC4]/40 transition-all"
                  style={{background:'#1e293b',border:'1px solid #334155',cursor:'pointer',width:'100%'}}
                >
                  <div className="text-2xl mb-2">{CATEGORIES.find((c) => c.id === s.category)?.emoji}</div>
                  <div className="text-white text-sm font-medium">{s.title}</div>
                  <div className="text-slate-500 text-xs mt-1">
                    Objetivo: {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(s.target_amount ?? 0)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-lg">{editGoal ? "Editar meta" : "Nueva meta"}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white" style={{background:'none',border:'none',cursor:'pointer'}}>
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block" style={{fontWeight:500}}>Nombre de la meta</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#4ECDC4]"
                  placeholder="Ej: Viaje a Japón"
                  style={{border:'1px solid #475569'}}
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block" style={{fontWeight:500}}>Categoría</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setForm({ ...form, category: c.id })}
                      className={`p-2 rounded-lg text-center text-xs transition-all ${form.category === c.id ? 'border-[#4ECDC4] bg-[#4ECDC4]/10 text-[#4ECDC4]' : 'border-slate-600 bg-slate-700 text-slate-400'}`}
                      style={{border: form.category === c.id ? '1px solid #4ECDC4' : '1px solid #475569', cursor:'pointer'}}
                    >
                      <div className="text-xl">{c.emoji}</div>
                      <div>{c.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block" style={{fontWeight:500}}>Objetivo (€)</label>
                  <input
                    type="number"
                    value={form.target_amount}
                    onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#4ECDC4]"
                    placeholder="5000"
                    style={{border:'1px solid #475569'}}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block" style={{fontWeight:500}}>Acumulado (€)</label>
                  <input
                    type="number"
                    value={form.current_amount}
                    onChange={(e) => setForm({ ...form, current_amount: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#4ECDC4]"
                    placeholder="0"
                    style={{border:'1px solid #475569'}}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block" style={{fontWeight:500}}>Fecha límite (opcional)</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#4ECDC4]"
                  style={{border:'1px solid #475569'}}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-700 transition-all text-sm"
                style={{border:'none',cursor:'pointer'}}
              >
                Cancelar
              </button>
              <button
                onClick={submitGoal}
                className="flex-1 py-2.5 rounded-xl text-slate-900 font-semibold text-sm"
                style={{ background: "linear-gradient(135deg, #4ECDC4, #2ECC71)", border: "none", cursor: "pointer" }}
              >
                {editGoal ? "Guardar" : "Crear meta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

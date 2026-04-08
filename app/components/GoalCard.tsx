"use client";
import ProgressCircle from "./ProgressCircle";
import { Pencil, Trash2, CheckCircle } from "lucide-react";

export interface Goal {
  id: string;
  title: string;
  category: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  completed: boolean;
}

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (id: string) => void;
  onComplete?: (id: string) => void;
}

const categoryIcons: Record<string, string> = {
  viaje: "✈️",
  coche: "🚗",
  casa: "🏠",
  educacion: "📚",
  emergencia: "🛡️",
  retiro: "🌅",
  negocio: "💼",
  otro: "⭐",
};

export default function GoalCard({ goal, onEdit, onDelete, onComplete }: GoalCardProps) {
  const progress = goal.target_amount > 0
    ? Math.min(100, (goal.current_amount / goal.target_amount) * 100)
    : 0;
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const fmt = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

  let monthsLeft: number | null = null;
  if (goal.deadline) {
    const diff = new Date(goal.deadline).getTime() - Date.now();
    monthsLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24 * 30)));
  }

  return (
    <div className={`bg-slate-800 border rounded-xl p-5 transition-all
      ${goal.completed ? 'border-[#2ECC71]/50 opacity-75' : 'border-slate-700 hover:border-slate-600'}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{categoryIcons[goal.category] || "⭐"}</span>
          <div>
            <h3 className="text-white font-semibold text-sm">{goal.title}</h3>
            <span className="text-xs text-slate-500 capitalize">{goal.category}</span>
          </div>
        </div>
        <ProgressCircle value={progress} size={56} />
      </div>

      <div className="space-y-1 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Objetivo</span>
          <span className="text-white font-medium">{fmt(goal.target_amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Acumulado</span>
          <span className="text-[#4ECDC4] font-medium">{fmt(goal.current_amount)}</span>
        </div>
        {remaining > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Te faltan</span>
            <span className="text-slate-300">{fmt(remaining)}</span>
          </div>
        )}
        {monthsLeft !== null && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Plazo</span>
            <span className="text-slate-300">{monthsLeft} meses</span>
          </div>
        )}
      </div>

      {!goal.completed && (
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(goal)}
              className="flex-1 flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg py-1.5 transition-all"
              style={{background:'#334155',border:'none',cursor:'pointer'}}
            >
              <Pencil size={12} /> Editar
            </button>
          )}
          {onComplete && (
            <button
              onClick={() => onComplete(goal.id)}
              className="flex-1 flex items-center justify-center gap-1 text-xs text-[#2ECC71] hover:text-white bg-[#2ECC71]/10 hover:bg-[#2ECC71]/20 rounded-lg py-1.5 transition-all"
              style={{background:'rgba(46,204,113,0.1)',border:'none',cursor:'pointer'}}
            >
              <CheckCircle size={12} /> Completar
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(goal.id)}
              className="flex items-center justify-center p-1.5 text-slate-500 hover:text-red-400 bg-slate-700 hover:bg-red-500/10 rounded-lg transition-all"
              style={{background:'#334155',border:'none',cursor:'pointer'}}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
      {goal.completed && (
        <div className="text-center text-[#2ECC71] text-sm font-semibold">✓ Meta alcanzada</div>
      )}
    </div>
  );
}

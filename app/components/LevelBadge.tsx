import ProgressBar from "./ProgressBar";

const LEVELS = [
  { name: "Novato", min: 0, max: 500, emoji: "🌱", color: "#94a3b8" },
  { name: "Bronce", min: 500, max: 2000, emoji: "🥉", color: "#cd7f32" },
  { name: "Plata", min: 2000, max: 5000, emoji: "🥈", color: "#94a3b8" },
  { name: "Oro", min: 5000, max: 15000, emoji: "🥇", color: "#f59e0b" },
  { name: "Diamante", min: 15000, max: 50000, emoji: "💎", color: "#4ECDC4" },
  { name: "Élite", min: 50000, max: Infinity, emoji: "👑", color: "#2ECC71" },
];

export default function LevelBadge({ totalEarned }: { totalEarned: number }) {
  const current = [...LEVELS].reverse().find((l) => totalEarned >= l.min) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(current) + 1];
  const progress = nextLevel
    ? ((totalEarned - current.min) / (nextLevel.min - current.min)) * 100
    : 100;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
          style={{ background: `${current.color}20`, border: `2px solid ${current.color}40` }}
        >
          {current.emoji}
        </div>
        <div>
          <div className="text-xs text-slate-400">Nivel actual</div>
          <div className="text-xl font-bold text-white">{current.name}</div>
          <div className="text-xs text-slate-400">
            {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(totalEarned)} ganados
          </div>
        </div>
      </div>
      {nextLevel && (
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Progreso a {nextLevel.name} {nextLevel.emoji}</span>
            <span>{new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(nextLevel.min - totalEarned)} restantes</span>
          </div>
          <ProgressBar value={progress} showPercent={false} />
        </div>
      )}
    </div>
  );
}

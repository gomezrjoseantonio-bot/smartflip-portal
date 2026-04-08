import ProgressBar from "./ProgressBar";

interface BadgeProps {
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  recentlyUnlocked?: boolean;
}

export default function Badge({ icon, title, description, unlocked, progress, recentlyUnlocked }: BadgeProps) {
  return (
    <div
      className={`relative bg-slate-800 border rounded-xl p-4 flex flex-col items-center text-center gap-2 transition-all
        ${unlocked
          ? recentlyUnlocked
            ? 'border-[#4ECDC4] shadow-lg shadow-[#4ECDC4]/20'
            : 'border-slate-600'
          : 'border-slate-700 opacity-50'
        }`}
    >
      {recentlyUnlocked && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#4ECDC4] rounded-full animate-pulse" />
      )}
      <div className={`text-3xl ${!unlocked ? 'grayscale' : ''}`} style={{ filter: !unlocked ? 'grayscale(1)' : 'none' }}>
        {icon}
      </div>
      <div className="font-semibold text-white text-sm">{title}</div>
      <div className="text-xs text-slate-400">{description}</div>
      {!unlocked && progress !== undefined && (
        <div className="w-full mt-1">
          <ProgressBar value={progress} showPercent />
        </div>
      )}
      {unlocked && (
        <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-[#4ECDC4] to-[#2ECC71] rounded-full text-slate-900 font-semibold">
          ✓ Desbloqueado
        </span>
      )}
    </div>
  );
}

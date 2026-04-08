interface ProgressBarProps {
  value: number;
  label?: string;
  showPercent?: boolean;
  height?: number;
}

export default function ProgressBar({ value, label, showPercent = true, height = 8 }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          {label && <span>{label}</span>}
          {showPercent && <span>{clamped.toFixed(0)}%</span>}
        </div>
      )}
      <div className="w-full bg-slate-700 rounded-full overflow-hidden" style={{ height }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${clamped}%`,
            background: 'linear-gradient(90deg, #4ECDC4, #2ECC71)',
          }}
        />
      </div>
    </div>
  );
}

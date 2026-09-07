import { Loader2 } from "lucide-react";

interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
}

export function ProgressIndicator({ current, total, label, showPercentage = true }: ProgressIndicatorProps) {
  const percentage = total > 0 ? Math.min(100, Math.max(0, Math.round((current / total) * 100))) : 0;

  return (
    <div className="progress-indicator">
      <div className="progress-info">
        {label && <span className="progress-label">{label}</span>}
        <span className="progress-numbers">{current} / {total}</span>
        {showPercentage && <span className="progress-percentage">{percentage}%</span>}
      </div>
      <div className="progress-track" aria-label={label ?? "Progresso"} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
        {percentage < 100 && <Loader2 size={14} className="progress-spinner" aria-hidden="true" />}
      </div>
    </div>
  );
}

interface ReferralProgressProps { current: number; target: number; progress: number; currentTierName: string; nextTierName: string; nextTierIcon: string }

export function ReferralProgress({ current, target, progress, currentTierName, nextTierName, nextTierIcon }: ReferralProgressProps) {
  const safeProgress = Math.min(100, Math.max(0, progress));
  return <section className="rounded-[2rem] border border-glass-border bg-glass p-5 sm:p-6 backdrop-blur-xl shadow-xl" aria-label={`Progresso para ${nextTierName}`}>
    <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-primary">Próximo nível</p><h3 className="mt-1 text-lg sm:text-xl font-black uppercase italic">{nextTierIcon} {nextTierName}</h3></div><span className="text-xl font-black tabular-nums">{Math.round(safeProgress)}%</span></div>
    <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted/60" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(safeProgress)}><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${safeProgress}%` }} /></div>
    <div className="mt-3 flex justify-between gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground"><span>{currentTierName}</span><span>{current} / {target} indicações</span></div>
  </section>;
}

interface ReferralBadgeProps { tierName: string; icon: string; color: string; size?: "small" | "medium" | "large" }

export function ReferralBadge({ tierName, icon, color, size = "medium" }: ReferralBadgeProps) {
  const dimensions = { small: 40, medium: 56, large: 80 }[size];
  return (
    <div className="inline-flex flex-col items-center justify-center rounded-2xl border bg-background/40 shadow-lg backdrop-blur-xl" style={{ width: dimensions, height: dimensions, borderColor: `${color}55`, boxShadow: `0 0 28px ${color}22` }} aria-label={`Nível ${tierName}`}>
      <span className={size === "large" ? "text-3xl" : size === "medium" ? "text-xl" : "text-base"}>{icon}</span>
      <span className="text-[8px] font-black uppercase tracking-widest" style={{ color }}>{tierName}</span>
    </div>
  );
}

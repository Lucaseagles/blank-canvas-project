import { useEffect, useMemo, useState } from "react";

export function FilterSlider({ min, max, valueMin, valueMax, onChange, formatValue = String }: { min: number; max: number; valueMin: number; valueMax: number; onChange: (min: number, max: number) => void; formatValue?: (value: number) => string }) {
  const safeMax = Math.max(max, min + 1);
  const [minValue, setMinValue] = useState(valueMin);
  const [maxValue, setMaxValue] = useState(valueMax);
  const [pending, setPending] = useState<[number, number] | null>(null);

  useEffect(() => {
    setMinValue(Math.max(min, Math.min(valueMin, safeMax)));
    setMaxValue(Math.max(min, Math.min(valueMax, safeMax)));
  }, [min, safeMax, valueMin, valueMax]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => {
      onChange(pending[0], pending[1]);
      setPending(null);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [onChange, pending]);

  const percentMin = useMemo(() => ((minValue - min) / (safeMax - min)) * 100, [minValue, min, safeMax]);
  const percentMax = useMemo(() => ((maxValue - min) / (safeMax - min)) * 100, [maxValue, min, safeMax]);

  const commit = (a: number, b: number) => {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    setMinValue(lo);
    setMaxValue(hi);
    setPending([lo, hi]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold tabular-nums">
        <span className="rounded-lg bg-muted/60 px-2.5 py-1 text-foreground">{formatValue(minValue)}</span>
        <span className="text-muted-foreground">até</span>
        <span className="rounded-lg bg-muted/60 px-2.5 py-1 text-foreground">{formatValue(maxValue)}</span>
      </div>
      <div className="relative px-1 py-2">
        <div className="absolute left-1 right-1 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted" />
        <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary/80" style={{ left: `${percentMin}%`, right: `${100 - percentMax}%` }} />
        <div className="relative grid gap-3">
          <input aria-label="Preço mínimo" type="range" min={min} max={safeMax} step="1" value={minValue} onChange={(e) => commit(Number(e.target.value), maxValue)} className="relative z-10 h-5 w-full cursor-pointer appearance-none bg-transparent accent-primary" />
          <input aria-label="Preço máximo" type="range" min={min} max={safeMax} step="1" value={maxValue} onChange={(e) => commit(minValue, Number(e.target.value))} className="relative z-10 -mt-8 h-5 w-full cursor-pointer appearance-none bg-transparent accent-primary" />
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground"><span>{formatValue(min)}</span><span>{formatValue(safeMax)}</span></div>
    </div>
  );
}

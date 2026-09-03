import { useEffect, useState } from "react";

export function FilterSlider({ min, max, valueMin, valueMax, onChange, formatValue = String }: { min: number; max: number; valueMin: number; valueMax: number; onChange: (min: number, max: number) => void; formatValue?: (value: number) => string }) {
  const safeMax = Math.max(max, min + 1);
  const [minValue, setMinValue] = useState(valueMin);
  const [maxValue, setMaxValue] = useState(valueMax);
  useEffect(() => { setMinValue(Math.max(min, Math.min(valueMin, safeMax))); setMaxValue(Math.max(min, Math.min(valueMax, safeMax))); }, [min, safeMax, valueMin, valueMax]);
  const commit = (a: number, b: number) => { const lo = Math.min(a, b); const hi = Math.max(a, b); setMinValue(lo); setMaxValue(hi); onChange(lo, hi); };
  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3 text-xs font-medium"><span>{formatValue(minValue)}</span><span>{formatValue(maxValue)}</span></div>
    <div className="grid gap-3">
      <input aria-label="Preço mínimo" type="range" min={min} max={safeMax} step="1" value={minValue} onChange={(e) => commit(Number(e.target.value), maxValue)} className="w-full accent-primary" />
      <input aria-label="Preço máximo" type="range" min={min} max={safeMax} step="1" value={maxValue} onChange={(e) => commit(minValue, Number(e.target.value))} className="w-full accent-primary" />
    </div>
  </div>;
}

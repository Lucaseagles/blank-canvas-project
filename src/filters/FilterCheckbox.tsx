import { Check } from "lucide-react";

export function FilterCheckbox({ id, label, count, checked, onChange }: { id: string; label: string; count?: number; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label htmlFor={`filter-${id}`} className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-2 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground">
    <input id={`filter-${id}`} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
    <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
      {checked && <Check className="h-3.5 w-3.5" />}
    </span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {count !== undefined && <span className="text-xs tabular-nums text-muted-foreground/70">{count.toLocaleString("pt-BR")}</span>}
  </label>;
}

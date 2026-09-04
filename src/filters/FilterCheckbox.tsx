import { Check } from "lucide-react";

export function FilterCheckbox({ id, label, count, checked, onChange }: { id: string; label: string; count?: number; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label htmlFor={`filter-${id}`} className="group flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground">
      <input id={`filter-${id}`} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200 ${checked ? "scale-105 border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20" : "border-border bg-background group-hover:border-primary/40"}`}>
        <Check className={`h-3.5 w-3.5 transition-transform duration-200 ${checked ? "scale-100" : "scale-0"}`} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground/80">{count.toLocaleString("pt-BR")}</span>}
    </label>
  );
}

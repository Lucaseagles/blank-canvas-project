import { Check } from "lucide-react";

export function FilterToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="group flex min-h-12 w-full items-center justify-between rounded-2xl border border-border/50 bg-card/30 px-3 py-2.5 text-left transition-all duration-300 hover:border-primary/25 hover:bg-primary/5">
      <span className="flex items-center gap-2.5 text-sm font-medium text-foreground">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${checked ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground"}`}><Check className={`h-3.5 w-3.5 transition-transform duration-200 ${checked ? "scale-100" : "scale-0"}`} /></span>
        {label}
      </span>
      <span aria-hidden className={`relative h-6 w-11 rounded-full p-0.5 transition-colors duration-300 ${checked ? "bg-primary" : "bg-muted"}`}>
        <span className={`block h-5 w-5 rounded-full bg-background shadow-sm transition-transform duration-300 ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </button>
  );
}

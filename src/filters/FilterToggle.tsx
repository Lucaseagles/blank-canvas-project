export function FilterToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground">
    <span>{label}</span>
    <span aria-hidden className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-background shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} /></span>
  </button>;
}

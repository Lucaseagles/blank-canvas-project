import { AuditChecklist } from "./AuditChecklist";

export function AuditDashboard() {
  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-8 lg:py-12">
      <header className="space-y-3">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Owner Control Center</p>
        <h1 className="text-4xl font-black tracking-tighter uppercase italic md:text-6xl">System Audit</h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          Auditoria centralizada das entidades críticas do produto. As verificações são executadas server-side com a mesma proteção Owner das demais operações administrativas.
        </p>
      </header>
      <AuditChecklist />
    </div>
  );
}

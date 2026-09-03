import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleAlert, Database, ExternalLink, RefreshCw, ShieldAlert, TriangleAlert } from "lucide-react";
import { runAdminAudit, type AuditItem, type AuditStatus } from "@/lib/admin-audit.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS: Record<AuditStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  functional: { label: "FUNCIONAL", icon: CheckCircle2, className: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10" },
  bug: { label: "BUG", icon: CircleAlert, className: "text-red-500 border-red-500/20 bg-red-500/10" },
  no_data: { label: "SEM DADOS", icon: Database, className: "text-amber-500 border-amber-500/20 bg-amber-500/10" },
  no_ui: { label: "SEM UI", icon: TriangleAlert, className: "text-orange-500 border-orange-500/20 bg-orange-500/10" },
  unavailable: { label: "INDISPONÍVEL", icon: ShieldAlert, className: "text-slate-500 border-slate-500/20 bg-slate-500/10" },
};

function Item({ item }: { item: AuditItem }) {
  const meta = STATUS[item.status];
  const Icon = meta.icon;
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/40 p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0" />
          <p className="font-bold">{item.label}</p>
          <Badge variant="outline" className="text-[9px] uppercase tracking-widest">{item.category}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{item.detail}</p>
        {item.table && <p className="font-mono text-[10px] text-muted-foreground/60">DB: {item.table}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className={`rounded-full text-[9px] font-black tracking-widest ${meta.className}`}>{meta.label}</Badge>
        {item.route && (
          <Button asChild size="sm" variant="ghost" className="h-8 rounded-xl">
            <a href={item.route}><ExternalLink className="mr-1 h-3.5 w-3.5" /> Abrir</a>
          </Button>
        )}
      </div>
    </div>
  );
}

export function AuditChecklist() {
  const audit = useServerFn(runAdminAudit);
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-system-audit"],
    queryFn: () => audit({ data: { includeOptional: true } }),
    staleTime: 0,
  });

  const items = data?.items ?? [];
  const grouped = items.reduce<Record<string, AuditItem[]>>((groups, item) => {
    (groups[item.category] ??= []).push(item);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Auditoria real</p>
          <h2 className="text-2xl font-black tracking-tight">Checklist do sistema</h2>
          <p className="mt-1 text-sm text-muted-foreground">Banco, dados e pontos de administração verificados no servidor.</p>
        </div>
        <Button onClick={() => refetch()} disabled={isFetching} className="rounded-xl font-bold uppercase tracking-wider">
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Re-auditar
        </Button>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {(["functional", "bug", "no_data", "no_ui", "unavailable"] as AuditStatus[]).map((status) => (
            <Card key={status} className="rounded-2xl border-border/60 bg-background/40">
              <CardHeader className="p-4 pb-1"><CardTitle className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{STATUS[status].label}</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0"><span className="text-2xl font-black tabular-nums">{data.stats[status]}</span></CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoading && <div className="rounded-2xl border border-border/60 p-8 text-center text-sm text-muted-foreground">Executando auditoria segura…</div>}

      {!isLoading && Object.entries(grouped).map(([category, categoryItems]) => (
        <section key={category} className="space-y-3">
          <h3 className="px-1 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{category}</h3>
          {categoryItems.map((item) => <Item key={item.key} item={item} />)}
        </section>
      ))}

      {data && <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Última auditoria: {new Date(data.checkedAt).toLocaleString("pt-BR")}</p>}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, ShieldCheck, AlertTriangle, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTrustQualityOverview } from "@/lib/trust-quality.functions";

export const Route = createFileRoute("/admin/trust-quality")({ component: TrustQualityPage });

function TrustQualityPage() {
  const getOverview = useServerFn(getTrustQualityOverview);
  const query = useQuery({ queryKey: ["admin-trust-quality"], queryFn: () => getOverview({ data: undefined }) });
  const summary = query.data?.summary;
  const score = summary?.averageScore ?? 0;

  return <div className="mx-auto max-w-7xl space-y-8 p-4 lg:p-8">
    <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div><Badge variant="outline" className="gap-2 text-[10px] font-black uppercase tracking-widest text-primary"><ShieldCheck className="h-3 w-3"/> Owner Only</Badge><h1 className="mt-2 text-4xl font-black uppercase italic tracking-tighter">Trust <span className="text-primary">& Quality</span></h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Auditoria operacional de qualidade dos produtos e visibilidade das violações reais de compliance. Este painel não fabrica avaliações nem prova social.</p></div>
      <Button variant="outline" className="gap-2 rounded-xl" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}/> Atualizar</Button>
    </header>

    {query.isError ? <Card className="rounded-3xl border-destructive/30"><CardContent className="py-12 text-center text-sm text-destructive">Falha ao carregar auditoria: {query.error.message}</CardContent></Card> : query.isLoading ? <Card className="rounded-3xl"><CardContent className="py-16 text-center text-sm text-muted-foreground">Auditando dados reais…</CardContent></Card> : <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<PackageCheck/>} label="Produtos auditados" value={summary?.products ?? 0}/>
        <Metric icon={<AlertTriangle/>} label="Com pendências" value={summary?.productsWithIssues ?? 0}/>
        <Metric icon={<ShieldCheck/>} label="Score médio" value={`${score}/100`}/>
        <Metric icon={<AlertTriangle/>} label="Violações recentes" value={summary?.recentViolations ?? 0}/>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[2rem]"><CardHeader><CardTitle className="text-lg font-black uppercase">Qualidade dos produtos</CardTitle></CardHeader><CardContent className="space-y-3">{(query.data?.products ?? []).length === 0 ? <Empty text="Nenhuma pendência encontrada na amostra auditada."/> : query.data?.products.map((product) => <div key={product.id} className="rounded-2xl border p-4"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="truncate font-bold">{product.title || "Produto sem título"}</p><p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Score {product.score}/100</p></div><Badge variant="outline">{product.issues.length} alerta{product.issues.length === 1 ? "" : "s"}</Badge></div><div className="mt-3 flex flex-wrap gap-2">{product.issues.map((issue) => <Badge key={issue} variant="secondary" className="text-[10px]">{issue.replaceAll("_", " ")}</Badge>)}</div></div>)}</CardContent></Card>
        <Card className="rounded-[2rem]"><CardHeader><CardTitle className="text-lg font-black uppercase">Compliance real</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-3"><Metric label="Regras" value={summary?.complianceRules ?? 0}/><Metric label="Aplicadas" value={summary?.enforcedRules ?? 0}/><Metric label="Sem revisão" value={summary?.unreviewedRules ?? 0}/><Metric label="Violações" value={summary?.recentViolations ?? 0}/></div><div className="pt-3">{(query.data?.violations ?? []).length === 0 ? <Empty text="Nenhuma violação registrada no histórico recente."/> : query.data?.violations.slice(0, 20).map((violation) => <div key={violation.id} className="border-b py-3 last:border-0"><p className="text-sm font-semibold">{violation.violation_detail || violation.rule_key}</p><p className="text-[10px] text-muted-foreground">{violation.detected_at ? new Date(violation.detected_at).toLocaleString("pt-BR") : "Sem data"}</p></div>)}</div></CardContent></Card>
      </div>
    </>}
  </div>;
}

function Metric({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string | number }) { return <Card className="rounded-3xl"><CardContent className="p-5"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">{icon ? <span className="h-4 w-4 text-primary">{icon}</span> : null}{label}</div><p className="mt-3 text-3xl font-black tracking-tight">{value}</p></CardContent></Card>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</div>; }

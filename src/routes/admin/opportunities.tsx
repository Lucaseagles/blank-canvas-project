import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOpportunityAlerts, refreshOpportunityAlerts, updateOpportunityAlertStatus } from "@/lib/opportunity-engine.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin/opportunities")({ component: OpportunitiesPage });

function OpportunitiesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["opportunity-alerts", "open"], queryFn: () => getOpportunityAlerts({ data: { status: "open" } }) });
  const refresh = useMutation({ mutationFn: () => refreshOpportunityAlerts(), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["opportunity-alerts"] }) });
  const update = useMutation({ mutationFn: updateOpportunityAlertStatus, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["opportunity-alerts"] }) });
  const alerts = data ?? [];

  return <div className="mx-auto max-w-7xl space-y-8 p-4 lg:p-8">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-primary">Opportunity Engine</Badge><h1 className="mt-2 text-4xl font-black uppercase italic tracking-tighter">Oportunidades <span className="text-primary">acionáveis</span></h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Detecta sinais reais dos produtos e transforma-os em alertas priorizados para revisão administrativa. Nenhuma oportunidade publica ou altera campanhas automaticamente.</p></div>
      <Button onClick={() => refresh.mutate()} disabled={refresh.isPending}><RefreshCw className={refresh.isPending ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"}/>Atualizar sinais</Button>
    </header>
    <div className="grid gap-4 md:grid-cols-3"><Card><CardContent className="p-5"><Lightbulb className="mb-2 h-5 w-5 text-primary"/><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Oportunidades abertas</p><p className="text-3xl font-black">{alerts.length}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Maior score</p><p className="text-3xl font-black">{alerts.length ? Number(alerts[0]?.score ?? 0).toFixed(0) : 0}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fonte</p><p className="text-lg font-black">Dados reais do catálogo</p></CardContent></Card></div>
    <Card className="rounded-[2rem]"><CardHeader><CardTitle className="text-lg font-black uppercase">Fila de oportunidades</CardTitle></CardHeader><CardContent>{isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Carregando oportunidades...</p> : isError ? <p className="py-10 text-center text-sm text-destructive">Não foi possível carregar as oportunidades.</p> : alerts.length === 0 ? <div className="py-10 text-center"><p className="font-bold">Nenhuma oportunidade aberta.</p><p className="mt-1 text-sm text-muted-foreground">Execute “Atualizar sinais” quando houver dados de catálogo para recalcular.</p></div> : <div className="space-y-3">{alerts.map((alert) => <div key={alert.id} className="rounded-2xl border p-4"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><Badge>{alert.opportunity_type}</Badge><Badge variant="outline">Score {Number(alert.score).toFixed(0)}</Badge><Badge variant="outline">Prioridade {alert.priority}</Badge></div><h3 className="mt-2 font-black">{alert.title}</h3><p className="mt-1 text-sm text-muted-foreground">{alert.recommended_action}</p><div className="mt-3 flex flex-wrap gap-2">{(Array.isArray(alert.reasons) ? alert.reasons : []).filter(Boolean).map((reason: string) => <span key={reason} className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold">{reason}</span>)}</div></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => update.mutate({ data: { id: alert.id, status: "dismissed" } })}><XCircle className="mr-1 h-4 w-4"/>Dispensar</Button><Button size="sm" onClick={() => update.mutate({ data: { id: alert.id, status: "actioned" } })}><CheckCircle2 className="mr-1 h-4 w-4"/>Marcar como tratada</Button></div></div></div>)}</div>}</CardContent></Card>
  </div>;
}

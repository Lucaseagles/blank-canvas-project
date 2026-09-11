import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Award, Brain, RefreshCw, Target, Users } from "lucide-react";
import { getEngagementIntelligence } from "@/lib/engagement-intelligence.functions";

export const Route = createFileRoute("/admin/engagement-intelligence")({ component: EngagementIntelligencePage });

function EngagementIntelligencePage() {
  const getData = useServerFn(getEngagementIntelligence);
  const query = useQuery({ queryKey: ["admin-engagement-intelligence"], queryFn: () => getData({ data: undefined }) });
  const data = query.data;

  return <div className="container mx-auto space-y-8 px-4 py-8 lg:px-8 lg:py-12">
    <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div><Badge className="mb-3 gap-2"><Brain className="h-3 w-3" /> Owner Only</Badge><h1 className="text-4xl font-black uppercase italic tracking-tighter lg:text-6xl">Engagement <span className="text-primary">Intelligence</span></h1><p className="mt-3 max-w-3xl text-sm text-muted-foreground">Visão administrativa consolidada de gamificação e personalização. Usa as mesmas fontes de verdade do produto, sem criar um segundo motor.</p></div>
      <Button variant="outline" className="gap-2 rounded-xl" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /> Atualizar</Button>
    </header>

    {query.isError ? <Card className="rounded-3xl border-destructive/30"><CardContent className="py-12 text-center text-sm text-destructive">Falha ao carregar inteligência de engagement: {query.error.message}</CardContent></Card> : query.isLoading ? <Card className="rounded-3xl"><CardContent className="py-16 text-center text-sm text-muted-foreground">Carregando dados reais…</CardContent></Card> : <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric icon={Users} label="Atribuições de segmento" value={data?.segments.totalAssignments ?? 0} />
        <Metric icon={Activity} label="Registros de pontos" value={data?.gamification.pointRecords ?? 0} />
        <Metric icon={Award} label="Badges configurados" value={data?.gamification.configuredBadges ?? 0} />
        <Metric icon={Target} label="Missões ativas" value={data?.gamification.activeMissions ?? 0} />
        <Metric icon={Brain} label="Pesos configurados" value={data?.personalization.configuredWeights ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="rounded-3xl border-glass-border bg-glass-fallback backdrop-blur-xl"><CardHeader><CardTitle className="text-sm uppercase tracking-widest">Distribuição de segmentos</CardTitle></CardHeader><CardContent>{(data?.segments.distribution ?? []).length === 0 ? <Empty text="Nenhum segmento encontrado na base." /> : <div className="space-y-2">{data?.segments.distribution.map((item) => <div key={item.name} className="flex items-center justify-between rounded-xl border border-glass-border p-3"><span className="text-sm font-semibold">{item.name}</span><Badge variant="outline">{item.count}</Badge></div>)}</div>}</CardContent></Card>
        <Card className="rounded-3xl border-glass-border bg-glass-fallback backdrop-blur-xl"><CardHeader><CardTitle className="text-sm uppercase tracking-widest">Pesos de personalização</CardTitle></CardHeader><CardContent>{(data?.personalization.weights ?? []).length === 0 ? <Empty text="Nenhum peso de personalização encontrado." /> : <div className="space-y-2">{data?.personalization.weights.map((item, index) => <div key={`${String(item.key)}-${index}`} className="flex items-center justify-between rounded-xl border border-glass-border p-3"><span className="truncate pr-4 text-sm font-semibold">{String(item.key)}</span><Badge variant="outline">{String(item.weight ?? "—")}</Badge></div>)}</div>}</CardContent></Card>
      </div>

      <Card className="rounded-3xl border-glass-border bg-glass-fallback"><CardHeader><CardTitle className="text-sm uppercase tracking-widest">Onde editar</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-3"><Button variant="outline" asChild><a href="/admin/settings">Configurações</a></Button><Button variant="outline" asChild><a href="/admin/recommendations">Recomendações</a></Button></CardContent></Card>
      {(data?.errors ?? []).length > 0 && <Card className="rounded-3xl border-destructive/30"><CardContent className="py-5 text-xs text-destructive">Algumas fontes não puderam ser lidas: {data?.errors.join(" · ")}</CardContent></Card>}
    </>}
  </div>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) { return <Card className="rounded-3xl"><CardContent className="flex items-center gap-4 p-5"><div className="rounded-2xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div><div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black">{value.toLocaleString("pt-BR")}</p></div></CardContent></Card>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</div>; }

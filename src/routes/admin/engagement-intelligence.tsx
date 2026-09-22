import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Award, Brain, CheckCircle2, ChevronRight, Database, Gauge, RefreshCw, Settings2, Target, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { getEngagementIntelligence } from "@/lib/engagement-intelligence.functions";

export const Route = createFileRoute("/admin/engagement-intelligence")({ component: EngagementIntelligencePage });

function EngagementIntelligencePage() {
  const getData = useServerFn(getEngagementIntelligence);
  const query = useQuery({ queryKey: ["admin-engagement-intelligence"], queryFn: () => getData({ data: undefined }) });
  const data = query.data;

  const health = useMemo(() => {
    const sources = data ? 5 : 0;
    const errors = data?.errors.length ?? 0;
    return { sources, errors, percent: sources ? Math.max(0, Math.round(((sources - errors) / sources) * 100)) : 0 };
  }, [data]);

  const totalGamification = (data?.gamification.pointRecords ?? 0) + (data?.gamification.configuredBadges ?? 0) + (data?.gamification.configuredMissions ?? 0);

  return <div className="min-h-full bg-gradient-to-b from-muted/20 via-background to-background">
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="relative overflow-hidden rounded-[2rem] border bg-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge className="gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]"><Brain className="h-3 w-3" /> Engagement Intelligence</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold uppercase">Owner Only</Badge>
              {data && <Badge variant="outline" className="gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase"><Database className="h-3 w-3" /> Dados reais</Badge>}
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Engagement <span className="text-primary">Intelligence</span></h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">Centro administrativo para entender segmentos, gamificação e personalização usando as mesmas fontes de verdade do produto — sem criar um segundo motor.</p>
          </div>
          <Button onClick={() => void query.refetch()} disabled={query.isFetching} className="h-11 rounded-xl px-5 font-black">
            <RefreshCw className={query.isFetching ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />{query.isFetching ? "Atualizando..." : "Atualizar inteligência"}
          </Button>
        </div>
      </header>

      {query.isError ? <Card className="rounded-[2rem] border-destructive/30"><CardContent className="flex flex-col items-center py-16 text-center"><AlertTriangle className="h-8 w-8 text-destructive" /><p className="mt-4 font-black">Falha ao carregar a inteligência</p><p className="mt-1 max-w-xl text-sm text-muted-foreground">{query.error.message}</p><Button variant="outline" className="mt-5 rounded-xl" onClick={() => void query.refetch()}>Tentar novamente</Button></CardContent></Card> : query.isLoading ? <Loading /> : <>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Metric icon={Users} label="Atribuições" value={data?.segments.totalAssignments ?? 0} detail="Segmentação" />
          <Metric icon={Activity} label="Pontos" value={data?.gamification.pointRecords ?? 0} detail="Registros" />
          <Metric icon={Award} label="Badges" value={data?.gamification.configuredBadges ?? 0} detail="Configurados" />
          <Metric icon={Target} label="Missões ativas" value={data?.gamification.activeMissions ?? 0} detail={`${data?.gamification.configuredMissions ?? 0} configuradas`} />
          <Metric icon={Brain} label="Pesos" value={data?.personalization.configuredWeights ?? 0} detail="Personalização" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <HealthCard percent={health.percent} errors={health.errors} />
          <Card className="rounded-[2rem] border bg-card shadow-sm lg:col-span-2">
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest"><Gauge className="h-4 w-4 text-primary" /> Visão operacional</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <MiniInsight label="Ecossistema de gamificação" value={totalGamification.toLocaleString("pt-BR")} detail="registros/configurações" icon={Award} />
              <MiniInsight label="Segmentação" value={(data?.segments.distribution ?? []).length.toLocaleString("pt-BR")} detail="segmentos identificados" icon={Users} />
              <MiniInsight label="Personalização" value={(data?.personalization.configuredWeights ?? 0).toLocaleString("pt-BR")} detail="sinais ponderados" icon={TrendingUp} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <InsightCard title="Distribuição de segmentos" icon={Users} subtitle="Atribuições encontradas na base">
            {(data?.segments.distribution ?? []).length === 0 ? <Empty text="Nenhum segmento encontrado na base." /> : <div className="space-y-3">{data?.segments.distribution.map((item) => {
              const max = data.segments.distribution[0]?.count || 1;
              const pct = Math.round((item.count / max) * 100);
              return <div key={item.name} className="rounded-2xl border bg-muted/10 p-3.5">
                <div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-bold">{item.name}</span><Badge variant="outline" className="rounded-full">{item.count.toLocaleString("pt-BR")}</Badge></div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, pct)}%` }} /></div>
              </div>;
            })}</div>}
          </InsightCard>

          <InsightCard title="Pesos de personalização" icon={Brain} subtitle="Sinais usados pelo motor existente">
            {(data?.personalization.weights ?? []).length === 0 ? <Empty text="Nenhum peso de personalização encontrado." /> : <div className="space-y-2">{data?.personalization.weights.map((item: any, index: number) => <div key={`${String(item.key)}-${index}`} className="flex items-center justify-between gap-4 rounded-2xl border bg-muted/10 p-3.5"><div className="min-w-0"><p className="truncate text-sm font-bold">{String(item.key)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">Peso configurado</p></div><Badge className="rounded-full px-3">{String(item.weight ?? "—")}</Badge></div>)}</div>}
          </InsightCard>
        </div>

        <Card className="rounded-[2rem] border bg-card shadow-sm">
          <CardHeader className="pb-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest"><Settings2 className="h-4 w-4 text-primary" /> Gestão relacionada</CardTitle><p className="mt-1 text-xs text-muted-foreground">Acesse os pontos de configuração sem duplicar lógica.</p></div></div></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <AdminLink href="/admin/settings" title="Configurações" text="Ajustes gerais do ecossistema" icon={Settings2} />
            <AdminLink href="/admin/recommendations" title="Recomendações" text="Fluxos e inteligência de recomendação" icon={Target} />
          </CardContent>
        </Card>

        {(data?.errors ?? []).length > 0 && <Card className="rounded-[2rem] border-amber-500/30 bg-amber-500/5"><CardContent className="flex gap-3 p-5 text-xs"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><div><p className="font-black text-amber-700">Algumas fontes não puderam ser lidas</p><p className="mt-1 leading-5 text-muted-foreground">{data?.errors.join(" · ")}</p></div></CardContent></Card>}
      </>}
    </div>
  </div>;
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Users; label: string; value: number; detail: string }) {
  return <Card className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" /><CardContent className="relative p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{value.toLocaleString("pt-BR")}</p><p className="mt-1 text-[10px] text-muted-foreground">{detail}</p></div><div className="rounded-xl border bg-muted/50 p-2.5 text-primary"><Icon className="h-4 w-4" /></div></div></CardContent></Card>;
}
function HealthCard({ percent, errors }: { percent: number; errors: number }) {
  return <Card className="rounded-[2rem] border bg-card shadow-sm"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest"><Database className="h-4 w-4 text-primary" /> Saúde das fontes</CardTitle></CardHeader><CardContent><div className="flex items-end justify-between"><div><p className="text-4xl font-black">{percent}%</p><p className="mt-1 text-xs text-muted-foreground">{errors ? `${errors} fonte(s) com erro` : "Todas as fontes consultadas"}</p></div><CheckCircle2 className="h-7 w-7 text-primary" /></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} /></div></CardContent></Card>;
}
function MiniInsight({ icon: Icon, label, value, detail }: { icon: typeof Users; label: string; value: string; detail: string }) { return <div className="rounded-2xl border bg-muted/10 p-4"><div className="flex items-center gap-2 text-xs font-black"><Icon className="h-4 w-4 text-primary" />{label}</div><p className="mt-3 text-2xl font-black">{value}</p><p className="text-[10px] text-muted-foreground">{detail}</p></div>; }
function InsightCard({ title, subtitle, icon: Icon, children }: { title: string; subtitle: string; icon: typeof Users; children: React.ReactNode }) { return <Card className="rounded-[2rem] border bg-card shadow-sm"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest"><Icon className="h-4 w-4 text-primary" />{title}</CardTitle><p className="text-xs text-muted-foreground">{subtitle}</p></CardHeader><CardContent>{children}</CardContent></Card>; }
function AdminLink({ href, title, text, icon: Icon }: { href: string; title: string; text: string; icon: typeof Settings2 }) { return <Button asChild variant="outline" className="group h-auto justify-between rounded-2xl p-4 text-left"><a href={href}><span className="flex items-center gap-3"><span className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></span><span><span className="block text-sm font-black">{title}</span><span className="block text-[10px] text-muted-foreground">{text}</span></span></span><ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></a></Button>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed bg-muted/10 p-10 text-center text-sm text-muted-foreground">{text}</div>; }
function Loading() { return <div className="space-y-4"><div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[1,2,3,4,5].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}</div><div className="grid gap-6 xl:grid-cols-2"><div className="h-80 animate-pulse rounded-[2rem] bg-muted" /><div className="h-80 animate-pulse rounded-[2rem] bg-muted" /></div></div>; }

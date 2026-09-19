import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getChannelStrategyMatrix } from "@/lib/channel-strategy-matrix.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BarChart3, CheckCircle2, ChevronRight, Filter, Layers3, Radio, RefreshCw, Search, Target, X, Zap } from "lucide-react";

export const Route = createFileRoute("/admin/channel-strategy-matrix")({ component: ChannelStrategyMatrixPage });

const objectiveLabels: Record<string, string> = { traffic: "Tráfego", engagement: "Engajamento", followers: "Seguidores", conversion: "Conversão", awareness: "Reconhecimento" };
const objectiveIcons: Record<string, typeof Target> = { traffic: Zap, engagement: Activity, followers: Radio, conversion: Target, awareness: CheckCircle2 };

function ChannelStrategyMatrixPage() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["channel-strategy-matrix"], queryFn: getChannelStrategyMatrix });
  const totals = data?.totals ?? { strategies: 0, channels: 0, collections: 0, campaigns: 0 };
  const objectives = data?.objectives ?? ["traffic", "engagement", "followers", "conversion", "awareness"];
  const [search, setSearch] = useState("");
  const [focus, setFocus] = useState("all");
  const filteredChannels = useMemo(() => (data?.channels ?? []).filter((channel) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || channel.channel_name.toLowerCase().includes(q) || channel.platform.toLowerCase().includes(q);
    const matchesFocus = focus === "all" || Boolean(channel.objectives[focus]);
    return matchesSearch && matchesFocus;
  }), [data?.channels, search, focus]);
  const coverageRate = totals.strategies ? Math.round(((totals.collections + totals.campaigns) / (totals.strategies * 2)) * 100) : 0;
  const objectiveCoverage = useMemo(() => objectives.map((objective) => ({
    objective,
    channels: (data?.channels ?? []).filter((channel) => Boolean(channel.objectives[objective])).length,
    strategies: (data?.channels ?? []).reduce((sum, channel) => sum + (channel.objectives[objective]?.count ?? 0), 0),
  })), [data?.channels, objectives]);

  return <div className="min-h-full bg-gradient-to-b from-muted/20 via-background to-background">
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="relative overflow-hidden rounded-[2rem] border bg-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-100px] left-1/3 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]"><BarChart3 className="mr-1 h-3 w-3" />Channel Strategy Matrix</Badge>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider">Visão operacional</Badge>
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Canais <span className="text-primary">×</span> Objetivos</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">Leia a distribuição das estratégias sociais ativas por canal, objetivo, frequência, prioridade, coleções e campanhas — usando exclusivamente os dados do ecossistema existente.</p>
          </div>
          <Button variant="outline" onClick={() => void refetch()} disabled={isLoading} className="h-11 rounded-xl px-4 font-bold"><RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />Atualizar matriz</Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric icon={Target} label="Estratégias" value={totals.strategies} detail="Ativas na matriz" />
        <Metric icon={Radio} label="Canais" value={totals.channels} detail="Com estratégia ativa" />
        <Metric icon={Layers3} label="Coleções ligadas" value={totals.collections} detail={`${coverageRate}% de cobertura combinada`} />
        <Metric icon={BarChart3} label="Campanhas ligadas" value={totals.campaigns} detail="Vínculos existentes" />
      </div>

      <Card className="rounded-[2rem] border shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-sm font-black">Mapa de objetivos</p><p className="text-xs text-muted-foreground">Cada objetivo abaixo corresponde às estratégias ativas reais.</p></div>
            <div className="flex flex-wrap gap-2">{objectives.map(objective => { const Icon = objectiveIcons[objective] ?? Target; return <Badge key={objective} variant="outline" className="gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold"><Icon className="h-3 w-3 text-primary" />{objectiveLabels[objective] ?? objective}</Badge>; })}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border bg-card shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {objectiveCoverage.map(({ objective, channels, strategies }) => {
              const Icon = objectiveIcons[objective] ?? Target;
              const width = totals.channels ? Math.min(100, Math.round((channels / totals.channels) * 100)) : 0;
              return <div key={objective} className="rounded-2xl border bg-muted/20 p-3">
                <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-black"><Icon className="h-3.5 w-3.5 text-primary" />{objectiveLabels[objective] ?? objective}</span><span className="text-lg font-black">{strategies}</span></div>
                <p className="mt-1 text-[10px] text-muted-foreground">{channels} {channels === 1 ? "canal" : "canais"} cobertos</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: width + "%" }} /></div>
              </div>;
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-[2rem] border bg-card shadow-sm">
        <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div><CardTitle className="text-lg font-black">Matriz operacional</CardTitle><p className="mt-1 text-xs text-muted-foreground">Frequência acumulada e maior prioridade por combinação canal × objetivo.</p></div>
            <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="rounded-full">{filteredChannels.length} de {data?.channels.length ?? 0} canais</Badge><Badge variant="outline" className="rounded-full">{coverageRate}% vínculos</Badge></div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b bg-background p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar canal ou plataforma..." className="h-10 w-full rounded-xl border bg-muted/30 pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary" />{search && <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-2 rounded-lg p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>}</div>
            <div className="flex items-center gap-2 overflow-x-auto"><Filter className="h-4 w-4 shrink-0 text-muted-foreground" /><button type="button" onClick={() => setFocus("all")} className={focus === "all" ? "rounded-full border bg-primary px-3 py-2 text-[10px] font-black uppercase text-primary-foreground" : "rounded-full border px-3 py-2 text-[10px] font-black uppercase hover:bg-muted"}>Todos</button>{objectives.map((objective) => <button type="button" key={objective} onClick={() => setFocus(objective)} className={focus === objective ? "whitespace-nowrap rounded-full border bg-primary px-3 py-2 text-[10px] font-black uppercase text-primary-foreground" : "whitespace-nowrap rounded-full border px-3 py-2 text-[10px] font-black uppercase hover:bg-muted"}>{objectiveLabels[objective] ?? objective}</button>)}</div>
          </div>
          {isLoading ? <div className="space-y-3 p-5">{[1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}</div> :
          isError ? <div className="flex flex-col items-center justify-center px-6 py-20 text-center"><div className="rounded-2xl bg-destructive/10 p-4"><BarChart3 className="h-6 w-6 text-destructive" /></div><p className="mt-4 font-black">Não foi possível carregar a matriz.</p><p className="mt-1 text-xs text-muted-foreground">Verifique a conexão e tente novamente.</p><Button variant="outline" className="mt-4 rounded-xl" onClick={() => void refetch()}>Tentar novamente</Button></div> :
          data?.channels.length === 0 ? <div className="flex flex-col items-center justify-center px-6 py-20 text-center"><div className="rounded-2xl bg-primary/10 p-4"><Radio className="h-6 w-6 text-primary" /></div><p className="mt-4 font-black">Nenhuma estratégia ativa configurada</p><p className="mt-1 max-w-md text-xs text-muted-foreground">Configure estratégias em Social Strategy para que elas apareçam automaticamente nesta matriz.</p></div> :
          <div className="overflow-x-auto"><table className="w-full min-w-[1050px] border-collapse text-sm"><thead><tr className="border-b bg-muted/10"><th className="sticky left-0 z-10 min-w-[190px] bg-muted/10 p-4 text-left text-[10px] font-black uppercase tracking-widest">Canal</th>{objectives.map(objective => { const Icon=objectiveIcons[objective] ?? Target; return <th key={objective} className="min-w-[170px] p-4 text-left text-[10px] font-black uppercase tracking-widest"><span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-primary" />{objectiveLabels[objective] ?? objective}</span></th>; })}</tr></thead><tbody>{filteredChannels.map(channel => <tr key={channel.channel_id} className="group border-b last:border-0 hover:bg-muted/20"><td className="sticky left-0 z-[1] bg-card p-4 align-top group-hover:bg-muted/20"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10"><Radio className="h-4 w-4 text-primary" /></div><div className="min-w-0"><p className="truncate font-black">{channel.channel_name}</p><Badge variant="outline" className="mt-1 rounded-full text-[9px] uppercase">{channel.platform}</Badge></div></div></td>{objectives.map(objective => { const cell=channel.objectives[objective]; return <td key={objective} className="p-3 align-top">{cell ? <div className="rounded-2xl border bg-background p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between gap-2"><span className="text-sm font-black">{cell.count}</span><Badge className="rounded-full text-[9px]">{cell.count === 1 ? "estratégia" : "estratégias"}</Badge></div><div className="mt-3 grid grid-cols-2 gap-2"><Info label="Posts/semana" value={String(cell.frequency)} /><Info label="Prioridade máx." value={String(cell.priority)} /><Info label="Coleções" value={String(cell.collections)} /><Info label="Campanhas" value={String(cell.campaigns)} /></div><div className="mt-3 flex items-center justify-end text-[9px] font-black uppercase tracking-widest text-muted-foreground"><ChevronRight className="h-3 w-3" /> detalhado</div></div> : <div className="flex min-h-[130px] items-center justify-center rounded-2xl border border-dashed bg-muted/10 text-xs text-muted-foreground">Sem estratégia</div>}</td>; })}</tr>)}</tbody></table></div>}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed bg-muted/20 p-4 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span><BarChart3 className="mr-2 inline h-4 w-4 text-primary" />A matriz é somente leitura e reflete estratégias ativas do banco em tempo real. Os filtros são locais e não alteram os dados.</span><span className="font-semibold">Edição: Social Strategy <ChevronRight className="inline h-3 w-3" /> Publicação: motor existente</span></div>
    </div>
  </div>;
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Target; label: string; value: number; detail: string }) {
  return <div className="group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" /><div className="relative flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black tracking-tight">{Number(value).toLocaleString("pt-BR")}</p><p className="mt-1 text-[10px] text-muted-foreground">{detail}</p></div><div className="rounded-xl border bg-muted/50 p-2.5"><Icon className="h-4 w-4 text-primary" /></div></div></div>;
}
function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted/40 p-2"><p className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-0.5 text-xs font-black">{value}</p></div>;
}

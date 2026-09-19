import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOpportunityAlerts, refreshOpportunityAlerts, updateOpportunityAlertStatus, type OpportunityAlert } from "@/lib/opportunity-engine.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, ChevronDown, Clock3, Filter, Lightbulb, RefreshCw, Search, Sparkles, Target, TrendingUp, X, XCircle, Zap } from "lucide-react";

export const Route = createFileRoute("/admin/opportunities")({ component: OpportunitiesPage });

const typeLabels: Record<string,string> = { product: "Produto", content: "Conteúdo", campaign: "Campanha", trend: "Tendência", catalog: "Catálogo" };

function OpportunitiesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const [type, setType] = useState("all");
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["opportunity-alerts","open"], queryFn: () => getOpportunityAlerts({ data: { status: "open" } }) });
  const refresh = useMutation({ mutationFn: () => refreshOpportunityAlerts(), onSuccess: (result) => { void queryClient.invalidateQueries({ queryKey: ["opportunity-alerts"] }); toastSafe(`${result.count} sinal(is) processado(s)`); }, onError: () => toastSafe("Não foi possível atualizar os sinais", true) });
  const update = useMutation({ mutationFn: updateOpportunityAlertStatus, onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["opportunity-alerts"]), onError: () => toastSafe("Não foi possível atualizar a oportunidade", true) });
  const alerts = data ?? [];
  const filtered = useMemo(() => alerts.filter(alert => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || alert.title.toLowerCase().includes(q) || alert.recommended_action.toLowerCase().includes(q) || alert.reasons.some(reason => reason.toLowerCase().includes(q));
    const matchPriority = priority === "all" || (priority === "high" ? alert.priority >= 70 : priority === "medium" ? alert.priority >= 40 && alert.priority < 70 : alert.priority < 40);
    const matchType = type === "all" || alert.opportunity_type === type;
    return matchSearch && matchPriority && matchType;
  }), [alerts, search, priority, type]);
  const stats = useMemo(() => ({ avg: alerts.length ? alerts.reduce((s,a)=>s+Number(a.score||0),0)/alerts.length : 0, high: alerts.filter(a=>a.priority>=70).length, types: new Set(alerts.map(a=>a.opportunity_type)).size }), [alerts]);

  return <div className="min-h-full bg-gradient-to-b from-muted/20 via-background to-background">
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="relative overflow-hidden rounded-[2rem] border bg-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl"><div className="mb-3 flex flex-wrap gap-2"><Badge className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]"><Sparkles className="mr-1 h-3 w-3"/>Opportunity Engine</Badge><Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold uppercase">Revisão humana</Badge></div><h1 className="text-3xl font-black tracking-tight sm:text-5xl">Oportunidades <span className="text-primary">acionáveis</span></h1><p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">Sinais reais do catálogo transformados em oportunidades priorizadas para revisão administrativa. Nenhum alerta publica ou altera campanhas sozinho.</p></div>
          <Button onClick={() => refresh.mutate()} disabled={refresh.isPending} className="h-11 rounded-xl px-5 font-black"><RefreshCw className={refresh.isPending ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"}/>Atualizar sinais</Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Metric icon={Lightbulb} label="Abertas" value={alerts.length} detail="Aguardando revisão"/><Metric icon={TrendingUp} label="Score médio" value={stats.avg} detail="Sinal agregado"/><Metric icon={Zap} label="Alta prioridade" value={stats.high} detail="Prioridade ≥ 70"/><Metric icon={Target} label="Tipos ativos" value={stats.types} detail="Categorias de sinal"/></div>

      <Card className="rounded-[2rem] border shadow-sm"><CardContent className="p-4 sm:p-5"><div className="flex flex-col gap-3 lg:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar oportunidade, ação ou motivo..." className="h-10 w-full rounded-xl border bg-muted/30 pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-primary"/>{search && <button type="button" onClick={()=>setSearch("")} className="absolute right-2 top-2 rounded-lg p-1.5 hover:bg-muted"><X className="h-4 w-4"/></button>}</div><div className="flex gap-2 overflow-x-auto"><Select value={priority} onChange={setPriority} options={[["all","Todas prioridades"],["high","Alta"],["medium","Média"],["low","Baixa"]]}/><Select value={type} onChange={setType} options={[["all","Todos os tipos"],...Array.from(new Set(alerts.map(a=>a.opportunity_type))).map(v=>[v,typeLabels[v]??v])]}/></div></div></CardContent></Card>

      <div className="flex items-center justify-between px-1"><div><p className="text-sm font-black">Fila inteligente</p><p className="text-xs text-muted-foreground">{filtered.length} de {alerts.length} oportunidades</p></div><div className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground sm:flex"><Clock3 className="h-3.5 w-3.5"/> revisão antes da ação</div></div>

      {isLoading ? <Card className="rounded-[2rem]"><CardContent className="space-y-3 p-5">{[1,2,3].map(i=><div key={i} className="h-36 animate-pulse rounded-2xl bg-muted"/>)}</CardContent></Card> :
      isError ? <State icon={XCircle} title="Não foi possível carregar as oportunidades." text="Verifique a conexão e tente novamente." action={<Button variant="outline" className="mt-4 rounded-xl" onClick={()=>void refetch()}>Tentar novamente</Button>}/> :
      filtered.length === 0 ? <State icon={Lightbulb} title={alerts.length ? "Nenhum resultado para os filtros." : "Nenhuma oportunidade aberta."} text={alerts.length ? "Ajuste os filtros para visualizar outros sinais." : "Execute Atualizar sinais quando houver dados de catálogo para recalcular."}/> :
      <div className="grid gap-4 lg:grid-cols-2">{filtered.map(alert=><OpportunityCard key={alert.id} alert={alert} pending={update.isPending} onDismiss={()=>update.mutate({data:{id:alert.id,status:"dismissed"}})} onAction={()=>update.mutate({data:{id:alert.id,status:"actioned"}})}/>)}</div>}

      <div className="flex flex-col gap-2 rounded-2xl border border-dashed bg-muted/20 p-4 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span><Activity className="mr-2 inline h-4 w-4 text-primary"/>Motor baseado em sinais reais do catálogo.</span><span className="font-semibold">Revisão humana <ChevronDown className="inline h-3 w-3 rotate-[-90deg]"/> nenhuma ação automática</span></div>
    </div>
  </div>;
}

function OpportunityCard({alert,pending,onDismiss,onAction}:{alert:OpportunityAlert;pending:boolean;onDismiss:()=>void;onAction:()=>void}) {
  const score=Math.max(0,Math.min(100,Number(alert.score)||0));
  return <Card className="group overflow-hidden rounded-[2rem] border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"><CardContent className="p-0"><div className="p-5 sm:p-6"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Lightbulb className="h-5 w-5"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><Badge className="rounded-full text-[9px] font-black uppercase">{typeLabels[alert.opportunity_type]??alert.opportunity_type}</Badge><Badge variant="outline" className="rounded-full text-[9px] font-black">Score {score.toFixed(0)}</Badge><Badge variant="outline" className="rounded-full text-[9px] font-black">Prioridade {alert.priority}</Badge></div><h3 className="mt-3 text-base font-black leading-5">{alert.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{alert.recommended_action}</p></div></div><div className="mt-4"><div className="mb-1 flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground"><span>Força do sinal</span><span>{score.toFixed(0)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{width:score+"%"}}/></div></div><div className="mt-4 flex flex-wrap gap-2">{(Array.isArray(alert.reasons)?alert.reasons:[]).filter(Boolean).map((reason:string)=><span key={reason} className="rounded-full border bg-muted/30 px-2.5 py-1.5 text-[10px] font-bold">{reason}</span>)}</div></div><div className="flex flex-wrap gap-2 border-t bg-muted/10 p-4"><Button size="sm" variant="outline" className="rounded-xl" onClick={onDismiss} disabled={pending}><XCircle className="mr-1.5 h-4 w-4"/>Dispensar</Button><Button size="sm" className="rounded-xl" onClick={onAction} disabled={pending}><CheckCircle2 className="mr-1.5 h-4 w-4"/>Marcar tratada</Button></div></CardContent></Card>;
}
function Metric({icon:Icon,label,value,detail}:{icon:typeof Target;label:string;value:number;detail:string}) { return <div className="group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl"/><div className="relative flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black">{Number(value).toFixed(label==="Score médio"?0:0)}</p><p className="mt-1 text-[10px] text-muted-foreground">{detail}</p></div><div className="rounded-xl border bg-muted/50 p-2.5"><Icon className="h-4 w-4 text-primary"/></div></div></div>; }
function Select({value,onChange,options}:{value:string;onChange:(v:string)=>void;options:string[][]}) { return <div className="relative shrink-0"><select value={value} onChange={e=>onChange(e.target.value)} className="h-10 appearance-none rounded-xl border bg-background px-3 pr-8 text-xs font-bold">{options.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-3.5 w-3.5 text-muted-foreground"/></div>; }
function State({icon:Icon,title,text,action}:{icon:typeof Target;title:string;text:string;action?:React.ReactNode}) { return <Card className="rounded-[2rem] border-dashed"><CardContent className="flex flex-col items-center justify-center py-20 text-center"><div className="rounded-2xl bg-primary/10 p-4"><Icon className="h-6 w-6 text-primary"/></div><p className="mt-4 font-black">{title}</p><p className="mt-1 max-w-md text-xs text-muted-foreground">{text}</p>{action}</CardContent></Card>; }
function toastSafe(message:string,error=false){ void import("sonner").then(({toast})=>error?toast.error(message):toast.success(message)); }

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, Zap, TrendingUp, BarChart3, MousePointerClick, Eye, Clock3 } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({ component: AdminAnalyticsPage });

type EventRow = { id:string; event_type:string; user_id:string|null; metadata:Record<string,unknown>|null; created_at:string; source:string|null };
type PopupRow = { id:string; popup_rule_id:string; event_type:string; user_id:string|null; created_at:string };

function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-marketing-analytics"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [eventsRes, popupRes, rulesRes, experimentsRes, assignmentsRes] = await Promise.all([
        supabase.from("analytics_events").select("id,event_type,user_id,metadata,created_at,source").gte("created_at", since).order("created_at", { ascending:false }).limit(5000),
        supabase.from("popup_events").select("id,popup_rule_id,event_type,user_id,created_at").gte("created_at", since).limit(5000),
        supabase.from("popup_rules").select("id,name,trigger_type,content,is_active"),
        supabase.from("ab_experiments").select("id,name,variant_a,variant_b,target,is_active"),
        supabase.from("ab_assignments").select("experiment_id,variant,assigned_at").gte("assigned_at", since).limit(5000),
      ]);
      if (eventsRes.error) throw eventsRes.error;
      if (popupRes.error) throw popupRes.error;
      if (rulesRes.error) throw rulesRes.error;
      if (experimentsRes.error) throw experimentsRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;
      const events = (eventsRes.data ?? []) as EventRow[];
      const popupEvents = (popupRes.data ?? []) as PopupRow[];
      const rules = rulesRes.data ?? [];
      const popupRuleById = new Map(rules.map((r:any)=>[r.id,r]));
      const views = popupEvents.filter(e=>e.event_type==='view').length;
      const clicks = popupEvents.filter(e=>e.event_type==='click').length;
      const timing = new Map<string,{views:number;clicks:number}>();
      for (const e of popupEvents) {
        const rule:any = popupRuleById.get(e.popup_rule_id);
        const trigger = String(rule?.trigger_type ?? 'unknown');
        const row = timing.get(trigger) ?? {views:0,clicks:0};
        if(e.event_type==='view') row.views++; if(e.event_type==='click') row.clicks++;
        timing.set(trigger,row);
      }
      const strategies = ['bundle','flash_deal','upsell','reward','gift'];
      const byStrategy = strategies.map(strategy=>{
        const ids = rules.filter((r:any)=>r.content?.strategy===strategy || r.trigger_type?.toLowerCase().includes(strategy)).map((r:any)=>r.id);
        const pv = popupEvents.filter(e=>ids.includes(e.popup_rule_id));
        const v=pv.filter(e=>e.event_type==='view').length, c=pv.filter(e=>e.event_type==='click').length;
        return {strategy,views:v,clicks:c,ctr:v?c/v*100:0};
      });
      const hour = Array.from({length:24},(_,h)=>({hour:h,views:0,clicks:0}));
      popupEvents.forEach(e=>{const h=new Date(e.created_at).getHours(); if(e.event_type==='view')hour[h]!.views++; if(e.event_type==='click')hour[h]!.clicks++;});
      const device = new Map<string,{views:number;clicks:number}>();
      events.forEach(e=>{const d=String((e.metadata as any)?.device ?? (e.metadata as any)?.device_type ?? 'unknown').toLowerCase(); if(!device.has(d))device.set(d,{views:0,clicks:0});});
      return {events,popupEvents,rules,experiments:experimentsRes.data??[],assignments:assignmentsRes.data??[],views,clicks,byStrategy,timing:Array.from(timing,([trigger,stats])=>({trigger,...stats,ctr:stats.views?stats.clicks/stats.views*100:0})),hour,device};
    }
  });
  const totalEvents=data?.events.length??0;
  const eventClicks=data?.events.filter(e=>['OUTBOUND_CLICK','AFFILIATE_CLICK'].includes(e.event_type)).length??0;
  const roiAvailable=data?.events.some(e=>typeof (e.metadata as any)?.commission_amount==='number');
  const generalViews=data?.events.filter(e=>['NOTIFICATION_VIEW','PUSH_OPEN','IN_APP_NOTIFICATION_VIEW'].includes(e.event_type)).length??0;
  const generalClicks=data?.events.filter(e=>['NOTIFICATION_CLICK','PUSH_CLICK','IN_APP_NOTIFICATION_CLICK'].includes(e.event_type)).length??0;
  const popupCtr=(data?.views??0)>0?((data?.clicks??0)/(data?.views??1))*100:0;
  const generalCtr=generalViews>0?generalClicks/generalViews*100:0;
  return <div className="container mx-auto py-10 px-4 max-w-7xl space-y-8 pb-safe">
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6"><div><Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3">Marketing Intelligence · 30 dias</Badge><h1 className="mt-2 text-4xl md:text-5xl font-black tracking-tighter uppercase italic">Popup Performance</h1><p className="mt-2 text-sm text-muted-foreground">Métricas derivadas exclusivamente dos eventos registrados.</p></div><Badge variant="outline" className="w-fit">{isLoading?'Sincronizando…':'LIVE DATA'}</Badge></div>
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {[['Eventos',totalEvents,Activity],['Exibições',data?.views??0,Eye],['Cliques',data?.clicks??0,MousePointerClick],['CTR pop-ups',`${popupCtr.toFixed(2)}%`,TrendingUp],['CTR geral',`${generalCtr.toFixed(2)}%`,Zap]].map(([label,val,Icon]:any)=><Card key={label} className="bg-glass-fallback border-glass-border rounded-3xl"><CardContent className="p-5"><Icon className="w-4 h-4 text-primary mb-3"/><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p><p className="text-2xl md:text-3xl font-black tracking-tight mt-1">{typeof val==='number'?val.toLocaleString('pt-BR'):val}</p></CardContent></Card>)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-glass-fallback border-glass-border rounded-[2rem]"><CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">CTR por pop-up estratégico</CardTitle></CardHeader><CardContent className="space-y-3">{data?.byStrategy.map((r:any)=><div key={r.strategy} className="flex items-center justify-between rounded-2xl border border-glass-border p-4"><div><p className="font-black uppercase text-xs">{r.strategy}</p><p className="text-xs text-muted-foreground">{r.views} visualizações · {r.clicks} cliques</p></div><Badge variant="outline">{r.ctr.toFixed(2)}% CTR</Badge></div>)}</CardContent></Card>
      <Card className="bg-glass-fallback border-glass-border rounded-[2rem]"><CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">CTR por gatilho de timing</CardTitle></CardHeader><CardContent className="space-y-3">{data?.timing.map((r:any)=><div key={r.trigger} className="flex items-center justify-between rounded-2xl border border-glass-border p-4"><div><p className="font-black uppercase text-xs">{r.trigger}</p><p className="text-xs text-muted-foreground">{r.views} views · {r.clicks} clicks</p></div><Badge variant="outline">{r.ctr.toFixed(2)}%</Badge></div>)}</CardContent></Card>
    </div>
    <Card className="bg-glass-fallback border-glass-border rounded-[2rem] overflow-hidden"><CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Clock3 className="w-4 h-4 text-primary"/>Performance por horário</CardTitle></CardHeader><CardContent><div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">{data?.hour.map((h:any)=><div key={h.hour} className="rounded-xl border border-glass-border p-2 text-center"><p className="text-[9px] font-black">{String(h.hour).padStart(2,'0')}h</p><p className="text-xs font-bold mt-1">{h.views}</p><p className="text-[8px] text-muted-foreground">views</p></div>)}</div></CardContent></Card>
    <Card className="bg-blue-500/5 border-blue-500/20 rounded-3xl"><CardContent className="p-6"><div className="flex items-start gap-3"><BarChart3 className="w-5 h-5 text-blue-500 mt-0.5"/><div><p className="text-xs font-black uppercase tracking-widest text-blue-500">ROI</p><p className="text-sm font-bold mt-1">{roiAvailable?'Disponível: calculado a partir de comissão real.':'Pendente — nenhuma comissão real disponível. Nenhum ROI foi inventado.'}</p></div></div></CardContent></Card>
    <Card className="bg-glass-fallback border-glass-border rounded-[2rem] overflow-hidden"><CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Eventos recentes</CardTitle></CardHeader><Table><TableHeader><TableRow><TableHead>Evento</TableHead><TableHead>Origem</TableHead><TableHead>Usuário</TableHead><TableHead className="text-right">Horário</TableHead></TableRow></TableHeader><TableBody>{data?.events.slice(0,20).map(e=><TableRow key={e.id}><TableCell><Badge variant="outline">{e.event_type}</Badge></TableCell><TableCell className="text-xs">{e.source??'—'}</TableCell><TableCell className="font-mono text-xs">{e.user_id?`${e.user_id.slice(0,8)}…`:'anonymous'}</TableCell><TableCell className="text-right text-xs">{new Date(e.created_at).toLocaleString('pt-BR')}</TableCell></TableRow>)}</TableBody></Table></Card>
    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">A/B: {data?.experiments.filter((e:any)=>e.is_active).length??0} experimento(s) ativo(s) · {data?.assignments.length??0} atribuições nos últimos 30 dias</div>
  </div>;
}

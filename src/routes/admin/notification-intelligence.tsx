import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, Bell, CheckCircle2, Send, Users, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getNotificationIntelligence } from "@/lib/notification-intelligence.functions";

export const Route = createFileRoute("/admin/notification-intelligence")({ component: NotificationIntelligencePage });

function NotificationIntelligencePage() {
  const getData = useServerFn(getNotificationIntelligence);
  const query = useQuery({ queryKey: ["notification-intelligence"], queryFn: () => getData({ data: undefined }) });
  if (query.isLoading) return <div className="container mx-auto px-4 py-12 text-sm text-muted-foreground">Carregando Notification Intelligence…</div>;
  if (query.isError) return <div className="container mx-auto px-4 py-12 text-sm text-destructive">Falha ao carregar: {query.error.message}</div>;
  const d = query.data ?? {};
  const deliveryRate = Number(d.logs_30d) > 0 ? ((Number(d.sent_30d) / Number(d.logs_30d)) * 100).toFixed(1) : "0.0";
  return <div className="container mx-auto space-y-8 px-4 py-8 lg:px-8 lg:py-12">
    <header><div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest"><Bell className="h-3 w-3"/> Notification Intelligence</div><h1 className="text-4xl font-black uppercase italic tracking-tighter lg:text-6xl">Notification <span className="text-primary">Intelligence</span></h1><p className="mt-3 max-w-3xl text-sm text-muted-foreground">Visão operacional do sistema existente: templates, retenção, push, entrega e falhas. Nenhum dado sintético.</p></header>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={Send} title="Logs 30d" value={d.logs_30d ?? 0}/><Metric icon={CheckCircle2} title="Enviadas 30d" value={d.sent_30d ?? 0}/><Metric icon={XCircle} title="Falhas 30d" value={d.failed_30d ?? 0}/><Metric icon={Activity} title="Entrega" value={`${deliveryRate}%`}/></div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><Metric icon={Bell} title="Templates ativos" value={d.active_templates ?? 0}/><Metric icon={Users} title="Push cadastrados" value={d.users_with_push ?? 0}/><Metric icon={Users} title="Retenção ativa" value={d.retention_enabled ?? 0}/><Metric icon={Bell} title="Push ativo" value={d.push_enabled ?? 0}/></div>
    <Card className="rounded-3xl"><CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between"><div><div className="text-xs font-black uppercase tracking-widest">Templates e histórico</div><p className="mt-1 text-sm text-muted-foreground">A administração existente continua em Notificações; este painel concentra os indicadores reais para decisão.</p></div><a href="/admin/notifications" className="rounded-xl border px-4 py-2 text-sm font-bold">Abrir central</a></CardContent></Card>
  </div>;
}
function Metric({ icon: Icon, title, value }: { icon: typeof Bell; title: string; value: string | number }) { return <Card className="rounded-3xl"><CardContent className="p-5"><Icon className="h-4 w-4 text-primary"/><div className="mt-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</div><div className="mt-1 text-3xl font-black">{value}</div></CardContent></Card>; }

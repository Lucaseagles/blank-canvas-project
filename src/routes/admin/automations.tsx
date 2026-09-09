import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAutomationRules, toggleRuleStatus, getAutomationLogs, recalculateTrendingManual, runRetentionCheck } from "@/lib/automation.functions";
import { recalculateCategoryHighlights } from "@/lib/highlights.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cpu, Zap, Clock, History, Settings2, CheckCircle2, XCircle, Database, RefreshCcw, ShieldCheck, Target } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/automations")({ component: AdminAutomationsPage });

function AdminAutomationsPage() {
  const queryClient = useQueryClient();
  const getRules = useServerFn(getAutomationRules);
  const getLogs = useServerFn(getAutomationLogs);
  const toggleStatus = useServerFn(toggleRuleStatus);
  const triggerTrending = useServerFn(recalculateTrendingManual);
  const triggerRetention = useServerFn(runRetentionCheck);
  const triggerCategoryHighlights = useServerFn(recalculateCategoryHighlights);

  const { data: rules } = useSuspenseQuery({ queryKey: ["automation-rules"], queryFn: () => getRules({ data: undefined }) });
  const { data: logs } = useSuspenseQuery({ queryKey: ["automation-logs"], queryFn: () => getLogs({ data: { limit: 50 } }) });

  const toggleMutation = useMutation({
    mutationFn: (vars: { id: string; isActive: boolean }) => toggleStatus({ data: vars }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["automation-rules"] }); toast.success("Status da automação atualizado"); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a automação"),
  });
  const trendingMutation = useMutation({
    mutationFn: () => triggerTrending({ data: undefined }),
    onSuccess: (result) => { queryClient.invalidateQueries({ queryKey: ["automation-logs"] }); result.success ? toast.success(`Trending recalculado: ${result.processed} produtos`) : toast.error(result.error ?? "Trending não executado"); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao recalcular trending"),
  });
  const retentionMutation = useMutation({
    mutationFn: () => triggerRetention({ data: undefined }),
    onSuccess: (result) => { queryClient.invalidateQueries({ queryKey: ["automation-logs"] }); result.success ? toast.success(`Retenção processada: ${result.notifications_queued} notificações`) : toast.error(result.error ?? "Retenção não executada"); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao executar retenção"),
  });
  const categoryHighlightsMutation = useMutation({
    mutationFn: () => triggerCategoryHighlights({ data: undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["automation-logs"] }); toast.success("Highlights de categoria sincronizados"); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao sincronizar highlights"),
  });

  return (
    <div className="container mx-auto py-8 md:py-12 px-4 md:px-8 space-y-8 md:space-y-12">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-3"><Badge className="bg-primary/10 text-primary border-primary/20 font-black px-4 py-1 uppercase tracking-widest text-[10px]">Neural Core</Badge><h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase italic leading-none">Automation <span className="text-primary">Engine</span></h1><p className="text-muted-foreground font-bold tracking-tight max-w-2xl">Orquestre regras, gatilhos e tarefas automáticas da plataforma em um único centro operacional.</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 xl:flex gap-3">
          <Button onClick={() => categoryHighlightsMutation.mutate()} disabled={categoryHighlightsMutation.isPending} variant="outline" className="h-12 md:h-14 px-5 md:px-8 rounded-2xl font-black uppercase tracking-tighter italic gap-2"><Target className="w-5 h-5" />{categoryHighlightsMutation.isPending ? "Sincronizando..." : "Sync Highlights"}</Button>
          <Button onClick={() => retentionMutation.mutate()} disabled={retentionMutation.isPending} variant="outline" className="h-12 md:h-14 px-5 md:px-8 rounded-2xl font-black uppercase tracking-tighter italic gap-2"><Zap className="w-5 h-5" />{retentionMutation.isPending ? "Processando..." : "Force Retention"}</Button>
          <Button onClick={() => trendingMutation.mutate()} disabled={trendingMutation.isPending} className="h-12 md:h-14 px-5 md:px-8 rounded-2xl font-black uppercase tracking-tighter italic gap-2"><RefreshCcw className={`w-5 h-5 ${trendingMutation.isPending ? "animate-spin" : ""}`} />{trendingMutation.isPending ? "Recalculando..." : "Force Re-Sync"}</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6"><div className="flex items-center gap-3 px-2"><Settings2 className="w-5 h-5 text-primary" /><h2 className="text-xl font-black uppercase italic tracking-tighter">Active Protocols</h2></div>
          <div className="grid grid-cols-1 gap-4">{rules.length === 0 ? <Card className="p-10 text-center bg-glass-fallback border-glass-border"><p className="text-sm font-bold text-muted-foreground">Nenhuma regra de automação configurada.</p></Card> : rules.map((rule) => <Card key={rule.id} className={`bg-glass-fallback border-glass-border backdrop-blur-xl rounded-[2rem] p-5 md:p-6 transition-all ${!rule.is_active ? "opacity-60" : ""}`}><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5"><div className="flex gap-4 min-w-0"><div className={`shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border ${rule.is_active ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted/10 border-muted/20 text-muted-foreground"}`}>{rule.trigger_type === "SCHEDULED" ? <Clock className="w-6 h-6" /> : <Zap className="w-6 h-6" />}</div><div className="space-y-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-base md:text-lg font-black uppercase italic tracking-tighter break-words">{rule.name}</h3>{!rule.is_fully_automated && <Badge variant="outline" className="text-[8px] font-black border-blue-500/30 text-blue-500">Adapter Required</Badge>}</div><p className="text-xs text-muted-foreground font-bold">{rule.description}</p><div className="flex flex-wrap items-center gap-2 md:gap-4 pt-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60"><span className="flex items-center gap-1.5"><Cpu className="w-3 h-3" />{rule.trigger_type}</span><span>→</span><span className="flex items-center gap-1.5 text-primary"><Database className="w-3 h-3" />{rule.action_type}</span></div></div></div><div className="flex items-center sm:flex-col sm:items-end justify-between gap-3"><Switch checked={!!rule.is_active} onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, isActive: checked })} disabled={toggleMutation.isPending} /><Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest ${rule.is_fully_automated ? "border-green-500/20 text-green-500" : "border-amber-500/20 text-amber-500"}`}>{rule.is_fully_automated ? "Autonomous" : "Manual Review"}</Badge></div></div></Card>)}</div>
        </div>
        <div className="space-y-6"><div className="flex items-center justify-between px-2"><div className="flex items-center gap-3"><History className="w-5 h-5 text-primary" /><h2 className="text-xl font-black uppercase italic tracking-tighter">Activity Log</h2></div><Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest opacity-50">Últimos 50</Badge></div><Card className="bg-glass-fallback border-glass-border backdrop-blur-xl rounded-[2.5rem] p-4 md:p-6 h-[520px] md:h-[700px] overflow-hidden flex flex-col"><div className="flex-1 overflow-y-auto space-y-4 pr-1">{logs.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-40"><History className="w-12 h-12" /><p className="text-xs font-black uppercase tracking-widest">Nenhuma atividade registrada ainda.</p></div> : logs.map((log) => <div key={log.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 min-w-0">{log.status === "success" ? <CheckCircle2 className="shrink-0 w-3 h-3 text-green-500" /> : log.status === "failed" ? <XCircle className="shrink-0 w-3 h-3 text-red-500" /> : <ShieldCheck className="shrink-0 w-3 h-3 text-blue-500" />}<span className="text-[10px] font-black uppercase tracking-widest truncate">{(log.automation_rules as { name?: string } | null)?.name ?? "Regra"}</span></div><span className="text-[9px] font-bold text-muted-foreground/60 shrink-0">{log.triggered_at ? format(new Date(log.triggered_at), "HH:mm:ss") : "--:--:--"}</span></div><p className="text-[11px] font-medium text-muted-foreground line-clamp-3 leading-relaxed">{log.result}</p></div>)}</div></Card></div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t border-glass-border opacity-60"><div className="flex flex-wrap items-center gap-4 md:gap-6"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Engine: Operational</div><div className="text-[10px] font-black uppercase tracking-widest">Rules: {rules.length}</div></div><div className="text-[10px] font-black uppercase tracking-widest">Automation Engine</div></div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, CheckCircle2, Clock3, Download, RefreshCw } from "lucide-react";
import { collectTelegramMetric, getExternalChannels, getExternalMetrics } from "@/lib/admin-metrics.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ExternalMetrics() {
  const queryClient = useQueryClient();
  const metricsQuery = useQuery({ queryKey: ["admin-external-metrics"], queryFn: () => getExternalMetrics() });
  const channelsQuery = useQuery({ queryKey: ["admin-external-channels"], queryFn: () => getExternalChannels() });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const collectMutation = useMutation({
    mutationFn: () => collectTelegramMetric(),
    onSuccess: async () => {
      setErrorMessage(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-external-metrics"] });
    },
    onError: (error) => setErrorMessage(error instanceof Error ? error.message : "Não foi possível coletar a métrica."),
  });

  const metrics = metricsQuery.data ?? [];
  const channels = channelsQuery.data ?? [];
  const telegramMetrics = useMemo(
    () => metrics.filter((metric) => metric.platform === "telegram" && metric.metric_type === "member_count").sort((a, b) => new Date(a.collected_at).getTime() - new Date(b.collected_at).getTime()),
    [metrics],
  );
  const latestTelegram = telegramMetrics.at(-1)?.value ?? null;
  const chartData = telegramMetrics.map((metric) => ({
    date: new Date(metric.collected_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    members: metric.value,
  }));

  const reload = async () => {
    setErrorMessage(null);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-external-metrics"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-external-channels"] }),
    ]);
  };

  const queryError = metricsQuery.error || channelsQuery.error;

  if (metricsQuery.isLoading || channelsQuery.isLoading) {
    return <div className="flex min-h-64 items-center justify-center text-muted-foreground">Carregando métricas externas…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><Activity className="h-5 w-5" /><h2 className="text-xl font-semibold">Métricas Externas</h2></div>
          <p className="mt-1 text-sm text-muted-foreground">Dados coletados de canais externos, sem métricas inventadas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reload} disabled={metricsQuery.isFetching || channelsQuery.isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${metricsQuery.isFetching || channelsQuery.isFetching ? "animate-spin" : ""}`} />Atualizar
          </Button>
          <Button onClick={() => collectMutation.mutate()} disabled={collectMutation.isPending}>
            <Download className="mr-2 h-4 w-4" />{collectMutation.isPending ? "Coletando…" : "Coletar Telegram"}
          </Button>
        </div>
      </div>

      {errorMessage && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</div>}
      {queryError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">Não foi possível carregar todos os dados. Tente atualizar.</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Telegram · membros</span><CheckCircle2 className="h-4 w-4" /></div><div className="mt-2 text-3xl font-bold">{latestTelegram === null ? "—" : latestTelegram.toLocaleString("pt-BR")}</div><p className="mt-1 text-xs text-muted-foreground">Última coleta registrada</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Coletas armazenadas</span><Activity className="h-4 w-4" /></div><div className="mt-2 text-3xl font-bold">{metrics.length}</div><p className="mt-1 text-xs text-muted-foreground">Histórico carregado</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Canais ativos</span><Clock3 className="h-4 w-4" /></div><div className="mt-2 text-3xl font-bold">{channels.length}</div><p className="mt-1 text-xs text-muted-foreground">Configurados no Cross-Promo</p></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Evolução de membros · Telegram</CardTitle></CardHeader><CardContent>
        {chartData.length > 0 ? <div className="h-[320px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><CartesianGrid strokeDasharray="3 3" className="opacity-30" /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip formatter={(value) => [Number(value).toLocaleString("pt-BR"), "Membros"]} /><Area type="monotone" dataKey="members" stroke="currentColor" fill="currentColor" fillOpacity={0.08} /></AreaChart></ResponsiveContainer></div> : <div className="py-16 text-center text-sm text-muted-foreground">Nenhuma coleta de membros do Telegram registrada ainda.</div>}
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Canais ativos</CardTitle></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {channels.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum canal ativo cadastrado.</p> : channels.map((channel) => <div key={channel.id} className="flex items-center gap-3 rounded-lg border p-3"><span className="text-xl">{channel.icon || "🔗"}</span><div className="min-w-0 flex-1"><p className="truncate font-medium">{channel.channel_name}</p><p className="text-xs text-muted-foreground">{channel.platform}</p></div><Badge variant="secondary">Ativo</Badge></div>)}
      </div></CardContent></Card>
    </div>
  );
}

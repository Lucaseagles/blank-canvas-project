import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type ReactNode } from "react";
import { BrainCircuit, CheckCircle2, Gauge, Info, RefreshCw, Save, Settings2, SlidersHorizontal, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminSettings, updateAdminSetting } from "@/lib/admin-settings.functions";

export const Route = createFileRoute("/admin/algorithm-control")({ component: AlgorithmControlPage });

type SettingSource = { key: string; label: string; rows: Array<Record<string, unknown>>; available: boolean; error: string | null };

const MIX_KEYS = ["relevant_pct", "related_pct", "discovery_pct"] as const;

function AlgorithmControlPage() {
  const qc = useQueryClient();
  const getSettings = useServerFn(getAdminSettings);
  const update = useServerFn(updateAdminSetting);
  const query = useQuery({ queryKey: ["admin-algorithm-control"], queryFn: () => getSettings({ data: undefined }) });
  const mutation = useMutation({
    mutationFn: (input: { source: string; id: string; patch: Record<string, unknown> }) => update({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-algorithm-control"] });
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Parâmetro atualizado e auditado");
    },
    onError: (error) => toast.error(error.message),
  });

  const sources = (query.data ?? []) as SettingSource[];
  const weights = sources.find((source) => source.key === "personalization_weights");
  const feedMix = sources.find((source) => source.key === "feed_mix_config");
  const weightRows = weights?.rows ?? [];
  const mixRow = feedMix?.rows?.[0];

  const mixValues = MIX_KEYS.map((key) => Number(mixRow?.[key] ?? 0));
  const mixTotal = mixValues.reduce((sum, value) => sum + value, 0);
  const validMixValues = mixValues.every((value) => Number.isFinite(value) && value >= 0 && value <= 100);
  const mixIsBalanced = validMixValues && Math.abs(mixTotal - 100) < 0.001;
  const maxWeight = Math.max(...weightRows.map((row) => Math.abs(Number(row["weight"] ?? 0))), 0);
  const availableSources = sources.filter((source) => source.available).length;
  const unavailableSources = sources.length - availableSources;

  const updatedAt = query.dataUpdatedAt ? new Date(query.dataUpdatedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : null;

  return (
    <div className="min-h-full bg-gradient-to-b from-primary/[0.035] via-background to-background">
      <div className="mx-auto max-w-7xl space-y-8 p-4 lg:p-8">
        <header className="relative overflow-hidden rounded-[2rem] border bg-card/90 p-6 shadow-sm backdrop-blur md:p-8">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"><BrainCircuit className="h-3 w-3" /> Algorithm Control</Badge>
                <Badge variant="outline" className="gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Fonte real</Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">Owner Only</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Centro de <span className="text-primary">controle algorítmico</span></h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Ajuste os sinais que já alimentam a personalização e o mix do feed. Este painel edita as fontes existentes, sem criar um segundo algoritmo ou uma nova fonte de verdade.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {updatedAt && <span className="text-xs text-muted-foreground">Atualizado {updatedAt}</span>}
              <Button variant="outline" className="gap-2 rounded-xl" onClick={() => query.refetch()} disabled={query.isFetching}>
                <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /> {query.isFetching ? "Atualizando…" : "Atualizar"}
              </Button>
            </div>
          </div>
        </header>

        {query.isError ? (
          <Card className="rounded-[2rem] border-destructive/30">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <TriangleAlert className="h-8 w-8 text-destructive" />
              <p className="font-bold">Não foi possível carregar o centro de controle.</p>
              <p className="max-w-xl text-sm text-muted-foreground">{query.error.message}</p>
              <Button variant="outline" className="rounded-xl" onClick={() => query.refetch()}>Tentar novamente</Button>
            </CardContent>
          </Card>
        ) : query.isLoading ? (
          <LoadingState />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={<SlidersHorizontal className="h-4 w-4" />} label="Sinais configurados" value={weightRows.length} detail="Pesos de personalização" />
              <MetricCard icon={<Gauge className="h-4 w-4" />} label="Mix do feed" value={`${Math.round(mixTotal)}%`} detail={mixIsBalanced ? "Distribuição equilibrada" : "Requer revisão"} />
              <MetricCard icon={<Sparkles className="h-4 w-4" />} label="Fontes disponíveis" value={availableSources} detail={unavailableSources ? `${unavailableSources} com erro` : "Todas respondendo"} />
              <MetricCard icon={<BrainCircuit className="h-4 w-4" />} label="Estado do motor" value={mixIsBalanced && unavailableSources === 0 ? "Operacional" : "Atenção"} detail="Baseado nas fontes carregadas" />
            </div>

            <section className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
              <Card className="overflow-hidden rounded-[2rem] border-primary/10 shadow-sm">
                <CardHeader className="border-b bg-muted/20 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" /><CardTitle className="text-lg font-black">Sinais de personalização</CardTitle></div>
                      <p className="mt-1 text-xs text-muted-foreground">Peso relativo de cada sinal consumido pelo sistema.</p>
                    </div>
                    <Badge variant="outline" className="rounded-full">{weightRows.length} sinais</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-6">
                  {!weights?.available ? <Empty icon={<TriangleAlert className="h-5 w-5" />} text={weights?.error ?? "Fonte indisponível."} /> : weightRows.length === 0 ? <Empty icon={<Info className="h-5 w-5" />} text="Nenhum peso configurado." /> : weightRows.map((row) => (
                    <WeightRow key={String(row["id"])} row={row} maxWeight={maxWeight} pending={mutation.isPending} onSave={(value) => mutation.mutate({ source: "personalization_weights", id: String(row["id"]), patch: { weight: value } })} />
                  ))}
                </CardContent>
              </Card>

              <Card className="overflow-hidden rounded-[2rem] border-primary/10 shadow-sm">
                <CardHeader className="border-b bg-muted/20 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" /><CardTitle className="text-lg font-black">Mix do feed</CardTitle></div>
                      <p className="mt-1 text-xs text-muted-foreground">Composição entre relevância, conteúdos relacionados e descoberta.</p>
                    </div>
                    <Badge variant={mixIsBalanced ? "secondary" : "destructive"} className="rounded-full">{mixIsBalanced ? "100% balanceado" : `${Math.round(mixTotal)}% total`}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {!feedMix?.available ? <Empty icon={<TriangleAlert className="h-5 w-5" />} text={feedMix?.error ?? "Fonte indisponível."} /> : !mixRow ? <Empty icon={<Info className="h-5 w-5" />} text="Nenhuma configuração de mix encontrada." /> : (
                    <>
                      <div className="mb-6 overflow-hidden rounded-2xl border bg-muted/20">
                        <div className="flex h-3">
                          {MIX_KEYS.map((key, index) => <div key={key} className="bg-primary transition-all" style={{ width: `${Math.max(0, Math.min(100, mixValues[index]))}%`, opacity: 1 - index * 0.18 }} />)}
                        </div>
                        <div className="grid grid-cols-3 divide-x text-center">
                          {MIX_KEYS.map((key, index) => <div key={key} className="p-3"><p className="text-lg font-black">{mixValues[index]}%</p><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{key.replace("_pct", "")}</p></div>)}
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {MIX_KEYS.map((key) => <MixRow key={key} label={key.replace("_pct", "")} value={Number(mixRow[key] ?? 0)} pending={mutation.isPending} onSave={(value) => mutation.mutate({ source: "feed_mix_config", id: String(mixRow["id"]), patch: { [key]: value } })} />)}
                      </div>
                      <div className={`mt-5 flex gap-3 rounded-2xl border p-4 text-sm ${mixIsBalanced ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
                        {mixIsBalanced ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
                        <div><b>{mixIsBalanced ? "Mix pronto para operação" : "Mix requer revisão"}</b><p className="mt-1 text-xs text-muted-foreground">Os valores devem ser números entre 0 e 100 e, para uma distribuição equilibrada, somar 100%.</p></div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </section>

            {unavailableSources > 0 && (
              <Card className="rounded-[2rem] border-amber-500/30 bg-amber-500/[0.04]">
                <CardContent className="flex gap-3 p-5 text-sm">
                  <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <div><p className="font-bold">Existem fontes administrativas indisponíveis</p><p className="mt-1 text-xs text-muted-foreground">{unavailableSources} fonte(s) retornaram erro durante a leitura. O painel continua exibindo somente os dados que conseguiu carregar, sem inventar valores.</p></div>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-[2rem] border-dashed bg-muted/10">
              <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><p className="font-bold">Fonte de verdade preservada</p><p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">As alterações usam o editor administrativo existente, passam pela mesma função de servidor e registram auditoria. O sistema de recomendação continua consumindo os mesmos registros.</p></div></div>
                <Button variant="outline" asChild className="gap-2 rounded-xl"><a href="/admin/settings"><Settings2 className="h-4 w-4" /> Configurações avançadas</a></Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string | number; detail: string }) {
  return <Card className="rounded-[1.5rem] border-primary/10 bg-card/90 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span></div><p className="mt-4 text-2xl font-black tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function WeightRow({ row, maxWeight, pending, onSave }: { row: Record<string, unknown>; maxWeight: number; pending: boolean; onSave: (value: number) => void }) {
  const [value, setValue] = useState(String(row["weight"] ?? ""));
  const numericValue = Number(value);
  const ratio = maxWeight > 0 ? Math.min(100, (Math.abs(numericValue) / maxWeight) * 100) : 0;
  return <div className="rounded-2xl border bg-background/70 p-4 transition-colors hover:bg-muted/20"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><p className="truncate font-bold">{String(row["signal_key"] ?? row["name"] ?? row["id"])}</p><span className="text-sm font-black tabular-nums">{Number.isFinite(numericValue) ? numericValue : "—"}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${ratio}%` }} /></div><p className="mt-2 text-[10px] text-muted-foreground">Peso aplicado ao sinal de comportamento.</p></div><Input className="w-full rounded-xl sm:w-28" type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} /><Button size="sm" disabled={pending || !Number.isFinite(numericValue)} onClick={() => onSave(numericValue)} className="gap-2 rounded-xl"><Save className="h-4 w-4" />Salvar</Button></div></div>;
}

function MixRow({ label, value, pending, onSave }: { label: string; value: number; pending: boolean; onSave: (value: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  const valid = Number.isFinite(Number(draft)) && Number(draft) >= 0 && Number(draft) <= 100;
  return <div className="rounded-2xl border bg-background/70 p-4"><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p><span className="text-xs font-bold text-muted-foreground">%</span></div><Input className="mt-2 rounded-xl" type="number" min="0" max="100" step="1" value={draft} onChange={(e) => setDraft(e.target.value)} /><Button size="sm" className="mt-3 w-full gap-2 rounded-xl" disabled={pending || !valid} onClick={() => onSave(Number(draft))}><Save className="h-4 w-4" />Salvar</Button></div>;
}

function Empty({ text, icon }: { text: string; icon: ReactNode }) {
  return <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">{icon}<p className="mt-3">{text}</p></div>;
}

function LoadingState() {
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-[1.5rem] border bg-muted/30" />)}</div><div className="grid gap-6 lg:grid-cols-2">{Array.from({ length: 2 }).map((_, index) => <div key={index} className="h-96 animate-pulse rounded-[2rem] border bg-muted/30" />)}</div></div>;
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BrainCircuit, RefreshCw, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminSettings, updateAdminSetting } from "@/lib/admin-settings.functions";

export const Route = createFileRoute("/admin/algorithm-control")({ component: AlgorithmControlPage });

type SettingSource = { key: string; label: string; rows: Array<Record<string, unknown>>; available: boolean; error: string | null };

function AlgorithmControlPage() {
  const qc = useQueryClient();
  const getSettings = useServerFn(getAdminSettings);
  const update = useServerFn(updateAdminSetting);
  const query = useQuery({ queryKey: ["admin-algorithm-control"], queryFn: () => getSettings({ data: undefined }) });
  const mutation = useMutation({
    mutationFn: (input: { source: string; id: string; patch: Record<string, unknown> }) => update({ data: input }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-algorithm-control"] }); qc.invalidateQueries({ queryKey: ["admin-settings"] }); toast.success("Parâmetro atualizado e auditado"); },
    onError: (error) => toast.error(error.message),
  });

  const sources = (query.data ?? []) as SettingSource[];
  const weights = sources.find((source) => source.key === "personalization_weights");
  const feedMix = sources.find((source) => source.key === "feed_mix_config");
  const weightRows = weights?.rows ?? [];
  const mixRow = feedMix?.rows?.[0];
  const mixTotal = ["relevant_pct", "related_pct", "discovery_pct"].reduce((sum, key) => sum + Number(mixRow?.[key] ?? 0), 0);

  return <div className="mx-auto max-w-7xl space-y-8 p-4 lg:p-8">
    <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div><Badge variant="outline" className="gap-2 text-[10px] font-black uppercase tracking-widest text-primary"><BrainCircuit className="h-3 w-3"/> Owner Only</Badge><h1 className="mt-2 text-4xl font-black uppercase italic tracking-tighter">Algorithm <span className="text-primary">Control Center</span></h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Controle operacional dos parâmetros que já alimentam personalização e composição do feed. Não cria um segundo algoritmo nem uma nova fonte de verdade.</p></div>
      <Button variant="outline" className="gap-2 rounded-xl" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}/> Atualizar</Button>
    </header>

    {query.isError ? <Card className="rounded-3xl border-destructive/30"><CardContent className="py-12 text-center text-sm text-destructive">Falha ao carregar parâmetros: {query.error.message}</CardContent></Card> : query.isLoading ? <Card className="rounded-3xl"><CardContent className="py-16 text-center text-sm text-muted-foreground">Carregando parâmetros reais…</CardContent></Card> : <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[2rem]"><CardHeader><CardTitle className="flex items-center gap-2 text-lg font-black uppercase"><BrainCircuit className="h-5 w-5 text-primary"/> Sinais de personalização</CardTitle></CardHeader><CardContent className="space-y-4">{!weights?.available ? <Empty text={weights?.error ?? "Fonte indisponível."}/> : weightRows.length === 0 ? <Empty text="Nenhum peso configurado."/> : weightRows.map((row) => <WeightRow key={String(row.id)} row={row} pending={mutation.isPending} onSave={(value) => mutation.mutate({ source: "personalization_weights", id: String(row.id), patch: { weight: value } })}/>)}</CardContent></Card>
        <Card className="rounded-[2rem]"><CardHeader><CardTitle className="flex items-center gap-2 text-lg font-black uppercase"><Settings2 className="h-5 w-5 text-primary"/> Mix do feed</CardTitle></CardHeader><CardContent>{!feedMix?.available ? <Empty text={feedMix?.error ?? "Fonte indisponível."}/> : !mixRow ? <Empty text="Nenhuma configuração de mix encontrada."/> : <><div className="grid gap-4 sm:grid-cols-3">{["relevant_pct", "related_pct", "discovery_pct"].map((key) => <MixRow key={key} label={key.replace("_pct", "")} value={Number(mixRow[key] ?? 0)} pending={mutation.isPending} onSave={(value) => mutation.mutate({ source: "feed_mix_config", id: String(mixRow.id), patch: { [key]: value } })}/>)}</div><div className={`mt-5 rounded-2xl border p-4 text-sm ${mixTotal === 100 ? "" : "border-amber-500/40 bg-amber-500/5"}`}><b>Total do mix: {mixTotal}%</b><p className="mt-1 text-xs text-muted-foreground">O motor normaliza os percentuais antes de distribuir o feed; 100% é o valor operacional recomendado.</p></div></>}</CardContent></Card>
      </div>
      <Card className="rounded-3xl border-dashed"><CardContent className="flex flex-col gap-3 p-5 text-sm md:flex-row md:items-center md:justify-between"><div><p className="font-bold">Fonte de verdade preservada</p><p className="text-xs text-muted-foreground">As alterações usam o editor administrativo existente, com auditoria. O algoritmo de recomendação continua consumindo estes mesmos registros.</p></div><Button variant="outline" asChild className="gap-2 rounded-xl"><a href="/admin/settings"><Settings2 className="h-4 w-4"/> Configurações avançadas</a></Button></CardContent></Card>
    </>}
  </div>;
}

function WeightRow({ row, pending, onSave }: { row: Record<string, unknown>; pending: boolean; onSave: (value: number) => void }) { const [value, setValue] = useState(String(row.weight ?? "")); return <div className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="font-bold">{String(row.signal_key ?? row.name ?? row.id)}</p><p className="text-[10px] text-muted-foreground">Peso aplicado ao sinal de comportamento.</p></div><Input className="w-full rounded-xl sm:w-32" type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)}/><Button size="sm" disabled={pending || !Number.isFinite(Number(value))} onClick={() => onSave(Number(value))} className="gap-2 rounded-xl"><Save className="h-4 w-4"/>Salvar</Button></div>; }
function MixRow({ label, value, pending, onSave }: { label: string; value: number; pending: boolean; onSave: (value: number) => void }) { const [draft, setDraft] = useState(String(value)); return <div className="rounded-2xl border p-4"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p><Input className="mt-2 rounded-xl" type="number" min="0" max="100" step="1" value={draft} onChange={(e) => setDraft(e.target.value)}/><Button size="sm" className="mt-3 w-full gap-2 rounded-xl" disabled={pending || !Number.isFinite(Number(draft))} onClick={() => onSave(Number(draft))}><Save className="h-4 w-4"/>Salvar</Button></div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{text}</div>; }

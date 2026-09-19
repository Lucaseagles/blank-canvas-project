import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Activity, ArrowRight, CheckCircle2, ChevronDown, Clock3, Layers3, Pause, Play, Plus, RefreshCw, Search, Send, Sparkles, Target, Video, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createStrategyOrchestration, generateStrategyOrchestrationPlan, approveStrategyOrchestration, listStrategyOrchestrations, getStrategyOrchestrationOptions, pauseStrategyOrchestration, type StrategyOrchestration } from "@/lib/strategy-orchestrator.functions";
import { prepareStrategyPublishing } from "@/lib/admin-publishing.functions";

export const Route = createFileRoute("/admin/strategy-orchestrator")({ component: StrategyOrchestratorPage });
const objectives = ["traffic", "engagement", "followers", "conversion", "awareness"] as const;
const objectiveLabels: Record<string, string> = { traffic: "Tráfego", engagement: "Engajamento", followers: "Seguidores", conversion: "Conversão", awareness: "Reconhecimento" };
const statusLabels: Record<string, string> = { draft: "Rascunho", ready: "Pronta", approved: "Aprovada", paused: "Pausada", completed: "Concluída" };
const emptyForm = { name: "", objective: "traffic" as (typeof objectives)[number], priority: 50, notes: "", selected: [] as string[], videoIds: [] as string[] };

function StrategyOrchestratorPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [objectiveFilter, setObjectiveFilter] = useState("all");

  const { data: items = [], isLoading, isError, refetch } = useQuery({ queryKey: ["strategy-orchestrations"], queryFn: listStrategyOrchestrations });
  const { data: options = [] } = useQuery({ queryKey: ["strategy-orchestration-options"], queryFn: getStrategyOrchestrationOptions });
  const { data: videos = [] } = useQuery({
    queryKey: ["strategy-orchestration-videos"],
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await (supabase as any).from("videos").select("id,title,platform,video_url,external_url,thumbnail_url").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["strategy-orchestrations"] });
    void qc.invalidateQueries({ queryKey: ["strategy-orchestration-options"] });
  };
  const create = useMutation({
    mutationFn: createStrategyOrchestration,
    onSuccess: () => { refresh(); setForm(emptyForm); toast.success("Orquestração criada"); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível criar a orquestração"),
  });
  const generate = useMutation({
    mutationFn: generateStrategyOrchestrationPlan,
    onSuccess: () => { refresh(); toast.success("Plano estratégico gerado"); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível gerar o plano"),
  });
  const approve = useMutation({
    mutationFn: approveStrategyOrchestration,
    onSuccess: (r) => { refresh(); toast.success(r.approved ? "Estratégia aprovada" : "Aprovação não permitida neste estado"); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível aprovar"),
  });
  const pause = useMutation({
    mutationFn: pauseStrategyOrchestration,
    onSuccess: () => { refresh(); toast.success("Orquestração pausada"); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível pausar"),
  });
  const preparePublishing = useMutation({
    mutationFn: prepareStrategyPublishing,
    onSuccess: (r) => { void qc.invalidateQueries({ queryKey: ["admin", "scheduled-posts"] }); toast.success(`Fila preparada: ${r.queued} nova(s), ${r.already_queued} já existente(s).`); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível preparar a publicação"),
  });

  const filteredItems = useMemo(() => items.filter(item => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || item.name.toLowerCase().includes(q) || (item.notes ?? "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesObjective = objectiveFilter === "all" || item.objective === objectiveFilter;
    return matchesSearch && matchesStatus && matchesObjective;
  }), [items, search, statusFilter, objectiveFilter]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter(i => i.status === "ready" || i.status === "approved").length,
    approved: items.filter(i => i.status === "approved").length,
    plans: items.filter(i => i.plan && Object.keys(i.plan).length > 0).length,
  }), [items]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Nome obrigatório"); return; }
    if (!form.selected.length) { toast.error("Selecione pelo menos uma estratégia"); return; }
    create.mutate({ data: { name: form.name.trim(), objective: form.objective, priority: Math.max(0, Math.min(100, form.priority)), notes: form.notes.trim() || null, strategy_ids: form.selected, video_ids: form.videoIds } });
  };

  const toggle = (id: string) => setForm(v => ({ ...v, selected: v.selected.includes(id) ? v.selected.filter(x => x !== id) : [...v.selected, id] }));
  const toggleVideo = (id: string) => setForm(v => ({ ...v, videoIds: v.videoIds.includes(id) ? v.videoIds.filter(x => x !== id) : [...v.videoIds, id] }));

  return (
    <div className="min-h-full bg-gradient-to-b from-muted/20 via-background to-background">
      <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="relative overflow-hidden rounded-[2rem] border bg-card p-6 shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className="gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]"><Sparkles className="h-3 w-3" />Strategy Orchestrator</Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider">Execução controlada</Badge>
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Estratégia <span className="text-primary">→ Execução</span></h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Transforme estratégias sociais existentes em orquestrações aprováveis, com plano, vídeos associados e preparação da fila de publicação sem criar outro motor.</p>
            </div>
            <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void refetch()} className="h-11 rounded-xl px-4 font-bold" disabled={isLoading}><RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />Atualizar</Button><Button onClick={() => setForm(emptyForm)} className="h-11 rounded-xl px-5 font-black"><Plus className="mr-2 h-4 w-4" />Nova orquestração</Button></div>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric icon={Layers3} label="Orquestrações" value={stats.total} detail="Criadas no sistema" />
          <Metric icon={Activity} label="Em operação" value={stats.active} detail="Prontas ou aprovadas" />
          <Metric icon={CheckCircle2} label="Aprovadas" value={stats.approved} detail="Liberadas para execução" />
          <Metric icon={Sparkles} label="Planos gerados" value={stats.plans} detail="Com plano estratégico" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <Card className="h-fit rounded-[2rem] border shadow-sm xl:sticky xl:top-6">
            <CardHeader className="border-b bg-muted/20 pb-5">
              <div className="flex items-start justify-between gap-3">
                <div><CardTitle className="flex items-center gap-2 text-lg font-black"><Target className="h-5 w-5 text-primary" />Nova orquestração</CardTitle><p className="mt-1 text-xs text-muted-foreground">Selecione as estratégias que formarão a operação.</p></div>
                {(form.name || form.selected.length || form.videoIds.length) ? <Button variant="ghost" size="icon" onClick={() => setForm(emptyForm)} className="rounded-xl"><X className="h-4 w-4" /></Button> : null}
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={submit} className="space-y-5">
                <div><Label>Nome</Label><Input className="mt-2 h-11 rounded-xl" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Operação Achadinhos Setembro" /></div>
                <div>
                  <Label>Objetivo</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {objectives.map(value => <Button key={value} type="button" variant={form.objective === value ? "default" : "outline"} className="h-10 justify-start rounded-xl text-xs" onClick={() => setForm({ ...form, objective: value })}><span className={form.objective === value ? "mr-2 h-1.5 w-1.5 rounded-full bg-background" : "mr-2 h-1.5 w-1.5 rounded-full bg-primary"} />{objectiveLabels[value]}</Button>)}
                  </div>
                </div>
                <div><Label>Prioridade <span className="text-muted-foreground">0–100</span></Label><Input className="mt-2 h-11 rounded-xl" type="number" min={0} max={100} value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} /></div>
                <div><Label>Observações</Label><Textarea className="mt-2 min-h-24 rounded-xl" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} maxLength={1000} placeholder="Contexto operacional, campanha ou instruções..." /></div>

                <SelectionPanel title="Estratégias existentes" icon={Layers3} count={form.selected.length} empty="Nenhuma estratégia ativa disponível.">
                  {options.map(strategy => <button type="button" key={strategy.id} onClick={() => toggle(strategy.id)} className={`w-full rounded-xl border p-3 text-left transition ${form.selected.includes(strategy.id) ? "border-primary bg-primary/10 shadow-sm" : "hover:bg-muted/50"}`}>
                    <div className="flex items-start gap-3"><div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${form.selected.includes(strategy.id) ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{form.selected.includes(strategy.id) ? <CheckCircle2 className="h-4 w-4" /> : <Target className="h-4 w-4" />}</div><div className="min-w-0"><div className="truncate text-xs font-black">{strategy.name}</div><div className="mt-1 text-[10px] text-muted-foreground">{strategy.channel?.platform} · {strategy.channel?.channel_name} · {objectiveLabels[strategy.objective] ?? strategy.objective}</div></div></div>
                  </button>)}
                </SelectionPanel>

                <SelectionPanel title="Vídeos associados" icon={Video} count={form.videoIds.length} optional empty="Nenhum vídeo disponível.">
                  {videos.map((video: any) => <button type="button" key={video.id} onClick={() => toggleVideo(video.id)} className={`w-full rounded-xl border p-3 text-left transition ${form.videoIds.includes(video.id) ? "border-primary bg-primary/10 shadow-sm" : "hover:bg-muted/50"}`}>
                    <div className="flex items-start gap-3"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${form.videoIds.includes(video.id) ? "bg-primary text-primary-foreground" : "bg-muted"}`}><Video className="h-4 w-4" /></div><div className="min-w-0"><div className="truncate text-xs font-black">{video.title || "Vídeo sem título"}</div><div className="mt-1 text-[10px] text-muted-foreground">{video.platform || "native"} · {video.video_url || video.external_url ? "link configurado" : "sem link"}</div></div></div>
                  </button>)}
                </SelectionPanel>

                <Button type="submit" className="h-11 w-full rounded-xl font-black uppercase tracking-wide" disabled={create.isPending}>{create.isPending ? "Criando..." : "Criar orquestração"}</Button>
              </form>
            </CardContent>
          </Card>

          <section className="space-y-4">
            <Card className="rounded-[2rem] border bg-card shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row">
                  <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="h-10 rounded-xl bg-muted/40 pl-9" placeholder="Buscar por nome ou observação..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                  <div className="flex gap-2 overflow-x-auto"><FilterSelect value={statusFilter} onChange={setStatusFilter} options={[["all", "Todos os status"], ...Object.entries(statusLabels)]} /><FilterSelect value={objectiveFilter} onChange={setObjectiveFilter} options={[["all", "Todos os objetivos"], ...objectives.map(v => [v, objectiveLabels[v]])]} /></div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black">Centro de execução</p><p className="text-xs text-muted-foreground">{filteredItems.length} de {items.length} orquestrações</p></div><div className="flex items-center gap-3"><div className="hidden items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground sm:flex"><Clock3 className="h-3.5 w-3.5" /> fluxo aprovado em etapas</div>{(search || statusFilter !== "all" || objectiveFilter !== "all") && <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => { setSearch(""); setStatusFilter("all"); setObjectiveFilter("all"); }}>Limpar filtros</Button>}</div></div>

            {isLoading ? <Card className="rounded-[2rem]"><CardContent className="space-y-3 p-5">{[1, 2, 3].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)}</CardContent></Card> :
              isError ? <Card className="rounded-[2rem] border-destructive/20"><CardContent className="flex flex-col items-center justify-center py-16 text-center"><p className="font-black">Não foi possível carregar as orquestrações.</p><Button variant="outline" className="mt-4 rounded-xl" onClick={() => void refetch()}>Tentar novamente</Button></CardContent></Card> :
              filteredItems.length === 0 ? <Card className="rounded-[2rem] border-dashed"><CardContent className="flex flex-col items-center justify-center py-20 text-center"><div className="rounded-2xl bg-primary/10 p-4"><Layers3 className="h-6 w-6 text-primary" /></div><p className="mt-4 font-black">{items.length ? "Nenhum resultado" : "Nenhuma orquestração criada"}</p><p className="mt-1 max-w-sm text-xs text-muted-foreground">{items.length ? "Ajuste a busca ou os filtros." : "Crie a primeira operação para transformar suas estratégias em execução."}</p></CardContent></Card> :
              <div className="space-y-3">{filteredItems.map(item => <OrchestrationCard key={item.id} item={item} onGenerate={() => generate.mutate({ data: { id: item.id } })} onApprove={() => approve.mutate({ data: { id: item.id } })} onPause={() => pause.mutate({ data: { id: item.id } })} onPublish={() => preparePublishing.mutate({ data: { orchestration_id: item.id } })} busyGenerate={generate.isPending} busyApprove={approve.isPending} busyPause={pause.isPending} busyPublish={preparePublishing.isPending} />)}</div>}
          </section>
        </div>

        <div className="rounded-2xl border border-dashed bg-muted/20 p-4 text-xs leading-5 text-muted-foreground"><Play className="mr-2 inline h-4 w-4" />Aprovar não publica automaticamente. A preparação usa o motor de <strong>scheduled_posts</strong> existente e respeita os adapters de canais disponíveis; hoje a preparação automática dessa função suporta Telegram.</div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Activity; label: string; value: number; detail: string }) {
  return <div className="group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl group-hover:scale-125" /><div className="relative flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black tracking-tight">{value.toLocaleString("pt-BR")}</p><p className="mt-1 text-[10px] text-muted-foreground">{detail}</p></div><div className="rounded-xl border bg-muted/50 p-2.5"><Icon className="h-4 w-4 text-primary" /></div></div></div>;
}

function SelectionPanel({ title, icon: Icon, count, optional, empty, children }: { title: string; icon: typeof Layers3; count: number; optional?: boolean; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <div><div className="flex items-center justify-between"><Label className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-primary" />{title} {optional && <span className="font-normal text-muted-foreground">(opcional)</span>}</Label><Badge variant="outline" className="rounded-full text-[9px]">{count} selecionada{count === 1 ? "" : "s"}</Badge></div><div className="mt-2 max-h-64 space-y-2 overflow-auto pr-1">{hasChildren ? children : <p className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">{empty}</p>}</div></div>;
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[][] }) {
  return <div className="relative shrink-0"><select value={value} onChange={e => onChange(e.target.value)} className="h-10 appearance-none rounded-xl border bg-background px-3 pr-8 text-xs font-bold">{options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-3.5 w-3.5 text-muted-foreground" /></div>;
}

function OrchestrationCard({ item, onGenerate, onApprove, onPause, onPublish, busyGenerate, busyApprove, busyPause, busyPublish }: { item: StrategyOrchestration; onGenerate: () => void; onApprove: () => void; onPause: () => void; onPublish: () => void; busyGenerate: boolean; busyApprove: boolean; busyPause: boolean; busyPublish: boolean }) {
  const planReady = Boolean(item.plan && Object.keys(item.plan).length);
  return <Card className="group overflow-hidden rounded-[2rem] border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"><CardContent className="p-0">
    <div className="p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.status === "approved" ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}><Target className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2"><h3 className="text-base font-black">{item.name}</h3><Badge className="rounded-full text-[9px] font-black uppercase">{objectiveLabels[item.objective] ?? item.objective}</Badge><Badge variant={item.status === "approved" ? "default" : "outline"} className="rounded-full text-[9px] font-black uppercase">{statusLabels[item.status] ?? item.status}</Badge></div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground"><span>Prioridade {item.priority}</span><span>{planReady ? "Plano gerado" : "Plano pendente"}</span>{item.scheduled_start && <span>Início {new Date(item.scheduled_start).toLocaleDateString("pt-BR")}</span>}</div>
        {item.notes && <p className="mt-3 rounded-xl bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">{item.notes}</p>}
      </div>
      <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
        {item.status === "draft" && <Button size="sm" variant="outline" className="rounded-xl" onClick={onGenerate} disabled={busyGenerate}><Sparkles className="mr-1.5 h-4 w-4" />Gerar plano</Button>}
        {item.status === "ready" && <Button size="sm" className="rounded-xl" onClick={onApprove} disabled={busyApprove}><CheckCircle2 className="mr-1.5 h-4 w-4" />Aprovar</Button>}
        {item.status === "approved" && <><Button size="sm" className="rounded-xl" onClick={onPublish} disabled={busyPublish}><Send className="mr-1.5 h-4 w-4" />Preparar fila</Button><Button size="sm" variant="outline" className="rounded-xl" onClick={onPause} disabled={busyPause}><Pause className="mr-1.5 h-4 w-4" />Pausar</Button></>}
        {item.status === "paused" && <Badge variant="outline" className="rounded-xl px-3 py-2"><Pause className="mr-1 inline h-3.5 w-3.5" />Operação pausada</Badge>}
        {item.status === "completed" && <Badge variant="outline" className="rounded-xl px-3 py-2"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />Concluída</Badge>}
      </div>
    </div></div>
    <div className="grid grid-cols-2 border-t bg-muted/10 sm:grid-cols-4"><MiniStat icon={Layers3} label="Estratégia" value="Conectada" /><MiniStat icon={Sparkles} label="Plano" value={planReady ? "Gerado" : "Pendente"} /><MiniStat icon={Video} label="Execução" value="Vídeos" /><MiniStat icon={ArrowRight} label="Próximo passo" value={item.status === "draft" ? "Gerar" : item.status === "ready" ? "Aprovar" : item.status === "approved" ? "Preparar" : statusLabels[item.status] ?? item.status} /></div>
  </CardContent></Card>;
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Layers3; label: string; value: string }) {
  return <div className="flex items-center gap-2 border-r p-3 last:border-r-0"><Icon className="h-3.5 w-3.5 text-primary" /><div className="min-w-0"><p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{label}</p><p className="truncate text-[10px] font-bold">{value}</p></div></div>;
}

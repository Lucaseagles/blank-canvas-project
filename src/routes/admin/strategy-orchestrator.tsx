import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Pause, Play, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createStrategyOrchestration, generateStrategyOrchestrationPlan, approveStrategyOrchestration, listStrategyOrchestrations, getStrategyOrchestrationOptions, pauseStrategyOrchestration } from "@/lib/strategy-orchestrator.functions";

export const Route = createFileRoute("/admin/strategy-orchestrator")({ component: StrategyOrchestratorPage });
const objectives = ["traffic", "engagement", "followers", "conversion", "awareness"] as const;

function StrategyOrchestratorPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [objective, setObjective] = useState<(typeof objectives)[number]>("traffic");
  const [priority, setPriority] = useState(50);
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const { data: items = [], isLoading } = useQuery({ queryKey: ["strategy-orchestrations"], queryFn: listStrategyOrchestrations });
  const { data: options = [] } = useQuery({ queryKey: ["strategy-orchestration-options"], queryFn: getStrategyOrchestrationOptions });
  const refresh = () => qc.invalidateQueries({ queryKey: ["strategy-orchestrations"] });
  const create = useMutation({ mutationFn: createStrategyOrchestration, onSuccess: () => { refresh(); setName(""); setNotes(""); setSelected([]); toast.success("Orquestração criada"); }, onError: () => toast.error("Não foi possível criar a orquestração") });
  const generate = useMutation({ mutationFn: generateStrategyOrchestrationPlan, onSuccess: () => { refresh(); toast.success("Plano estratégico gerado"); }, onError: () => toast.error("Não foi possível gerar o plano") });
  const approve = useMutation({ mutationFn: approveStrategyOrchestration, onSuccess: (r) => { refresh(); toast.success(r.approved ? "Estratégia aprovada" : "Aprovação não permitida neste estado"); }, onError: () => toast.error("Não foi possível aprovar") });
  const pause = useMutation({ mutationFn: pauseStrategyOrchestration, onSuccess: () => { refresh(); toast.success("Orquestração pausada"); }, onError: () => toast.error("Não foi possível pausar") });

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!name.trim()) return toast.error("Nome obrigatório"); if (!selected.length) return toast.error("Selecione pelo menos uma estratégia"); create.mutate({ data: { name: name.trim(), objective, priority, notes: notes || null, strategy_ids: selected } }); };
  const toggle = (id: string) => setSelected(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id]);

  return <div className="mx-auto max-w-7xl space-y-8 p-4 lg:p-8">
    <header><Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-primary">Strategy Orchestrator</Badge><h1 className="mt-2 text-4xl font-black uppercase italic tracking-tighter">Estratégia → <span className="text-primary">Execução</span></h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Centraliza estratégias sociais existentes em um plano aprovado. Não cria outro motor de publicação: usa campanhas, automações e scheduled_posts já existentes.</p></header>
    <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
      <Card className="rounded-[2rem]"><CardHeader><CardTitle className="flex items-center gap-2 text-lg font-black uppercase"><Sparkles className="h-5 w-5 text-primary"/>Nova orquestração</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="space-y-4">
        <div><Label>Nome</Label><Input className="mt-2 rounded-xl" value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Operação Achadinhos Setembro"/></div>
        <div><Label>Objetivo</Label><select value={objective} onChange={e=>setObjective(e.target.value as typeof objective)} className="mt-2 h-10 w-full rounded-xl border bg-background px-3 text-sm">{objectives.map(v=><option key={v}>{v}</option>)}</select></div>
        <div><Label>Prioridade</Label><Input className="mt-2 rounded-xl" type="number" min={0} max={100} value={priority} onChange={e=>setPriority(Number(e.target.value))}/></div>
        <div><Label>Observações</Label><Textarea className="mt-2 rounded-xl" value={notes} onChange={e=>setNotes(e.target.value)} maxLength={1000}/></div>
        <div><Label>Estratégias existentes</Label><div className="mt-2 max-h-72 space-y-2 overflow-auto">{options.length===0?<p className="text-xs text-muted-foreground">Nenhuma estratégia ativa disponível.</p>:options.map(s=><button type="button" key={s.id} onClick={()=>toggle(s.id)} className={`w-full rounded-xl border p-3 text-left text-xs transition ${selected.includes(s.id)?"border-primary bg-primary/10":"hover:bg-muted/50"}`}><div className="font-bold">{s.name}</div><div className="mt-1 text-muted-foreground">{s.channel?.platform} · {s.channel?.channel_name} · {s.objective}</div></button>)}</div></div>
        <Button type="submit" className="w-full rounded-xl font-black uppercase" disabled={create.isPending}>Criar orquestração</Button>
      </form></CardContent></Card>
      <Card className="rounded-[2rem]"><CardHeader><CardTitle className="text-lg font-black uppercase">Orquestrações</CardTitle></CardHeader><CardContent className="space-y-3">{isLoading?<p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p>:items.length===0?<p className="py-10 text-center text-sm text-muted-foreground">Nenhuma orquestração criada.</p>:items.map(item=><div key={item.id} className="rounded-2xl border p-4"><div className="flex flex-wrap items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-black">{item.name}</span><Badge variant="outline">{item.objective}</Badge><Badge variant={item.status==="approved"?"default":"outline"}>{item.status.toUpperCase()}</Badge></div><p className="mt-1 text-xs text-muted-foreground">Prioridade {item.priority} · {item.plan && Object.keys(item.plan).length ? "Plano gerado" : "Plano ainda não gerado"}</p></div>{item.status==="draft"&&<Button size="sm" variant="outline" onClick={()=>generate.mutate({data:{id:item.id}})} disabled={generate.isPending}><Sparkles className="mr-1 h-4 w-4"/>Gerar plano</Button>}{item.status==="ready"&&<Button size="sm" onClick={()=>approve.mutate({data:{id:item.id}})} disabled={approve.isPending}><CheckCircle2 className="mr-1 h-4 w-4"/>Aprovar</Button>}{item.status==="approved"&&<Button size="sm" variant="outline" onClick={()=>pause.mutate({data:{id:item.id}})} disabled={pause.isPending}><Pause className="mr-1 h-4 w-4"/>Pausar</Button>}</div><p className="mt-3 text-xs text-muted-foreground">{item.notes || "Sem observações."}</p></div>)}</CardContent></Card>
    </div>
    <div className="rounded-2xl border border-dashed p-4 text-xs text-muted-foreground"><Play className="mr-2 inline h-4 w-4"/>A aprovação prepara a estratégia para execução, mas não publica automaticamente. A execução continuará dependente dos motores existentes e de suas condições.</div>
  </div>;
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { Activity, ArrowUpRight, BarChart3, Check, ChevronDown, Layers3, Megaphone, Pencil, Plus, Radio, Search, Sparkles, Target, Trash2, Users, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getSocialStrategyOptions, getSocialStrategyOverview, listSocialStrategies, saveSocialStrategy, deleteSocialStrategy, type SocialStrategy } from "@/lib/social-strategy.functions";

export const Route = createFileRoute("/admin/social-strategy")({ ssr: false, component: SocialStrategyPage });

type Option = { id: string; name?: string; platform?: string; title?: string; status?: string };
const objectives = ["traffic", "engagement", "followers", "conversion", "awareness"] as const;
const formats = ["short_video", "reel", "story", "carousel", "post", "live"];
const objectiveLabels: Record<string, string> = { traffic: "Tráfego", engagement: "Engajamento", followers: "Seguidores", conversion: "Conversão", awareness: "Reconhecimento" };
const platformLabels: Record<string, string> = { tiktok: "TikTok", instagram: "Instagram", kwai: "Kwai", telegram: "Telegram", youtube: "YouTube" };
const emptyForm = { channel_id: "", name: "", category_id: "", collection_id: "", campaign_id: "", audience_segment: "", objective: "traffic" as typeof objectives[number], content_pillars: "", preferred_formats: ["short_video"], posting_frequency_per_week: 3, cta: "", priority: 50, is_active: true };

function SocialStrategyPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<SocialStrategy | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { data: strategies = [], isLoading, isError, refetch } = useQuery({ queryKey: ["social-strategies"], queryFn: listSocialStrategies });
  const { data: options } = useQuery({ queryKey: ["social-strategy-options"], queryFn: getSocialStrategyOptions });
  const { data: overview } = useQuery({ queryKey: ["social-strategy-overview"], queryFn: getSocialStrategyOverview });
  const save = useMutation({ mutationFn: saveSocialStrategy, onSuccess: () => { qc.invalidateQueries({ queryKey: ["social-strategies"] }); qc.invalidateQueries({ queryKey: ["social-strategy-overview"] }); reset(); toast.success("Estratégia salva com sucesso"); }, onError: () => toast.error("Não foi possível salvar. Confira os dados e tente novamente.") });
  const remove = useMutation({ mutationFn: deleteSocialStrategy, onSuccess: () => { qc.invalidateQueries({ queryKey: ["social-strategies"] }); qc.invalidateQueries({ queryKey: ["social-strategy-overview"] }); toast.success("Estratégia removida"); }, onError: () => toast.error("Não foi possível remover a estratégia") });
  const reset = () => { setEditing(null); setForm(emptyForm); };
  const edit = (item: SocialStrategy) => { setEditing(item); setForm({ channel_id: item.channel_id, name: item.name, category_id: item.category_id ?? "", collection_id: item.collection_id ?? "", campaign_id: item.campaign_id ?? "", audience_segment: item.audience_segment ?? "", objective: (objectives.includes(item.objective as typeof objectives[number]) ? item.objective : "traffic") as typeof objectives[number], content_pillars: item.content_pillars.join(", "), preferred_formats: item.preferred_formats, posting_frequency_per_week: item.posting_frequency_per_week, cta: item.cta ?? "", priority: item.priority, is_active: item.is_active }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const submit = (e: FormEvent) => { e.preventDefault(); if (!form.channel_id || !form.name.trim()) { toast.error("Canal e nome são obrigatórios"); return; } if (form.preferred_formats.length === 0) { toast.error("Selecione pelo menos um formato"); return; } save.mutate({ data: { id: editing?.id, channel_id: form.channel_id, name: form.name.trim(), category_id: form.category_id || null, collection_id: form.collection_id || null, campaign_id: form.campaign_id || null, audience_segment: form.audience_segment || null, objective: form.objective, content_pillars: form.content_pillars.split(",").map(v => v.trim()).filter(Boolean), preferred_formats: form.preferred_formats, posting_frequency_per_week: Number(form.posting_frequency_per_week), cta: form.cta.trim() || null, priority: Number(form.priority), is_active: form.is_active } }); };
  const confirmRemove = (item: SocialStrategy) => { if (window.confirm(`Remover a estratégia “${item.name}”? Esta ação não pode ser desfeita.`)) remove.mutate({ data: { id: item.id } }); };
  const channels = (options?.channels ?? []) as Option[];
  const categories = (options?.categories ?? []) as Option[];
  const collections = (options?.collections ?? []) as Option[];
  const campaigns = (options?.campaigns ?? []) as Option[];
  const segments = options?.segments ?? [];
  const filtered = useMemo(() => strategies.filter(item => { const q = search.toLowerCase().trim(); const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.channel?.channel_name?.toLowerCase().includes(q) || item.category?.name?.toLowerCase().includes(q); const matchesFilter = filter === "all" || (filter === "active" ? item.is_active : item.objective === filter); return matchesSearch && matchesFilter; }), [strategies, search, filter]);
  const activeRate = overview?.total ? Math.round(((overview.active ?? 0) / overview.total) * 100) : 0;

  return <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
    <div className="mx-auto max-w-[1500px] space-y-7 p-4 md:p-6 lg:p-8">
      <header className="relative overflow-hidden rounded-[2rem] border bg-card/80 p-6 shadow-sm backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2"><Badge className="gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]"><Sparkles className="h-3 w-3" /> Social Ecosystem</Badge><Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider">Orquestração</Badge></div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Social <span className="text-primary">Strategy</span></h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">Conecte canais, categorias, coleções, campanhas e segmentos em estratégias operacionais prontas para orientar sua distribuição de conteúdo.</p>
          </div>
          <Button onClick={reset} className="h-11 rounded-xl px-5 font-black shadow-lg shadow-primary/10"><Plus className="mr-2 h-4 w-4" /> Nova estratégia</Button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {([["Estratégias", overview?.total ?? 0, Layers3], ["Ativas", overview?.active ?? 0, Activity], ["Canais", overview?.channels_covered ?? 0, Radio], ["Coleções", overview?.with_collection ?? 0, Layers3], ["Campanhas", overview?.with_campaign ?? 0, Megaphone], ["Segmentos", overview?.with_segment ?? 0, Users]] as Array<[string, number, typeof Layers3]>).map(([label,value,Icon]) => <Card key={String(label)} className="rounded-2xl border bg-card/70 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p><Icon className="h-4 w-4 text-primary" /></div><p className="mt-2 text-2xl font-black tracking-tight">{Number(value).toLocaleString("pt-BR")}</p></CardContent></Card>)}
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card className="h-fit rounded-[2rem] border shadow-sm xl:sticky xl:top-6">
          <CardHeader className="border-b bg-muted/20 pb-5"><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-lg font-black"><Target className="h-5 w-5 text-primary" />{editing ? "Editar estratégia" : "Nova estratégia"}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Defina como este canal deve operar.</p></div>{editing && <Button variant="ghost" size="icon" onClick={reset} className="rounded-xl"><X className="h-4 w-4" /></Button>}</div></CardHeader>
          <CardContent className="p-5"><form onSubmit={submit} className="space-y-5">
            <div className="rounded-2xl border bg-muted/20 p-3"><Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Canal de distribuição</Label><div className="relative mt-2"><select value={form.channel_id} onChange={e=>setForm({...form,channel_id:e.target.value})} className="h-11 w-full appearance-none rounded-xl border bg-background px-3 pr-9 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-primary/20"><option value="">Selecione um canal</option>{channels.map(c=><option key={c.id} value={c.id}>{platformLabels[c.platform ?? ""] ?? c.platform} · {c.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" /></div></div>
            <div><Label>Nome da estratégia</Label><Input className="mt-2 h-11 rounded-xl" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex.: Achadinhos TikTok" /></div>
            <div><Label>Objetivo principal</Label><div className="mt-2 grid grid-cols-2 gap-2">{objectives.map(v=><Button key={v} type="button" variant={form.objective===v?"default":"outline"} className="h-10 justify-start rounded-xl text-xs" onClick={()=>setForm({...form,objective:v})}><span className={form.objective===v?"mr-2 h-1.5 w-1.5 rounded-full bg-background":"mr-2 h-1.5 w-1.5 rounded-full bg-primary"}/>{objectiveLabels[v]}</Button>)}</div></div>
            <div className="grid grid-cols-2 gap-3"><FieldSelect label="Categoria" value={form.category_id} onChange={v=>setForm({...form,category_id:v})} options={categories} empty="Todas" /><FieldSelect label="Segmento" value={form.audience_segment} onChange={v=>setForm({...form,audience_segment:v})} options={segments.map(s=>({id:s.value,name:s.value}))} empty="Todos" /></div>
            <div className="grid grid-cols-2 gap-3"><FieldSelect label="Coleção" value={form.collection_id} onChange={v=>setForm({...form,collection_id:v})} options={collections} empty="Nenhuma" /><FieldSelect label="Campanha" value={form.campaign_id} onChange={v=>setForm({...form,campaign_id:v})} options={campaigns} empty="Nenhuma" /></div>
            <div><Label>Pilares de conteúdo</Label><Input className="mt-2 h-11 rounded-xl" value={form.content_pillars} onChange={e=>setForm({...form,content_pillars:e.target.value})} placeholder="ofertas, review, tutorial" /><p className="mt-1.5 text-[10px] text-muted-foreground">Separe os pilares por vírgula.</p></div>
            <div><Label>Formatos preferidos</Label><div className="mt-2 flex flex-wrap gap-2">{formats.map(f=><button key={f} type="button" onClick={()=>setForm({...form,preferred_formats:form.preferred_formats.includes(f)?form.preferred_formats.filter(x=>x!==f):[...form.preferred_formats,f]})} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${form.preferred_formats.includes(f)?"border-primary bg-primary text-primary-foreground shadow-sm":"bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>{form.preferred_formats.includes(f)&&<Check className="mr-1 inline h-3 w-3"/>}{f.replaceAll("_"," ")}</button>)}</div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Posts / semana</Label><Input className="mt-2 h-11 rounded-xl" type="number" min={1} max={50} value={form.posting_frequency_per_week} onChange={e=>setForm({...form,posting_frequency_per_week:Number(e.target.value)})}/></div><div><Label>Prioridade</Label><Input className="mt-2 h-11 rounded-xl" type="number" min={0} max={100} value={form.priority} onChange={e=>setForm({...form,priority:Number(e.target.value)})}/></div></div>
            <div><Label>CTA padrão</Label><Input className="mt-2 h-11 rounded-xl" value={form.cta} onChange={e=>setForm({...form,cta:e.target.value})} placeholder="Veja a oferta" /></div>
            <div className="flex items-center justify-between rounded-2xl border bg-muted/20 p-4"><div><Label className="font-bold">Estratégia ativa</Label><p className="mt-0.5 text-[10px] text-muted-foreground">Disponível para operação.</p></div><Switch checked={form.is_active} onCheckedChange={v=>setForm({...form,is_active:v})}/></div>
            <Button type="submit" className="h-11 w-full rounded-xl font-black uppercase tracking-wide" disabled={save.isPending}>{save.isPending ? "Salvando..." : editing ? "Atualizar estratégia" : "Criar estratégia"}</Button>
            {editing&&<Button type="button" variant="ghost" className="w-full rounded-xl" onClick={reset}>Cancelar edição</Button>}
          </form></CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border bg-card/70 p-3 shadow-sm md:flex-row md:items-center">
            <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar estratégia, canal ou categoria..." className="h-10 rounded-xl border-0 bg-muted/50 pl-9 shadow-none focus-visible:ring-1"/></div>
            <select value={filter} onChange={e=>setFilter(e.target.value)} className="h-10 rounded-xl border bg-background px-3 text-sm font-semibold"><option value="all">Todas</option><option value="active">Ativas</option>{objectives.map(v=><option key={v} value={v}>{objectiveLabels[v]}</option>)}</select>
          </div>
          <div className="flex items-center justify-between px-1"><div><p className="text-sm font-black">Mapa de estratégias</p><p className="text-xs text-muted-foreground">{filtered.length} de {strategies.length} configurações</p></div><div className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500"/>{activeRate}% ativas</div></div>
          {isLoading ? <Card className="rounded-[2rem]"><CardContent className="space-y-3 p-5">{[1,2,3].map(i=><div key={i} className="h-28 animate-pulse rounded-2xl bg-muted"/>)}</CardContent></Card> : isError ? <Card className="rounded-[2rem] border-destructive/20"><CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center"><p className="font-bold">Não foi possível carregar as estratégias.</p><Button variant="outline" onClick={()=>refetch()} className="rounded-xl">Tentar novamente</Button></CardContent></Card> : filtered.length===0 ? <Card className="rounded-[2rem] border-dashed"><CardContent className="flex flex-col items-center justify-center py-20 text-center"><div className="mb-4 rounded-2xl bg-primary/10 p-4"><Zap className="h-6 w-6 text-primary"/></div><p className="font-black">{strategies.length ? "Nenhum resultado" : "Nenhuma estratégia configurada"}</p><p className="mt-1 max-w-sm text-xs text-muted-foreground">{strategies.length ? "Tente outro termo ou filtro." : "Crie a primeira estratégia para conectar seu ecossistema social."}</p>{strategies.length===0&&<Button onClick={reset} className="mt-5 rounded-xl"><Plus className="mr-2 h-4 w-4"/>Criar primeira estratégia</Button>}</CardContent></Card> : <div className="grid gap-3">{filtered.map(item=><StrategyCard key={item.id} item={item} onEdit={edit} onRemove={confirmRemove}/>)}</div>}
        </section>
      </div>
    </div>
  </div>;
}

function FieldSelect({ label, value, onChange, options, empty }: { label:string; value:string; onChange:(v:string)=>void; options:Option[]; empty:string }) { return <div><Label>{label}</Label><div className="relative mt-2"><select value={value} onChange={e=>onChange(e.target.value)} className="h-11 w-full appearance-none rounded-xl border bg-background px-2 pr-7 text-xs font-medium"><option value="">{empty}</option>{options.map(o=><option key={o.id} value={o.id}>{o.name ?? o.title}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-3.5 h-3.5 w-3.5 text-muted-foreground"/></div></div>; }

function StrategyCard({ item, onEdit, onRemove }: { item: SocialStrategy; onEdit:(item:SocialStrategy)=>void; onRemove:(item:SocialStrategy)=>void }) { return <Card className="group overflow-hidden rounded-[1.75rem] border bg-card/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"><CardContent className="p-0"><div className="flex flex-col gap-4 p-5 md:flex-row md:items-center"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Radio className="h-5 w-5"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-black">{item.name}</h3><Badge className="rounded-full text-[9px] font-black uppercase">{objectiveLabels[item.objective] ?? item.objective}</Badge><Badge variant={item.is_active?"outline":"secondary"} className="rounded-full text-[9px] font-black uppercase">{item.is_active?"ATIVA":"PAUSADA"}</Badge></div><p className="mt-1 text-xs font-semibold text-muted-foreground">{platformLabels[item.channel?.platform ?? ""] ?? item.channel?.platform} · {item.channel?.channel_name ?? "Canal"}</p><div className="mt-3 flex flex-wrap gap-2">{item.category?.name&&<Tag text={item.category.name}/>} {item.collection?.title&&<Tag text={item.collection.title}/>} {item.campaign?.name&&<Tag text={item.campaign.name}/>} {item.audience_segment&&<Tag text={item.audience_segment}/>}</div><div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><span>{item.posting_frequency_per_week}x / semana</span><span>Prioridade {item.priority}</span>{item.content_pillars.length>0&&<span>{item.content_pillars.slice(0,3).join(" · ")}</span>}</div></div><div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" onClick={()=>onEdit(item)} className="rounded-xl" title="Editar"><Pencil className="h-4 w-4"/></Button><Button variant="ghost" size="icon" onClick={()=>onRemove(item)} className="rounded-xl text-destructive hover:text-destructive" title="Remover"><Trash2 className="h-4 w-4"/></Button><Button variant="outline" size="icon" onClick={()=>onEdit(item)} className="rounded-xl"><ArrowUpRight className="h-4 w-4"/></Button></div></div><div className="flex items-center gap-2 border-t bg-muted/10 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"><BarChart3 className="h-3.5 w-3.5"/> Estratégia operacional <span className="ml-auto">{item.preferred_formats.length} formatos</span></div></CardContent></Card>; }
function Tag({text}:{text:string}){return <span className="rounded-full border bg-muted/30 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{text}</span>;}

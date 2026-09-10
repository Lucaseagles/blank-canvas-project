import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getSocialStrategyOptions, getSocialStrategyOverview, listSocialStrategies, saveSocialStrategy, deleteSocialStrategy, type SocialStrategy } from "@/lib/social-strategy.functions";

export const Route = createFileRoute("/admin/social-strategy")({ component: SocialStrategyPage });

type Option = { id: string; name?: string; platform?: string; title?: string; status?: string };
const objectives = ["traffic", "engagement", "followers", "conversion", "awareness"] as const;
const formats = ["short_video", "reel", "story", "carousel", "post", "live"];

const emptyForm = { channel_id: "", name: "", category_id: "", collection_id: "", campaign_id: "", audience_segment: "", objective: "traffic" as typeof objectives[number], content_pillars: "", preferred_formats: ["short_video"], posting_frequency_per_week: 3, cta: "", priority: 50, is_active: true };

function SocialStrategyPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<SocialStrategy | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { data: strategies = [], isLoading } = useQuery({ queryKey: ["social-strategies"], queryFn: listSocialStrategies });
  const { data: options } = useQuery({ queryKey: ["social-strategy-options"], queryFn: getSocialStrategyOptions });
  const { data: overview } = useQuery({ queryKey: ["social-strategy-overview"], queryFn: getSocialStrategyOverview });
  const save = useMutation({ mutationFn: saveSocialStrategy, onSuccess: () => { qc.invalidateQueries({ queryKey: ["social-strategies"] }); qc.invalidateQueries({ queryKey: ["social-strategy-overview"] }); reset(); toast.success("Estratégia salva"); }, onError: () => toast.error("Não foi possível salvar a estratégia") });
  const remove = useMutation({ mutationFn: deleteSocialStrategy, onSuccess: () => { qc.invalidateQueries({ queryKey: ["social-strategies"] }); qc.invalidateQueries({ queryKey: ["social-strategy-overview"] }); toast.success("Estratégia removida"); }, onError: () => toast.error("Não foi possível remover") });
  const reset = () => { setEditing(null); setForm(emptyForm); };
  const edit = (item: SocialStrategy) => setEditing(item) || setForm({ channel_id: item.channel_id, name: item.name, category_id: item.category_id ?? "", collection_id: item.collection_id ?? "", campaign_id: item.campaign_id ?? "", audience_segment: item.audience_segment ?? "", objective: item.objective as typeof objectives[number], content_pillars: item.content_pillars.join(", "), preferred_formats: item.preferred_formats, posting_frequency_per_week: item.posting_frequency_per_week, cta: item.cta ?? "", priority: item.priority, is_active: item.is_active });
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (!form.channel_id || !form.name.trim()) return toast.error("Canal e nome são obrigatórios"); save.mutate({ data: { id: editing?.id, channel_id: form.channel_id, name: form.name.trim(), category_id: form.category_id || null, collection_id: form.collection_id || null, campaign_id: form.campaign_id || null, audience_segment: form.audience_segment || null, objective: form.objective, content_pillars: form.content_pillars.split(",").map(v => v.trim()).filter(Boolean), preferred_formats: form.preferred_formats, posting_frequency_per_week: Number(form.posting_frequency_per_week), cta: form.cta || null, priority: Number(form.priority), is_active: form.is_active } }); };
  const channels = (options?.channels ?? []) as Option[];
  const categories = (options?.categories ?? []) as Option[];
  const collections = (options?.collections ?? []) as Option[];
  const campaigns = (options?.campaigns ?? []) as Option[];
  const segments = options?.segments ?? [];
  return <div className="mx-auto max-w-7xl space-y-8 p-4 lg:p-8">
    <header><Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-primary">Social Ecosystem Hub</Badge><h1 className="mt-2 text-4xl font-black uppercase italic tracking-tighter">Canal + <span className="text-primary">Estratégia</span></h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Transforme canais sociais em ativos estratégicos ligados a categorias, coleções, campanhas e segmentos. A publicação continua usando o motor existente.</p></header>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{[["Estratégias", overview?.total ?? 0],["Ativas", overview?.active ?? 0],["Canais", overview?.channels_covered ?? 0],["Coleções", overview?.with_collection ?? 0],["Campanhas", overview?.with_campaign ?? 0]].map(([label,value]) => <Card key={String(label)} className="rounded-2xl"><CardContent className="p-4"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black">{Number(value).toLocaleString("pt-BR")}</p></CardContent></Card>)}</div>
    <div className="grid gap-6 lg:grid-cols-[390px_1fr]">
      <Card className="rounded-[2rem]"><CardHeader><CardTitle className="flex items-center gap-2 text-lg font-black uppercase"><Sparkles className="h-5 w-5 text-primary" />{editing ? "Editar estratégia" : "Nova estratégia"}</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="space-y-4">
        <div><Label>Canal</Label><select value={form.channel_id} onChange={e => setForm({...form,channel_id:e.target.value})} className="mt-2 h-10 w-full rounded-xl border bg-background px-3 text-sm"><option value="">Selecione</option>{channels.map(c=><option key={c.id} value={c.id}>{c.platform} · {c.name}</option>)}</select></div>
        <div><Label>Nome da estratégia</Label><Input className="mt-2 rounded-xl" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex.: Achadinhos TikTok" /></div>
        <div><Label>Objetivo</Label><select value={form.objective} onChange={e=>setForm({...form,objective:e.target.value as typeof objectives[number]})} className="mt-2 h-10 w-full rounded-xl border bg-background px-3 text-sm">{objectives.map(v=><option key={v}>{v}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Categoria</Label><select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})} className="mt-2 h-10 w-full rounded-xl border bg-background px-2 text-sm"><option value="">Todas</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><Label>Segmento</Label><select value={form.audience_segment} onChange={e=>setForm({...form,audience_segment:e.target.value})} className="mt-2 h-10 w-full rounded-xl border bg-background px-2 text-sm"><option value="">Todos</option>{segments.map(s=><option key={s.value}>{s.value}</option>)}</select></div></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Coleção</Label><select value={form.collection_id} onChange={e=>setForm({...form,collection_id:e.target.value})} className="mt-2 h-10 w-full rounded-xl border bg-background px-2 text-sm"><option value="">Nenhuma</option>{collections.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select></div><div><Label>Campanha</Label><select value={form.campaign_id} onChange={e=>setForm({...form,campaign_id:e.target.value})} className="mt-2 h-10 w-full rounded-xl border bg-background px-2 text-sm"><option value="">Nenhuma</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div>
        <div><Label>Pilares de conteúdo</Label><Input className="mt-2 rounded-xl" value={form.content_pillars} onChange={e=>setForm({...form,content_pillars:e.target.value})} placeholder="ofertas, review, tutorial" /></div>
        <div><Label>Formatos</Label><div className="mt-2 flex flex-wrap gap-2">{formats.map(f=><Button key={f} type="button" variant={form.preferred_formats.includes(f)?"default":"outline"} size="sm" onClick={()=>setForm({...form,preferred_formats:form.preferred_formats.includes(f)?form.preferred_formats.filter(x=>x!==f):[...form.preferred_formats,f]})}>{f.replaceAll("_"," ")}</Button>)}</div></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Posts / semana</Label><Input className="mt-2 rounded-xl" type="number" min={1} max={50} value={form.posting_frequency_per_week} onChange={e=>setForm({...form,posting_frequency_per_week:Number(e.target.value)})}/></div><div><Label>Prioridade</Label><Input className="mt-2 rounded-xl" type="number" min={0} max={100} value={form.priority} onChange={e=>setForm({...form,priority:Number(e.target.value)})}/></div></div>
        <div><Label>CTA padrão</Label><Input className="mt-2 rounded-xl" value={form.cta} onChange={e=>setForm({...form,cta:e.target.value})} placeholder="Veja a oferta" /></div>
        <div className="flex items-center justify-between rounded-xl border p-3"><Label>Estratégia ativa</Label><Switch checked={form.is_active} onCheckedChange={v=>setForm({...form,is_active:v})}/></div>
        <Button type="submit" className="w-full rounded-xl font-black uppercase" disabled={save.isPending}><Plus className="mr-2 h-4 w-4"/>{editing?"Atualizar":"Criar estratégia"}</Button>{editing&&<Button type="button" variant="ghost" className="w-full" onClick={reset}>Cancelar</Button>}
      </form></CardContent></Card>
      <Card className="rounded-[2rem]"><CardHeader><CardTitle className="text-lg font-black uppercase">Mapa de estratégias</CardTitle></CardHeader><CardContent className="space-y-3">{isLoading?<p className="py-10 text-center text-sm text-muted-foreground">Carregando...</p>:strategies.length===0?<p className="py-10 text-center text-sm text-muted-foreground">Nenhuma estratégia configurada.</p>:strategies.map(item=><div key={item.id} className="rounded-2xl border p-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-black">{item.name}</span><Badge variant="outline">{item.objective}</Badge><Badge variant={item.is_active?"default":"outline"}>{item.is_active?"ATIVA":"PAUSADA"}</Badge></div><p className="mt-1 text-xs font-semibold text-muted-foreground">{item.channel?.platform} · {item.channel?.channel_name}</p><div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">{item.category?.name&&<span>Categoria: {item.category.name}</span>}{item.collection?.title&&<span>Coleção: {item.collection.title}</span>}{item.campaign?.name&&<span>Campanha: {item.campaign.name}</span>}{item.audience_segment&&<span>Segmento: {item.audience_segment}</span>}</div><p className="mt-2 text-xs">{item.content_pillars.join(" · ")} · {item.posting_frequency_per_week}x/semana</p></div><Button variant="ghost" size="icon" onClick={()=>edit(item)}><Pencil className="h-4 w-4"/></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={()=>remove.mutate({data:{id:item.id}})}><Trash2 className="h-4 w-4"/></Button></div></div>)}</CardContent></Card>
    </div>
  </div>;
}

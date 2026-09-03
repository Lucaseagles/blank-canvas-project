import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, ExternalLink, BarChart3, Pencil } from "lucide-react";
import { toast } from "sonner";
import { getAdminSocialChannels, saveSocialChannel, deleteSocialChannel, getCrossPromoAnalytics } from "@/lib/social-cross-promo.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/social-channels" as any)({ component: AdminSocialChannelsPage });
const platforms = ["tiktok", "instagram", "kwai", "telegram", "youtube"] as const;
type Channel = { id: string; platform: string; channel_name: string; channel_url: string; is_active: boolean; };
type AnalyticsRow = { platform: string; exposure_point: string; intent_clicks: number; };

function AdminSocialChannelsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Channel | null>(null);
  const [form, setForm] = useState({ platform: "tiktok", channel_name: "", channel_url: "", is_active: true });
  const { data: channels = [] } = useQuery({ queryKey: ["admin-social-channels"], queryFn: getAdminSocialChannels });
  const { data: analytics = [] } = useQuery({ queryKey: ["social-cross-promo-analytics"], queryFn: getCrossPromoAnalytics });
  const save = useMutation({ mutationFn: saveSocialChannel, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-social-channels"] }); setEditing(null); setForm({ platform: "tiktok", channel_name: "", channel_url: "", is_active: true }); toast.success("Canal salvo"); }, onError: () => toast.error("Não foi possível salvar o canal") });
  const remove = useMutation({ mutationFn: deleteSocialChannel, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-social-channels"] }); toast.success("Canal removido"); }, onError: () => toast.error("Não foi possível remover") });
  const submit = (e: React.FormEvent) => { e.preventDefault(); save.mutate({ data: { id: editing?.id, ...form } }); };
  const edit = (c: Channel) => { setEditing(c); setForm({ platform: c.platform, channel_name: c.channel_name, channel_url: c.channel_url, is_active: c.is_active }); };
  return <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-8">
    <header><Badge variant="outline" className="text-[10px] uppercase tracking-widest font-black text-primary">Cross-Promo Engine</Badge><h1 className="text-4xl font-black uppercase italic tracking-tighter mt-2">Canais <span className="text-primary">Sociais</span></h1><p className="text-sm text-muted-foreground mt-2">Gerencie convites para acompanhar os canais oficiais. O sistema mede somente cliques de intenção.</p></header>
    <div className="grid lg:grid-cols-[380px_1fr] gap-6">
      <Card className="rounded-[2rem] border-glass-border bg-glass/50 backdrop-blur-xl"><CardHeader><CardTitle className="text-lg font-black uppercase">{editing ? "Editar canal" : "Adicionar canal"}</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="space-y-4">
        <div><Label>Plataforma</Label><select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} className="mt-2 h-10 w-full rounded-xl border border-glass-border bg-background px-3 text-sm">{platforms.map(p => <option key={p}>{p}</option>)}</select></div>
        <div><Label>Nome do canal</Label><Input className="mt-2 rounded-xl" value={form.channel_name} onChange={e => setForm({ ...form, channel_name: e.target.value })} required /></div>
        <div><Label>URL</Label><Input className="mt-2 rounded-xl" type="url" placeholder="https://..." value={form.channel_url} onChange={e => setForm({ ...form, channel_url: e.target.value })} required /></div>
        <div className="flex items-center justify-between rounded-xl border border-glass-border p-3"><Label>Ativo</Label><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /></div>
        <Button type="submit" className="w-full rounded-xl font-black uppercase" disabled={save.isPending}><Plus className="mr-2 h-4 w-4" />{editing ? "Atualizar" : "Adicionar"}</Button>{editing && <Button type="button" variant="ghost" className="w-full" onClick={() => { setEditing(null); setForm({ platform: "tiktok", channel_name: "", channel_url: "", is_active: true }); }}>Cancelar</Button>}
      </form></CardContent></Card>
      <div className="space-y-6"><Card className="rounded-[2rem] border-glass-border bg-glass/50 backdrop-blur-xl"><CardHeader><CardTitle className="text-lg font-black uppercase">Canais publicados</CardTitle></CardHeader><CardContent className="space-y-3">{(channels as Channel[]).length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Nenhum canal configurado.</p> : (channels as Channel[]).map((c) => <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-glass-border p-4"><div className="flex-1 min-w-0"><div className="flex gap-2 items-center"><span className="font-black capitalize">{c.platform}</span><Badge variant="outline" className="text-[9px]">{c.is_active ? "ATIVO" : "PAUSADO"}</Badge></div><p className="text-sm font-semibold truncate">{c.channel_name}</p><a href={c.channel_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary inline-flex items-center gap-1">Abrir canal <ExternalLink className="h-3 w-3" /></a></div><Button variant="ghost" size="icon" onClick={() => edit(c)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove.mutate({ data: { id: c.id } })}><Trash2 className="h-4 w-4" /></Button></div>)}</CardContent></Card>
      <Card className="rounded-[2rem] border-glass-border bg-glass/50 backdrop-blur-xl"><CardHeader><CardTitle className="flex items-center gap-2 text-lg font-black uppercase"><BarChart3 className="h-5 w-5 text-primary" />Cliques de intenção</CardTitle></CardHeader><CardContent><div className="grid md:grid-cols-2 gap-3">{(analytics as AnalyticsRow[]).length === 0 ? <p className="text-sm text-muted-foreground">Ainda não há cliques registrados.</p> : (analytics as AnalyticsRow[]).map((row) => <div key={`${row.platform}-${row.exposure_point}`} className="rounded-xl border border-glass-border p-4"><div className="flex justify-between gap-3"><span className="font-black capitalize">{row.platform}</span><span className="text-lg font-black">{Number(row.intent_clicks).toLocaleString("pt-BR")}</span></div><p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{row.exposure_point.replaceAll("_", " ")}</p></div>)}</div></CardContent></Card></div>
    </div>
  </div>;
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { BarChart3, Check, CheckCircle2, ChevronRight, ExternalLink, Globe2, Instagram, Link2, Pencil, Plus, Radio, Search, Send, Sparkles, Trash2, Users, Video, Youtube, Zap } from "lucide-react";
import { toast } from "sonner";
import { getAdminSocialChannels, saveSocialChannel, deleteSocialChannel, getCrossPromoAnalytics } from "@/lib/social-cross-promo.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/social-channels")({ ssr: false, component: AdminSocialChannelsPage });

const platforms = ["tiktok", "instagram", "kwai", "telegram", "youtube"] as const;
type Platform = (typeof platforms)[number];
type Channel = { id: string; platform: Platform; channel_name: string; channel_url: string; icon?: string | null; is_active: boolean; created_at?: string | null };
type AnalyticsRow = { platform: string; exposure_point: string; intent_clicks: number };

const platformMeta: Record<Platform, { label: string; description: string; icon: typeof Globe2 }> = {
  tiktok: { label: "TikTok", description: "Vídeos curtos e descoberta", icon: Video },
  instagram: { label: "Instagram", description: "Conteúdo visual e comunidade", icon: Instagram },
  kwai: { label: "Kwai", description: "Vídeo curto e alcance", icon: Video },
  telegram: { label: "Telegram", description: "Canal direto de ofertas", icon: Send },
  youtube: { label: "YouTube", description: "Vídeos longos e Shorts", icon: Youtube },
};

const emptyForm = () => ({ platform: "tiktok" as Platform, channel_name: "", channel_url: "", is_active: true });

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Users; label: string; value: string | number; detail: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-transform group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-3">
        <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
        <div className="rounded-xl border bg-muted/50 p-2.5"><Icon className="h-4 w-4" /></div>
      </div>
    </div>
  );
}

function PlatformIcon({ platform, className = "h-5 w-5" }: { platform: Platform; className?: string }) {
  const Icon = platformMeta[platform]?.icon ?? Globe2;
  return <Icon className={className} />;
}

function AdminSocialChannelsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Channel | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | Platform>("all");

  const channelsQuery = useQuery({ queryKey: ["admin-social-channels"], queryFn: getAdminSocialChannels });
  const analyticsQuery = useQuery({ queryKey: ["social-cross-promo-analytics"], queryFn: getCrossPromoAnalytics });
  const channels = (channelsQuery.data ?? []) as Channel[];
  const analytics = (analyticsQuery.data ?? []) as AnalyticsRow[];

  const save = useMutation({
    mutationFn: saveSocialChannel,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-social-channels"] }); setEditing(null); setForm(emptyForm()); toast.success("Canal salvo com sucesso"); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível salvar o canal"),
  });
  const remove = useMutation({
    mutationFn: deleteSocialChannel,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-social-channels"] }); toast.success("Canal removido"); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível remover o canal"),
  });

  const filtered = useMemo(() => channels.filter((channel) => {
    const matchesPlatform = platformFilter === "all" || channel.platform === platformFilter;
    const text = `${channel.channel_name} ${channel.platform} ${channel.channel_url}`.toLowerCase();
    return matchesPlatform && text.includes(query.toLowerCase());
  }), [channels, platformFilter, query]);

  const stats = useMemo(() => ({
    total: channels.length,
    active: channels.filter(c => c.is_active).length,
    platforms: new Set(channels.map(c => c.platform)).size,
    clicks: analytics.reduce((sum, row) => sum + Number(row.intent_clicks || 0), 0),
  }), [channels, analytics]);

  function startNew(platform?: Platform) { setEditing(null); setForm({ ...emptyForm(), platform: platform ?? "tiktok" }); }
  function edit(channel: Channel) { setEditing(channel); setForm({ platform: channel.platform, channel_name: channel.channel_name, channel_url: channel.channel_url, is_active: channel.is_active }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function cancelEdit() { setEditing(null); setForm(emptyForm()); }
  function submit(event: FormEvent) {
    event.preventDefault();
    const name = form.channel_name.trim();
    const url = form.channel_url.trim();
    if (name.length < 2) { toast.error("Informe um nome de canal válido."); return; }
    if (!/^https?:\\/\\//i.test(url)) { toast.error("Use uma URL pública começando com https://"); return; }
    save.mutate({ data: { id: editing?.id, ...form, channel_name: name, channel_url: url } });
  }
  function removeChannel(channel: Channel) {
    if (window.confirm(`Remover o canal “${channel.channel_name}”?`)) remove.mutate({ data: { id: channel.id } });
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-muted/20 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="relative overflow-hidden rounded-[2rem] border bg-card p-6 shadow-sm sm:p-8">
          <div className="absolute -right-24 -top-32 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-black tracking-[0.16em]">SOCIAL ECOSYSTEM</Badge>
                <Badge className="rounded-full px-3 py-1"><Radio className="mr-1 h-3 w-3" />Operação ativa</Badge>
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Canais <span className="text-primary">Sociais</span></h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Centralize os canais oficiais usados pelo ecossistema para cross-promoção. Os cliques de intenção são medidos pelo motor real de analytics.</p>
            </div>
            <Button className="rounded-xl font-black" onClick={() => startNew()}><Plus className="mr-2 h-4 w-4" />Novo canal</Button>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric icon={Globe2} label="Canais" value={stats.total} detail="Cadastrados no sistema" />
          <Metric icon={CheckCircle2} label="Ativos" value={stats.active} detail="Disponíveis para promoção" />
          <Metric icon={Sparkles} label="Plataformas" value={stats.platforms} detail="Com canais configurados" />
          <Metric icon={BarChart3} label="Cliques" value={stats.clicks.toLocaleString("pt-BR")} detail="Intenção registrada" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section className="space-y-4">
            <Card className="overflow-hidden rounded-[2rem] border bg-card shadow-sm">
              <CardHeader className="border-b bg-muted/20 pb-4"><div className="flex items-center justify-between"><div><CardTitle className="text-lg font-black">{editing ? "Editar canal" : "Adicionar canal"}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Configuração usada pelo cross-promo</p></div><div className="rounded-xl border bg-background p-2"><Link2 className="h-4 w-4 text-primary" /></div></div></CardHeader>
              <CardContent className="p-5">
                <form onSubmit={submit} className="space-y-5">
                  <div>
                    <Label className="text-xs font-bold">Plataforma</Label>
                    <div className="mt-2 grid grid-cols-5 gap-1.5">
                      {platforms.map(platform => <button type="button" key={platform} onClick={() => setForm(f => ({ ...f, platform }))} title={platformMeta[platform].label} className={`flex h-11 items-center justify-center rounded-xl border transition-all ${form.platform === platform ? "border-primary bg-primary/10 text-primary shadow-sm" : "bg-background text-muted-foreground hover:bg-muted"}`}><PlatformIcon platform={platform} className="h-4 w-4" /></button>)}
                    </div>
                    <div className="mt-2 flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2"><PlatformIcon platform={form.platform} className="h-4 w-4 text-primary" /><div><p className="text-xs font-black">{platformMeta[form.platform].label}</p><p className="text-[10px] text-muted-foreground">{platformMeta[form.platform].description}</p></div></div>
                  </div>
                  <div><Label className="text-xs font-bold">Nome do canal</Label><Input className="mt-2 h-11 rounded-xl" value={form.channel_name} onChange={e => setForm({ ...form, channel_name: e.target.value })} placeholder="Ex.: Achadinhos Oficial" required /></div>
                  <div><Label className="text-xs font-bold">URL pública</Label><Input className="mt-2 h-11 rounded-xl" type="url" placeholder="https://..." value={form.channel_url} onChange={e => setForm({ ...form, channel_url: e.target.value })} required /><p className="mt-1.5 text-[10px] text-muted-foreground">Use o endereço público que o cliente deve abrir.</p></div>
                  <div className="flex items-center justify-between rounded-2xl border bg-muted/20 p-4"><div><p className="text-sm font-black">Disponível no ecossistema</p><p className="text-[10px] text-muted-foreground">Canais inativos não entram nas chamadas públicas.</p></div><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /></div>
                  <div className="flex gap-2 pt-1"><Button type="submit" className="h-11 flex-1 rounded-xl font-black" disabled={save.isPending}>{save.isPending ? "Salvando..." : editing ? "Atualizar canal" : "Adicionar canal"}</Button>{editing && <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={cancelEdit}>Cancelar</Button>}</div>
                </form>
              </CardContent>
            </Card>
            <div className="rounded-[2rem] border bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-sm"><div className="flex items-start gap-3"><div className="rounded-xl border bg-background p-2.5"><Zap className="h-4 w-4 text-primary" /></div><div><p className="text-sm font-black">Cross-promo conectado</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Os canais ativos podem ser usados pelos pontos de exposição que já existem no motor de cross-promo.</p></div></div></div>
          </section>

          <section className="space-y-5">
            <Card className="rounded-[2rem] border bg-card shadow-sm">
              <CardHeader className="pb-3"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><CardTitle className="text-lg font-black">Canais configurados</CardTitle><p className="mt-1 text-xs text-muted-foreground">Gerencie os destinos oficiais usados pelo aplicativo.</p></div><div className="flex gap-2"><Button variant="outline" size="sm" className="rounded-xl" onClick={() => startNew()}>Adicionar</Button></div></div></CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-10 rounded-xl pl-9" placeholder="Buscar canal..." value={query} onChange={e => setQuery(e.target.value)} /></div><div className="flex gap-1 overflow-x-auto rounded-xl border bg-muted/30 p-1">{(["all", ...platforms] as const).map(filter => <button type="button" key={filter} onClick={() => setPlatformFilter(filter)} className={`shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase transition-colors ${platformFilter === filter ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{filter === "all" ? "Todos" : platformMeta[filter].label}</button>)}</div></div>
                <div className="space-y-2">
                  {channelsQuery.isLoading ? [1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />) : filtered.length === 0 ? <div className="rounded-2xl border border-dashed p-10 text-center"><Globe2 className="mx-auto h-8 w-8 text-muted-foreground/50" /><p className="mt-3 font-black">Nenhum canal encontrado</p><p className="mt-1 text-xs text-muted-foreground">Cadastre um canal ou ajuste a busca.</p><Button className="mt-4 rounded-xl" onClick={() => startNew()}>Cadastrar canal</Button></div> : filtered.map(channel => (
                    <div key={channel.id} className="group flex items-center gap-3 rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:bg-muted/30 hover:shadow-sm">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-muted/50"><PlatformIcon platform={channel.platform} className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-black">{channel.channel_name}</span><Badge variant={channel.is_active ? "default" : "outline"} className="rounded-full text-[9px]">{channel.is_active ? "ATIVO" : "PAUSADO"}</Badge></div><p className="mt-1 truncate text-[10px] uppercase tracking-widest text-muted-foreground">{platformMeta[channel.platform].label} · {channel.channel_url}</p></div>
                      <div className="hidden items-center gap-1 sm:flex"><Button variant="ghost" size="icon" className="rounded-xl" asChild><a href={channel.channel_url} target="_blank" rel="noopener noreferrer" aria-label="Abrir canal"><ExternalLink className="h-4 w-4" /></a></Button><Button variant="ghost" size="icon" className="rounded-xl" onClick={() => edit(channel)} aria-label="Editar canal"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="rounded-xl text-destructive" onClick={() => removeChannel(channel)} aria-label="Remover canal"><Trash2 className="h-4 w-4" /></Button></div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground sm:hidden" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border bg-card shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg font-black"><BarChart3 className="h-5 w-5 text-primary" />Analytics de intenção</CardTitle><p className="text-xs text-muted-foreground">Dados retornados pelo resumo real de cross-promo.</p></CardHeader>
              <CardContent><div className="grid gap-3 sm:grid-cols-2">{analytics.length === 0 ? <div className="sm:col-span-2 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Ainda não há cliques de intenção registrados.</div> : analytics.map(row => <div key={`${row.platform}-${row.exposure_point}`} className="rounded-2xl border bg-muted/10 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-black capitalize">{row.platform}</p><p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{row.exposure_point.replaceAll("_", " ")}</p></div><div className="text-right"><p className="text-xl font-black">{Number(row.intent_clicks).toLocaleString("pt-BR")}</p><p className="text-[9px] font-bold uppercase text-muted-foreground">cliques</p></div></div></div>)}</div></CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

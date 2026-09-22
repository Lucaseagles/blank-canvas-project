import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Copy, Edit3, ExternalLink, ImageIcon, LayoutGrid, Monitor, Plus, RefreshCw, Smartphone, Tablet, Trash2, TriangleAlert, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getAdminSettings, createBanner, deleteBanner, updateAdminSetting } from "@/lib/admin-settings.functions";

export const Route = createFileRoute("/admin/banner-preview")({ component: BannerPreviewPage });

type Banner = Record<string, unknown>;
type Device = "desktop" | "tablet" | "mobile";
type Status = "all" | "active" | "scheduled" | "expired" | "inactive";

function BannerPreviewPage() {
  const queryClient = useQueryClient();
  const getSettings = useServerFn(getAdminSettings);
  const create = useServerFn(createBanner);
  const update = useServerFn(updateAdminSetting);
  const remove = useServerFn(deleteBanner);
  const query = useQuery({ queryKey: ["admin-banner-preview"], queryFn: () => getSettings({ data: undefined }) });
  const [status, setStatus] = useState<Status>("all");
  const [device, setDevice] = useState<Device>("desktop");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const source = query.data?.find((item) => item.key === "banners");
  const banners = (source?.rows ?? []) as Banner[];
  const now = Date.now();
  const stateOf = (banner: Banner): Exclude<Status, "all"> => {
    if (!Boolean(banner["is_active"])) return "inactive";
    const start = dateValue(banner["starts_at"]);
    const end = dateValue(banner["ends_at"]);
    if (start && end && end < start) return "inactive";
    if (start && now < start) return "scheduled";
    if (end && now > end) return "expired";
    return "active";
  };
  const counts = useMemo(() => (["active", "scheduled", "expired", "inactive"] as const).reduce((acc, key) => ({ ...acc, [key]: banners.filter((b) => stateOf(b) === key).length }), { active: 0, scheduled: 0, expired: 0, inactive: 0 }), [banners, now]);
  const filtered = useMemo(() => status === "all" ? banners : banners.filter((b) => stateOf(b) === status), [banners, status, now]);
  const selected = filtered.find((b) => String(b["id"]) === selectedId) ?? filtered[0] ?? null;
  const selectedIndex = selected ? filtered.findIndex((b) => String(b["id"]) === String(selected["id"])) : -1;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-banner-preview"] });
  const openCreate = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = (banner: Banner) => { setEditing(banner); setSelectedId(String(banner["id"])); setEditorOpen(true); };
  const duplicate = (banner: Banner) => { setEditing({ ...banner, id: undefined, title: `${String(banner["title"] ?? "Banner")} — cópia`, is_active: false }); setEditorOpen(true); };

  const saveMutation = useMutation({
    mutationFn: async (payload: Banner) => {
      const clean = bannerPayload(payload);
      if (editing?.["id"]) return update({ data: { source: "banners", id: String(editing["id"]), patch: clean } });
      return create({ data: clean });
    },
    onSuccess: (result) => { toast.success(editing?.["id"] ? "Banner atualizado." : "Banner criado."); setEditorOpen(false); setEditing(null); setSelectedId(String(result.row["id"])); refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const deleteMutation = useMutation({
    mutationFn: () => remove({ data: { id: String(selected?.["id"]) } }),
    onSuccess: () => { toast.success("Banner excluído."); setDeleteOpen(false); setSelectedId(null); refresh(); },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="min-h-full bg-gradient-to-b from-primary/[0.035] via-background to-background">
      <div className="mx-auto max-w-7xl space-y-7 p-4 lg:p-8">
        <header className="relative overflow-hidden rounded-[2rem] border bg-card/90 p-6 shadow-sm backdrop-blur md:p-8">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge className="gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"><LayoutGrid className="h-3 w-3" /> Banner Studio</Badge>
                <Badge variant="outline" className="gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Banco real</Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">Owner Only</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Gerencie e visualize seus <span className="text-primary">banners</span></h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Aqui você pode adicionar, editar, duplicar, ativar, trocar imagem/link/período e excluir banners. A alteração é feita na mesma tabela usada pela configuração administrativa.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2 rounded-xl" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /> Atualizar</Button>
              <Button className="gap-2 rounded-xl" onClick={openCreate}><Plus className="h-4 w-4" /> Novo banner</Button>
            </div>
          </div>
        </header>

        {query.isError ? <Card className="rounded-[2rem] border-destructive/30"><CardContent className="py-16 text-center"><TriangleAlert className="mx-auto h-8 w-8 text-destructive" /><p className="mt-3 font-bold">Falha ao carregar banners</p><p className="mt-1 text-sm text-muted-foreground">{query.error.message}</p><Button className="mt-4 rounded-xl" variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button></CardContent></Card> : query.isLoading ? <LoadingState /> : !source?.available ? <Card className="rounded-[2rem] border-destructive/30"><CardContent className="py-16 text-center"><TriangleAlert className="mx-auto h-8 w-8 text-destructive" /><p className="mt-3 font-bold">Fonte de banners indisponível</p><p className="mt-1 text-sm text-muted-foreground">{source?.error ?? "Fonte não encontrada."}</p></CardContent></Card> : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric label="Total" value={banners.length} icon={<LayoutGrid className="h-4 w-4" />} />
              <Metric label="Ativos agora" value={counts.active} icon={<CheckCircle2 className="h-4 w-4" />} />
              <Metric label="Agendados" value={counts.scheduled} icon={<CalendarDays className="h-4 w-4" />} />
              <Metric label="Expirados" value={counts.expired} icon={<XCircle className="h-4 w-4" />} />
              <Metric label="Inativos" value={counts.inactive} icon={<EyeIcon />} />
            </div>

            <Card className="rounded-[2rem] border-primary/10 shadow-sm">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div><p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Estado</p><div className="mt-3 flex flex-wrap gap-2">{(["all", "active", "scheduled", "expired", "inactive"] as Status[]).map((item) => <Button key={item} size="sm" variant={status === item ? "default" : "outline"} className="rounded-xl" onClick={() => setStatus(item)}>{statusLabel(item)} {item !== "all" && <span className="ml-1 opacity-70">({counts[item]})</span>}</Button>)}</div></div>
                <div><p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Dispositivo do preview</p><div className="mt-3 flex gap-2"><DeviceButton active={device === "desktop"} icon={<Monitor className="h-4 w-4" />} label="Desktop" onClick={() => setDevice("desktop")} /><DeviceButton active={device === "tablet"} icon={<Tablet className="h-4 w-4" />} label="Tablet" onClick={() => setDevice("tablet")} /><DeviceButton active={device === "mobile"} icon={<Smartphone className="h-4 w-4" />} label="Mobile" onClick={() => setDevice("mobile")} /></div></div>
              </CardContent>
            </Card>

            {selected ? <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
              <Card className="overflow-hidden rounded-[2rem] border-primary/10 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between gap-4 border-b bg-muted/20 p-5">
                  <div><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preview real</p><CardTitle className="mt-1 text-lg font-black">{selected["title"] ? String(selected["title"]) : "Banner sem título"}</CardTitle></div>
                  <div className="flex gap-2"><Button size="icon" variant="outline" className="rounded-xl" disabled={selectedIndex <= 0} onClick={() => setSelectedId(String(filtered[selectedIndex - 1]["id"]))}><ArrowLeft /></Button><Button size="icon" variant="outline" className="rounded-xl" disabled={selectedIndex < 0 || selectedIndex >= filtered.length - 1} onClick={() => setSelectedId(String(filtered[selectedIndex + 1]["id"]))}><ArrowRight /></Button></div>
                </CardHeader>
                <CardContent className="flex min-h-[440px] items-center justify-center bg-muted/30 p-5 md:p-8">
                  <PreviewFrame banner={selected} device={device} />
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-primary/10 shadow-sm">
                <CardHeader><CardTitle className="text-lg font-black">Banner selecionado</CardTitle><p className="text-xs text-muted-foreground">Controle tudo deste banner sem sair da tela.</p></CardHeader>
                <CardContent className="space-y-4">
                  <StateBadge state={stateOf(selected)} />
                  <div className="grid grid-cols-2 gap-3"><Validation label="Imagem" ok={Boolean(String(selected["image_url"] ?? "").trim())} /><Validation label="Destino" ok={!selected["link_url"] || isUrl(String(selected["link_url"]))} /><Validation label="Datas" ok={validDates(selected)} /><Validation label="Dispositivo" ok={["all", "desktop", "tablet", "mobile"].includes(String(selected["target_device"] ?? "all"))} /></div>
                  <div className="space-y-2 rounded-2xl border bg-muted/20 p-4 text-xs"><Meta label="Posição" value={String(selected["position"] ?? "0")} /><Meta label="Público" value={String(selected["audience_segment"] ?? "Todos")} /><Meta label="Dispositivo" value={deviceLabel(String(selected["target_device"] ?? "all"))} /><Meta label="Início" value={formatDate(selected["starts_at"])} /><Meta label="Fim" value={formatDate(selected["ends_at"])} /></div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1"><Button className="gap-2 rounded-xl" onClick={() => openEdit(selected)}><Edit3 className="h-4 w-4" /> Editar banner</Button><Button variant="outline" className="gap-2 rounded-xl" onClick={() => duplicate(selected)}><Copy className="h-4 w-4" /> Duplicar</Button>{selected["link_url"] && <Button asChild variant="outline" className="gap-2 rounded-xl"><a href={String(selected["link_url"])} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Abrir destino</a></Button>}<Button variant="destructive" className="gap-2 rounded-xl" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4" /> Excluir banner</Button></div>
                </CardContent>
              </Card>
            </div> : <Card className="rounded-[2rem] border-dashed"><CardContent className="py-16 text-center text-sm text-muted-foreground">Nenhum banner corresponde ao filtro.</CardContent></Card>}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((banner) => <BannerCard key={String(banner["id"])} banner={banner} selected={String(selected?.["id"]) === String(banner["id"])} onSelect={() => setSelectedId(String(banner["id"]))} onEdit={() => openEdit(banner)} />)}</div>
          </>
        )}
      </div>

      <BannerEditor open={editorOpen} banner={editing} pending={saveMutation.isPending} onOpenChange={setEditorOpen} onSave={(payload) => saveMutation.mutate(payload)} />
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}><DialogContent className="rounded-[2rem]"><DialogHeader><DialogTitle>Excluir este banner?</DialogTitle><DialogDescription>Essa ação remove o registro real de <b>{String(selected?.["title"] ?? "banner")}</b> da tabela de banners e é registrada na auditoria administrativa.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setDeleteOpen(false)}>Cancelar</Button><Button variant="destructive" className="gap-2 rounded-xl" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}><Trash2 className="h-4 w-4" /> {deleteMutation.isPending ? "Excluindo…" : "Excluir definitivamente"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function BannerEditor({ open, banner, pending, onOpenChange, onSave }: { open: boolean; banner: Banner | null; pending: boolean; onOpenChange: (open: boolean) => void; onSave: (payload: Banner) => void }) {
  const [form, setForm] = useState<Banner>({});
  const [lastKey, setLastKey] = useState<string | null>(null);
  const sourceKey = banner?.["id"] ? String(banner["id"]) : "new";
  if (open && lastKey !== sourceKey) { setForm(banner ? { ...banner } : { is_active: true, position: 0, target_device: "all" }); setLastKey(sourceKey); }
  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const dateInput = (value: unknown) => value ? new Date(String(value)).toISOString().slice(0, 16) : "";
  const dateToIso = (value: string) => value ? new Date(value).toISOString() : null;
  const endBeforeStart = Boolean(form["starts_at"] && form["ends_at"] && dateValue(form["ends_at"])! < dateValue(form["starts_at"])!);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-y-auto rounded-[2rem] sm:max-w-3xl"><DialogHeader><DialogTitle className="text-2xl font-black">{banner?.["id"] ? "Editar banner" : "Novo banner"}</DialogTitle><DialogDescription>Altere os dados reais do banner. Salvar atualiza a mesma fonte usada pelo Admin.</DialogDescription></DialogHeader><div className="grid gap-5 md:grid-cols-2">
    <Field label="Título" required><Input value={String(form["title"] ?? "")} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: Oferta especial" /></Field>
    <Field label="Imagem (URL)" required><Input value={String(form["image_url"] ?? "")} onChange={(e) => set("image_url", e.target.value)} placeholder="https://..." /></Field>
    <Field label="Destino (URL)"><Input value={String(form["link_url"] ?? "")} onChange={(e) => set("link_url", e.target.value)} placeholder="https://..." /></Field>
    <Field label="Posição"><Input type="number" min={0} value={String(form["position"] ?? 0)} onChange={(e) => set("position", Number(e.target.value))} /></Field>
    <Field label="Início"><Input type="datetime-local" value={dateInput(form["starts_at"])} onChange={(e) => set("starts_at", dateToIso(e.target.value))} /></Field>
    <Field label="Fim"><Input type="datetime-local" value={dateInput(form["ends_at"])} onChange={(e) => set("ends_at", dateToIso(e.target.value))} /></Field>
    <Field label="Público / segmento"><Input value={String(form["audience_segment"] ?? "")} onChange={(e) => set("audience_segment", e.target.value)} placeholder="Todos, novos usuários..." /></Field>
    <Field label="Dispositivo"><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={String(form["target_device"] ?? "all")} onChange={(e) => set("target_device", e.target.value)}><option value="all">Todos</option><option value="desktop">Desktop</option><option value="tablet">Tablet</option><option value="mobile">Mobile</option></select></Field>
    <div className="md:col-span-2 flex items-center justify-between rounded-2xl border p-4"><div><p className="text-sm font-bold">Banner ativo</p><p className="text-xs text-muted-foreground">Controla o campo is_active no banco.</p></div><Switch checked={Boolean(form["is_active"])} onCheckedChange={(v) => set("is_active", v)} /></div>
    {String(form["image_url"] ?? "").startsWith("http") && <div className="md:col-span-2 overflow-hidden rounded-2xl border bg-muted"><img src={String(form["image_url"])} alt="Prévia do banner" className="max-h-64 w-full object-cover" /></div>}
  </div>{endBeforeStart && <p className="text-sm font-semibold text-destructive">A data de fim não pode ser anterior ao início.</p>}<DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>Cancelar</Button><Button className="rounded-xl" disabled={pending || !String(form["title"] ?? "").trim() || !isUrl(String(form["image_url"] ?? "")) || endBeforeStart} onClick={() => onSave(form)}>{pending ? "Salvando…" : banner?.["id"] ? "Salvar alterações" : "Criar banner"}</Button></DialogFooter></DialogContent></Dialog>;
}

function PreviewFrame({ banner, device }: { banner: Banner; device: Device }) {
  const width = device === "mobile" ? "w-[270px]" : device === "tablet" ? "w-[560px]" : "w-full";
  const image = String(banner["image_url"] ?? "");
  return <div className={`overflow-hidden rounded-[1.6rem] border-4 border-foreground/10 bg-background shadow-2xl ${width}`}><div className="flex h-7 items-center gap-1 border-b bg-muted px-3"><span className="h-2 w-2 rounded-full bg-muted-foreground/30" /><span className="h-2 w-2 rounded-full bg-muted-foreground/30" /><span className="h-2 w-2 rounded-full bg-muted-foreground/30" /><span className="ml-2 h-2 flex-1 rounded-full bg-background/70" /></div><div className="relative aspect-[16/7] overflow-hidden bg-muted">{image ? <img src={image} alt={String(banner["title"] ?? "")} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ImageIcon className="mr-2 h-5 w-5" /> Sem imagem</div>}<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 pt-16 text-white"><p className="font-black">{String(banner["title"] ?? "Banner")}</p>{banner["link_url"] && <span className="mt-2 inline-flex rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur">Abrir oferta</span>}</div></div></div>;
}

function BannerCard({ banner, selected, onSelect, onEdit }: { banner: Banner; selected: boolean; onSelect: () => void; onEdit: () => void }) {
  return <Card className={`group cursor-pointer overflow-hidden rounded-[1.6rem] border-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-lg ${selected ? "ring-2 ring-primary" : ""}`} onClick={onSelect}><div className="relative aspect-[16/7] bg-muted">{banner["image_url"] ? <img src={String(banner["image_url"])} alt={String(banner["title"] ?? "")} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground"><ImageIcon className="mr-2 h-5 w-5" /> Sem imagem</div>}<div className="absolute left-3 top-3"><StateBadge state={stateOfBanner(banner)} /></div></div><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-black">{String(banner["title"] ?? "Sem título")}</p><p className="mt-1 text-xs text-muted-foreground">Posição {String(banner["position"] ?? 0)} · {deviceLabel(String(banner["target_device"] ?? "all"))}</p></div><Button size="icon" variant="outline" className="shrink-0 rounded-xl" onClick={(e) => { e.stopPropagation(); onEdit(); }}><Edit3 className="h-4 w-4" /></Button></div></CardContent></Card>;
}

function stateOfBanner(banner: Banner): Exclude<Status, "all"> { if (!Boolean(banner["is_active"])) return "inactive"; const start = dateValue(banner["starts_at"]); const end = dateValue(banner["ends_at"]); if (start && end && end < start) return "inactive"; if (start && Date.now() < start) return "scheduled"; if (end && Date.now() > end) return "expired"; return "active"; }
function dateValue(value: unknown) { if (!value) return null; const n = new Date(String(value)).getTime(); return Number.isNaN(n) ? null : n; }
function validDates(banner: Banner) { const start = dateValue(banner["starts_at"]); const end = dateValue(banner["ends_at"]); return !(start && end && end < start); }
function isUrl(value: string) { try { const u = new URL(value); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; } }
function bannerPayload(payload: Banner) { return { title: String(payload["title"] ?? "").trim(), image_url: String(payload["image_url"] ?? "").trim(), link_url: String(payload["link_url"] ?? "").trim(), starts_at: payload["starts_at"] ? String(payload["starts_at"]) : null, ends_at: payload["ends_at"] ? String(payload["ends_at"]) : null, is_active: Boolean(payload["is_active"]), position: Number(payload["position"] ?? 0), audience_segment: String(payload["audience_segment"] ?? "").trim(), target_device: String(payload["target_device"] ?? "all") as "all" | "desktop" | "tablet" | "mobile" }; }
function statusLabel(status: Status) { return status === "all" ? "Todos" : status === "active" ? "Ativos" : status === "scheduled" ? "Agendados" : status === "expired" ? "Expirados" : "Inativos"; }
function deviceLabel(device: string) { return device === "desktop" ? "Desktop" : device === "tablet" ? "Tablet" : device === "mobile" ? "Mobile" : "Todos"; }
function formatDate(value: unknown) { if (!value) return "Não definido"; const d = new Date(String(value)); return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); }
function StateBadge({ state }: { state: Exclude<Status, "all"> }) { const map = { active: ["Ativo agora", "default"], scheduled: ["Agendado", "secondary"], expired: ["Expirado", "destructive"], inactive: ["Inativo", "outline"] } as const; const [label, variant] = map[state]; return <Badge variant={variant}>{label}</Badge>; }
function Validation({ label, ok }: { label: string; ok: boolean }) { return <div className="rounded-xl border p-3"><div className="flex items-center gap-2 text-xs font-bold">{ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <TriangleAlert className="h-4 w-4 text-amber-500" />}{label}</div><p className="mt-1 text-[10px] text-muted-foreground">{ok ? "OK" : "Revisar"}</p></div>; }
function Metric({ label, value, icon }: { label: string; value: number; icon: ReactNode }) { return <Card className="rounded-[1.5rem] border-primary/10"><CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span></div><p className="mt-3 text-2xl font-black">{value}</p></CardContent></Card>; }
function DeviceButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) { return <Button size="sm" variant={active ? "default" : "outline"} className="gap-2 rounded-xl" onClick={onClick}>{icon}{label}</Button>; }
function Meta({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">{label}</span><span className="max-w-[65%] truncate text-right font-semibold">{value}</span></div>; }
function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) { return <label className="space-y-1.5"><Label>{label}{required ? " *" : ""}</Label>{children}</label>; }
function EyeIcon() { return <EyeIconBase />; }
function EyeIconBase() { return <CheckCircle2 className="h-4 w-4" />; }
function LoadingState() { return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-[1.5rem] border bg-muted/30" />)}</div><div className="h-24 animate-pulse rounded-[2rem] border bg-muted/30" /><div className="h-[480px] animate-pulse rounded-[2rem] border bg-muted/30" /></div>; }

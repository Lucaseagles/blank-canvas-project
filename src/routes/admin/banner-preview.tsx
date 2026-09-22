import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, ExternalLink, ImageIcon, LayoutGrid, Monitor, RefreshCw, Smartphone, Tablet, CalendarDays, CheckCircle2, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSettings } from "@/lib/admin-settings.functions";

export const Route = createFileRoute("/admin/banner-preview")({ component: BannerPreviewPage });

type Banner = Record<string, unknown>;
type Device = "desktop" | "tablet" | "mobile";
type StatusFilter = "all" | "active" | "inactive";

function BannerPreviewPage() {
  const getSettings = useServerFn(getAdminSettings);
  const query = useQuery({ queryKey: ["admin-banner-preview"], queryFn: () => getSettings({ data: undefined }) });
  const [status, setStatus] = useState<StatusFilter>("all");
  const [device, setDevice] = useState<Device>("desktop");

  const source = query.data?.find((item) => item.key === "banners");
  const banners = (source?.rows ?? []) as Banner[];
  const activeCount = banners.filter((banner) => Boolean(banner["is_active"])).length;
  const inactiveCount = banners.length - activeCount;

  const filteredBanners = useMemo(() => {
    if (status === "active") return banners.filter((banner) => Boolean(banner["is_active"]));
    if (status === "inactive") return banners.filter((banner) => !Boolean(banner["is_active"]));
    return banners;
  }, [banners, status]);

  const deviceWidth = device === "mobile" ? "max-w-sm" : device === "tablet" ? "max-w-2xl" : "max-w-none";

  return (
    <div className="min-h-full bg-gradient-to-b from-primary/[0.035] via-background to-background">
      <div className="mx-auto max-w-7xl space-y-8 p-4 lg:p-8">
        <header className="relative overflow-hidden rounded-[2rem] border bg-card/90 p-6 shadow-sm backdrop-blur md:p-8">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"><Eye className="h-3 w-3" /> Banner Studio</Badge>
                <Badge variant="outline" className="gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Dados reais</Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest">Owner Only</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Pré-visualização de <span className="text-primary">banners</span></h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Veja como os banners cadastrados aparecem na vitrine, confira status, período e destino e valide a experiência antes de publicar alterações.</p>
            </div>
            <Button variant="outline" className="gap-2 rounded-xl" onClick={() => query.refetch()} disabled={query.isFetching}>
              <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /> {query.isFetching ? "Atualizando…" : "Atualizar"}
            </Button>
          </div>
        </header>

        {query.isError ? (
          <Card className="rounded-[2rem] border-destructive/30"><CardContent className="flex flex-col items-center gap-3 py-16 text-center"><TriangleAlert className="h-8 w-8 text-destructive" /><p className="font-bold">Falha ao carregar banners</p><p className="max-w-xl text-sm text-muted-foreground">{query.error.message}</p><Button variant="outline" className="rounded-xl" onClick={() => query.refetch()}>Tentar novamente</Button></CardContent></Card>
        ) : query.isLoading ? (
          <LoadingState />
        ) : !source?.available ? (
          <Card className="rounded-[2rem] border-destructive/30"><CardContent className="flex flex-col items-center gap-3 py-16 text-center"><TriangleAlert className="h-8 w-8 text-destructive" /><p className="font-bold">Fonte de banners indisponível</p><p className="max-w-xl text-sm text-muted-foreground">{source?.error ?? "A fonte não foi encontrada."}</p></CardContent></Card>
        ) : banners.length === 0 ? (
          <Card className="rounded-[2rem] border-dashed"><CardContent className="flex flex-col items-center py-16 text-center"><ImageIcon className="h-10 w-10 text-muted-foreground" /><p className="mt-4 font-bold">Nenhum banner cadastrado</p><p className="mt-1 max-w-lg text-sm text-muted-foreground">O preview não cria conteúdo fictício. Cadastre um banner nas configurações para visualizá-lo aqui.</p><Button asChild variant="outline" className="mt-5 rounded-xl"><Link to="/admin/settings">Abrir configurações</Link></Button></CardContent></Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Metric label="Total de banners" value={banners.length} icon={<LayoutGrid className="h-4 w-4" />} detail="Registros encontrados" />
              <Metric label="Ativos" value={activeCount} icon={<CheckCircle2 className="h-4 w-4" />} detail={activeCount ? "Disponíveis na configuração" : "Nenhum ativo"} />
              <Metric label="Inativos" value={inactiveCount} icon={<Eye className="h-4 w-4" />} detail={inactiveCount ? "Fora da exibição ativa" : "Nenhum inativo"} />
            </div>

            <Card className="rounded-[2rem] border-primary/10 shadow-sm">
              <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Controles do preview</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["all", "active", "inactive"] as StatusFilter[]).map((item) => (
                      <Button key={item} size="sm" variant={status === item ? "default" : "outline"} className="rounded-xl" onClick={() => setStatus(item)}>
                        {item === "all" ? "Todos" : item === "active" ? "Ativos" : "Inativos"}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Viewport</p>
                  <div className="mt-3 flex gap-2">
                    <DeviceButton active={device === "desktop"} icon={<Monitor className="h-4 w-4" />} label="Desktop" onClick={() => setDevice("desktop")} />
                    <DeviceButton active={device === "tablet"} icon={<Tablet className="h-4 w-4" />} label="Tablet" onClick={() => setDevice("tablet")} />
                    <DeviceButton active={device === "mobile"} icon={<Smartphone className="h-4 w-4" />} label="Mobile" onClick={() => setDevice("mobile")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className={`mx-auto w-full transition-all ${deviceWidth}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><p className="font-black">Visualização {device === "desktop" ? "desktop" : device === "tablet" ? "tablet" : "mobile"}</p><p className="text-xs text-muted-foreground">{filteredBanners.length} banner(s) nesta visualização</p></div>
                {status !== "all" && <Badge variant="outline" className="rounded-full">{status === "active" ? "Somente ativos" : "Somente inativos"}</Badge>}
              </div>
              {filteredBanners.length === 0 ? (
                <Card className="rounded-[2rem] border-dashed"><CardContent className="py-14 text-center text-sm text-muted-foreground">Nenhum banner corresponde ao filtro selecionado.</CardContent></Card>
              ) : (
                <div className="grid gap-6">
                  {filteredBanners.map((banner) => <BannerCard key={String(banner["id"])} banner={banner} device={device} />)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BannerCard({ banner, device }: { banner: Banner; device: Device }) {
  const imageUrl = String(banner["image_url"] ?? "");
  const title = String(banner["title"] ?? "Sem título");
  const linkUrl = banner["link_url"] ? String(banner["link_url"]) : null;
  const active = Boolean(banner["is_active"]);
  const position = String(banner["position"] ?? "—");
  return (
    <Card className="overflow-hidden rounded-[2rem] border-primary/10 bg-card/95 shadow-sm">
      <div className="relative aspect-[16/7] overflow-hidden bg-muted">
        {imageUrl ? <img src={imageUrl} alt={title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.015]" loading="lazy" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground"><ImageIcon className="mr-2 h-5 w-5" /> Sem imagem</div>}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Badge variant={active ? "default" : "secondary"} className="rounded-full shadow-sm">{active ? "Ativo" : "Inativo"}</Badge>
          <Badge variant="outline" className="rounded-full bg-background/80 backdrop-blur">Posição {position}</Badge>
        </div>
      </div>
      <CardHeader className="p-6 pb-3"><div className="flex items-start justify-between gap-4"><div><CardTitle className="text-xl font-black">{title}</CardTitle><p className="mt-1 text-xs text-muted-foreground">ID {String(banner["id"] ?? "—").slice(0, 12)}</p></div>{active && <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Publicado</div>}</div></CardHeader>
      <CardContent className="space-y-4 p-6 pt-0">
        <div className="grid gap-3 sm:grid-cols-3">
          <Meta icon={<CalendarDays className="h-3.5 w-3.5" />} label="Início" value={formatDate(banner["starts_at"])} />
          <Meta icon={<CalendarDays className="h-3.5 w-3.5" />} label="Fim" value={formatDate(banner["ends_at"])} />
          <Meta icon={<ExternalLink className="h-3.5 w-3.5" />} label="Destino" value={linkUrl ? truncate(linkUrl, 28) : "Sem link"} />
        </div>
        {linkUrl && <Button asChild variant="outline" className="w-full gap-2 rounded-xl"><a href={linkUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Abrir destino real</a></Button>}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, icon, detail }: { label: string; value: number; icon: React.ReactNode; detail: string }) {
  return <Card className="rounded-[1.5rem] border-primary/10 bg-card/90 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span></div><p className="mt-4 text-2xl font-black">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>;
}

function DeviceButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <Button size="sm" variant={active ? "default" : "outline"} className="gap-2 rounded-xl" onClick={onClick}>{icon}{label}</Button>;
}

function Meta({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl border bg-muted/20 p-3"><div className="flex items-center gap-1.5 text-muted-foreground"><span>{icon}</span><p className="text-[9px] font-black uppercase tracking-widest">{label}</p></div><p className="mt-2 truncate text-xs font-semibold">{value}</p></div>;
}

function truncate(value: string, max: number) {
  return value.length > max ? value.slice(0, max - 1) + "…" : value;
}

function formatDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function LoadingState() {
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-[1.5rem] border bg-muted/30" />)}</div><div className="h-24 animate-pulse rounded-[2rem] border bg-muted/30" /><div className="grid gap-6"><div className="h-80 animate-pulse rounded-[2rem] border bg-muted/30" /><div className="h-80 animate-pulse rounded-[2rem] border bg-muted/30" /></div></div>;
}

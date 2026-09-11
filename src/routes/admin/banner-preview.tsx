import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, ImageIcon, ExternalLink, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSettings } from "@/lib/admin-settings.functions";

export const Route = createFileRoute("/admin/banner-preview")({ component: BannerPreviewPage });

type Banner = Record<string, unknown>;

function BannerPreviewPage() {
  const getSettings = useServerFn(getAdminSettings);
  const query = useQuery({ queryKey: ["admin-banner-preview"], queryFn: () => getSettings({ data: undefined }) });
  const source = query.data?.find((item) => item.key === "banners");
  const banners = (source?.rows ?? []) as Banner[];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 lg:p-8">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Badge variant="outline" className="mb-3 gap-2 text-[10px] font-black uppercase tracking-widest text-primary"><Eye className="h-3 w-3" /> Owner Only</Badge>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Banner <span className="text-primary">Studio</span></h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Pré-visualização dos banners reais usados pela vitrine. Nenhum conteúdo fictício é criado aqui.</p>
        </div>
        <Button variant="outline" className="gap-2 rounded-xl" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /> Atualizar</Button>
      </header>

      {query.isError ? (
        <Card className="rounded-3xl border-destructive/30"><CardContent className="py-12 text-center text-sm text-destructive">Falha ao carregar banners: {query.error.message}</CardContent></Card>
      ) : query.isLoading ? (
        <Card className="rounded-3xl"><CardContent className="py-16 text-center text-sm text-muted-foreground">Carregando banners reais…</CardContent></Card>
      ) : !source?.available ? (
        <Card className="rounded-3xl"><CardContent className="py-16 text-center text-sm text-destructive">A fonte de banners está indisponível: {source?.error ?? "não encontrada"}</CardContent></Card>
      ) : banners.length === 0 ? (
        <Card className="rounded-3xl border-dashed"><CardContent className="py-16 text-center"><ImageIcon className="mx-auto mb-4 h-10 w-10 text-muted-foreground" /><p className="font-bold">Nenhum banner cadastrado</p><p className="mt-1 text-sm text-muted-foreground">O estúdio não cria banners automaticamente. Cadastre um banner na configuração avançada para visualizá-lo aqui.</p><Button asChild variant="outline" className="mt-5 rounded-xl"><Link to="/admin/settings">Abrir configurações</Link></Button></CardContent></Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {banners.map((banner) => {
            const imageUrl = String(banner.image_url ?? "");
            const title = String(banner.title ?? "Sem título");
            const linkUrl = banner.link_url ? String(banner.link_url) : null;
            const active = Boolean(banner.is_active);
            return (
              <Card key={String(banner.id)} className="overflow-hidden rounded-[2rem]">
                <div className="relative aspect-[16/7] overflow-hidden bg-muted">
                  {imageUrl ? <img src={imageUrl} alt={title} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem imagem</div>}
                  <div className="absolute left-4 top-4"><Badge variant={active ? "default" : "secondary"}>{active ? "Ativo" : "Inativo"}</Badge></div>
                </div>
                <CardHeader className="pb-3"><CardTitle className="text-lg font-black">{title}</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <Meta label="Posição" value={String(banner.position ?? 0)} />
                    <Meta label="ID" value={String(banner.id).slice(0, 8)} />
                    <Meta label="Início" value={formatDate(banner.starts_at)} />
                    <Meta label="Fim" value={formatDate(banner.ends_at)} />
                  </div>
                  {linkUrl && <Button asChild variant="outline" className="w-full gap-2 rounded-xl"><a href={linkUrl}><ExternalLink className="h-4 w-4" /> Abrir destino</a></Button>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border p-3"><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-1 truncate font-semibold">{value}</p></div>;
}

function formatDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("pt-BR");
}

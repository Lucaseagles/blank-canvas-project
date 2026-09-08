import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, ExternalLink, RefreshCw, Eye, MousePointerClick, Package, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getSellerPerformance, setSellerProductStatus } from "@/lib/seller-center.functions";

export const Route = createFileRoute("/admin/seller-center")({ component: SellerCenterPage });

function SellerCenterPage() {
  const queryClient = useQueryClient();
  const getPerformance = useServerFn(getSellerPerformance);
  const setStatus = useServerFn(setSellerProductStatus);
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["seller-center-performance", 30], queryFn: () => getPerformance({ data: { days: 30 } }) });
  const statusMutation = useMutation({ mutationFn: (data: { id: string; status: "draft" | "published" | "archived" | "active" }) => setStatus({ data }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["seller-center-performance"] }); toast.success("Status do produto atualizado"); }, onError: (error: Error) => toast.error(error.message) });

  const summary = data?.summary;
  return <main className="container mx-auto max-w-7xl space-y-7 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div><Badge className="bg-primary/10 text-primary border-primary/20">Seller / Creator Center</Badge><h1 className="mt-2 text-4xl font-black italic uppercase tracking-tighter sm:text-6xl">Performance</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Visão operacional baseada em produtos reais e eventos reais dos últimos 30 dias. A plataforma encaminha o usuário para o marketplace pelo link de afiliado.</p></div>
      <Button variant="outline" onClick={() => refetch()} disabled={isLoading} className="min-h-11 rounded-xl"><RefreshCw className={isLoading ? "mr-2 animate-spin" : "mr-2"} /> Atualizar</Button>
    </header>

    {isError && <Card className="border-destructive/30 bg-destructive/5"><CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-bold">Não foi possível carregar a performance real.</p><Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button></CardContent></Card>}

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      <Metric icon={Package} label="Produtos" value={summary?.products ?? 0} />
      <Metric icon={TrendingUp} label="Publicados" value={summary?.published ?? 0} />
      <Metric icon={ExternalLink} label="Links afiliados" value={summary?.linkedProducts ?? 0} />
      <Metric icon={Eye} label="Visualizações" value={summary?.totalViews ?? 0} />
      <Metric icon={MousePointerClick} label="Cliques" value={summary?.totalClicks ?? 0} />
      <Metric icon={BarChart3} label="CTR" value={`${(summary?.ctr ?? 0).toFixed(2)}%`} />
    </section>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <Card className="overflow-hidden rounded-[2rem] border-glass-border bg-glass-fallback">
        <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Performance por produto</CardTitle></CardHeader>
        <CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Categoria</TableHead><TableHead>Views</TableHead><TableHead>Cliques</TableHead><TableHead>CTR</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell colSpan={7} className="h-32 text-center">Carregando dados reais...</TableCell></TableRow> : data?.products.length ? data.products.map((product) => <TableRow key={product.id}><TableCell><div className="flex min-w-[220px] items-center gap-3">{Array.isArray(product.images) && typeof product.images[0] === "string" ? <img src={product.images[0] as string} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-muted" />}<div><p className="max-w-[260px] truncate font-bold">{product.title}</p><p className="text-[10px] text-muted-foreground">Score {Number(product.offer_score ?? 0).toFixed(1)}</p></div></div></TableCell><TableCell className="text-xs">{product.category_name}</TableCell><TableCell>{product.views}</TableCell><TableCell>{product.clicks}</TableCell><TableCell><Badge variant="outline">{product.ctr.toFixed(2)}%</Badge></TableCell><TableCell><Badge variant={product.status === "published" || product.status === "active" ? "default" : "secondary"}>{product.status}</Badge></TableCell><TableCell className="text-right">{product.affiliate_url && <Button variant="ghost" size="icon" asChild><a href={product.affiliate_url} target="_blank" rel="noreferrer" aria-label={`Abrir oferta de ${product.title}`}><ExternalLink /></a></Button>}<Button size="sm" variant="outline" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: product.id, status: product.status === "published" ? "draft" : "published" })}>{product.status === "published" ? "Despublicar" : "Publicar"}</Button></TableCell></TableRow>) : <TableRow><TableCell colSpan={7} className="h-32 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</TableCell></TableRow>}</TableBody></Table></div></CardContent>
      </Card>

      <Card className="rounded-[2rem] border-glass-border bg-glass-fallback"><CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Categorias</CardTitle></CardHeader><CardContent className="space-y-3">{data?.categories.length ? data.categories.slice(0, 10).map((category) => <div key={category.id} className="rounded-2xl border border-glass-border p-4"><div className="flex items-center justify-between gap-3"><p className="truncate text-xs font-black uppercase">{category.name}</p><Badge variant="outline">{category.products}</Badge></div><div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>{category.views} views</span><span>{category.clicks} cliques</span></div></div>) : <p className="py-8 text-center text-sm text-muted-foreground">Sem dados de categoria no período.</p>}</CardContent></Card>
    </div>

    <Card className="rounded-[2rem] border-primary/20 bg-primary/5"><CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">🔥 Produtos em alta</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{data?.trending.length ? data.trending.slice(0, 10).map((product, index) => <div key={product.id} className="rounded-2xl border border-glass-border bg-background/30 p-4"><p className="text-[10px] font-black text-primary">#{index + 1}</p><p className="mt-1 line-clamp-2 text-xs font-bold">{product.title}</p><p className="mt-2 text-[10px] text-muted-foreground">{product.views} views · {product.clicks} cliques</p></div>) : <p className="text-sm text-muted-foreground">Nenhum produto em alta no período.</p>}</CardContent></Card>
  </main>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: number | string }) {
  return <Card className="rounded-2xl border-glass-border bg-glass-fallback"><CardContent className="p-4"><Icon className="mb-3 h-4 w-4 text-primary" /><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black">{typeof value === "number" ? value.toLocaleString("pt-BR") : value}</p></CardContent></Card>;
}

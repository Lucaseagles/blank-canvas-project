import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "Histórico de navegação" }, { name: "description", content: "Revise os produtos que você descobriu recentemente." }] }),
  component: HistoryPage,
});

async function getHistory() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [] as any[];
  const { data, error } = await supabase
    .from("browsing_history")
    .select("id, product_id, viewed_at, duration_seconds, device_type, products(*)")
    .eq("user_id", auth.user.id)
    .order("viewed_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return ((data || []) as any[]).map((item) => ({ ...item, product: item.products })).filter((item) => item.product);
}

function HistoryPage() {
  const queryClient = useQueryClient();
  const history = useQuery({ queryKey: ["browsing-history", 100], queryFn: getHistory, staleTime: 30_000 });

  const remove = async (id: string) => {
    const { error } = await supabase.from("browsing_history").delete().eq("id", id);
    if (!error) await queryClient.invalidateQueries({ queryKey: ["browsing-history"] });
  };

  const clear = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("browsing_history").delete().eq("user_id", auth.user.id);
    if (!error) await queryClient.invalidateQueries({ queryKey: ["browsing-history"] });
  };

  if (history.isLoading) return <div className="container mx-auto max-w-7xl px-4 py-16"><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}</div></div>;
  if (history.error) return <div className="container mx-auto max-w-3xl px-4 py-20 text-center"><p className="text-muted-foreground">Não foi possível carregar seu histórico.</p><Button className="mt-6" onClick={() => void history.refetch()}>Tentar novamente</Button></div>;

  const items = history.data || [];
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12 md:py-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-3"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button>
          <div className="flex items-center gap-2 text-primary"><Clock3 className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Navegação</span></div>
          <h1 className="mt-2 text-4xl font-black uppercase italic tracking-tight md:text-6xl">Meu histórico</h1>
        </div>
        {items.length > 0 && <Button variant="outline" onClick={() => void clear()}><Trash2 className="mr-2 h-4 w-4" />Limpar histórico</Button>}
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed border-white/10 bg-white/5 p-16 text-center"><Clock3 className="mx-auto mb-5 h-12 w-12 text-muted-foreground/40" /><h2 className="text-xl font-black uppercase">Seu histórico está vazio</h2><p className="mt-2 text-muted-foreground">Abra alguns produtos e eles aparecerão aqui.</p><Button asChild className="mt-6"><Link to="/feed">Explorar ofertas</Link></Button></Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <Card key={item.id} className="group relative overflow-hidden border-white/10 bg-white/5">
              <Link to="/product/$slug" params={{ slug: item.product.slug }} className="block">
                <img src={item.product.images?.[0] || item.product.image || ""} alt={item.product.title} className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
                <div className="p-4"><p className="line-clamp-2 text-sm font-bold">{item.product.title}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(item.viewed_at).toLocaleString("pt-BR")}</p></div>
              </Link>
              <Button variant="secondary" size="icon" onClick={() => void remove(item.id)} className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background/80 shadow-lg backdrop-blur" aria-label={`Remover ${item.product.title} do histórico`}><Trash2 className="h-3.5 w-3.5" /></Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

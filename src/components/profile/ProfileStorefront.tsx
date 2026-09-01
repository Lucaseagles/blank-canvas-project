import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingBag, Star, ExternalLink, Package, Activity, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProductRow {
  id: string;
  title: string;
  description: string | null;
  images: string[] | null;
  current_price: number | null;
  rating: number | null;
  review_count: number | null;
  status: string | null;
  affiliate_url: string | null;
  marketplaces?: { name: string | null } | null;
}

function productImage(images: string[] | null) {
  return Array.isArray(images) && images.length > 0 ? images[0] : null;
}

export function ProfileStorefront({ userId }: { userId: string }) {
  const { data: favorites = [], isLoading: favoritesLoading } = useQuery({
    queryKey: ["profile-favorites", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("product_id, created_at, products(id,title,description,images,current_price,rating,review_count,status,affiliate_url,marketplaces(name))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{ product_id: string; created_at: string; products: ProductRow | null }>;
    },
    enabled: !!userId,
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["profile-activity", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("id,event_type,event_name,created_at,product_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  const favoriteProducts = favorites.map((row) => row.products).filter(Boolean) as ProductRow[];
  const uniqueProducts = favoriteProducts.filter((product, index, list) => list.findIndex((item) => item.id === product.id) === index);

  return (
    <div className="space-y-6">
      <Card className="border-glass-border bg-glass backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
        <CardHeader className="p-6 sm:p-8 pb-3">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-black italic uppercase tracking-tighter">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Sua Loja & Descobertas
          </CardTitle>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
            Produtos salvos, avaliações reais e sinais da sua atividade
          </p>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 pt-3">
          {favoritesLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((item) => <div key={item} className="h-56 rounded-2xl bg-muted/30 animate-pulse" />)}
            </div>
          ) : uniqueProducts.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border border-dashed border-glass-border bg-white/[0.02]">
              <Heart className="w-8 h-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-bold">Nenhum produto salvo ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Seus favoritos aparecerão aqui automaticamente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {uniqueProducts.slice(0, 6).map((product) => {
                const image = productImage(product.images);
                const rating = Number(product.rating ?? 0);
                const reviews = Number(product.review_count ?? 0);
                return (
                  <article key={product.id} className="group overflow-hidden rounded-2xl border border-glass-border bg-background/40 transition-all hover:-translate-y-1 hover:shadow-xl">
                    <a href={`/product/${product.id}`} className="block">
                      <div className="aspect-square bg-muted/20 overflow-hidden">
                        {image ? (
                          <img src={image} alt={product.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground/40"><Package className="w-10 h-10" /></div>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold line-clamp-2">{product.title}</h3>
                          <Badge variant="outline" className="shrink-0 text-[9px] uppercase">{product.status || "active"}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="text-xs font-bold">{rating > 0 ? rating.toFixed(1) : "—"}</span>
                          <span className="text-[10px] text-muted-foreground">({reviews})</span>
                        </div>
                        <div className="flex items-end justify-between gap-2">
                          <span className="text-base font-black">{product.current_price != null ? `R$ ${Number(product.current_price).toFixed(2)}` : "Preço indisponível"}</span>
                          <Button size="sm" variant="secondary" className="h-8 rounded-lg text-[10px] font-bold uppercase">Ver</Button>
                        </div>
                      </div>
                    </a>
                    {product.affiliate_url && (
                      <div className="px-3 pb-3">
                        <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">
                          Abrir marketplace <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-glass-border bg-glass backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
        <CardHeader className="p-6 sm:p-8 pb-3">
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-black italic uppercase tracking-tighter">
            <Activity className="w-5 h-5 text-primary" />
            Atividade recente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 pt-3">
          {activity.length === 0 ? (
            <p className="py-8 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Nenhuma atividade registrada</p>
          ) : (
            <div className="space-y-2">
              {activity.map((event: any) => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Eye className="w-4 h-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{event.event_name || event.event_type || "Atividade"}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(event.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

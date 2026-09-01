import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Clock3, Trash2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductCard } from "@/components/product/ProductCard";
import { useEffect, useState } from "react";

export type BrowsingHistoryItem = {
  id: string;
  product_id: string;
  viewed_at: string;
  duration_seconds: number;
  device_type: string | null;
  product: any;
};

async function getBrowsingHistory(limit = 8) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [] as BrowsingHistoryItem[];
  const { data, error } = await supabase
    .from("browsing_history")
    .select("id, product_id, viewed_at, duration_seconds, device_type, products(*)")
    .eq("user_id", auth.user.id)
    .order("viewed_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data || []) as any[])
    .map((item) => ({ ...item, product: item.products }))
    .filter((item) => item.product);
}

function toCardProduct(product: any) {
  return {
    id: product.id,
    slug: product.slug || "",
    categoryId: product.category_id,
    title: product.title,
    price: product.current_price ?? product.price ?? 0,
    previousPrice: product.previous_price,
    discount: product.discount,
    image: product.images?.[0] || product.image || "",
    marketplace: product.marketplace || "Marketplace",
    rating: product.rating,
    reviewCount: product.review_count,
    affiliateUrl: product.affiliate_url || null,
    hasVideo: Boolean(product.has_video),
    isBestOffer: product.is_best_offer,
    offerScore: product.offer_score,
  };
}

export function ContinueBrowsing({ limit = 8, compact = false }: { limit?: number; compact?: boolean }) {
  const queryClient = useQueryClient();
  const [visible, setVisible] = useState(true);
  const historyQuery = useQuery({
    queryKey: ["browsing-history", limit],
    queryFn: () => getBrowsingHistory(limit),
    staleTime: 30_000,
  });

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active && !data.user) setVisible(false);
    });
    return () => { active = false; };
  }, []);

  const items = historyQuery.data || [];
  if (!visible || historyQuery.isLoading || !items.length) return null;

  const removeItem = async (id: string) => {
    const { error } = await supabase.from("browsing_history").delete().eq("id", id);
    if (!error) await queryClient.invalidateQueries({ queryKey: ["browsing-history"] });
  };

  const clearAll = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("browsing_history").delete().eq("user_id", auth.user.id);
    if (!error) await queryClient.invalidateQueries({ queryKey: ["browsing-history"] });
  };

  return (
    <section className={compact ? "py-8" : "py-16"} aria-labelledby="continue-browsing-title">
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <Clock3 className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Seu histórico</span>
            </div>
            <h2 id="continue-browsing-title" className="text-3xl font-black uppercase italic tracking-tight md:text-5xl">Continue de onde parou</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="font-black uppercase tracking-widest text-[10px]">
              <Link to="/history">Ver histórico <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void clearAll()} className="text-muted-foreground hover:text-destructive" aria-label="Limpar histórico">
              <Trash2 className="mr-2 h-4 w-4" /> Limpar
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <div key={item.id} className="relative min-w-0">
              <ProductCard {...toCardProduct(item.product)} />
              <Button variant="secondary" size="icon" onClick={() => void removeItem(item.id)} className="absolute right-2 top-2 z-20 h-8 w-8 rounded-full bg-background/80 shadow-lg backdrop-blur" aria-label={`Remover ${item.product.title} do histórico`}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BrowsingHistoryCard({ item }: { item: BrowsingHistoryItem }) {
  return (
    <Card className="overflow-hidden border-white/10 bg-white/5">
      <Link to="/product/$slug" params={{ slug: item.product.slug }} className="block">
        <img src={item.product.images?.[0] || item.product.image || ""} alt={item.product.title} className="aspect-square w-full object-cover" loading="lazy" />
        <div className="p-4"><p className="line-clamp-2 text-sm font-bold">{item.product.title}</p></div>
      </Link>
    </Card>
  );
}

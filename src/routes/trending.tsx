import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp } from "lucide-react";
import { CustomBreadcrumbs } from "@/components/layout/Breadcrumbs";

export const Route = createFileRoute("/trending")({
  head: () => ({
    meta: [
      { title: "Em Alta — Produtos Mais Buscados" },
      { name: "description", content: "Descubra os produtos com maior engajamento e crescimento de interesse agora." },
      { property: "og:title", content: "Em Alta — Produtos Mais Buscados" },
      { property: "og:description", content: "Descubra os produtos com maior engajamento e crescimento de interesse agora." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TrendingPage,
});

function TrendingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["trending"],
    queryFn: async () => {
      // 72h proxy for trending
      const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
      
      const { data: analytics, error: analyticsError } = await supabase
        .from("analytics_events")
        .select("metadata")
        .in("event_type", ["PRODUCT_VIEW", "PRODUCT_CLICK", "ADD_FAVORITE"])
        .gte("created_at", seventyTwoHoursAgo);
      
      if (analyticsError) throw analyticsError;

      const counts: Record<string, number> = {};
      analytics.forEach(a => {
        const pId = (a.metadata as any)?.product_id;
        if (pId) counts[pId] = (counts[pId] || 0) + 1;
      });

      const topIds = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(e => e[0]);

      if (topIds.length === 0) {
        // Fallback to most viewed ever if no recent events
        const { data: fallback, error: fallbackError } = await supabase
          .from("products")
          .select("*, marketplaces(name), video_products(id)")

          .order("rating", { ascending: false })
          .limit(12);
        if (fallbackError) throw fallbackError;
        return (fallback as any[]).map(p => ({
          id: p.id,
          slug: p.slug,
          categoryId: p.category_id,
          title: p.title,
          price: p.current_price,
          previousPrice: p.previous_price,
          discount: p.discount,
          image: p.images?.[0] || "",
          marketplace: (p.marketplaces as any)?.name || "External",
          rating: p.rating,
          reviewCount: p.review_count,
          affiliateUrl: p.affiliate_url || null,
          hasVideo: p.video_products && p.video_products.length > 0,
          isBestOffer: p.is_best_offer,
          offerScore: p.offer_score
        }));

      }

      const { data: products, error } = await supabase
        .from("products")
        .select("*, marketplaces(name), video_products(id)")

        .in("id", topIds);

      if (error) throw error;
      
      return (products as any[]).map(p => ({
        id: p.id,
        slug: p.slug,
        categoryId: p.category_id,
        title: p.title,
        price: p.current_price,
        previousPrice: p.previous_price,
        discount: p.discount,
        image: p.images?.[0] || "",
        marketplace: (p.marketplaces as any)?.name || "External",
        rating: p.rating,
        reviewCount: p.review_count,
        affiliateUrl: p.affiliate_url || null,
        hasVideo: p.video_products && p.video_products.length > 0,
        isBestOffer: p.is_best_offer,
        offerScore: p.offer_score
      }));

    },
  });

  return (
    <div className="container mx-auto py-20 px-4 max-w-7xl reveal-on-scroll">
      <CustomBreadcrumbs items={[{ label: 'Trending', to: '/trending' }]} />
      <div className="mb-16 space-y-4">
        <Badge variant="outline" className="px-5 py-2 rounded-full border-primary/30 bg-primary/5 text-primary glass-surface mb-4">
          <TrendingUp className="w-3.5 h-3.5 mr-2" />
          SINAIS DE ALTA VELOCIDADE - TRENDING
        </Badge>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none">Tendências</h1>
        <p className="text-xl text-muted-foreground font-medium tracking-tight border-l-2 border-primary/20 pl-6 max-w-2xl">
          Produtos com maior engajamento nas últimas 72h. Síntese de dados em tempo real a partir de interações globais de usuários.
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? [...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-[2.5rem]" />) 
          : data?.map((p) => <ProductCard key={p.id} {...p} />)}
      </div>
    </div>
  );
}
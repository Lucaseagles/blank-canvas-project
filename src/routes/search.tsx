import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/product/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, Sparkles } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CustomBreadcrumbs } from "@/components/layout/Breadcrumbs";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Busca de Produtos e Ofertas" },
      { name: "description", content: "Encontre produtos por nome, categoria ou marketplace com resultados em tempo real." },
      { property: "og:title", content: "Busca de Produtos e Ofertas" },
      { property: "og:description", content: "Encontre produtos por nome, categoria ou marketplace com resultados em tempo real." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search['q'] as string) || "",
    };
  },
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const [query, setQuery] = useState(search['q'] || "");
  const [activeQuery, setActiveQuery] = useState(search['q'] || "");

  const { data: products, isLoading } = useQuery<any[]>({
    queryKey: ["search", activeQuery],
    queryFn: async () => {
      if (!activeQuery) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*, marketplaces(name), video_products(id)")
        .ilike("title", `%${activeQuery}%`)
        .limit(20);
      
      if (error) throw error;
      
      return data.map(p => ({
        id: p.id,
        slug: (p as any).slug || "",
        title: p.title,
        price: p.current_price,
        previousPrice: p.previous_price,
        discount: p.discount,
        image: p.images?.[0] || "",
        marketplace: (p.marketplaces as any)?.name || "External",
        rating: p.rating,
        reviewCount: p.review_count,
        affiliateUrl: p.affiliate_url || null,
        hasVideo: p.video_products && p.video_products.length > 0
      }));
    },
    enabled: activeQuery.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(query);
  };

  return (
    <div className="container mx-auto py-20 px-4 max-w-7xl reveal-on-scroll">
      <CustomBreadcrumbs items={[{ label: 'Search', to: '/search' }]} />
      <div className="max-w-3xl mx-auto mb-16 text-center space-y-8">
        <Badge variant="outline" className="px-5 py-2 rounded-full border-primary/30 bg-primary/5 text-primary glass-surface">
          <Sparkles className="w-3.5 h-3.5 mr-2" />
          Neural Discovery Engine
        </Badge>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none">Busca Global</h1>
        <form onSubmit={handleSearch} className="relative flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por produtos, marcas ou categorias..." 
              className="h-16 pl-14 pr-6 rounded-2xl bg-white/5 border-glass-border focus:border-primary/50 focus:ring-primary/20 text-xl font-medium shadow-2xl transition-all"
            />
          </div>
          <Button type="submit" size="lg" className="h-16 px-10 rounded-2xl font-black italic uppercase tracking-tight shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
            Buscar
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : products?.length ? (
        <div className="space-y-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-bold text-foreground">{products?.length || 0}</span> resultados encontrados para "{activeQuery}"
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                id={product.id}
                slug={product.slug}
                title={product.title}
                price={product.price}
                previousPrice={product.previousPrice}
                discount={product.discount}
                image={product.image}
                marketplace={product.marketplace}
                rating={product.rating}
                reviewCount={product.reviewCount}
                affiliateUrl={product.affiliateUrl ?? null}
              />
            ))}
          </div>
        </div>
      ) : activeQuery ? (
        <div className="text-center py-24 bg-muted/20 rounded-3xl border border-dashed border-muted-foreground/20">
          <p className="text-muted-foreground">Nenhum resultado encontrado para "{activeQuery}". Tente palavras-chave diferentes.</p>
        </div>
      ) : (
        <div className="text-center py-24 opacity-40">
          <SearchIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl font-medium">Insira um termo de busca para descobrir ofertas.</p>
        </div>
      )}
    </div>
  );
}

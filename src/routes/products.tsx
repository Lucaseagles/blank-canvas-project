import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/product/ProductCard';

export const Route = createFileRoute('/products')({
  head: () => ({
    meta: [
      { title: "Catálogo de Produtos — Busca Inteligente" },
      { name: "description", content: "Explore o catálogo completo com filtros, avaliações e comparação de melhores ofertas." },
      { property: "og:title", content: "Catálogo de Produtos — Busca Inteligente" },
      { property: "og:description", content: "Explore o catálogo completo com filtros, avaliações e comparação de melhores ofertas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, marketplaces(name), video_products(id)')
        .eq('status', 'active');
      
      if (error) throw error;
      
      return (data as any[]).map(p => ({
        id: p.id,
        slug: p.slug,
        categoryId: p.category_id,
        title: p.title,
        price: p.current_price,
        previousPrice: p.previous_price,
        discount: p.discount,
        image: p.images?.[0] || '',
        marketplace: (p.marketplaces as any)?.name || 'External',
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
      <div className="mb-16 space-y-4">
        <Badge variant="outline" className="px-5 py-2 rounded-full border-primary/30 bg-primary/5 text-primary glass-surface mb-4">
          <Sparkles className="w-3.5 h-3.5 mr-2" />
          REGISTRO GLOBAL
        </Badge>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none">Catálogo</h1>
      </div>

      <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-xl border-y border-glass-border p-4 mb-12 -mx-4">
        <div className="max-w-7xl mx-auto flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
          <Link to="/products" className="px-4 min-h-[44px] inline-flex items-center bg-primary text-primary-foreground font-black uppercase rounded-lg text-sm">Tudo</Link>
          <Link to="/deals" className="px-4 min-h-[44px] inline-flex items-center hover:bg-primary/5 font-black uppercase rounded-lg text-sm">Ofertas</Link>
          <Link to="/trending" className="px-4 min-h-[44px] inline-flex items-center hover:bg-primary/5 font-black uppercase rounded-lg text-sm">Tendências</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading 
          ? [...Array(12)].map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-[2rem]" />)
          : data?.map((p) => <ProductCard key={p.id} {...p} />)
        }
      </div>
    </div>
  );
}

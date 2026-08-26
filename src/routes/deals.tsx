import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, ArrowRight, Tag } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/deals')({
  head: () => ({
    meta: [
      { title: "Ofertas do Dia — Maiores Descontos" },
      { name: "description", content: "Veja as maiores quedas de preço e promoções relâmpago selecionadas em vários marketplaces." },
      { property: "og:title", content: "Ofertas do Dia — Maiores Descontos" },
      { property: "og:description", content: "Veja as maiores quedas de preço e promoções relâmpago selecionadas em vários marketplaces." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DealsPage,
});

function DealsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, marketplaces(name), video_products(id)')

        .eq('status', 'active')
        .gt('discount', 0)
        .order('discount', { ascending: false });
      
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
          <Tag className="w-3.5 h-3.5 mr-2" />
          VIGILÂNCIA ATIVA
        </Badge>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none">Ofertas</h1>
        <p className="text-xl text-muted-foreground font-medium tracking-tight border-l-2 border-primary/20 pl-6 max-w-2xl">
          Descontos de alta fidelidade mapeados em tempo real. Inteligência de marketplace verificada.
        </p>
      </div>

      <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-xl border-y border-glass-border p-4 mb-12 -mx-4">
        <div className="max-w-7xl mx-auto flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
          <Badge variant="outline" className="bg-primary text-primary-foreground font-black uppercase border-transparent">Todas as Ofertas</Badge>
          <Badge variant="outline" className="hover:bg-primary/5 font-black uppercase border-transparent">Ofertas Relâmpago</Badge>
          <Badge variant="outline" className="hover:bg-primary/5 font-black uppercase border-transparent">Maiores Descontos</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading 
          ? [...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-[2rem]" />)
          : data?.map((p) => <ProductCard key={p.id} {...p} />)
        }
      </div>
    </div>
  );
}

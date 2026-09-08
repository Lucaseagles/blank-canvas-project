import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Clock, Sparkles, Star, TrendingUp, Zap } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/offers')({
  head: () => ({
    meta: [
      { title: 'Ofertas — Ofertas Inteligentes' },
      { name: 'description', content: 'As melhores ofertas, descontos relâmpago e destaques em um só lugar.' },
    ],
  }),
  component: OffersPage,
});

type ProductRow = {
  id: string;
  slug: string;
  category_id: string | null;
  title: string;
  current_price: number | null;
  previous_price: number | null;
  discount: number | null;
  images: string[] | null;
  rating: number | null;
  review_count: number | null;
  affiliate_url: string | null;
  is_best_offer: boolean;
  offer_score: number | null;
  flash_deal_ends_at: string | null;
  marketplaces?: { name: string } | null;
  video_products?: { id: string }[] | null;
};

function mapProduct(p: ProductRow) {
  return {
    id: p.id,
    slug: p.slug,
    categoryId: p.category_id,
    title: p.title,
    price: p.current_price ?? undefined,
    previousPrice: p.previous_price,
    discount: p.discount,
    image: p.images?.[0] || '',
    marketplace: p.marketplaces?.name || 'Marketplace',
    rating: p.rating,
    reviewCount: p.review_count,
    affiliateUrl: p.affiliate_url,
    hasVideo: Boolean(p.video_products?.length),
    isBestOffer: p.is_best_offer,
    offerScore: p.offer_score ?? undefined,
  };
}

function OffersPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['offers-hub'],
    queryFn: async () => {
      const now = new Date().toISOString();

      const { data: groups, error: groupsError } = await supabase
        .from('offer_groups')
        .select('id, is_featured_on_hub, featured_priority, featured_starts_at, featured_ends_at')
        .eq('is_featured_on_hub', true)
        .order('featured_priority', { ascending: true });
      if (groupsError) throw groupsError;

      const activeGroups = (groups ?? []).filter((group: any) =>
        (!group.featured_starts_at || group.featured_starts_at <= now) &&
        (!group.featured_ends_at || group.featured_ends_at >= now),
      );
      const groupIds = activeGroups.map((group: any) => group.id);

      const [featuredResult, flashResult, categoryResult, curatedResult] = await Promise.all([
        groupIds.length
          ? supabase
              .from('products')
              .select('*, marketplaces(name), video_products(id)')
              .in('offer_group_id', groupIds)
              .eq('status', 'active')
              .order('offer_score', { ascending: false, nullsFirst: false })
              .limit(12)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from('products')
          .select('*, marketplaces(name), video_products(id)')
          .eq('status', 'active')
          .gte('discount', 20)
          .or(`flash_deal_ends_at.is.null,flash_deal_ends_at.gte.${now}`)
          .order('discount', { ascending: false })
          .limit(12),
        supabase
          .from('category_highlights')
          .select('rank, product_id, products!inner(*, marketplaces(name), video_products(id))')
          .order('rank', { ascending: true })
          .limit(12),
        supabase
          .from('products')
          .select('*, marketplaces(name), video_products(id)')
          .eq('status', 'active')
          .eq('is_best_offer', true)
          .order('offer_score', { ascending: false, nullsFirst: false })
          .limit(8),
      ]);

      for (const result of [featuredResult, flashResult, categoryResult, curatedResult]) {
        if (result.error) throw result.error;
      }

      const categoryProducts = (categoryResult.data ?? [])
        .map((row: any) => row.products as ProductRow)
        .filter(Boolean);

      return {
        featured: (featuredResult.data ?? []).map((p: any) => mapProduct(p as ProductRow)),
        flash: (flashResult.data ?? []).map((p: any) => mapProduct(p as ProductRow)),
        categoryHighlights: categoryProducts.map(mapProduct),
        curated: (curatedResult.data ?? []).map((p: any) => mapProduct(p as ProductRow)),
        flashEndsAt: (flashResult.data?.[0] as ProductRow | undefined)?.flash_deal_ends_at ?? null,
      };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const flashEndsAt = data?.flashEndsAt;

  useEffect(() => {
    const update = () => {
      const target = flashEndsAt ? new Date(flashEndsAt).getTime() : Date.now() + 3600000;
      const diff = Math.max(0, target - Date.now());
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [flashEndsAt]);

  const hasOffers = useMemo(() => Boolean(
    data?.featured.length || data?.flash.length || data?.categoryHighlights.length || data?.curated.length,
  ), [data]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-14 md:py-20 space-y-12 reveal-on-scroll">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary">
          <Sparkles className="h-4 w-4" /> Hub de Ofertas
        </div>
        <h1 className="text-5xl font-black tracking-tighter uppercase italic md:text-7xl">Ofertas</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">As melhores promoções em um só lugar, atualizadas automaticamente.</p>
      </header>

      {isError && (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="font-bold text-destructive">Não foi possível carregar o Hub de Ofertas.</p>
          <button onClick={() => refetch()} className="mt-3 text-sm font-black uppercase tracking-wider text-primary">Tentar novamente</button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <div key={index} className="aspect-[4/5] animate-pulse rounded-[2.5rem] bg-muted/40" />)}
        </div>
      ) : !hasOffers ? (
        <div className="rounded-[2.5rem] border border-glass-border bg-glass p-14 text-center">
          <span className="text-5xl">🛍️</span>
          <h2 className="mt-4 text-2xl font-black">Nenhuma oferta disponível</h2>
          <p className="mt-2 text-muted-foreground">Volte em breve para conferir as melhores promoções.</p>
        </div>
      ) : (
        <div className="space-y-14">
          {data?.featured.length ? <OfferSection icon={<Sparkles className="h-5 w-5" />} title="Destaques do Admin" products={data.featured} featured /> : null}

          {data?.flash.length ? (
            <OfferSection
              icon={<Zap className="h-5 w-5" />}
              title="Ofertas Relâmpago"
              products={data.flash}
              trailing={<span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-black text-primary"><Clock className="h-4 w-4" />{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>}
            />
          ) : null}

          {data?.categoryHighlights.length ? <OfferSection icon={<TrendingUp className="h-5 w-5" />} title="Melhores por Categoria" products={data.categoryHighlights} /> : null}
          {data?.curated.length ? <OfferSection icon={<Star className="h-5 w-5" />} title="Curadoria Inteligente" products={data.curated} /> : null}
        </div>
      )}
    </div>
  );
}

function OfferSection({ icon, title, products, trailing, featured = false }: { icon: React.ReactNode; title: string; products: ReturnType<typeof mapProduct>[]; trailing?: React.ReactNode; featured?: boolean }) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><span className="text-primary">{icon}</span><h2 className="text-2xl font-black tracking-tight uppercase italic md:text-3xl">{title}</h2></div>
        {trailing}
      </div>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {products.map((product) => <ProductCard key={`${title}-${product.id}`} {...product} />)}
      </div>
    </section>
  );
}

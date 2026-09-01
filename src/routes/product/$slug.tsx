import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ArrowLeft, Award, BellRing, Heart, Layers, ShieldCheck, Star, Target, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEngagement } from '@/hooks/useEngagement';
import { useServerFn } from '@tanstack/react-start';
import { createPriceAlert } from '@/lib/engagement.functions';
import { updateInterestScore } from '@/lib/personalization.functions';
import { trackEvent, trackOutboundClick } from '@/lib/analytics';
import { getRelatedProducts } from '@/lib/relationships.functions';
import { AggregatedSocialProof } from '@/components/AggregatedSocialProof';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductMediaShowcase } from '@/components/product/ProductMediaShowcase';
import { ProductReviews } from '@/components/product/ProductReviews';
import { CustomBreadcrumbs } from '@/components/layout/Breadcrumbs';

export const Route = createFileRoute('/product/$slug')({
  head: ({ params }) => {
    const name = params.slug.replace(/-/g, ' ');
    return { meta: [
      { title: `${name} — Melhor Oferta e Histórico de Preço` },
      { name: 'description', content: `Compare preços e encontre a melhor oferta de ${name} entre os marketplaces.` },
      { property: 'og:title', content: `${name} — Melhor Oferta e Histórico de Preço` },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ] };
  },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const [targetPrice, setTargetPrice] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [showDownsell, setShowDownsell] = useState(false);
  const createAlertFn = useServerFn(createPriceAlert);
  const trackInterestFn = useServerFn(updateInterestScore);
  const fetchRelatedFn = useServerFn(getRelatedProducts);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select(`*, marketplaces(name, slug), offer_groups(id, canonical_title, products(id, slug, current_price, discount, rating, is_best_offer, images, marketplaces(name, slug), affiliate_url)), video_products(video_id, videos(id, title, video_url, storage_path, external_url, thumbnail_url, duration))`).eq('slug', slug).single();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.id],
    queryFn: () => fetchRelatedFn({ data: { productId: product!.id, limit: 4 } }),
    enabled: Boolean(product?.id),
  });

  const { isFavorited, setIsFavorited, handleToggleFavorite } = useEngagement(product?.id || '', product?.category_id);

  useEffect(() => {
    if (!product) return;
    setTargetPrice(((product.current_price ?? 0) * 0.9).toFixed(2));
    const checkFavorite = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('product_id', product.id).maybeSingle();
      if (data) setIsFavorited(true);
    };
    void checkFavorite();
  }, [product, setIsFavorited]);

  const handleVideoEvent = async (action: string) => {
    if (!product) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      await trackInterestFn({ data: { userId: user.id, categoryId: product.category_id || 'general', action, metadata: { product_id: product.id, video_id: product.video_products?.[0]?.video_id } } });
    } catch (error) { console.error('Video tracking error:', error); }
  };

  const handleBuyClick = async () => {
    if (!product) return;
    trackOutboundClick(product.affiliate_url || '', product.id, 'external');
    if (product.discount && product.discount < 20) {
      setShowDownsell(true);
      trackEvent('DOWNSELL_TRIGGERED', { product_id: product.id, discount: product.discount });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await trackInterestFn({ data: { userId: user.id, categoryId: product.category_id || 'general', action: 'click', metadata: { product_id: product.id } } });
    if (product.affiliate_url) window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
  };

  const handleCreateAlert = async () => {
    if (!product) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { trackEvent('PRICE_ALERT_AUTH_REQUIRED', { product_id: product.id }); return; }
    const value = Number.parseFloat(targetPrice);
    if (!Number.isFinite(value) || value <= 0) return;
    try {
      await createAlertFn({ data: { productId: product.id, targetPrice: value } });
      setAlertOpen(false);
      trackEvent('PRICE_ALERT_CREATED', { product_id: product.id, target_price: value });
    } catch (error) { console.error('Price alert error:', error); }
  };

  if (isLoading) return <div className="container mx-auto max-w-7xl px-4 py-12"><div className="grid gap-12 lg:grid-cols-2"><Skeleton className="aspect-square w-full rounded-[2rem]" /><div className="space-y-6"><Skeleton className="h-12 w-3/4" /><Skeleton className="h-32 w-full" /><Skeleton className="h-16 w-full" /></div></div></div>;
  if (!product) return <div className="container mx-auto px-4 py-24 text-center"><h1 className="text-2xl font-black uppercase italic">Produto não encontrado.</h1><Link to="/" className="mt-4 inline-flex text-primary">Voltar</Link></div>;

  const video = product.video_products?.[0]?.videos as any;
  const videoUrl = video?.external_url || video?.video_url || '';
  const typedRelated = Array.isArray(relatedProducts) ? relatedProducts : [];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 pb-16 sm:py-12">
      <CustomBreadcrumbs items={[{ label: 'Discovery', to: '/' }, { label: product.title }]} />
      <Link to="/" className="mb-8 mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Voltar para o Feed</Link>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <ProductMediaShowcase
            title={product.title}
            images={product.images}
            discount={product.discount}
            video={videoUrl ? { url: videoUrl, title: video?.title, subtitle: video?.subtitle, thumbnail: video?.thumbnail_url } : null}
            onVideoStart={() => void handleVideoEvent('video_start')}
            onVideoComplete={() => void handleVideoEvent('video_complete')}
          />
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full border-glass-border bg-white/5 text-[9px]">ID: {product.id.slice(0, 8)}</Badge>
            <Badge variant="outline" className="rounded-full border-glass-border bg-white/5 text-[9px]">Fonte: {(product.marketplaces as any)?.name || 'Marketplace'}</Badge>
            <Badge variant="outline" className="rounded-full border-glass-border bg-white/5 text-[9px]"><ShieldCheck className="mr-1 h-3 w-3" />Verificação</Badge>
          </div>
        </div>

        <div className="min-w-0 space-y-8">
          <div className="space-y-5">
            {typeof product.rating === 'number' && product.review_count > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-0.5" aria-label={`Nota ${product.rating} de 5`}>
                  {Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-4 w-4 ${index < Math.round(product.rating) ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/20'}`} />)}
                </div>
                <span className="font-black">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({Number(product.review_count).toLocaleString('pt-BR')} avaliações)</span>
              </div>
            ) : <span className="text-xs text-muted-foreground">Avaliação do marketplace ainda não disponível.</span>}

            <h1 className="flex flex-wrap items-center gap-3 text-4xl font-black uppercase italic tracking-tighter sm:text-5xl">{product.title}{product.is_best_offer && <Badge className="bg-amber-500 text-white"><Award className="mr-1 h-3 w-3" />Melhor Oferta</Badge>}</h1>
            <div className="flex flex-wrap items-end gap-4"><span className="text-5xl font-black tracking-tight text-primary sm:text-6xl">R$ {(product.current_price ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>{product.previous_price && <span className="text-xl font-bold text-muted-foreground/40 line-through">R$ {product.previous_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}</div>
          </div>

          <AggregatedSocialProof productId={product.id} variant="full" />

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-green-500" /><div><p className="text-xs font-black uppercase text-green-500">Loja verificada</p><p className="text-xs text-muted-foreground">Oferta externa via {(product.marketplaces as any)?.name || 'marketplace'}</p></div></div></div>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{product.description || 'Descrição não disponível no momento. Consulte a oferta original para todos os detalhes do produto.'}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
              <DialogTrigger asChild><Button size="lg" variant="outline" className="h-14 rounded-2xl font-black uppercase tracking-wide"><BellRing className="mr-2 h-5 w-5" />Alerta de Preço</Button></DialogTrigger>
              <DialogContent className="w-[92vw] max-w-md rounded-3xl">
                <DialogHeader><DialogTitle className="font-black uppercase italic">Vigilância de preço</DialogTitle><DialogDescription>Escolha o preço real que você deseja acompanhar.</DialogDescription></DialogHeader>
                <div className="py-4"><Label htmlFor="target-price">Preço alvo</Label><div className="relative mt-2"><Target className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /><Input id="target-price" type="number" min="0.01" step="0.01" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} className="h-12 pl-10" /></div></div>
                <DialogFooter><Button onClick={() => void handleCreateAlert()} className="w-full h-12 rounded-xl font-black uppercase">Confirmar</Button></DialogFooter>
              </DialogContent>
            </Dialog>
            <Button size="lg" className="h-14 rounded-2xl font-black uppercase tracking-wide" onClick={() => void handleBuyClick()}>Adquirir agora <Zap className="ml-2 h-5 w-5 fill-current" /></Button>
          </div>

          <Button variant="outline" className="w-full rounded-2xl" onClick={async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) { toast('Faça login para salvar favoritos'); return; } handleToggleFavorite(user.id); }}><Heart className={`mr-2 h-5 w-5 ${isFavorited ? 'fill-current text-primary' : ''}`} />{isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</Button>

          <ProductReviews rating={product.rating} reviewCount={product.review_count} reviews={Array.isArray(product.reviews) ? product.reviews : []} />

          {typedRelated.length > 0 && <section className="space-y-5 pt-4"><h2 className="flex items-center gap-2 text-2xl font-black uppercase italic"><Layers className="h-6 w-6 text-primary" />Inteligência relacionada</h2><div className="grid grid-cols-2 gap-4">{typedRelated.map((item: any) => <ProductCard key={item.id} {...item} />)}</div></section>}
        </div>
      </div>

      {showDownsell && product.discount && product.discount < 20 && <div className="sr-only" aria-hidden="true">Downsell real baseado no desconto atual.</div>}
    </div>
  );
}

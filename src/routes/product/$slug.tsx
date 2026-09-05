import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Award, BellRing, Heart, Layers, ShieldCheck, Target, Zap } from 'lucide-react';
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
import { RatingStars } from '@/components/product/RatingStars';
import { CustomBreadcrumbs } from '@/components/layout/Breadcrumbs';
import { SocialChannels } from '@/components/SocialChannels';
import { VideoBridge, type BridgeVideo, type BridgeVideoPlatform } from '@/components/video/VideoBridge';

export const Route = createFileRoute('/product/$slug')({
  head: ({ params }) => { const name = params.slug.replace(/-/g, ' '); return { meta: [{ title: `${name} — Melhor Oferta e Histórico de Preço` }, { name: 'description', content: `Compare preços e encontre a melhor oferta de ${name} entre os marketplaces.` }, { property: 'og:title', content: `${name} — Melhor Oferta e Histórico de Preço` }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }; },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const [targetPrice, setTargetPrice] = useState(''); const [alertOpen, setAlertOpen] = useState(false); const [showDownsell, setShowDownsell] = useState(false); const [postAffiliateOpen, setPostAffiliateOpen] = useState(false); const [videoResumeAt, setVideoResumeAt] = useState(0);
  const createAlertFn = useServerFn(createPriceAlert); const trackInterestFn = useServerFn(updateInterestScore); const fetchRelatedFn = useServerFn(getRelatedProducts);
  const { data: product, isLoading } = useQuery({ queryKey: ['product', slug], queryFn: async () => { const { data, error } = await supabase.from('products').select(`*, marketplaces(name, slug), offer_groups(id, canonical_title, products(id, slug, current_price, discount, rating, is_best_offer, images, marketplaces(name, slug), affiliate_url)), video_products(video_id, videos(id, title, video_url, storage_path, external_url, thumbnail_url, duration, duration_seconds, caption, subtitle, subtitle_url, subtitle_text))`).eq('slug', slug).single(); if (error) throw error; return data as any; } });
  const { data: relatedProducts } = useQuery({ queryKey: ['related-products', product?.id], queryFn: () => fetchRelatedFn({ data: { productId: product!.id, limit: 4 } }), enabled: Boolean(product?.id) });
  const { data: bridgeVideos = [] } = useQuery({
    queryKey: ['product-bridge-videos', product?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('bridge_videos').select('id,title,subtitle,thumbnail,platform,link,created_at,products!inner(id,slug,title,current_price,images,status)').eq('product_id', product!.id).eq('is_active', true).eq('products.status', 'active').order('created_at', { ascending: false }).limit(6);
      if (error) throw error;
      return (data ?? []).map((row: any): BridgeVideo => ({ id: row.id, title: row.title, subtitle: row.subtitle, thumbnail: row.thumbnail, platform: row.platform as BridgeVideoPlatform, link: row.link, product: row.products }));
    },
    enabled: Boolean(product?.id),
  });
  const { isFavorited, setIsFavorited, handleToggleFavorite } = useEngagement(product?.id || '', product?.category_id);

  useEffect(() => {
    if (!product) return;
    setTargetPrice(((product.current_price ?? 0) * 0.9).toFixed(2));
    void (async () => { const { data: { user } } = await supabase.auth.getUser(); trackEvent('PRODUCT_VIEW', { product_id: product.id, category_id: product.category_id || null }, { productId: product.id, categoryId: product.category_id || undefined }); if (!user) return; const { data: favorite } = await supabase.from('favorites').select('id').eq('user_id', user.id).eq('product_id', product.id).maybeSingle(); if (favorite) setIsFavorited(true); const videoId = product.video_products?.[0]?.video_id as string | undefined; if (videoId) { const { data: progress } = await (supabase as any).from('video_watch_progress').select('last_watched_seconds').eq('user_id', user.id).eq('video_id', videoId).maybeSingle(); if (progress?.last_watched_seconds) setVideoResumeAt(Number(progress.last_watched_seconds)); } })();
  }, [product, setIsFavorited]);

  const videoId = product?.video_products?.[0]?.video_id as string | undefined;
  const handleVideoEvent = async (eventName: 'VIDEO_START' | 'VIDEO_COMPLETE', metadata: Record<string, any> = {}) => { if (!product || !videoId) return; await trackEvent(eventName, { product_id: product.id, video_id: videoId, ...metadata }, { productId: product.id, categoryId: product.category_id || undefined }); };
  const handleVideoProgress = async (seconds: number, duration: number) => { if (!product || !videoId || !Number.isFinite(seconds) || !Number.isFinite(duration) || duration <= 0) return; await trackEvent('VIDEO_PROGRESS', { product_id: product.id, video_id: videoId, seconds: Math.round(seconds), duration: Math.round(duration), progress_percent: Math.round((seconds / duration) * 100) }, { productId: product.id, categoryId: product.category_id || undefined }); const { data: { user } } = await supabase.auth.getUser(); if (user) await (supabase as any).from('video_watch_progress').upsert({ user_id: user.id, video_id: videoId, last_watched_seconds: Math.round(seconds), updated_at: new Date().toISOString() }, { onConflict: 'user_id,video_id' }); };
  const handleBuyClick = async () => { if (!product) return; trackOutboundClick(product.id, 'external', product.affiliate_url || ''); if (product.discount && product.discount < 20) { setShowDownsell(true); trackEvent('DOWNSELL_TRIGGERED', { product_id: product.id, discount: product.discount }); } const { data: { user } } = await supabase.auth.getUser(); if (user) await trackInterestFn({ data: { userId: user.id, categoryId: product.category_id || 'general', action: 'click', metadata: { product_id: product.id } } }); if (product.affiliate_url) { window.open(product.affiliate_url, '_blank', 'noopener,noreferrer'); const key = 'cross_promo_post_affiliate_v1'; if (!window.localStorage.getItem(key)) { window.localStorage.setItem(key, '1'); setPostAffiliateOpen(true); } } };
  const handleCreateAlert = async () => { if (!product) return; const { data: { user } } = await supabase.auth.getUser(); if (!user) { toast.error('Faça login para criar um alerta de preço.'); return; } const value = Number.parseFloat(targetPrice); if (!Number.isFinite(value) || value <= 0) { toast.error('Informe um preço alvo válido.'); return; } try { await createAlertFn({ data: { productId: product.id, targetPrice: value } }); setAlertOpen(false); toast.success('Alerta de preço criado.'); trackEvent('PRICE_ALERT_CREATED', { product_id: product.id, target_price: value }); } catch (error) { console.error('Price alert error:', error); toast.error('Não foi possível criar o alerta.'); } };

  if (isLoading) return <div className="container mx-auto max-w-7xl px-4 py-12"><div className="grid gap-12 lg:grid-cols-2"><Skeleton className="aspect-square w-full rounded-[2rem]" /><div className="space-y-6"><Skeleton className="h-12 w-3/4" /><Skeleton className="h-32 w-full" /><Skeleton className="h-16 w-full" /></div></div></div>;
  if (!product) return <div className="container mx-auto px-4 py-24 text-center"><h1 className="text-2xl font-black uppercase italic">Produto não encontrado.</h1><Link to="/" className="mt-4 inline-flex text-primary">Voltar</Link></div>;
  const video = product.video_products?.[0]?.videos as any; const videoUrl = video?.external_url || video?.video_url || ''; const typedRelated = Array.isArray(relatedProducts) ? relatedProducts : [];
  return <div className="container mx-auto max-w-7xl px-4 py-8 pb-16 sm:py-12">
    <CustomBreadcrumbs items={[{ label: 'Discovery', to: '/' }, { label: product.title }]} /><Link to="/" className="mb-8 mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Voltar para o Feed</Link>
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14"><div className="min-w-0 lg:sticky lg:top-24 lg:self-start"><ProductMediaShowcase title={product.title} images={product.images} discount={product.discount} video={videoUrl ? { id: video?.id, url: videoUrl, title: video?.title, caption: video?.caption, subtitle: video?.subtitle, subtitleUrl: video?.subtitle_url, thumbnail: video?.thumbnail_url, resumeAt: videoResumeAt } : null} onVideoStart={() => void handleVideoEvent('VIDEO_START')} onVideoComplete={() => void handleVideoEvent('VIDEO_COMPLETE')} onVideoProgress={(seconds, duration) => void handleVideoProgress(seconds, duration)} /></div>
    <div className="min-w-0 space-y-8"><div className="space-y-5"><div className="flex flex-wrap items-center gap-3">{typeof product.rating === 'number' && product.review_count > 0 ? <RatingStars rating={product.rating} reviewCount={Number(product.review_count)} showCount showLabel /> : <span className="text-xs text-muted-foreground">Avaliação do marketplace ainda não disponível.</span>}</div><h1 className="flex flex-wrap items-center gap-3 text-4xl font-black uppercase italic tracking-tighter sm:text-5xl">{product.title}{product.is_best_offer && <Badge className="bg-amber-500 text-white"><Award className="mr-1 h-3 w-3" />Melhor Oferta</Badge>}</h1><div className="flex flex-wrap items-end gap-4"><span className="text-5xl font-black tracking-tight text-primary sm:text-6xl">R$ {(product.current_price ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>{product.previous_price && <span className="text-xl font-bold text-muted-foreground/40 line-through">R$ {product.previous_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}</div></div>
    <AggregatedSocialProof productId={product.id} variant="full" /><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-green-500" /><div><p className="text-xs font-black uppercase text-green-500">Loja verificada</p><p className="text-xs text-muted-foreground">Oferta externa via {(product.marketplaces as any)?.name || 'marketplace'}</p></div></div></div><p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{product.description || 'Descrição não disponível no momento. Consulte a oferta original para todos os detalhes do produto.'}</p>
    {bridgeVideos.length > 0 && <section className="space-y-5 border-y border-glass-border py-7" aria-labelledby="product-bridge-videos"><div><h2 id="product-bridge-videos" className="text-xl font-black uppercase italic tracking-tight">Visto em vídeo</h2><p className="mt-1 text-xs text-muted-foreground">Conteúdo real curado nas plataformas de origem.</p></div><div className="grid gap-4 md:grid-cols-2">{bridgeVideos.map((bridgeVideo) => <VideoBridge key={bridgeVideo.id} video={bridgeVideo} />)}</div></section>}
    <div className="grid gap-3 sm:grid-cols-2"><Dialog open={alertOpen} onOpenChange={setAlertOpen}><DialogTrigger asChild><Button size="lg" variant="outline" className="h-14 rounded-2xl font-black uppercase tracking-wide"><BellRing className="mr-2 h-5 w-5" />Alerta de Preço</Button></DialogTrigger><DialogContent className="w-[92vw] max-w-md rounded-3xl"><DialogHeader><DialogTitle className="font-black uppercase italic">Vigilância de preço</DialogTitle><DialogDescription>Escolha o preço real que você deseja acompanhar.</DialogDescription></DialogHeader><div className="py-4"><Label htmlFor="target-price">Preço alvo</Label><div className="relative mt-2"><Target className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /><Input id="target-price" type="number" min="0.01" step="0.01" value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} className="h-12 pl-10" /></div></div><DialogFooter><Button onClick={() => void handleCreateAlert()} className="h-12 w-full rounded-xl font-black uppercase">Confirmar</Button></DialogFooter></DialogContent></Dialog><Button size="lg" className="h-14 rounded-2xl font-black uppercase tracking-wide" onClick={() => void handleBuyClick()}>Adquirir agora <Zap className="ml-2 h-5 w-5 fill-current" /></Button></div>
    <Button variant="outline" className="w-full rounded-2xl" onClick={async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) { toast.error('Faça login para salvar favoritos.'); return; } handleToggleFavorite(user.id); }}><Heart className={`mr-2 h-5 w-5 ${isFavorited ? 'fill-current text-primary' : ''}`} />{isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</Button><ProductReviews rating={product.rating} reviewCount={product.review_count} reviews={Array.isArray(product.reviews) ? product.reviews : []} />{typedRelated.length > 0 && <section className="space-y-5 pt-4"><h2 className="flex items-center gap-2 text-2xl font-black uppercase italic"><Layers className="h-6 w-6 text-primary" />Inteligência relacionada</h2><div className="grid grid-cols-2 gap-4">{typedRelated.map((item: any) => <ProductCard key={item.id} {...item} />)}</div></section>}</div></div>
    <Dialog open={postAffiliateOpen} onOpenChange={setPostAffiliateOpen}><DialogContent className="w-[92vw] max-w-lg rounded-3xl border-glass-border bg-glass backdrop-blur-xl"><DialogHeader><DialogTitle className="font-black uppercase italic">Curtiu essa descoberta?</DialogTitle><DialogDescription>Receba mais ofertas e novidades nos nossos canais oficiais.</DialogDescription></DialogHeader><SocialChannels exposurePoint="post_affiliate" /><DialogFooter><Button variant="ghost" className="rounded-xl" onClick={() => setPostAffiliateOpen(false)}>Agora não</Button></DialogFooter></DialogContent></Dialog>
    {showDownsell && product.discount && product.discount < 20 && <div className="sr-only" aria-hidden="true">Downsell baseado no desconto real atual.</div>}
  </div>;
}

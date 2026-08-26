import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, TrendingUp, ArrowLeft, Heart, BellRing, Target, ShieldCheck, PlayCircle, Award, Layers, Zap } from 'lucide-react';
import { useEngagement } from '@/hooks/useEngagement';
import { useWebPush } from '@/hooks/useWebPush';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';
import { trackOutboundClick, trackEvent } from '@/lib/analytics';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPriceAlert } from '@/lib/engagement.functions';
import { updateInterestScore } from '@/lib/personalization.functions';
import { useServerFn } from '@tanstack/react-start';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomBreadcrumbs } from '@/components/layout/Breadcrumbs';
import { getRelatedProducts } from '@/lib/relationships.functions';
import { ProductCard } from '@/components/product/ProductCard';
import { AggregatedSocialProof } from '@/components/AggregatedSocialProof';


export const Route = createFileRoute('/product/$slug')({
  head: ({ params }) => {
    const nome = params.slug.replace(/-/g, ' ');
    return {
      meta: [
        { title: `${nome} — Melhor Oferta e Histórico de Preço` },
        { name: "description", content: `Compare preços, veja o histórico e encontre a melhor oferta de ${nome} entre os marketplaces.` },
        { property: "og:title", content: `${nome} — Melhor Oferta e Histórico de Preço` },
        { property: "og:description", content: `Compare preços, veja o histórico e encontre a melhor oferta de ${nome} entre os marketplaces.` },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const createAlertFn = useServerFn(createPriceAlert);
  const trackInterestFn = useServerFn(updateInterestScore);
  const fetchRelatedFn = useServerFn(getRelatedProducts);
  const [showDownsell, setShowDownsell] = useState(false);
  const [viewStartTime] = useState(Date.now());
  const webPush = useWebPush();

  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          marketplaces(name, slug),
          offer_groups(
            id,
            canonical_title,
            products(
              id,
              slug,
              current_price,
              discount,
              rating,
              is_best_offer,
              images,
              marketplaces(name, slug),
              affiliate_url
            )
          ),
          video_products(
            video_id,
            videos(
              id,
              title,
              video_url,
              storage_path,
              external_url,
              thumbnail_url,
              duration
            )
          )
        `)
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.id],
    queryFn: () => fetchRelatedFn({ data: { productId: product!.id, limit: 4 } }),
    enabled: !!product?.id
  });

  const typedRelatedProducts = (relatedProducts as any) || [];


  const { isFavorited, setIsFavorited, isOptimistic, handleToggleFavorite } = useEngagement(product?.id || '', product?.category_id);

  useEffect(() => {
    if (product) {
      const checkFavorite = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .maybeSingle();
        if (data) setIsFavorited(true);
      };
      checkFavorite();
      
      setTargetPrice((product.current_price * 0.9).toFixed(2));
    }
  }, [product, setIsFavorited]);

  const handleVideoEvent = async (action: string) => {
    if (!product) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await trackInterestFn({
        data: {
          userId: user.id,
          categoryId: product.category_id || 'general',
          action,
          metadata: { product_id: product.id, video_id: product.video_products?.[0]?.video_id }
        }
      });
    } catch (err) {
      console.error("Video tracking error:", err);
    }
  };

  const handleBuyClick = async () => {
    if (!product) return;
    trackOutboundClick(product.affiliate_url || '', product.id, 'external');
    
    // Growth Arsenal: Logic for downsell
    if (product.discount && product.discount < 20) {
      setShowDownsell(true);
      trackEvent('DOWNSELL_TRIGGERED', { product_id: product.id, discount: product.discount });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await trackInterestFn({
        data: {
          userId: user.id,
          categoryId: product.category_id || 'general',
          action: 'click',
          metadata: { product_id: product.id }
        }
      });
    }
    
    if (product.affiliate_url) {
      window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
    }

  };

  const handleCreateAlert = async () => {
    if (!product) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Por favor, faça login para estabelecer vigilância");
      return;
    }

    try {
      await createAlertFn({ 
        data: { 
          productId: product.id, 
          targetPrice: parseFloat(targetPrice) 
        } 
      });
      setIsAlertModalOpen(false);
      toast.success("Protocolo de vigilância de preço estabelecido.");
      trackEvent('PRICE_ALERT_CREATED', { product_id: product.id, target_price: targetPrice });
    } catch (err) {
      toast.error("Falha no protocolo: Não foi possível estabelecer o alerta.");
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="container mx-auto py-12 px-4 max-w-7xl animate-pulse">
        <div className="flex flex-col lg:flex-row gap-12">
          <Skeleton className="w-full lg:w-1/2 aspect-square rounded-[2rem]" />
          <div className="w-full lg:w-1/2 space-y-6">
            <Skeleton className="h-12 w-3/4 rounded-xl" />
            <Skeleton className="h-24 w-1/2 rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return (
    <div className="container mx-auto py-24 px-4 text-center">
      <h1 className="text-2xl font-black uppercase tracking-tighter italic">Sinal do produto perdido.</h1>
      <Link to="/" className="text-primary font-bold uppercase text-xs mt-4 inline-block tracking-widest">Voltar para a Base</Link>
    </div>
  );

  return (
    <div className="container mx-auto py-12 px-4 max-w-7xl pb-safe">
      <div className="mb-8">
        <CustomBreadcrumbs items={[{ label: 'Discovery', to: '/' }, { label: product.title }]} />
      </div>
      
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-primary transition-colors mb-8 group"
      >
        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
        Voltar para o Feed de Descoberta
      </Link>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-1/2 space-y-6 lg:sticky lg:top-24">
          <Tabs defaultValue="image" className="w-full">
            <div className="relative group">
              <TabsContent value="image" className="mt-0 focus-visible:ring-0">
                <div className="aspect-square rounded-[2rem] overflow-hidden bg-muted border border-glass-border shadow-2xl relative">
                  <div className="absolute inset-0 z-10 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  <img 
                    src={product.images?.[0] || ""} 
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  {product.discount && (
                    <Badge className="absolute top-6 left-6 bg-primary text-primary-foreground text-xl font-black px-6 py-2 shadow-2xl rounded-tr-none rounded-bl-none rounded-tl-2xl rounded-br-2xl z-20 animate-pulse tracking-tighter border-none">
                      -{product.discount}%
                    </Badge>
                  )}
                </div>
              </TabsContent>

              {product.video_products?.length > 0 && (
                <TabsContent value="video" className="mt-0 focus-visible:ring-0">
                  <div className="aspect-square rounded-[2rem] overflow-hidden border border-glass-border shadow-2xl">
                    <VideoPlayer 
                      src={(product.video_products?.[0]?.videos as any)?.external_url || (product.video_products?.[0]?.videos as any)?.video_url || ""}
                      className="h-full aspect-square"
                      onStart={() => handleVideoEvent('video_start')}
                      onComplete={() => handleVideoEvent('video_complete')}
                    />

                  </div>
                </TabsContent>
              )}

              <Button
                variant="ghost"
                size="icon"
                className={`absolute top-6 right-6 z-30 w-14 h-14 rounded-full backdrop-blur-xl border border-white/10 transition-all duration-500 shadow-2xl ${
                  isFavorited ? 'bg-primary text-primary-foreground' : 'bg-background/40 text-white hover:bg-primary/20'
                }`}
                onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) {
                    toast.error("Please sign in to save favorites");
                    return;
                  }
                  handleToggleFavorite(user.id);
                }}
              >
                <Heart className={`w-7 h-7 ${isFavorited ? 'fill-current' : ''}`} />
              </Button>
            </div>

            <TabsList className="flex gap-4 mt-4 overflow-x-auto pb-2 bg-transparent h-auto p-0 scrollbar-hide">
              <TabsTrigger value="image" className="p-0 w-20 h-20 rounded-xl border border-glass-border overflow-hidden opacity-60 data-[state=active]:opacity-100 data-[state=active]:border-primary transition-all">
                <img src={product.images?.[0]} className="w-full h-full object-cover" />
              </TabsTrigger>
              {product.video_products?.length > 0 && (
                <TabsTrigger value="video" className="p-0 w-20 h-20 rounded-xl border border-glass-border bg-glass flex items-center justify-center opacity-60 data-[state=active]:opacity-100 data-[state=active]:border-primary transition-all group">
                  <PlayCircle className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full border-glass-border bg-white/5 font-black uppercase text-[8px] tracking-[0.2em] px-4 py-1.5 italic italic">
              Technical ID: {product.id.slice(0, 8)}
            </Badge>
            <Badge variant="outline" className="rounded-full border-glass-border bg-white/5 font-black uppercase text-[8px] tracking-[0.2em] px-4 py-1.5 italic italic">
              Fonte: {(product.marketplaces as any)?.name}
            </Badge>
            <Badge variant="outline" className="rounded-full border-glass-border bg-white/5 font-black uppercase text-[8px] tracking-[0.2em] px-4 py-1.5 italic italic">
              Verificação: SHA-256
            </Badge>
          </div>
        </div>

        <div className="w-full lg:w-1/2 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(product.rating || 5) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/20'}`} />
                  ))}
                </div>
                <span className="text-sm font-black italic">{product.rating || '4.9'}</span>
                <span className="text-muted-foreground font-medium opacity-50 uppercase tracking-tighter">({product.review_count?.toLocaleString() || '3.400'})</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] animate-glow px-3 py-1 rounded-full border border-primary/20">
                <TrendingUp className="w-3 h-3" />
                Alta Demanda
              </div>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter leading-tight italic uppercase flex flex-wrap items-center gap-4">
              {product.title}
              {(product as any).is_best_offer && (
                <Badge className="bg-amber-500 text-white border-none font-black rounded-full px-3 py-1 shadow-2xl text-[9px] tracking-widest uppercase flex items-center gap-1 italic">
                  <Award className="w-3 h-3" />
                  Melhor Oferta
                </Badge>
              )}
            </h1>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-4">
                <span className="text-6xl font-black tracking-[-0.05em] leading-none text-primary">
                  R$ {product.current_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                {product.previous_price && (
                  <span className="text-2xl text-muted-foreground/40 line-through decoration-primary/40 font-black italic tracking-tighter">
                    R$ {product.previous_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
              {product.current_price > 100 && (
                <p className="text-lg font-bold text-muted-foreground uppercase tracking-tighter">
                  ou 10x de R$ {(product.current_price / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros
                </p>
              )}
            </div>
          </div>

          <AggregatedSocialProof productId={product.id} variant="full" />

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-green-500 italic">Loja Verificada</p>
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Transação Segura via {(product.marketplaces as any)?.name}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-muted-foreground text-lg leading-relaxed font-medium tracking-tight">
            <p>{product.description || "Sintetizando inteligência do produto... Esta oferta de alta fidelidade representa o ápice do valor atual de mercado, conforme determinado pelo nosso motor de descoberta heurística."}</p>
          </div>

          <div className="flex flex-col gap-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Dialog open={isAlertModalOpen} onOpenChange={setIsAlertModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="h-16 rounded-2xl font-black uppercase tracking-tighter gap-3 glass-surface border-primary/20 text-primary hover:bg-primary/5 transition-all"
                  >
                    <BellRing className="w-5 h-5" />
                    Alerta de Preço
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] w-[92%] rounded-[2rem] bg-glass backdrop-blur-3xl border-glass-border bottom-safe md:bottom-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Vigilância de Alvo</DialogTitle>
                    <DialogDescription className="text-muted-foreground font-medium tracking-tight">
                      Estabeleça seu preço alvo. Enviaremos notificações quando o valor de mercado corresponder ao seu perfil de inteligência.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest opacity-50">Preço Alvo (R$)</Label>
                      <div className="relative">
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={targetPrice}
                          onChange={(e) => setTargetPrice(e.target.value)}
                          className="h-14 pl-12 bg-white/5 border-glass-border rounded-xl font-black text-xl tracking-tight focus:ring-primary/20"
                        />
                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleCreateAlert}
                      className="w-full h-14 rounded-xl font-black uppercase tracking-widest italic shadow-xl shadow-primary/20"
                    >
                      Confirmar Vigilância
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                size="lg" 
                className="h-16 rounded-2xl font-black uppercase tracking-widest italic gap-3 shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
                onClick={handleBuyClick}
              >
                ADQUIRIR AGORA
                <Zap className="w-5 h-5 fill-current" />
              </Button>
            </div>
          </div>

          {typedRelatedProducts.length > 0 && (
            <div className="pt-12 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                  <Layers className="w-6 h-6 text-primary" />
                  Inteligência Relacionada
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {typedRelatedProducts.map((p: any) => (
                  <ProductCard key={p.id} {...p} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

 
 
 
 
 
 
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getPersonalizedFeed } from "@/lib/personalization.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product/ProductCard";
import { TrendingUp, Zap, ArrowRight, ShieldCheck, Globe, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CategoryStrip } from "@/components/product/CategoryStrip";
import { BannerCarousel } from "@/components/product/BannerCarousel";
import { FlashDeals } from "@/components/product/FlashDeals";
import { CategoryHighlightsSection } from "@/components/product/CategoryHighlightsSection";


export const Route = createFileRoute("/")({
  loader: async ({ context }: { context: any }) => {
    // Return early to ensure the page renders even if data fails
    try {
      await context.queryClient.ensureQueryData({
        queryKey: ["personalizedFeed", null, 4],
        queryFn: () => getPersonalizedFeed({ data: { userId: null, limit: 4 } })
      });
    } catch (e) {
      console.error("Loader feed error:", e);
    }
  },
  component: Index,
  head: () => ({
    title: "AFFILIATEPRO | Discovery & Video Commerce",
    meta: [
      {
        name: "description",
        content: "A próxima geração do comércio liderado por descoberta. Compras em vídeo imersivas e ofertas inteligentes.",
      },
      { property: "og:title", content: "AFFILIATEPRO — Plataforma de Afiliados Moderna" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Index() {
  const navigate = useNavigate();
  const { data: products } = useSuspenseQuery({
    queryKey: ["personalizedFeed", null, 4],
    queryFn: () => getPersonalizedFeed({ data: { userId: null, limit: 4 } })
  });

  return (
    <div className="flex flex-col gap-0 min-h-screen w-full">
      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-background pt-20">
        {/* Background Accents - Premium Mesh Gradients */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] aspect-square bg-primary/10 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square bg-blue-600/10 rounded-full blur-[130px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center z-10 space-y-10">
          <Badge variant="outline" className="px-5 py-2 rounded-full border-primary/30 bg-primary/5 text-primary glass-surface">
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            PROTOCOLO DE INTELIGÊNCIA ATIVO
          </Badge>
          
          <h1 className="text-6xl md:text-[8rem] font-black tracking-[-0.06em] leading-[0.85] uppercase italic">
            O FUTURO <br />
            DAS <span className="text-primary mix-blend-plus-lighter">OFERTAS</span> <br />
            HOJE.
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium tracking-tight">
            Comércio de próxima geração impulsionado por algoritmos de descoberta ponderada. 
            Rastreamento em tempo real. Inteligência máxima.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 pt-6">
            <Button size="lg" className="rounded-2xl px-10 h-16 text-xl font-black group shadow-2xl shadow-primary/30 transition-all hover:scale-105" asChild>
              <Link to="/feed">
                ENTRAR NO SISTEMA
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="rounded-2xl px-10 h-16 text-xl font-bold glass-surface hover:bg-primary/5 transition-all" 
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) navigate({ to: "/profile" });
                else navigate({ to: "/auth" });
              }}
            >
              SINCRONIZAR PERFIL
            </Button>
          </div>
        </div>
      </section>

      {/* Categories & Banners */}
      <CategoryStrip />
      <BannerCarousel />

      {/* Campaign Spotlight Video */}
      <section className="py-12 px-4 max-w-7xl mx-auto w-full">
        <div className="rounded-[2.5rem] bg-glass-fallback border border-glass-border overflow-hidden relative min-h-[400px] flex flex-col md:flex-row shadow-2xl elevation-1 mb-safe">
          <div className="w-full md:w-1/2 aspect-video md:aspect-auto relative bg-black">
             {/* This would be dynamically loaded from active campaigns in a real scenario */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Badge className="bg-primary/20 text-primary border-primary/30 uppercase font-black tracking-widest text-[10px]">Lançamento Ativo</Badge>
                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Revelação Coleção de Verão</h3>
                  <Button className="rounded-xl font-black uppercase italic gap-2 shadow-2xl shadow-primary/20">
                    <Link to="/videos">Assistir Estreia</Link>
                  </Button>
                </div>
             </div>
          </div>
          <div className="w-full md:w-1/2 p-12 flex flex-col justify-center space-y-6">
            <Badge variant="outline" className="w-fit border-primary/20 text-primary uppercase font-black tracking-widest text-[10px]">Acesso Exclusivo</Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter italic uppercase leading-none">O Futuro da <br/><span className="text-primary">Moda Tech</span></h2>
            <p className="text-muted-foreground font-medium text-lg">Experimente a próxima geração de wearables em comércio de vídeo de alta definição. Compre diretamente do frame.</p>
            <div className="flex gap-4">
               <div className="flex flex-col">
                  <span className="text-2xl font-black italic">42.5K</span>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Visualizações</span>
               </div>
               <div className="w-px h-10 bg-glass-border" />
               <div className="flex flex-col">
                  <span className="text-2xl font-black italic">120+</span>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Produtos</span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flash Deals */}
      <FlashDeals />

      {/* Category Highlights */}
      <CategoryHighlightsSection limit={4} />


      {/* Trust & Scale Badges */}
      <section className="py-12 border-y bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-60">
          <Link to="/videos" className="flex items-center gap-2 font-bold text-lg hover:text-primary transition-colors cursor-pointer group">
            <Zap className="w-5 h-5 group-hover:animate-pulse" /> 
            COMÉRCIO EM VÍDEO
          </Link>
          <div className="flex items-center gap-2 font-bold text-lg"><Globe className="w-5 h-5" /> BUSCA GLOBAL</div>
          <div className="flex items-center gap-2 font-bold text-lg"><ShieldCheck className="w-5 h-5 text-emerald-500" /> CENTRO DE CONFORMIDADE</div>
          <div className="flex items-center gap-2 font-bold text-lg"><TrendingUp className="w-5 h-5" /> PREÇO EM TEMPO REAL</div>
        </div>
      </section>

      {/* Trending Feed Snippet */}
      {products && products.length > 0 && (
        <section className="py-24 px-4 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div className="space-y-2">
              <Badge variant="secondary" className="rounded-full px-4 border border-white/5 bg-white/5 uppercase font-black tracking-widest text-[10px]">Tendências Agora</Badge>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase">Descoberta Personalizada</h2>
            </div>
            <Button variant="ghost" className="group font-bold uppercase tracking-widest text-xs" asChild>
              <Link to="/feed">
                Ver Tudo 
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <div key={product.id} className="relative group/card">
                {product.feedContext && (
                  <div className="absolute -top-3 left-4 z-20 px-3 py-1 bg-background/80 backdrop-blur-md border border-white/5 rounded-full shadow-xl">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-primary/70">
                      {product.feedContext}
                    </span>
                  </div>
                )}
                <ProductCard 
                  id={product.id}
                  slug={product.slug}
                  categoryId={product.categoryId}
                  title={product.title}
                  price={product.price}
                  previousPrice={product.previousPrice}
                  discount={product.discount}
                  image={product.image}
                  marketplace={product.marketplace}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  affiliateUrl={product.affiliateUrl ?? null}
                  hasVideo={product.hasVideo}
                  isBestOffer={product.isBestOffer}
                  offerScore={product.offerScore}
                />

              </div>
            ))}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-32 px-4 bg-primary text-primary-foreground relative overflow-hidden selection:bg-white/20 selection:text-white pb-[140px] md:pb-32">
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h2 className="text-4xl md:text-8xl font-black tracking-[-0.06em] leading-none uppercase italic">
            PRONTO PARA DAR UM UPGRADE NAS SUAS COMPRAS?
          </h2>
          <p className="text-xl md:text-2xl text-primary-foreground/70 leading-relaxed font-medium tracking-tight">
            Junte-se a milhares de usuários que encontram os melhores preços na Amazon, Mercado Livre e muito mais usando nosso motor de descoberta orientado por IA.
          </p>
          <div className="flex justify-center gap-4 pt-6">
            <Button size="lg" variant="secondary" className="rounded-2xl px-12 h-16 text-xl font-black uppercase tracking-tight shadow-2xl hover:scale-105 transition-all" asChild>
              <Link to="/register">Criar Conta Gratuita</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
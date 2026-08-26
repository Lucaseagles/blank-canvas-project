import { createFileRoute, Link } from "@tanstack/react-router";
import { getPersonalizedFeed } from "@/lib/personalization.functions";
import { ProductCard } from "@/components/product/ProductCard";
import { useServerFn } from "@tanstack/react-start";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Feed de Descoberta Personalizado" },
      { name: "description", content: "Um feed inteligente que mistura relevância, produtos relacionados e descobertas novas para você." },
      { property: "og:title", content: "Feed de Descoberta Personalizado" },
      { property: "og:description", content: "Um feed inteligente que mistura relevância, produtos relacionados e descobertas novas para você." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const fetchFeed = useServerFn(getPersonalizedFeed);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        // Use a generous limit and ensure userId is handled (could be null)
        const data = await fetchFeed({ data: { userId: user?.id || null, limit: 12 } });
        if (mounted) {
          setProducts(data || []);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Feed load error:", err);
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [fetchFeed]);

  return (
    <div className="container mx-auto py-20 px-4 max-w-7xl reveal-on-scroll">
      <div className="mb-20 text-center space-y-6">
        <Badge variant="outline" className="px-4 py-1 rounded-full border-primary/30 bg-primary/5 text-primary animate-pulse">
          ENGINE STATUS: ACTIVE
        </Badge>
        <h1 className="text-6xl md:text-8xl font-black tracking-[-0.05em] leading-none uppercase italic">FEED DE <span className="text-primary">DESCOBERTA</span></h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium tracking-tight">
          Seleção de produtos de alta fidelidade calibrada para sua assinatura comportamental única.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <ProductCard key={i} id={`skeleton-${i}`} slug="" isLoading={true} />
          ))}
        </div>
      ) : products?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Video Discovery Entry Point */}
          <Link 
            to="/videos"
            className="col-span-1 sm:col-span-2 lg:col-span-1 h-full min-h-[400px] rounded-3xl overflow-hidden relative group cursor-pointer border border-primary/20 bg-black"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent z-10 opacity-60 group-hover:opacity-80 transition-opacity" />
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur-xl border border-primary/30 flex items-center justify-center animate-pulse">
                <Zap className="w-8 h-8 text-primary fill-current" />
              </div>
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Descoberta em Vídeo Ao Vivo</h3>
              <p className="text-white/70 text-sm font-medium">Experiências de produto imersivas calibradas para o seu perfil.</p>
              <div className="pt-4">
                <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5 px-4 py-1">ENTRAR NO MOTOR</Badge>
              </div>
            </div>
            {/* Background motion or static placeholder */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000')] bg-cover bg-center grayscale opacity-30 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" />
          </Link>

          {products.map((product) => (
            <div key={product.id} className="relative group">
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
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 glass-surface rounded-[3rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50" />
          <div className="relative z-10 space-y-6 max-w-md mx-auto px-6">
            <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-8 border border-white/5">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
            <h3 className="text-3xl font-black uppercase italic tracking-tighter">Início a Frio do Conteúdo</h3>
            <p className="text-muted-foreground font-medium tracking-tight">
              Nosso motor de inteligência está indexando ofertas de alta qualidade. Tente atualizar em alguns instantes.
            </p>
            <div className="pt-4">
              <button 
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                Reinicializar Feed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
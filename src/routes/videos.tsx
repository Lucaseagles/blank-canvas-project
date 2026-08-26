import { createFileRoute, Link } from "@tanstack/react-router";
import { getVideos } from "@/lib/video.functions";
import { updateInterestScore } from "@/lib/personalization.functions";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Share2, ShoppingBag, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Video Commerce — Ofertas em Vídeo" },
      { name: "description", content: "Feed vertical de vídeos curtos com produtos em destaque e links diretos para a oferta." },
      { property: "og:title", content: "Video Commerce — Ofertas em Vídeo" },
      { property: "og:description", content: "Feed vertical de vídeos curtos com produtos em destaque e links diretos para a oferta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VideoFeedPage,
});

function VideoFeedPage() {
  const fetchVideos = useServerFn(getVideos);
  const trackVideoInterest = useServerFn(updateInterestScore);
  const [videos, setVideos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const data = await fetchVideos({ data: { status: 'published', limit: 20, includeScheduled: false } });
        if (!mounted) return;
        setUserId(user?.id || null);
        setVideos(data || []);
      } catch (error) {
        console.error("Video feed load error:", error);
        if (mounted) setVideos([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [fetchVideos]);

  const handleVideoEvent = async (videoId: string, categoryId: string | null, action: string) => {
    if (!userId) return;

    try {
      await trackVideoInterest({
        data: {
          userId,
          categoryId: categoryId || 'general',
          action,
          metadata: { video_id: videoId }
        }
      });

      if (action === 'favorite') {
        setVideos(prev => prev.map(v => v.id === videoId ? { ...v, is_favorited: !v.is_favorited } : v));
        toast.success("Sinal priorizado no seu vault.");
      }
    } catch (err) {
      console.error("Video tracking error:", err);
    }
  };

  const handleShare = async (video: any) => {
    const url = `${window.location.origin}/videos#${video.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: video.title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado.");
      }
    } catch {
      // User cancelled native share; no UI error is necessary.
    }
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-full bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
      <Link
        to="/"
        aria-label="Voltar para o início"
        className="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 z-50 min-h-touch min-w-touch rounded-full bg-black/30 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/50 transition-all"
      >
        <ArrowLeft className="w-6 h-6" />
      </Link>

      {videos.length > 0 ? (
        videos.map((video) => (
          <div key={video.id} id={video.id} className="h-[100dvh] w-full snap-start relative flex items-center justify-center overflow-hidden">
            <VideoPlayer
              src={video.external_url || video.storage_path || ""}
              poster={video.poster_url}
              className="h-full w-full object-cover rounded-none border-none shadow-none"
              autoPlay={true}
              loop={true}
              onStart={() => handleVideoEvent(video.id, video.category_id, 'video_start')}
              onComplete={() => handleVideoEvent(video.id, video.category_id, 'video_complete')}
            />

            <div className="absolute right-4 bottom-[calc(8rem+env(safe-area-inset-bottom))] z-40 flex flex-col gap-4 items-center">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Favoritar vídeo"
                className={cn(
                  "w-14 h-14 min-h-touch min-w-touch rounded-full bg-black/20 backdrop-blur-xl border border-white/10 text-white hover:bg-black/40 hover:scale-110 transition-all",
                  video.is_favorited && "text-primary border-primary/50 bg-primary/10"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleVideoEvent(video.id, video.category_id, 'favorite');
                }}
              >
                <Heart className={cn("w-7 h-7", video.is_favorited && "fill-current")} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Compartilhar vídeo"
                className="w-14 h-14 min-h-touch min-w-touch rounded-full bg-black/20 backdrop-blur-xl border border-white/10 text-white hover:bg-black/40 transition-all"
                onClick={() => handleShare(video)}
              >
                <Share2 className="w-7 h-7" />
              </Button>
              {video.video_products?.[0]?.products && (
                <Link to="/product/$slug" params={{ slug: video.video_products[0].products.slug }} aria-label="Ver produto">
                  <Button size="icon" variant="ghost" className="w-14 h-14 min-h-touch min-w-touch rounded-full bg-primary text-white shadow-2xl shadow-primary/30 hover:scale-110 transition-all">
                    <ShoppingBag className="w-7 h-7" />
                  </Button>
                </Link>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
              <div className="max-w-xl space-y-4 pr-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className="bg-primary/20 text-primary border-primary/30 font-black uppercase tracking-widest text-[10px]">Badge de Destaque</Badge>
                  {video.video_products?.length > 0 && (
                    <Badge variant="outline" className="text-white border-white/20 glass-surface uppercase text-[9px]">{video.video_products.length} Produtos</Badge>
                  )}
                  {video.scheduled_for && new Date(video.scheduled_for) > new Date() && (
                    <Badge className="bg-amber-500 text-white border-none font-black uppercase tracking-widest text-[10px] animate-pulse">ESTREIA EM ANDAMENTO</Badge>
                  )}
                </div>
                <h2 className="text-2xl font-black text-white leading-tight italic uppercase tracking-tighter">{video.title}</h2>

                {video.video_products?.[0]?.products && (
                  <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0">
                        <img src={video.video_products[0].products.images?.[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Produto em Destaque</p>
                        <p className="text-sm font-black text-white truncate max-w-[150px]">{video.video_products[0].products.title}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-lg font-black text-primary italic leading-none">R$ {Number(video.video_products[0].products.current_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 text-center space-y-6">
          <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter">Motor de Vídeo Frio</h2>
          <p className="text-white/50 max-w-md">Nenhum vídeo foi publicado ainda. Volte logo para o conteúdo de descoberta mais recente.</p>
          <Button variant="outline" className="text-white border-white/20 min-h-touch" asChild>
            <Link to="/">Voltar para o Início</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
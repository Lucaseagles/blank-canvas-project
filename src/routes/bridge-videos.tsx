import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { VideoBridge, type BridgeVideo, type BridgeVideoPlatform } from '@/components/video/VideoBridge';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/bridge-videos')({ component: BridgeVideosPage });

function BridgeVideosPage() {
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['bridge-videos', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bridge_videos')
        .select('id,title,subtitle,thumbnail,platform,link,products!inner(id,slug,title,current_price,images)')
        .eq('is_active', true)
        .eq('products.status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any): BridgeVideo => ({
        id: row.id,
        title: row.title,
        subtitle: row.subtitle,
        thumbnail: row.thumbnail,
        platform: row.platform as BridgeVideoPlatform,
        link: row.link,
        product: row.products,
      }));
    },
  });

  return (
    <main className="container mx-auto max-w-7xl space-y-8 px-4 py-8 sm:py-12">
      <header className="max-w-2xl space-y-3">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Video Commerce</p>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter sm:text-5xl">Vídeos Ponte</h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Assista ao conteúdo na plataforma original e encontre o produto correspondente aqui. Apenas vídeos reais cadastrados pelo administrador são exibidos.
        </p>
      </header>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => <Skeleton key={item} className="aspect-[4/5] rounded-[1.75rem]" />)}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => <VideoBridge key={video.id} video={video} />)}
        </div>
      ) : (
        <section className="rounded-[1.75rem] border border-glass-border bg-white/[0.03] p-8 text-center">
          <p className="text-sm font-bold text-muted-foreground">Nenhum vídeo ponte ativo foi cadastrado.</p>
        </section>
      )}
    </main>
  );
}

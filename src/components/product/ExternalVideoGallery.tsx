import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ExternalVideoCard } from './ExternalVideoCard';
import { getExternalVideosByProduct } from '@/lib/supabase/external-videos';

export function ExternalVideoGallery({ productId }: { productId: string }) {
  const getVideos = useServerFn(getExternalVideosByProduct);
  const { data = [], isLoading } = useQuery({
    queryKey: ['external-videos', productId],
    queryFn: () => getVideos({ data: { productId } }),
    enabled: Boolean(productId),
  });

  if (isLoading) return <section className="space-y-4"><div className="h-7 w-48 animate-pulse rounded bg-white/10" /><div className="grid grid-cols-2 gap-4 sm:grid-cols-3"><div className="aspect-[4/5] animate-pulse rounded-2xl bg-white/5" /><div className="aspect-[4/5] animate-pulse rounded-2xl bg-white/5" /></div></section>;
  if (!data.length) return null;

  return (
    <section className="space-y-5 border-y border-glass-border py-7" aria-labelledby="external-videos-heading">
      <div className="space-y-1">
        <h2 id="external-videos-heading" className="text-xl font-black uppercase italic tracking-tight">Visto em vídeo</h2>
        <p className="text-xs text-muted-foreground">Conteúdo curado nas plataformas de origem. Assista por lá e encontre o produto aqui.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {data.map((video) => <ExternalVideoCard key={video.id} video={video} />)}
      </div>
    </section>
  );
}

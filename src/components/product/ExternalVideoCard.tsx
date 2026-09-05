import { ExternalLink, Eye, Package, Play } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import type { ExternalVideo } from '@/lib/supabase/external-videos';

const PLATFORM: Record<ExternalVideo['platform'], { name: string; icon: string }> = {
  tiktok: { name: 'TikTok', icon: '🎵' },
  shopee_video: { name: 'Shopee Video', icon: '🛍️' },
  mercado_livre_video: { name: 'Mercado Livre', icon: '📦' },
};

function track(id: string, kind: 'view' | 'click') {
  void fetch(`/api/external-videos/${id}/${kind}`, { method: 'POST', keepalive: true });
}

export function ExternalVideoCard({ video }: { video: ExternalVideo }) {
  const platform = PLATFORM[video.platform];
  return (
    <article className="group overflow-hidden rounded-2xl border border-glass-border bg-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05]">
      <div className="relative aspect-[4/5] overflow-hidden bg-black/30">
        {video.thumbnail_url ? <img src={video.thumbnail_url} alt={video.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" onLoad={() => track(video.id, 'view')} /> : <div className="flex h-full items-center justify-center text-5xl">{platform.icon}</div>}
        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur">{platform.icon} {platform.name}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-black shadow-2xl"><Play className="h-6 w-6 fill-current" /></span></div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white backdrop-blur"><Eye className="h-3 w-3" /> {video.view_count.toLocaleString('pt-BR')}</div>
      </div>
      <div className="space-y-3 p-4">
        <h3 className="line-clamp-2 text-sm font-black uppercase tracking-tight">{video.title}</h3>
        {video.description && <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{video.description}</p>}
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild variant="outline" className="h-10 rounded-xl text-xs font-black uppercase" onClick={() => track(video.id, 'click')}>
            <a href={video.external_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Assistir</a>
          </Button>
          {video.product && <Button asChild className="h-10 rounded-xl text-xs font-black uppercase"><Link to="/product/$slug" params={{ slug: video.product.slug }}><Package className="mr-2 h-4 w-4" />Produto</Link></Button>}
        </div>
      </div>
    </article>
  );
}

import { ExternalLink, PlayCircle, ShoppingBag } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type BridgeVideoPlatform = 'tiktok' | 'shopee' | 'ml' | 'youtube';

export interface BridgeVideo {
  id: string;
  title: string;
  subtitle?: string | null;
  thumbnail?: string | null;
  platform: BridgeVideoPlatform;
  link: string;
  product: {
    id: string;
    slug?: string | null;
    title: string;
    current_price?: number | null;
    images?: string[] | null;
  };
}

const platformLabel: Record<BridgeVideoPlatform, string> = {
  tiktok: 'TikTok',
  shopee: 'Shopee',
  ml: 'Mercado Livre',
  youtube: 'YouTube',
};

export function VideoBridge({ video }: { video: BridgeVideo }) {
  const productImage = Array.isArray(video.product.images) ? video.product.images[0] : undefined;
  const image = video.thumbnail || productImage;
  const productTo = video.product.slug ? '/product/$slug' : '/products';
  const productParams = video.product.slug ? { slug: video.product.slug } : undefined;

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-glass-border bg-white/[0.04] shadow-xl backdrop-blur-xl transition-transform duration-300 hover:-translate-y-0.5">
      <div className="relative aspect-video overflow-hidden bg-muted">
        {image ? (
          <img src={image} alt={video.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted text-muted-foreground">
            <PlayCircle className="h-10 w-10 opacity-40" />
          </div>
        )}
        <Badge className="absolute left-3 top-3 border-0 bg-black/75 text-white backdrop-blur-md">
          {platformLabel[video.platform]}
        </Badge>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="line-clamp-2 text-base font-black tracking-tight">{video.title}</h3>
          {video.subtitle && <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{video.subtitle}</p>}
        </div>

        <div className="rounded-xl border border-glass-border bg-background/40 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Produto relacionado</p>
          <p className="mt-1 line-clamp-2 text-sm font-bold">{video.product.title}</p>
          {typeof video.product.current_price === 'number' && (
            <p className="mt-1 text-sm font-black text-primary">
              R$ {video.product.current_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild className="h-11 rounded-xl font-black">
            <a href={video.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Assista no {platformLabel[video.platform]}
            </a>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-xl font-black">
            <Link to={productTo as any} params={productParams as any}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Encontre o produto aqui
            </Link>
          </Button>
        </div>

        <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
          Link externo oficial cadastrado pelo administrador. O produto é exibido no app para facilitar a descoberta.
        </p>
      </div>
    </article>
  );
}

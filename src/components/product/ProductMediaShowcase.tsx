import { useMemo, useState } from 'react';
import { PlayCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductVideo } from '@/components/product/ProductVideo';

interface ProductMediaShowcaseProps {
  title: string;
  images?: string[] | null;
  discount?: number | null;
  video?: {
    id?: string | null;
    url?: string | null;
    title?: string | null;
    caption?: string | null;
    subtitle?: string | null;
    subtitleText?: string | null;
    subtitleUrl?: string | null;
    thumbnail?: string | null;
    resumeAt?: number;
  } | null;
  onVideoStart?: () => void;
  onVideoComplete?: () => void;
  onVideoProgress?: (seconds: number, duration: number) => void;
}

export function ProductMediaShowcase({ title, images, discount, video, onVideoStart, onVideoComplete, onVideoProgress }: ProductMediaShowcaseProps) {
  const imageList = useMemo(() => (Array.isArray(images) ? images : []), [images]);
  const hasVideo = Boolean(video?.url);
  const [tab, setTab] = useState<'image' | 'video'>('image');

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as 'image' | 'video')} className="w-full">
      <TabsContent value="image" className="mt-0 focus-visible:outline-none">
        <ProductGallery images={imageList} productName={title} discount={discount ?? null} autoPlay={imageList.length > 1} />
      </TabsContent>
      {hasVideo && video?.url && (
        <TabsContent value="video" className="mt-0 focus-visible:outline-none">
          <ProductVideo
            videoUrl={video.url}
            title={video.title ?? null}
            caption={video.caption ?? null}
            subtitle={video.subtitle ?? null}
            subtitleText={video.subtitleText ?? null}
            subtitleUrl={video.subtitleUrl ?? null}
            thumbnail={video.thumbnail ?? null}
            initialTime={video.resumeAt ?? 0}
            {...(onVideoStart ? { onStart: onVideoStart } : {})}
            {...(onVideoComplete ? { onComplete: onVideoComplete } : {})}
            {...(onVideoProgress ? { onProgress: onVideoProgress } : {})}
          />
        </TabsContent>
      )}
      <TabsList className="mt-3 h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-1 scrollbar-hide">
        <TabsTrigger value="image" className="h-12 shrink-0 rounded-xl border border-glass-border px-4 data-[state=active]:border-primary">Galeria {imageList.length > 0 ? `(${imageList.length})` : ''}</TabsTrigger>
        {hasVideo && <TabsTrigger value="video" className="h-12 shrink-0 gap-2 rounded-xl border border-glass-border px-4 data-[state=active]:border-primary"><PlayCircle className="h-4 w-4" />Vídeo</TabsTrigger>}
      </TabsList>
    </Tabs>
  );
}

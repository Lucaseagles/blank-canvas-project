import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, ZoomIn, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images?: string[] | null;
  productName: string;
  discount?: number | null;
}

export function ProductGallery({ images, productName, discount }: ProductGalleryProps) {
  const normalizedImages = useMemo(
    () => (Array.isArray(images) ? images.filter((image): image is string => typeof image === 'string' && image.trim().length > 0) : []),
    [images]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const hasImages = normalizedImages.length > 0;
  const safeIndex = hasImages ? Math.min(currentIndex, normalizedImages.length - 1) : 0;
  const currentImage = normalizedImages[safeIndex];

  const nextImage = () => {
    if (normalizedImages.length < 2) return;
    setCurrentIndex((index) => (index + 1) % normalizedImages.length);
  };

  const prevImage = () => {
    if (normalizedImages.length < 2) return;
    setCurrentIndex((index) => (index - 1 + normalizedImages.length) % normalizedImages.length);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) return;
    const diff = touchStartX.current - endX;
    touchStartX.current = null;
    if (Math.abs(diff) >= 45) diff > 0 ? nextImage() : prevImage();
  };

  return (
    <>
      <div className="w-full max-w-2xl mx-auto space-y-3">
        <div
          className="relative aspect-square overflow-hidden rounded-[2rem] bg-muted border border-glass-border shadow-2xl touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {currentImage ? (
            <button
              type="button"
              className="group block w-full h-full cursor-zoom-in"
              onClick={() => setZoomOpen(true)}
              aria-label={`Ampliar ${productName}`}
            >
              <img
                src={currentImage}
                alt={`${productName} — imagem ${safeIndex + 1} de ${normalizedImages.length}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                loading={safeIndex === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
              <span className="absolute right-4 bottom-4 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-xs font-bold text-white backdrop-blur-md opacity-0 transition-opacity group-hover:opacity-100">
                <ZoomIn className="h-4 w-4" />
                Ampliar
              </span>
            </button>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Images className="h-10 w-10 opacity-40" />
              <span className="text-xs font-semibold uppercase tracking-wider">Imagem indisponível</span>
            </div>
          )}

          {discount !== null && discount !== undefined && discount > 0 && (
            <div className="absolute top-5 left-5 z-20 rounded-2xl bg-primary px-4 py-2 text-lg font-black text-primary-foreground shadow-xl">
              -{discount}%
            </div>
          )}

          {normalizedImages.length > 1 && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(event) => { event.stopPropagation(); prevImage(); }}
                aria-label="Imagem anterior"
                className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/45 text-white backdrop-blur-md hover:bg-black/65 md:flex"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(event) => { event.stopPropagation(); nextImage(); }}
                aria-label="Próxima imagem"
                className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-black/45 text-white backdrop-blur-md hover:bg-black/65 md:flex"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <div className="absolute bottom-4 right-4 z-20 rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md md:hidden">
                {safeIndex + 1} / {normalizedImages.length}
              </div>
            </>
          )}
        </div>

        {normalizedImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-1 py-1 scrollbar-hide snap-x snap-mandatory">
            {normalizedImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Ver imagem ${index + 1}`}
                aria-current={index === safeIndex}
                className={cn(
                  'relative h-16 w-16 shrink-0 snap-start overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-20',
                  index === safeIndex ? 'border-primary ring-2 ring-primary/20' : 'border-glass-border opacity-65 hover:opacity-100'
                )}
              >
                <img src={image} alt="" aria-hidden="true" className="h-full w-full object-cover" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="w-[96vw] max-w-6xl border-glass-border bg-black/95 p-2 sm:p-4">
          <div className="relative flex max-h-[90vh] items-center justify-center overflow-hidden rounded-2xl">
            {currentImage && (
              <img src={currentImage} alt={productName} className="max-h-[86vh] w-auto max-w-full object-contain" />
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setZoomOpen(false)}
              aria-label="Fechar zoom"
              className="absolute right-2 top-2 rounded-full bg-black/55 text-white hover:bg-black/75"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, ZoomIn, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import './ProductGallery.css';

interface ProductGalleryProps {
  images?: string[] | null;
  productName: string;
  discount?: number | null;
  autoPlay?: boolean;
}

export function ProductGallery({ images, productName, discount, autoPlay = false }: ProductGalleryProps) {
  const normalizedImages = useMemo(
    () => (Array.isArray(images) ? Array.from(new Set(images.filter((image): image is string => typeof image === 'string' && image.trim().length > 0))) : []),
    [images]
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const totalImages = normalizedImages.length;
  const hasImages = totalImages > 0;
  const safeIndex = hasImages ? Math.min(currentIndex, totalImages - 1) : 0;
  const currentImage = normalizedImages[safeIndex];

  const nextImage = () => {
    if (totalImages < 2) return;
    setCurrentIndex((index) => (index + 1) % totalImages);
  };

  const prevImage = () => {
    if (totalImages < 2) return;
    setCurrentIndex((index) => (index - 1 + totalImages) % totalImages);
  };

  useEffect(() => {
    if (!autoPlay || totalImages < 2 || zoomOpen) return;
    const timer = window.setInterval(nextImage, 4000);
    return () => window.clearInterval(timer);
  }, [autoPlay, totalImages, zoomOpen]);

  useEffect(() => {
    if (!zoomOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') prevImage();
      if (event.key === 'ArrowRight') nextImage();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [zoomOpen, totalImages]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX;
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (endX === undefined) return;
    const diff = startX - endX;
    if (Math.abs(diff) >= 45) diff > 0 ? nextImage() : prevImage();
  };

  if (!hasImages) {
    return (
      <div className="product-gallery-fallback" role="img" aria-label={`${productName}: imagem indisponível`}>
        <Images className="h-10 w-10 opacity-40" />
        <span>Imagem indisponível</span>
      </div>
    );
  }

  return (
    <>
      <div className="product-gallery-premium">
        <div
          className="gallery-main"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          aria-label={`Galeria de ${productName}`}
        >
          <button type="button" className="gallery-image-button group" onClick={() => setZoomOpen(true)} aria-label={`Ampliar ${productName}`}>
            <img
              src={currentImage}
              alt={`${productName} — imagem ${safeIndex + 1} de ${totalImages}`}
              className="gallery-image"
              loading={safeIndex === 0 ? 'eager' : 'lazy'}
              decoding="async"
              draggable={false}
              onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }}
            />
            <span className="gallery-zoom-hint"><ZoomIn className="h-4 w-4" />Ampliar</span>
          </button>

          {discount !== null && discount !== undefined && discount > 0 && (
            <span className="gallery-discount">-{Math.round(discount)}%</span>
          )}

          {totalImages > 1 && (
            <>
              <Button type="button" variant="ghost" size="icon" onClick={prevImage} aria-label="Imagem anterior" className="gallery-nav gallery-nav-prev">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={nextImage} aria-label="Próxima imagem" className="gallery-nav gallery-nav-next">
                <ChevronRight className="h-5 w-5" />
              </Button>
              <span className="gallery-counter" aria-live="polite">{safeIndex + 1} / {totalImages}</span>
            </>
          )}
        </div>

        {totalImages > 1 && (
          <div className="gallery-thumbnails" role="tablist" aria-label="Imagens do produto">
            {normalizedImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                role="tab"
                aria-selected={index === safeIndex}
                aria-label={`Ver imagem ${index + 1}`}
                onClick={() => setCurrentIndex(index)}
                className={cn('gallery-thumbnail', index === safeIndex && 'is-active')}
              >
                <img src={image} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="gallery-lightbox">
          <div className="gallery-lightbox-stage">
            <img src={currentImage} alt={`${productName} — imagem ${safeIndex + 1} de ${totalImages}`} className="gallery-lightbox-image" />
            {totalImages > 1 && (
              <>
                <Button type="button" variant="ghost" size="icon" onClick={prevImage} aria-label="Imagem anterior" className="gallery-lightbox-nav left-3 sm:left-6">
                  <ChevronLeft />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={nextImage} aria-label="Próxima imagem" className="gallery-lightbox-nav right-3 sm:right-6">
                  <ChevronRight />
                </Button>
                <div className="gallery-lightbox-counter">{safeIndex + 1} / {totalImages}</div>
              </>
            )}
            <Button type="button" variant="ghost" size="icon" onClick={() => setZoomOpen(false)} aria-label="Fechar galeria" className="gallery-lightbox-close">
              <X />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

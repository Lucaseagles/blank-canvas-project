import { MessageSquareText } from 'lucide-react';
import { RatingStars } from './RatingStars';

interface ProductReviewsProps {
  rating?: number | null;
  reviewCount?: number | null;
  reviews?: Array<{ author?: string; rating?: number; comment?: string; date?: string }> | null;
}

export function ProductReviews({ rating, reviewCount, reviews }: ProductReviewsProps) {
  const safeRating = typeof rating === 'number' && Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : null;
  const safeCount = typeof reviewCount === 'number' && Number.isFinite(reviewCount) ? Math.max(0, Math.floor(reviewCount)) : 0;
  const realReviews = Array.isArray(reviews) ? reviews.filter((review) => review && typeof review.comment === 'string' && review.comment.trim()) : [];

  return (
    <section className="space-y-5 rounded-2xl border border-glass-border bg-white/5 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <MessageSquareText className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-black uppercase tracking-wide">Avaliações</h2>
        </div>
        {safeRating !== null && safeCount > 0 && <RatingStars value={safeRating} count={safeCount} showValue size="lg" label="Nota média" />}
      </div>

      {safeRating === null || safeCount <= 0 ? (
        <p className="text-xs leading-relaxed text-muted-foreground">Avaliações do marketplace aparecerão aqui quando houver dados reais disponíveis.</p>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-xl border border-glass-border bg-background/30 px-4 py-3">
            <span className="text-xs text-muted-foreground">Média baseada em dados reais do marketplace</span>
            <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-green-500">Verificado</span>
          </div>
          {realReviews.length > 0 && (
            <div className="space-y-3">
              {realReviews.slice(0, 5).map((review, index) => (
                <article key={`${review.author ?? 'review'}-${index}`} className="rounded-xl border border-glass-border bg-background/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold">{review.author || 'Cliente do marketplace'}</span>
                    {typeof review.rating === 'number' && <RatingStars value={review.rating} size="sm" label={`Avaliação de ${review.author || 'cliente'}`} />}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                  {review.date && <time className="mt-2 block text-[10px] text-muted-foreground/60">{review.date}</time>}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

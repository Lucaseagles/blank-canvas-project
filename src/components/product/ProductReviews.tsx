import { Star } from 'lucide-react';

interface ProductReviewsProps {
  rating?: number | null;
  reviewCount?: number | null;
  reviews?: Array<{ author?: string; rating?: number; comment?: string; date?: string }> | null;
}

function formatCount(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function ProductReviews({ rating, reviewCount, reviews }: ProductReviewsProps) {
  const safeRating = typeof rating === 'number' && Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : null;
  const safeCount = typeof reviewCount === 'number' && Number.isFinite(reviewCount) ? Math.max(0, Math.floor(reviewCount)) : null;
  const realReviews = Array.isArray(reviews)
    ? reviews.filter((review) => review && typeof review.comment === 'string' && review.comment.trim())
    : [];

  if (safeRating === null || safeCount === null || safeCount <= 0) {
    return (
      <section className="rounded-2xl border border-glass-border bg-white/5 p-5">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Star className="h-5 w-5 text-muted-foreground/40" />
          Avaliações
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Avaliações do marketplace aparecerão aqui quando houver dados reais disponíveis.
        </p>
      </section>
    );
  }

  const roundedRating = Math.round(safeRating * 10) / 10;
  return (
    <section className="space-y-5 rounded-2xl border border-glass-border bg-white/5 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5" aria-label={`Nota ${roundedRating} de 5`}>
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} className={`h-5 w-5 ${index < Math.round(safeRating) ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/20'}`} />
            ))}
          </div>
          <strong className="text-lg">{roundedRating.toFixed(1)}</strong>
          <span className="text-xs text-muted-foreground">({formatCount(safeCount)} avaliações)</span>
        </div>
        <span className="w-fit rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-green-500">
          Dados reais do marketplace
        </span>
      </div>

      {realReviews.length > 0 && (
        <div className="space-y-3">
          {realReviews.slice(0, 5).map((review, index) => (
            <article key={`${review.author ?? 'review'}-${index}`} className="rounded-xl border border-glass-border bg-background/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold">{review.author || 'Cliente do marketplace'}</span>
                {typeof review.rating === 'number' && (
                  <div className="flex" aria-label={`Nota ${review.rating} de 5`}>
                    {Array.from({ length: 5 }, (_, star) => (
                      <Star key={star} className={`h-3.5 w-3.5 ${star < Math.round(review.rating ?? 0) ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/20'}`} />
                    ))}
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
              {review.date && <time className="mt-2 block text-[10px] text-muted-foreground/60">{review.date}</time>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

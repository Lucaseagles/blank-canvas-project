import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  value?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  count?: number | null;
  label?: string;
  className?: string;
}

const sizes = { sm: 'h-3.5 w-3.5', md: 'h-4.5 w-4.5', lg: 'h-5.5 w-5.5' } as const;

export function RatingStars({ value, size = 'md', showValue = false, count, label = 'Avaliação', className }: RatingStarsProps) {
  const safeValue = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;
  const rounded = Math.round(safeValue * 10) / 10;
  const accessibleLabel = `${label}: ${rounded.toFixed(1)} de 5${typeof count === 'number' ? `, ${count.toLocaleString('pt-BR')} avaliações` : ''}`;

  return (
    <div className={cn('inline-flex items-center gap-2', className)} aria-label={accessibleLabel}>
      <span className="inline-flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} className={cn(sizes[size], index < Math.round(safeValue) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20')} />
        ))}
      </span>
      {showValue && <span className="font-black tabular-nums">{rounded.toFixed(1)}</span>}
      {typeof count === 'number' && <span className="text-xs text-muted-foreground">({count.toLocaleString('pt-BR')})</span>}
    </div>
  );
}

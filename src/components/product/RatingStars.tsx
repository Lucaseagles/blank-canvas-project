import { Star, StarHalf } from 'lucide-react';
import './RatingStars.css';

interface RatingStarsProps {
  rating: number;
  reviewCount: number;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
  showLabel?: boolean;
  className?: string;
}

const sizes = {
  small: { star: 14, text: '11px', gap: 2 },
  medium: { star: 18, text: '14px', gap: 3 },
  large: { star: 22, text: '16px', gap: 4 },
} as const;

function formatCount(count: number) {
  const safeCount = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  if (safeCount >= 1_000_000) return `${(safeCount / 1_000_000).toFixed(1)}M`;
  if (safeCount >= 1_000) return `${(safeCount / 1_000).toFixed(1)}K`;
  return safeCount.toString();
}

export function RatingStars({
  rating,
  reviewCount,
  size = 'medium',
  showCount = true,
  showLabel = false,
  className = '',
}: RatingStarsProps) {
  const safeRating = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;

  if (safeRating <= 0) return null;

  const s = sizes[size];
  const fullStars = Math.min(5, Math.floor(safeRating));
  const halfStar = safeRating < 5 && safeRating % 1 >= 0.5;
  const emptyStars = Math.max(0, 5 - fullStars - (halfStar ? 1 : 0));
  const accessibleLabel = `Avaliação: ${safeRating.toFixed(1)} de 5${reviewCount > 0 ? `, ${reviewCount.toLocaleString('pt-BR')} avaliações` : ''}`;

  return (
    <div className={`rating-stars ${size} ${className}`.trim()} aria-label={accessibleLabel}>
      <div className="stars-wrapper" aria-hidden="true">
        {Array.from({ length: fullStars }, (_, index) => (
          <Star key={`full-${index}`} size={s.star} fill="currentColor" className="star-icon star-icon--filled" />
        ))}
        {halfStar && <StarHalf size={s.star} fill="currentColor" className="star-icon star-icon--filled" />}
        {Array.from({ length: emptyStars }, (_, index) => (
          <Star key={`empty-${index}`} size={s.star} className="star-icon star-icon--empty" />
        ))}
      </div>

      <span className="rating-number" style={{ fontSize: s.text }}>{safeRating.toFixed(1)}</span>

      {showCount && reviewCount > 0 && (
        <span className="rating-count" style={{ fontSize: s.text }}>({formatCount(reviewCount)})</span>
      )}

      {showLabel && <span className="rating-label" style={{ fontSize: s.text }}>avaliações</span>}
    </div>
  );
}

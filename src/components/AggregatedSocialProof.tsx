import { useQuery } from "@tanstack/react-query";
import { getAggregatedSocialProof } from "@/lib/social-proof.functions";
import { Eye, Heart, TrendingUp } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";

interface AggregatedSocialProofProps {
  productId: string;
  variant?: 'compact' | 'full';
  className?: string;
}

export function AggregatedSocialProof({ productId, variant = 'compact', className = "" }: AggregatedSocialProofProps) {
  const fetchAggregated = useServerFn(getAggregatedSocialProof);
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['aggregatedSocialProof', productId],
    queryFn: () => fetchAggregated({ data: { productId } }),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const views = stats?.views || 0;
  const favorites = stats?.favorites || 0;

  if (isLoading || !stats || (views === 0 && favorites === 0)) return null;

  const timeLabel = (stats.windowHours || 24) <= 24 ? "hoje" : "esta semana";

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {views > 0 && (
          <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-primary/80 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
            <Eye className="w-3 h-3" />
            <span>{views} viram {timeLabel}</span>
          </div>
        )}
        {favorites > 0 && (
          <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter text-red-500/80 bg-red-500/5 px-2 py-0.5 rounded-full border border-red-500/10">
            <Heart className="w-3 h-3 fill-red-500/20" />
            <span>{favorites} favoritaram</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {views > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/10 group hover:bg-primary/10 transition-all">
          <TrendingUp className="w-4 h-4 text-primary animate-pulse" />
          <p className="text-xs font-bold text-foreground/90 uppercase tracking-tight">
            🔥 <span className="text-primary font-black">{views} pessoas</span> viram esta oferta {timeLabel}
          </p>
        </div>
      )}
      {favorites > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-red-500/5 border border-red-500/10 group hover:bg-red-500/10 transition-all">
          <Heart className="w-4 h-4 text-red-500 fill-red-500/20" />
          <p className="text-xs font-bold text-foreground/90 uppercase tracking-tight">
            ❤️ <span className="text-red-500 font-black">{favorites} pessoas</span> favoritaram este item
          </p>
        </div>
      )}
    </div>
  );
}

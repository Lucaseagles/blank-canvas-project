import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCategoryHighlights } from "@/lib/highlights.functions";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "./ProductCard";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface CategoryHighlightsSectionProps {
  categoryId?: string | undefined;
  categoryName?: string | undefined;
  limit?: number;
}

export function CategoryHighlightsSection({ 
  categoryId, 
  categoryName = "Melhores Ofertas", 
  limit = 4 
}: CategoryHighlightsSectionProps) {
  const fetchHighlights = useServerFn(getCategoryHighlights);
  
  const { data: highlights, isLoading } = useQuery({
    queryKey: ["category-highlights", categoryId, limit],
    queryFn: () => fetchHighlights({ data: categoryId ? { categoryId, limit } : { limit } }),
  });

  if (!isLoading && (!highlights || highlights.length === 0)) return null;

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
        <div className="space-y-2">
          <Badge variant="outline" className="rounded-full px-4 border-primary/30 bg-primary/5 text-primary uppercase font-black tracking-widest text-[10px]">
            <Sparkles className="w-3.5 h-3.5 mr-2 animate-pulse" />
            Pico da Categoria
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase">
            Melhores em {categoryName}
          </h2>
        </div>
        
        {categoryId && (
          <div className="group font-bold uppercase tracking-widest text-xs">
            <span className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
              Motor de Descoberta <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          [...Array(limit)].map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-[2.5rem] bg-glass-fallback animate-pulse border border-glass-border" />
          ))
        ) : (
          highlights?.map((product: any) => (
            <div key={product.id} className="relative">
              <div className="absolute -top-3 left-4 z-20 px-3 py-1 bg-primary text-primary-foreground text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl italic">
                Rank #{product.rank}
              </div>
              <ProductCard {...product} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}


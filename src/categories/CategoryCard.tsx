import { Link } from "@tanstack/react-router";
import { ChevronRight, FolderOpen, Sparkles, TrendingUp } from "lucide-react";
import type { CSSProperties } from "react";
import * as Icons from "lucide-react";
import type { Category } from "@/lib/supabase/categories";

function resolveIcon(name?: string | null) {
  if (!name) return FolderOpen;
  const Icon = (Icons as unknown as Record<string, typeof FolderOpen | undefined>)[name];
  return Icon || FolderOpen;
}

interface CategoryCardProps {
  category: Category;
  index?: number;
}

export function CategoryCard({ category, index = 0 }: CategoryCardProps) {
  const color = category.color || "hsl(var(--primary))";
  const style = {
    "--category-color": color,
    "--category-delay": `${index * 55}ms`,
  } as CSSProperties;
  const Icon = resolveIcon(category.icon);
  const productCount = category.product_count ?? 0;
  const isTrending = productCount > 500;
  const isNew = !!category.created_at && Date.now() - new Date(category.created_at).getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <Link
      to="/category/$slug"
      params={{ slug: category.slug }}
      style={style}
      aria-label={`Abrir categoria ${category.name}`}
      className="category-card-premium group relative min-h-[172px] overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-5 shadow-sm backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-[var(--category-color)]/70 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--category-color)]/70 motion-safe:animate-[category-card-in_500ms_cubic-bezier(.16,1,.3,1)_both]"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--category-color)]/15 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--category-color)]/20 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute inset-x-5 bottom-0 h-px origin-left scale-x-0 bg-[var(--category-color)] transition-transform duration-500 group-hover:scale-x-100" />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-background/70 shadow-inner transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1">
            {category.image_url ? (
              <img src={category.image_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            ) : (
              <Icon className="h-7 w-7 text-[var(--category-color)]" aria-hidden="true" />
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            {isTrending && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-500">
                <TrendingUp className="h-3 w-3" aria-hidden="true" /> Em alta
              </span>
            )}
            {isNew && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                <Sparkles className="h-3 w-3" aria-hidden="true" /> Nova
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="truncate font-black tracking-tight text-foreground transition-colors duration-300 group-hover:text-[var(--category-color)]">
              {category.name}
            </h3>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[var(--category-color)]" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs tabular-nums text-muted-foreground">
              {productCount.toLocaleString("pt-BR")} {productCount === 1 ? "produto" : "produtos"}
            </span>
            {category.has_children && <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Subcategorias</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

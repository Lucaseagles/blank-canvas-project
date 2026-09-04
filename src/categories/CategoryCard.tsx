import { Link } from "@tanstack/react-router";
import { ChevronRight, FolderOpen } from "lucide-react";
import * as Icons from "lucide-react";
import type { CSSProperties } from "react";
import type { Category } from "@/lib/supabase/categories";

function resolveIcon(name?: string | null) {
  if (!name) return FolderOpen;
  const Icon = (Icons as Record<string, unknown>)[name];
  return typeof Icon === "object" || typeof Icon === "function" ? Icon as typeof FolderOpen : FolderOpen;
}

export function CategoryCard({ category }: { category: Category }) {
  const style = { "--category-color": category.color || "hsl(var(--primary))" } as CSSProperties;
  const Icon = resolveIcon(category.icon);
  return (
    <Link to="/category/$slug" params={{ slug: category.slug }} style={style} className="group relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--category-color)]/60 hover:shadow-2xl hover:shadow-primary/10">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--category-color)]/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/40 text-2xl">
          {category.image_url ? <img src={category.image_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Icon className="h-7 w-7 text-primary" />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-black tracking-tight">{category.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{(category.product_count ?? 0).toLocaleString("pt-BR")} produtos</p>
          {category.has_children && <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary">Subcategorias <ChevronRight className="h-3 w-3" /></p>}
        </div>
      </div>
    </Link>
  );
}

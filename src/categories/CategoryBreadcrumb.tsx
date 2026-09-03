import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import type { Category } from "@/lib/supabase/categories";

export function CategoryBreadcrumb({ items }: { items: Category[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 overflow-x-auto text-sm text-muted-foreground">
      <Link to="/" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-muted/50 hover:text-foreground">
        <Home className="h-4 w-4" /> Início
      </Link>
      <ChevronRight className="h-4 w-4 shrink-0 opacity-40" />
      <Link to="/categories" className="shrink-0 rounded-lg px-2 py-1.5 hover:bg-muted/50 hover:text-foreground">Categorias</Link>
      {items.map((item, index) => (
        <span key={item.id} className="flex shrink-0 items-center gap-1.5">
          <ChevronRight className="h-4 w-4 opacity-40" />
          {index === items.length - 1 ? (
            <span className="max-w-[220px] truncate px-2 py-1.5 font-medium text-foreground" aria-current="page">{item.name}</span>
          ) : (
            <Link to="/category/$slug" params={{ slug: item.slug }} className="max-w-[220px] truncate rounded-lg px-2 py-1.5 hover:bg-muted/50 hover:text-foreground">{item.name}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}

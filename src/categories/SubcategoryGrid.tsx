import { Link } from "@tanstack/react-router";
import { ChevronRight, FolderOpen } from "lucide-react";
import type { Category } from "@/lib/supabase/categories";

export function SubcategoryGrid({ categories, parentName }: { categories: Category[]; parentName: string }) {
  if (!categories.length) return null;
  return <section className="mb-10 rounded-3xl border border-border/60 bg-card/40 p-5 md:p-6"><div className="mb-4 flex items-center justify-between"><h2 className="font-black">Subcategorias de {parentName}</h2><span className="text-xs text-muted-foreground">{categories.length}</span></div><div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">{categories.map((sub) => <Link key={sub.id} to="/category/$slug" params={{ slug: sub.slug }} className="group flex items-center gap-3 rounded-2xl border border-border/40 bg-background/40 p-3 transition hover:border-primary/30 hover:bg-primary/5"><div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-muted/50">{sub.image_url ? <img src={sub.image_url} alt="" className="h-full w-full object-cover" /> : sub.icon || <FolderOpen className="h-4 w-4 text-primary" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{sub.name}</p><p className="text-xs text-muted-foreground">{(sub.product_count ?? 0).toLocaleString("pt-BR")} produtos</p></div><ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></Link>)}</div></section>;
}

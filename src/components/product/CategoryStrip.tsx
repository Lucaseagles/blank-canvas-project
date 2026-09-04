import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/lib/supabase/categories";

export function CategoryStrip() {
  const { data: categories } = useQuery({
    queryKey: ["categories", "root", "active"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,slug,icon,image_url,color,parent_id,display_order,is_active,created_at")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("display_order", { ascending: true })
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as Category[];
    },
  });

  if (!categories?.length) return null;

  return (
    <div className="w-full overflow-hidden border-b border-glass-border bg-background/50 py-6 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-4 scrollbar-hide">
        <div className="flex min-w-max items-center gap-5">
          {categories.map((cat) => {
            const Icon = (Icons as Record<string, typeof Icons.Package>)[cat.icon || "Package"] || Icons.Package;
            return (
              <Link key={cat.id} to="/category/$slug" params={{ slug: cat.slug }} className="group flex shrink-0 flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/30 transition-all group-hover:scale-105 group-hover:border-primary/40">
                  {cat.image_url ? <img src={cat.image_url} alt="" className="h-full w-full object-cover" /> : <Icon className="h-7 w-7 text-primary" />}
                </div>
                <span className="w-24 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground line-clamp-1">{cat.name}</span>
              </Link>
            );
          })}
          <a href="/categories" className="group flex shrink-0 flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-primary/5 transition-all group-hover:scale-105">
              <ArrowRight className="h-6 w-6 text-primary" />
            </div>
            <span className="w-24 text-center text-[10px] font-bold uppercase tracking-widest text-primary">Ver todas</span>
          </a>
        </div>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import * as Icons from "lucide-react";

export function CategoryStrip() {
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  if (!categories || categories.length === 0) return null;

  return (
    <div className="w-full bg-background/50 backdrop-blur-md border-b border-glass-border py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-hide flex gap-8 items-center justify-between min-w-max md:min-w-0">
        {categories.map((cat, idx) => {
          const Icon = (Icons as any)[cat.icon || "Package"] || Icons.Package;
          const bgColors = [
            'bg-blue-500/10 text-blue-500',
            'bg-purple-500/10 text-purple-500',
            'bg-emerald-500/10 text-emerald-500',
            'bg-amber-500/10 text-amber-500',
            'bg-rose-500/10 text-rose-500',
            'bg-indigo-500/10 text-indigo-500'
          ];
          const colorClass = bgColors[idx % bgColors.length] || bgColors[0];
          const [bgPart, textPart] = colorClass!.split(' ');
          
          return (
            <Link
              key={cat.id}
              to="/category/$slug"
              params={{ slug: cat.slug }}
              className="flex flex-col items-center gap-3 group transition-all shrink-0"
            >
              <div className={`w-16 h-16 rounded-full ${bgPart} border border-white/5 flex items-center justify-center group-hover:scale-110 transition-all shadow-lg`}>
                <Icon className={`w-7 h-7 ${textPart}`} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors text-center w-20 line-clamp-1">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

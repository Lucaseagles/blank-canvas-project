import { useEffect, useMemo, useState } from "react";
import { Grid3X3, Search } from "lucide-react";
import { CategoryCard } from "./CategoryCard";
import { getMainCategories, type Category } from "@/lib/supabase/categories";

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMainCategories().then(setCategories).catch((e) => setError(e instanceof Error ? e.message : "Não foi possível carregar as categorias.")).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => categories.filter((c) => c.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))), [categories, search]);
  const totalProducts = categories.reduce((sum, c) => sum + (c.product_count ?? 0), 0);

  return <main className="container mx-auto max-w-7xl px-4 py-16 md:py-20">
    <header className="mb-10 rounded-[2rem] border border-border/60 bg-card/50 p-6 md:p-8 backdrop-blur-xl">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary"><Grid3X3 className="h-3.5 w-3.5" /> Navegação</div><h1 className="text-4xl font-black tracking-tighter md:text-6xl">Categorias</h1><p className="mt-2 text-muted-foreground">Explore o catálogo por setores e subcategorias.</p></div>
        <label className="flex h-12 w-full max-w-sm items-center gap-3 rounded-2xl border border-border/60 bg-background/60 px-4"><Search className="h-4 w-4 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar categoria..." className="w-full bg-transparent text-sm outline-none" /></label>
      </div>
    </header>
    {loading ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-muted/40" />)}</div> : error ? <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-10 text-center text-sm text-destructive">{error}</div> : filtered.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map((category) => <CategoryCard key={category.id} category={category} />)}</div> : <div className="rounded-3xl border border-dashed border-border p-16 text-center text-muted-foreground">Nenhuma categoria encontrada.</div>}
    <footer className="mt-8 rounded-2xl border border-border/50 bg-card/40 px-5 py-4 text-center text-sm text-muted-foreground">{totalProducts.toLocaleString("pt-BR")} produtos em {categories.length} categorias</footer>
  </main>;
}

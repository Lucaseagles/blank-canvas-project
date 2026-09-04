import { useEffect, useMemo, useState } from "react";
import { Grid3X3, Search, Sparkles, TrendingUp, X } from "lucide-react";
import { CategoryCard } from "./CategoryCard";
import { getMainCategories, type Category } from "@/lib/supabase/categories";

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [trendingOnly, setTrendingOnly] = useState(false);
  const [withProductsOnly, setWithProductsOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await getMainCategories());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar as categorias.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadCategories(); }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return categories.filter((category) => {
      const matchesSearch = !term || category.name.toLocaleLowerCase("pt-BR").includes(term);
      const matchesTrending = !trendingOnly || (category.product_count ?? 0) > 500;
      const matchesProducts = !withProductsOnly || (category.product_count ?? 0) > 0;
      return matchesSearch && matchesTrending && matchesProducts;
    });
  }, [categories, search, trendingOnly, withProductsOnly]);

  const totalProducts = categories.reduce((sum, category) => sum + (category.product_count ?? 0), 0);
  const trendingCount = categories.filter((category) => (category.product_count ?? 0) > 500).length;
  const hasFilters = !!search || trendingOnly || withProductsOnly;

  const clearFilters = () => {
    setSearch("");
    setTrendingOnly(false);
    setWithProductsOnly(false);
  };

  return (
    <main className="container mx-auto max-w-7xl px-4 py-12 md:py-16">
      <header className="relative mb-8 overflow-hidden rounded-[2rem] border border-border/60 bg-card/60 p-6 shadow-elevation-1 backdrop-blur-xl md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              <Grid3X3 className="h-3.5 w-3.5" aria-hidden="true" /> Navegação inteligente
            </div>
            <h1 className="text-4xl font-black tracking-[-0.04em] md:text-6xl">Categorias</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">Explore o catálogo por setores, encontre categorias em alta e navegue direto para os produtos.</p>
          </div>
          <label className="flex h-12 w-full max-w-md items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar categoria..." aria-label="Buscar categoria" className="w-full bg-transparent text-sm outline-none" />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca" className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>}
          </label>
        </div>
        <div className="relative mt-6 flex flex-wrap items-center gap-2 border-t border-border/60 pt-5">
          <button type="button" aria-pressed={trendingOnly} onClick={() => setTrendingOnly((value) => !value)} className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-xs font-bold transition-all ${trendingOnly ? "border-primary/50 bg-primary/10 text-primary shadow-sm" : "border-border/70 bg-background/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}>
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> Em alta
          </button>
          <button type="button" aria-pressed={withProductsOnly} onClick={() => setWithProductsOnly((value) => !value)} className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-xs font-bold transition-all ${withProductsOnly ? "border-primary/50 bg-primary/10 text-primary shadow-sm" : "border-border/70 bg-background/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground"}`}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Com produtos
          </button>
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">{filtered.length.toLocaleString("pt-BR")} de {categories.length.toLocaleString("pt-BR")} categorias</span>
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-label="Carregando categorias">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[172px] animate-pulse rounded-3xl border border-border/50 bg-card/50" />)}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-10 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button type="button" onClick={() => void loadCategories()} className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Tentar novamente</button>
        </div>
      ) : filtered.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((category, index) => <CategoryCard key={category.id} category={category} index={index} />)}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60"><Search className="h-6 w-6 text-muted-foreground" /></div>
          <h2 className="mt-5 font-black">Nenhuma categoria encontrada</h2>
          <p className="mt-2 text-sm text-muted-foreground">Ajuste a busca ou remova os filtros ativos.</p>
          {hasFilters && <button type="button" onClick={clearFilters} className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Limpar filtros</button>}
        </div>
      )}

      <footer className="mt-8 flex flex-col gap-2 rounded-2xl border border-border/50 bg-card/40 px-5 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <span>{totalProducts.toLocaleString("pt-BR")} produtos disponíveis</span>
        <span>{categories.length.toLocaleString("pt-BR")} categorias · {trendingCount.toLocaleString("pt-BR")} em alta</span>
      </footer>
    </main>
  );
}

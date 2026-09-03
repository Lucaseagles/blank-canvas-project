import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Filter, Globe } from "lucide-react";
import { CustomBreadcrumbs } from "@/components/layout/Breadcrumbs";
import { CategoryHighlightsSection } from "@/components/product/CategoryHighlightsSection";
import { getSubcategories, getCategoryBreadcrumb } from "@/lib/supabase/categories";
import { SubcategoryGrid } from "@/categories/SubcategoryGrid";
import { FilterDrawer } from "@/filters/FilterDrawer";
import { useFilters } from "@/filters/useFilters";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug.replace(/-/g, " ")} — Ofertas da Categoria` }, { name: "description", content: "Ofertas verificadas por categoria." }] }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const [showFilters, setShowFilters] = useState(false);
  const { data: category, isLoading: categoryLoading } = useQuery({ queryKey: ["category-info", slug], queryFn: async () => { const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle(); if (error) throw error; return data; } });
  const { data: subcategories = [] } = useQuery({ queryKey: ["category-subs", category?.id], queryFn: () => getSubcategories(category!.id), enabled: !!category?.id });
  const { data: breadcrumb = [] } = useQuery({ queryKey: ["category-breadcrumb", category?.id], queryFn: () => getCategoryBreadcrumb(category!.id), enabled: !!category?.id });
  const filters = useFilters("category", category?.id);
  const products = filters.results;

  if (categoryLoading) return <div className="container mx-auto px-4 py-24"><Skeleton className="h-16 w-1/2" /></div>;
  if (!category) return <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">Categoria não encontrada.</div>;

  return <main className="container mx-auto max-w-7xl px-4 py-16 md:py-20 reveal-on-scroll">
    <CustomBreadcrumbs items={[{ label: "Categorias", to: "/categories" }, ...breadcrumb.map((item) => ({ label: item.name, to: `/category/${item.slug}` as const }))]} />
    <header className="mb-10 mt-8 flex flex-col gap-6 rounded-[2rem] border border-border/60 bg-card/50 p-6 md:flex-row md:items-end md:justify-between md:p-8">
      <div><Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary"><Globe className="mr-2 h-3.5 w-3.5" /> CATEGORIA</Badge><h1 className="text-4xl font-black tracking-tighter md:text-7xl">{category.name}</h1>{category.description && <p className="mt-3 max-w-2xl text-muted-foreground">{category.description}</p>}</div>
      <button onClick={() => setShowFilters(true)} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 font-bold text-primary-foreground"><Filter className="h-4 w-4" /> Filtros {filters.totalResults ? `(${filters.totalResults})` : ""}</button>
    </header>
    <SubcategoryGrid categories={subcategories} parentName={category.name} />
    <CategoryHighlightsSection categoryId={category.id} categoryName={category.name} limit={3} />
    <section className="mt-10"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">Produtos</h2><span className="text-sm text-muted-foreground">{filters.totalResults.toLocaleString("pt-BR")} resultados</span></div>{filters.loading ? <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-[2rem]" />)}</div> : products.length ? <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">{products.map((p: any) => <ProductCard key={p.id} id={p.id} slug={p.slug || ""} title={p.title} price={p.current_price ?? 0} previousPrice={p.previous_price} discount={p.discount} image={p.images?.[0] || ""} marketplace={p.marketplaces?.name || "External"} rating={p.rating} reviewCount={p.review_count} affiliateUrl={p.affiliate_url || null} isBestOffer={p.is_best_offer} offerScore={p.offer_score} />)}</div> : <div className="rounded-3xl border border-dashed border-border p-16 text-center text-muted-foreground">Nenhum produto encontrado com estes filtros.</div>}</section>
    <FilterDrawer isOpen={showFilters} onClose={() => setShowFilters(false)} pageType="category" categoryId={category.id} />
  </main>;
}

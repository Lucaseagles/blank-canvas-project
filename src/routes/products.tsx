import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Filter, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/product/ProductCard';
import { FilterDrawer } from '@/filters/FilterDrawer';
import { useFilters } from '@/filters/useFilters';

export const Route = createFileRoute('/products')({
  head: () => ({ meta: [{ title: 'Catálogo de Produtos — Busca Inteligente' }, { name: 'description', content: 'Explore o catálogo completo com filtros, avaliações e comparação de melhores ofertas.' }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const [showFilters, setShowFilters] = useState(false);
  const filters = useFilters('products');
  return <main className="container mx-auto max-w-7xl px-4 py-16 md:py-20 reveal-on-scroll">
    <div className="mb-10 space-y-4"><Badge variant="outline" className="px-4 py-2 rounded-full border-primary/30 bg-primary/5 text-primary"><Sparkles className="mr-2 h-3.5 w-3.5"/> REGISTRO GLOBAL</Badge><h1 className="text-5xl font-black tracking-tighter md:text-8xl">Catálogo</h1><p className="text-muted-foreground">{filters.totalResults.toLocaleString('pt-BR')} produtos disponíveis</p></div>
    <div className="sticky top-20 z-40 mb-10 flex items-center gap-3 border-y border-glass-border bg-background/80 p-4 backdrop-blur-xl"><div className="flex flex-1 gap-3 overflow-x-auto"><Link to="/products" className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-4 text-sm font-black uppercase text-primary-foreground">Tudo</Link><Link to="/deals" className="inline-flex min-h-[44px] items-center rounded-lg px-4 text-sm font-black uppercase hover:bg-primary/5">Ofertas</Link><Link to="/trending" className="inline-flex min-h-[44px] items-center rounded-lg px-4 text-sm font-black uppercase hover:bg-primary/5">Tendências</Link></div><button type="button" onClick={() => setShowFilters(true)} className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold"><Filter className="h-4 w-4"/> Filtros</button></div>
    {filters.loading ? <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-[2rem]"/>)}</div> : filters.results.length ? <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">{filters.results.map((p: any) => <ProductCard key={p.id} id={p.id} slug={p.slug || ''} categoryId={p.category_id} title={p.title} price={p.current_price ?? 0} previousPrice={p.previous_price} discount={p.discount} image={p.images?.[0] || ''} marketplace={p.marketplaces?.name || 'External'} rating={p.rating} reviewCount={p.review_count} affiliateUrl={p.affiliate_url || null} isBestOffer={p.is_best_offer} offerScore={p.offer_score}/>)}</div> : <div className="rounded-3xl border border-dashed border-border p-16 text-center text-muted-foreground">Nenhum produto encontrado com os filtros atuais.</div>}
    <FilterDrawer isOpen={showFilters} onClose={() => setShowFilters(false)} pageType="products"/>
  </main>;
}

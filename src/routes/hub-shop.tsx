import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { getRetailHubCatalog } from "@/lib/hub-catalog.functions";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ShieldCheck, Search } from "lucide-react";

export const Route = createFileRoute("/hub-shop")({ component: Catalog });
type Product = { id: string; title: string; description: string | null; image_url: string | null; category: string | null; retail_price: number };
type SortOrder = "recent" | "price-asc" | "price-desc" | "title";
const money = (value: number) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Catalog() {
  const load = useServerFn(getRetailHubCatalog);
  const { data = [], isLoading, error, refetch } = useQuery({ queryKey: ["hub-catalog", "retail"], queryFn: () => load() });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<SortOrder>("recent");
  const products = data as Product[];
  const categories = useMemo(() => [...new Set(products.map(p => p.category?.trim()).filter((value): value is string => !!value))].sort((a,b) => a.localeCompare(b,"pt-BR")), [products]);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    const result = products.filter(product => {
      const matchesText = !query || [product.title, product.description ?? "", product.category ?? ""].some(value => value.toLocaleLowerCase("pt-BR").includes(query));
      return matchesText && (!category || product.category?.trim() === category);
    });
    if (sort === "price-asc") result.sort((a,b) => Number(a.retail_price) - Number(b.retail_price));
    if (sort === "price-desc") result.sort((a,b) => Number(b.retail_price) - Number(a.retail_price));
    if (sort === "title") result.sort((a,b) => a.title.localeCompare(b.title,"pt-BR"));
    return result;
  }, [products, search, category, sort]);
  return <main className="min-h-screen px-4 pb-24 pt-32"><div className="mx-auto max-w-7xl space-y-8">
    <header className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-blue-500/10 p-8 md:p-12">
      <div className="mb-5 flex items-center gap-3 text-primary"><ShoppingBag className="h-8 w-8" /><span className="text-xs font-black uppercase tracking-widest">Hub Eagles · Seleção especial</span></div>
      <h1 className="text-4xl font-black tracking-tight md:text-6xl">Produtos selecionados para você.</h1>
      <p className="mt-5 max-w-2xl text-muted-foreground">Explore o catálogo de fornecedores parceiros, incluindo produtos Kairos quando disponíveis, com preços cadastrados para o consumidor final.</p>
    </header>
    {isLoading && <p role="status">Carregando catálogo...</p>}
    {error && <div role="alert" className="rounded-2xl border border-primary/20 p-6"><p>{error instanceof Error ? error.message : "Não foi possível carregar."}</p><Button className="mt-4" onClick={() => void refetch()}>Tentar novamente</Button></div>}
    {!isLoading && !error && products.length === 0 && <div className="rounded-3xl border bg-card/70 p-12 text-center"><ShieldCheck className="mx-auto mb-5 h-10 w-10 text-primary" /><h2 className="text-2xl font-bold">Catálogo em preparação</h2><p className="mt-3 text-muted-foreground">Estamos cadastrando produtos e validando condições com os fornecedores. Nenhum preço foi inventado.</p></div>}
    {!isLoading && !error && products.length > 0 && <>
      <section aria-label="Pesquisar e filtrar produtos" className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,200px)_minmax(0,200px)]">
        <label className="space-y-2 text-sm font-semibold"><span>Buscar produtos</span><span className="relative block"><Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome, categoria ou descrição" className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-3" /></span></label>
        <label className="space-y-2 text-sm font-semibold"><span>Categoria</span><select value={category} onChange={event => setCategory(event.target.value)} className="block w-full rounded-lg border bg-background p-2.5"><option value="">Todas as categorias</option>{categories.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="space-y-2 text-sm font-semibold"><span>Ordenar por</span><select value={sort} onChange={event => setSort(event.target.value as SortOrder)} className="block w-full rounded-lg border bg-background p-2.5"><option value="recent">Mais recentes</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option><option value="title">Nome A–Z</option></select></label>
      </section>
      <p role="status" className="text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "produto encontrado" : "produtos encontrados"} no catálogo carregado.</p>
      {filtered.length === 0 && <div className="rounded-2xl border p-8 text-center"><p>Nenhum produto corresponde aos filtros.</p><Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setCategory(""); setSort("recent"); }}>Limpar filtros</Button></div>}
      <section aria-label="Produtos para consumidor" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(product => <article key={product.id} className="overflow-hidden rounded-3xl border bg-card/70">
          <div className="aspect-[4/3] bg-muted/30">{product.image_url && <img src={product.image_url} alt={product.title} loading="lazy" className="h-full w-full object-cover" />}</div>
          <div className="space-y-3 p-6"><p className="text-xs font-bold uppercase tracking-widest text-primary">{product.category ?? "Seleção Hub Eagles"}</p><h2 className="text-xl font-bold">{product.title}</h2>{product.description && <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>}<p className="text-2xl font-black">{money(product.retail_price)}</p><p className="text-xs text-muted-foreground">Preço de varejo cadastrado pela Hub Eagles.</p><p className="text-xs text-muted-foreground">Compra e logística serão disponibilizadas após integração do fornecedor.</p></div>
        </article>)}
      </section>
      <p className="text-xs text-muted-foreground">Busca e filtros abrangem os produtos carregados nesta página, não todo o estoque dos fornecedores.</p>
    </>}
  </div></main>;
}

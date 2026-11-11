import {createFileRoute,Link} from "@tanstack/react-router";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {useMemo,useState} from "react";
import {getRetailHubCatalog} from "@/lib/hub-catalog.functions";
import {RubiStorefrontStories} from "@/components/store/RubiStorefrontStories";
import {RubiStorefrontSections} from "@/components/store/RubiStorefrontSections";
import {Button} from "@/components/ui/button";
import {ArrowRight,ArrowUpRight,CheckCircle2,ChevronRight,PlayCircle,Search,ShoppingBag,SlidersHorizontal,Sparkles,Store,Truck,Users,Video} from "lucide-react";

export const Route=createFileRoute("/hub-shop")({
 head:()=>({meta:[{title:"RUBI Eagles Store — Loja online oficial"},{name:"description",content:"Explore nossa vitrine de produtos selecionados de fornecedores autorizados. Conheça ofertas e compre pelo checkout oficial."}]}),
 component:Catalog
});
type Product={id:string;title:string;description:string|null;image_url:string|null;category:string|null;retail_price:number};
type SortOrder="recent"|"price-asc"|"price-desc"|"title";
const money=(v:number)=>Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const link="/hub-product/$productId" as const;
function ProductTile({product,index=0}:{product:Product;index?:number}){
 return <article className="group flex min-w-0 flex-col overflow-hidden rounded-[1.6rem] border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/5">
  <Link to={link} params={{productId:product.id}} aria-label={`Conhecer ${product.title}`} className="relative block aspect-[4/4.3] overflow-hidden bg-gradient-to-br from-muted/60 to-muted/20">
   {product.image_url?<img src={product.image_url} alt={product.title} loading={index<2?"eager":"lazy"} className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/>:<div className="flex h-full items-center justify-center"><ShoppingBag aria-hidden="true" className="h-16 w-16 text-muted-foreground/30"/></div>}
   <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full border border-white/20 bg-background/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide shadow-sm backdrop-blur">{product.category?.trim()||"Seleção RUBI"}</span>
   <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/95 text-foreground shadow-md transition group-hover:bg-primary group-hover:text-primary-foreground"><ArrowUpRight className="h-5 w-5"/></span>
  </Link>
  <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
   <h3 className="line-clamp-2 min-h-[2.75rem] text-base font-extrabold leading-snug tracking-tight sm:text-lg">{product.title}</h3>
   {product.description&&<p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{product.description}</p>}
   <div className="mt-auto space-y-3 pt-3">
    <p className="text-[11px] text-muted-foreground">Preço de varejo</p>
    <p className="text-xl font-black tracking-tight sm:text-2xl">{money(product.retail_price)}</p>
    <Button asChild className="w-full rounded-xl font-bold"><Link to={link} params={{productId:product.id}}>Ver oferta <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
   </div>
  </div>
 </article>;
}
function Catalog(){
 const load=useServerFn(getRetailHubCatalog);
 const {data=[],isLoading,error,refetch}=useQuery({queryKey:["hub-catalog","retail"],queryFn:()=>load(),retry:false});
 const products=data as Product[];
 const [search,setSearch]=useState("");
 const [category,setCategory]=useState("");
 const [sort,setSort]=useState<SortOrder>("recent");
 const categories=useMemo(()=>[...new Set(products.map(p=>p.category?.trim()).filter((x):x is string=>!!x))].sort((a,b)=>a.localeCompare(b,"pt-BR")),[products]);
 const filtered=useMemo(()=>{
  const term=search.trim().toLocaleLowerCase("pt-BR");
  const matching=products.filter(p=>(!term||[p.title,p.description??"",p.category??""].some(v=>v.toLocaleLowerCase("pt-BR").includes(term)))&&(!category||p.category?.trim()===category));
  if(sort==="price-asc")matching.sort((a,b)=>Number(a.retail_price)-Number(b.retail_price));
  if(sort==="price-desc")matching.sort((a,b)=>Number(b.retail_price)-Number(a.retail_price));
  if(sort==="title")matching.sort((a,b)=>a.title.localeCompare(b.title,"pt-BR"));
  return matching;
 },[products,search,category,sort]);
 const featured=products[0];
 const clear=()=>{setSearch("");setCategory("");setSort("recent");};
 return <main className="min-h-screen bg-background pb-28 pt-24 sm:pt-28">
  <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
   <nav aria-label="Trilha de navegação" className="flex items-center gap-2 text-xs text-muted-foreground"><Link to="/" className="hover:text-primary">RUBI Eagles</Link><ChevronRight className="h-3.5 w-3.5"/><span className="font-semibold text-foreground">Loja oficial</span></nav>
   <section className="relative isolate overflow-hidden rounded-[2rem] border border-primary/15 bg-slate-950 text-white shadow-2xl shadow-slate-950/10 dark:bg-slate-900">
    <div className="pointer-events-none absolute -right-20 -top-32 h-[24rem] w-[24rem] rounded-full bg-violet-500/25 blur-3xl"/>
    <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl"/>
    <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:p-14">
     <div className="max-w-2xl space-y-6">
      <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[.18em] text-white/90"><Sparkles className="h-4 w-4 text-violet-300"/> RUBI EAGLES · STORE</p>
      <h1 className="text-4xl font-black leading-[1.05] tracking-[-.05em] sm:text-5xl lg:text-6xl">Sua próxima descoberta <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-sky-300 bg-clip-text text-transparent">começa aqui.</span></h1>
      <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">Uma vitrine feita para explorar, descobrir e conhecer produtos de fornecedores autorizados. Cada oferta tem sua própria história, condições e caminho de compra.</p>
      <div className="flex flex-wrap gap-3">
       <a href="#rubi-products" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-violet-100">Explorar produtos <ArrowRight className="ml-2 h-4 w-4"/></a>
       <Link to="/videos" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"><PlayCircle className="mr-2 h-4 w-4"/> Ver vídeos</Link>
      </div>
     </div>
     <div className="relative flex min-h-[230px] items-center justify-center sm:min-h-[320px]">
      {featured?.image_url?<Link to={link} params={{productId:featured.id}} className="group relative block w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl"><img src={featured.image_url} alt={featured.title} className="aspect-square w-full object-cover transition duration-700 group-hover:scale-105"/><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-5"><p className="text-[10px] font-black uppercase tracking-widest text-violet-200">Explore na vitrine</p><p className="mt-1 line-clamp-2 text-lg font-bold">{featured.title}</p><p className="text-xl font-black">{money(featured.retail_price)}</p></div></Link>:
       <div className="relative flex aspect-square w-full max-w-xs items-center justify-center rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-violet-400/20 via-sky-400/10 to-transparent shadow-2xl"><ShoppingBag className="h-28 w-28 text-white/70"/><div className="absolute -bottom-5 -left-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black backdrop-blur-xl">Descubra a RUBI Store</div></div>}
     </div>
    </div>
   </section>
   <section aria-label="Como navegar pela RUBI" className="grid gap-3 md:grid-cols-3">
    <div className="flex items-start gap-3 rounded-2xl border bg-card p-4"><Store className="mt-1 h-5 w-5 shrink-0 text-primary"/><div><p className="font-bold">Uma loja, muitas descobertas</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Explore categorias e ofertas reais em uma vitrine central.</p></div></div>
    <Link to="/wholesale" className="group flex items-start gap-3 rounded-2xl border bg-card p-4 hover:border-primary/40"><Truck className="mt-1 h-5 w-5 shrink-0 text-primary"/><div><p className="font-bold">É lojista? <ArrowUpRight className="inline h-4 w-4"/></p><p className="mt-1 text-xs leading-5 text-muted-foreground">Consulte o atacado no espaço comercial com acesso próprio.</p></div></Link>
    <Link to="/partner/portal" className="group flex items-start gap-3 rounded-2xl border bg-card p-4 hover:border-primary/40"><Users className="mt-1 h-5 w-5 shrink-0 text-primary"/><div><p className="font-bold">É parceiro? <ArrowUpRight className="inline h-4 w-4"/></p><p className="mt-1 text-xs leading-5 text-muted-foreground">Acesse seus produtos autorizados e links próprios de divulgação.</p></div></Link>
   </section>
   <section className="relative overflow-hidden rounded-[1.75rem] border bg-card p-5 sm:p-7">
    <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto]">
     <div><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-primary"><Video className="h-4 w-4"/> RUBI STORIES · VIDEO COMMERCE</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Descubra além da foto.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Veja demonstrações e conteúdo em vídeo no feed. As páginas da loja apresentam os detalhes e as condições oficiais de cada oferta.</p></div>
     <Button variant="outline" size="lg" asChild className="rounded-xl"><Link to="/videos">Explorar vídeos <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
    </div>
   </section>
   <RubiStorefrontSections />
   <RubiStorefrontStories />
   <section id="rubi-products" className="scroll-mt-28 space-y-6" aria-label="Vitrine de produtos RUBI">
    <div className="flex flex-wrap items-end justify-between gap-3">
     <div><p className="text-[10px] font-black uppercase tracking-[.22em] text-primary">RUBI EDIT · SUA VITRINE</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Explore a coleção</h2><p className="mt-2 text-sm text-muted-foreground">Produtos com fornecedor ativo, preço cadastrado e checkout oficial validado.</p></div>
     <span className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary"/> Conferência de disponibilidade por produto</span>
    </div>
    {isLoading&&<div role="status" className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{[0,1,2,3,4,5,6,7].map(i=><div key={i} className="animate-pulse overflow-hidden rounded-3xl border bg-card"><div className="aspect-[4/4.3] bg-muted"/><div className="space-y-3 p-4"><div className="h-5 w-4/5 rounded bg-muted"/><div className="h-4 w-1/2 rounded bg-muted"/></div></div>)}</div>}
    {error&&<div role="alert" className="rounded-2xl border p-6"><p className="font-bold">Não foi possível carregar a vitrine.</p><p className="mt-2 text-sm text-muted-foreground">{error instanceof Error?error.message:"Falha ao consultar o catálogo."}</p><Button className="mt-4" onClick={()=>void refetch()}>Tentar novamente</Button></div>}
    {!isLoading&&!error&&products.length===0&&<div className="rounded-3xl border border-dashed bg-card p-10 text-center sm:p-16"><ShoppingBag className="mx-auto h-12 w-12 text-primary/70"/><h3 className="mt-5 text-2xl font-black">A vitrine está sendo preparada</h3><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Os produtos aparecerão aqui depois do cadastro e da aprovação dos fornecedores e dos links oficiais de compra. Nenhum preço ou estoque fictício será exibido.</p><Button className="mt-6" asChild variant="outline"><Link to="/videos">Conhecer o feed de vídeos</Link></Button></div>}
    {!isLoading&&!error&&products.length>0&&<>
     <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-primary"/><span className="text-sm font-extrabold">Encontre o seu produto</span><span className="ml-auto text-xs text-muted-foreground">{filtered.length} de {products.length} produtos carregados</span></div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
       <label className="relative block"><span className="sr-only">Buscar produtos</span><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Busque por nome, descrição ou categoria" className="h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm"/></label>
       <label><span className="sr-only">Ordenar produtos</span><select value={sort} onChange={e=>setSort(e.target.value as SortOrder)} className="h-11 w-full rounded-xl border bg-background px-3 text-sm"><option value="recent">Mais recentes</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option><option value="title">Nome A–Z</option></select></label>
      </div>
      {categories.length>0&&<div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por categoria">
       <button type="button" aria-pressed={!category} onClick={()=>setCategory("")} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${!category?"border-primary bg-primary text-primary-foreground":"bg-background hover:border-primary/50"}`}>Tudo</button>
       {categories.map(value=><button type="button" key={value} aria-pressed={category===value} onClick={()=>setCategory(value)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${category===value?"border-primary bg-primary text-primary-foreground":"bg-background hover:border-primary/50"}`}>{value}</button>)}
      </div>}
     </div>
     {filtered.length===0?<div className="rounded-2xl border p-8 text-center"><p className="font-semibold">Não encontramos produtos com esses filtros.</p><Button className="mt-4" variant="outline" onClick={clear}>Limpar filtros</Button></div>:
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{filtered.map((product,index)=><ProductTile key={product.id} product={product} index={index}/>)}</div>}
     <p className="text-xs text-muted-foreground">Os resultados mostram os produtos carregados no catálogo. Preço e condições finais são confirmados no checkout do fornecedor.</p>
    </>}
   </section>
   <footer className="rounded-[1.7rem] border bg-card px-6 py-8 sm:px-10">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[11px] font-black uppercase tracking-widest text-primary">RUBI EAGLES</p><h2 className="mt-2 text-xl font-black">Sua experiência começa na descoberta.</h2><p className="mt-2 max-w-2xl text-xs text-muted-foreground">Varejo, atacado e parcerias possuem regras e acessos próprios. Não anunciamos frete grátis ou descontos sem condições oficiais verificadas.</p></div><Link to="/videos" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">Ver histórias em vídeo <ArrowRight className="h-4 w-4"/></Link></div>
   </footer>
  </div>
 </main>;
}

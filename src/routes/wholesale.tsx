import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMerchantHubCatalog } from "@/lib/hub-catalog.functions";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Store, ShieldCheck } from "lucide-react";
export const Route=createFileRoute("/wholesale")({component:Catalog});
function Catalog(){
 const load=useServerFn(getMerchantHubCatalog);
 const {data=[],isLoading,error,refetch}=useQuery({queryKey:["hub-catalog","b2b"],queryFn:()=>load()});
 return <main className="min-h-screen px-4 pb-24 pt-32"><div className="mx-auto max-w-7xl space-y-10">
 <header className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-blue-500/10 p-8 md:p-12"><div className="mb-5 flex items-center gap-3 text-primary"><Store className="h-8 w-8"/><span className="text-xs font-black uppercase tracking-widest">Hub Eagles · Negócios</span></div><h1 className="text-4xl font-black tracking-tight md:text-6xl">Abasteça seu negócio.</h1><p className="mt-5 max-w-2xl text-muted-foreground">Preços comerciais exclusivos para lojistas aprovados. Condições por volume dependem do produto e do fornecedor.</p></header>
 {isLoading&&<p>Carregando catálogo...</p>}
 {error&&<div role="alert" className="rounded-2xl border border-primary/20 p-6"><p>{error instanceof Error?error.message:"Não foi possível carregar."}</p><Button className="mt-4" onClick={()=>void refetch()}>Tentar novamente</Button><Button variant="outline" className="ml-2 mt-4" asChild><Link to="/onboarding" search={{audience:"merchant"}}>Solicitar acesso</Link></Button></div>}
 {!isLoading&&!error&&data.length===0&&<div className="rounded-3xl border border-white/10 bg-card/70 p-12 text-center"><ShieldCheck className="mx-auto mb-5 h-10 w-10 text-primary"/><h2 className="text-2xl font-bold">Catálogo em preparação</h2><p className="mt-3 text-muted-foreground">Estamos cadastrando produtos e validando condições com os fornecedores. Nenhum preço foi inventado.</p></div>}
 <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{(data as any[]).map(p=><article key={p.id} className="overflow-hidden rounded-3xl border border-white/10 bg-card/70"><div className="aspect-[4/3] bg-muted/30">{p.image_url&&<img src={p.image_url} alt={p.title} loading="lazy" className="h-full w-full object-cover"/>}</div><div className="space-y-3 p-6"><p className="text-xs font-bold uppercase tracking-widest text-primary">{p.category??"Seleção Hub Eagles"}</p><h2 className="text-xl font-bold">{p.title}</h2><p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p><p className="text-2xl font-black">{Number(p.b2b_base_price).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</p><p className="text-sm text-muted-foreground">Pedido mínimo: {p.min_b2b_quantity} unidades</p><div className="space-y-1 text-xs text-muted-foreground">{(p.hub_b2b_tiers??[]).map((t:any)=><p key={t.min_quantity}>A partir de {t.min_quantity} un.: {Number(t.unit_price).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}/un.</p>)}</div><p className="text-xs text-muted-foreground">Compra e logística serão disponibilizadas após integração do fornecedor.</p></div></article>)}</div>
 </div></main>;
}

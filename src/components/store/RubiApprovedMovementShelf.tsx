import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Sparkles } from "lucide-react";
import { getRubiApprovedMovementFeed } from "@/lib/rubi-movement-feed.functions";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Approved RUBI discovery ranked by account category interests, with anonymous fallback. */
export function RubiApprovedMovementShelf() {
 const load = useServerFn(getRubiApprovedMovementFeed);
 const [identity,setIdentity] = useState<{userId:string|null;accessToken:string|null}|null>(null);
 useEffect(()=>{
  let active=true;
  const refresh=()=>{void supabase.auth.getSession().then(({data})=>{
   if(active)setIdentity({userId:data.session?.user.id??null,accessToken:data.session?.access_token??null});
  }).catch(()=>{if(active)setIdentity({userId:null,accessToken:null});});};
  refresh();
  const {data:subscription}=supabase.auth.onAuthStateChange(()=>refresh());
  return ()=>{active=false;subscription.subscription.unsubscribe();};
 },[]);
 const query = useQuery({
  queryKey:["rubi-approved-movement-feed",identity?.userId??"anonymous"],
  queryFn:()=>load({data:{userId:identity!.userId,accessToken:identity!.accessToken}}),
  enabled:identity!==null,retry:false,staleTime:60000,refetchOnWindowFocus:"always"
 });
 if (identity===null) return <section aria-label="Movimentos oficiais RUBI" className="mb-12 rounded-3xl border border-primary/20 p-5"><p role="status" className="text-sm text-muted-foreground">Preparando ofertas oficiais da RUBI...</p></section>;
 if (query.isLoading) return <section aria-label="Movimentos oficiais RUBI" className="mb-12 rounded-3xl border border-primary/20 p-5"><p role="status" className="text-sm text-muted-foreground">Carregando ofertas oficiais...</p></section>;
 if (query.isError) return <section aria-label="Movimentos oficiais RUBI" className="mb-12 space-y-3 rounded-3xl border border-primary/20 p-5"><p role="alert" className="text-sm">Não foi possível consultar as ofertas oficiais agora.</p><button type="button" className="rounded-xl border px-4 py-2 text-sm font-semibold" onClick={()=>void query.refetch()}>Tentar novamente</button><a href="/hub-shop" className="ml-3 text-sm font-semibold text-primary underline">Ver loja principal</a></section>;
 if (!query.data?.length) return <section aria-label="Movimentos oficiais RUBI" className="mb-12 space-y-3 rounded-3xl border border-primary/20 p-5"><h2 className="font-bold">Ofertas oficiais da RUBI</h2><p className="text-sm text-muted-foreground">Ainda não há movimentos publicados e elegíveis. Você pode explorar a loja principal sem depender de recomendações personalizadas.</p><a href="/hub-shop" className="inline-flex rounded-xl border px-4 py-2 text-sm font-bold">Explorar a RUBI Store</a></section>;
 return <section aria-label="Movimentos oficiais RUBI" className="mb-12 space-y-5 rounded-3xl border border-primary/20 bg-card p-5 sm:p-8">
  <header className="space-y-2">
   <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Sparkles className="h-4 w-4"/> RUBI Eagles · Movimentos</p>
   <h2 className="text-2xl font-black sm:text-3xl">Ofertas especiais da RUBI</h2>
   <p className="max-w-2xl text-sm text-muted-foreground">Lançamentos e páginas oficiais revisados pela RUBI. Seleção com prioridade para categorias do seu interesse quando disponíveis, mantendo espaço para descobrir novidades.</p>
  </header>
  {identity.userId&&<p className="text-xs text-muted-foreground">As preferências de categorias podem ser alteradas no <a href="/profile" className="font-semibold text-primary underline">seu perfil</a>. A seleção não usa características pessoais sensíveis.</p>}
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
   {query.data.map(item=><article key={item.productId} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-background">
    <div className="aspect-video bg-muted/40">
     {item.imageUrl?<img src={item.imageUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center"><Sparkles className="h-12 w-12 text-muted-foreground/40"/></div>}
    </div>
    <div className="flex flex-1 flex-col gap-3 p-4">
     <p className="text-xs font-bold uppercase text-primary">{item.category||"Seleção RUBI"}</p>
     <h3 className="line-clamp-2 text-lg font-black">{item.headline}</h3>
     <p className="line-clamp-3 text-sm text-muted-foreground">{item.promise}</p>
     <p className="mt-auto text-lg font-bold">{money(item.price)}</p>
     <a href={item.href} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">Conhecer a oferta <ArrowRight className="ml-2 h-4 w-4"/></a>
    </div>
   </article>)}
  </div>
  <p className="text-xs text-muted-foreground">Condições e disponibilidade devem ser confirmadas no checkout oficial. Visualizações e cliques não representam pedidos pagos.</p>
 </section>;
}

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Sparkles } from "lucide-react";
import { getRubiApprovedMovementFeed } from "@/lib/rubi-movement-feed.functions";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Public, approved discovery. This does not claim personalized targeting. */
export function RubiApprovedMovementShelf() {
 const load = useServerFn(getRubiApprovedMovementFeed);
 const query = useQuery({ queryKey:["rubi-approved-movement-feed"],queryFn:()=>load(),retry:false,staleTime:60000 });
 if (!query.data?.length) return null;
 return <section aria-label="Movimentos oficiais RUBI" className="mb-12 space-y-5 rounded-3xl border border-primary/20 bg-card p-5 sm:p-8">
  <header className="space-y-2">
   <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Sparkles className="h-4 w-4"/> RUBI Eagles · Movimentos</p>
   <h2 className="text-2xl font-black sm:text-3xl">Ofertas especiais da RUBI</h2>
   <p className="max-w-2xl text-sm text-muted-foreground">Lançamentos e páginas oficiais revisados pela RUBI. Seleção editorial; recomendações individuais ainda dependem da ativação do motor de interesses.</p>
  </header>
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

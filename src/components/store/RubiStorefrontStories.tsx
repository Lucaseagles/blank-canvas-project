import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Link} from "@tanstack/react-router";
import {ArrowRight,PlayCircle} from "lucide-react";
import {getRubiStorefrontStories} from "@/lib/rubi-storefront-stories.functions";
const brl=(value:number)=>value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function RubiStorefrontStories(){
 const load=useServerFn(getRubiStorefrontStories);
 const query=useQuery({queryKey:["rubi-storefront-stories"],queryFn:()=>load(),retry:false,staleTime:60000});
 if(query.isLoading)return <section aria-label="Stories da loja" role="status" className="rounded-3xl border bg-card p-6 text-sm text-muted-foreground">Preparando histórias da loja...</section>;
 if(query.isError)return <section aria-label="Stories da loja" className="rounded-3xl border bg-card p-6"><h2 className="text-xl font-bold">Histórias temporariamente indisponíveis</h2><p className="mt-2 text-sm text-muted-foreground">A vitrine de produtos continua disponível normalmente.</p><button className="mt-3 text-sm font-bold text-primary underline" type="button" onClick={()=>void query.refetch()}>Tentar novamente</button></section>;
 if(!query.data?.length)return null;
 return <section aria-label="Vídeos reais de produtos da loja" className="space-y-5">
  <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-primary"><PlayCircle className="h-4 w-4"/> RUBI STORIES · MARCA PRÓPRIA</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Histórias que mostram mais</h2><p className="mt-2 text-sm text-muted-foreground">Conheça demonstrações aprovadas de produtos disponíveis na nossa loja.</p></div><Link className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline" to="/videos">Abrir feed geral <ArrowRight className="h-4 w-4"/></Link></header>
  <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:gap-5">
   {query.data.map(story=><article key={story.id} className="w-[min(76vw,280px)] shrink-0 snap-start overflow-hidden rounded-[1.5rem] border bg-card shadow-sm sm:w-[280px]">
    <div className="relative aspect-[9/12] bg-slate-950">
     <video controls playsInline preload="none" poster={story.posterUrl??undefined} src={story.videoUrl} aria-label={story.title} className="h-full w-full object-contain"/>
    </div>
    <div className="flex min-h-44 flex-col gap-2 p-4"><h3 className="line-clamp-2 text-base font-black">{story.title}</h3><p className="line-clamp-1 text-xs text-muted-foreground">{story.productTitle}</p><p className="mt-auto text-lg font-black">{brl(story.retailPrice)}</p><Link to="/hub-product/$productId" params={{productId:story.productId}} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-bold text-primary-foreground">Conhecer produto <ArrowRight className="h-4 w-4"/></Link></div>
   </article>)}
  </div>
  <p className="text-xs text-muted-foreground">Vídeos são demonstrações editoriais, não comprovantes de resultados ou compras. Condições finais no checkout oficial.</p>
 </section>;
}

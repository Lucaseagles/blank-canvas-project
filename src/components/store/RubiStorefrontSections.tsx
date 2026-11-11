import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Link} from "@tanstack/react-router";
import {ArrowRight,PlayCircle} from "lucide-react";
import {trackEvent} from "@/lib/analytics";
import {rememberRubiEditorialClick} from "@/lib/rubi-editorial-context";
import {getRubiStorefrontPublishedSections} from "@/lib/rubi-storefront-sections.functions";
const money=(price:number)=>price.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export function RubiStorefrontSections(){
 const load=useServerFn(getRubiStorefrontPublishedSections);
 const query=useQuery({queryKey:["rubi-storefront-sections-public"],queryFn:()=>load(),retry:false,staleTime:60000});
 if(!query.data?.length)return null;
 return <div className="space-y-8" aria-label="Coleções editoriais da RUBI">
  {query.data.map(section=><section key={section.id} className="space-y-4 rounded-[2rem] border bg-card p-5 sm:p-8">
   <header><p className="text-[10px] font-black uppercase tracking-[.18em] text-primary">{section.kind==="hero"?"Destaque da RUBI":"Coleção RUBI"}</p>
    <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{section.title}</h2>
    {section.subtitle&&<p className="mt-2 max-w-2xl text-sm text-muted-foreground">{section.subtitle}</p>}</header>
   <div className={section.kind==="hero"?"grid gap-4 sm:grid-cols-2 lg:grid-cols-3":"flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3"}>
    {section.products.map(p=><Link key={p.id} to="/hub-product/$productId" params={{productId:p.id}}
     onClick={()=>{rememberRubiEditorialClick(section.id,p.id);void trackEvent("RUBI_STOREFRONT_SECTION_CLICK",{section_id:section.id,product_id:p.id,source:"rubi_store_collection",interaction:"card_click",sales_status:"view_only"},{productId:p.id,source:"rubi_store_collection"});}}
     className={`group overflow-hidden rounded-2xl border bg-background hover:border-primary/40 ${section.kind==="hero"?"":"w-52 shrink-0 snap-start sm:w-60"}`}>
     <div className="relative aspect-square overflow-hidden bg-muted">{p.image_url?<img src={p.image_url} alt={p.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105"/>:<div className="flex h-full items-center justify-center text-xs text-muted-foreground">Imagem não disponível</div>}{p.story&&<span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-background/95 px-3 py-1.5 text-[11px] font-bold text-foreground shadow"><PlayCircle className="h-3.5 w-3.5"/> Vídeo disponível</span>}</div>
     <div className="space-y-2 p-4"><h3 className="line-clamp-2 text-sm font-bold">{p.title}</h3><p className="text-lg font-black">{money(p.retail_price)}</p><span className="inline-flex items-center gap-1 text-xs font-bold text-primary">Ver produto <ArrowRight className="h-3 w-3"/></span></div>
    </Link>)}
   </div>
  </section>)}
 </div>;
}

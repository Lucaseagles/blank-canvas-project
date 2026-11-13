import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {PlayCircle} from "lucide-react";
import {listRubiApprovedProductStories} from "@/lib/rubi-product-stories.functions";
export function RubiProductStories({productId}:{productId:string}){
 const load=useServerFn(listRubiApprovedProductStories);
 const query=useQuery({queryKey:["rubi-product-stories-public",productId],retry:false,staleTime:30000,queryFn:()=>load({data:{productId}})});
 if(!query.data?.length)return null;
 return <section aria-label="Histórias e vídeos deste produto" className="space-y-5 rounded-[2rem] border bg-card p-5 sm:p-8">
  <header className="space-y-2"><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-primary"><PlayCircle className="h-4 w-4"/> RUBI STORIES · Marca Própria</p><h2 className="text-2xl font-black tracking-tight sm:text-3xl">Veja o produto em ação</h2><p className="text-sm text-muted-foreground">Vídeos e narrativas comerciais publicados após aprovação. Consulte sempre os detalhes e as condições oficiais da oferta.</p></header>
  <div className="grid gap-5 md:grid-cols-2">{query.data.map((story:{id:string;title:string;description:string;video_url:string;poster_url:string|null})=><article key={story.id} className="overflow-hidden rounded-2xl border bg-background">
   <video src={story.video_url} poster={story.poster_url||undefined} controls playsInline preload="metadata" className="aspect-video w-full bg-black object-contain">Seu navegador não suporta este vídeo.</video>
   <div className="space-y-2 p-5"><h3 className="text-lg font-black">{story.title}</h3><p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{story.description}</p></div>
  </article>)}</div>
 </section>;
}

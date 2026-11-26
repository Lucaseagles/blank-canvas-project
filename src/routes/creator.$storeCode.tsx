import {createFileRoute,Link} from "@tanstack/react-router";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {getPublicRubiCreatorProfile} from "@/lib/rubi-public-creator-profile.functions";
import {getPublicRubiPartnerStorefront} from "@/lib/partner-storefront.functions";
import {Button} from "@/components/ui/button";
import {ArrowUpRight,Copy,PlayCircle,Store,Video} from "lucide-react";
import {toast} from "sonner";

export const Route=createFileRoute("/creator/$storeCode")({component:PublicCreatorPage});

const platformLabel:Record<string,string>={
 native:"Vídeo RUBI",youtube:"YouTube",tiktok:"TikTok",instagram:"Instagram",
 shopee:"Shopee Video",kwai:"Kwai",shein:"SHEIN",mercado_livre:"Mercado Livre"
};

function PublicCreatorPage(){
 const {storeCode}=Route.useParams();
 const loadProfile=useServerFn(getPublicRubiCreatorProfile);
 const loadStore=useServerFn(getPublicRubiPartnerStorefront);
 const profile=useQuery({
  queryKey:["public-rubi-creator-profile",storeCode],
  queryFn:()=>loadProfile({data:{storeCode}}),retry:false
 });
 const store=useQuery({
  queryKey:["public-rubi-creator-store",storeCode],
  queryFn:()=>loadStore({data:{storeCode}}),enabled:!!profile.data?.storeCode,retry:false
 });
 const creator=profile.data;
 const copy=async()=>{
  try{
   await navigator.clipboard.writeText(window.location.href);
   toast.success("Perfil do criador copiado.");
  }catch{toast.error("Não foi possível copiar automaticamente. Copie o endereço do navegador.");}
 };
 if(profile.isLoading)return <main className="mx-auto max-w-6xl px-4 py-28"><p role="status">Carregando perfil do criador...</p></main>;
 if(profile.isError||!creator)return <main className="mx-auto max-w-3xl space-y-4 px-4 py-28 text-center">
  <p className="text-xs font-black uppercase tracking-widest text-primary">Hub Eagles · Criadores</p>
  <h1 className="text-3xl font-black">Este perfil não está disponível</h1>
  <p className="text-sm text-muted-foreground">O perfil pode estar suspenso, em análise ou ainda não ter sido publicado.</p>
  <Button asChild variant="outline"><Link to="/creators">Conhecer a rede de criadores</Link></Button>
 </main>;
 return <main className="min-h-screen bg-background px-4 pb-24 pt-28">
  <div className="mx-auto max-w-6xl space-y-10">
   <header className="overflow-hidden rounded-[2rem] border bg-gradient-to-br from-primary/15 via-card to-background p-7 sm:p-12">
    <div className="flex flex-wrap items-start justify-between gap-4">
     <div className="space-y-3">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Hub Eagles · Criador parceiro</p>
      <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{creator.displayName}</h1>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">Conteúdos publicados e produtos selecionados por este criador. Links de oferta identificam a origem da indicação; pagamento e entrega seguem as condições do checkout responsável.</p>
      <div className="flex flex-wrap gap-2 text-xs">
       <span className="rounded-full border bg-background/80 px-3 py-2">Perfil público verificado</span>
       {creator.partnerType&&<span className="rounded-full border bg-background/80 px-3 py-2">{creator.partnerType}</span>}
       <span className="rounded-full border bg-background/80 px-3 py-2">{creator.videos.length} conteúdos publicados</span>
      </div>
     </div>
     <Button type="button" variant="outline" onClick={()=>void copy()}><Copy className="mr-2 h-4 w-4"/>Compartilhar perfil</Button>
    </div>
   </header>

   <section aria-label="Feed público do criador" className="space-y-5">
    <div className="space-y-1"><p className="text-xs font-black uppercase tracking-widest text-primary">Creator Feed</p><h2 className="text-2xl font-black">Vídeos e conteúdos</h2><p className="text-sm text-muted-foreground">Somente conteúdos aprovados e publicados pelo Shadow Master aparecem neste perfil.</p></div>
    {creator.videos.length===0?<div className="rounded-2xl border border-dashed p-8 text-center"><Video className="mx-auto h-8 w-8 text-muted-foreground"/><h3 className="mt-3 font-bold">Novos conteúdos em breve</h3><p className="mt-1 text-sm text-muted-foreground">Este criador ainda não possui vídeos publicados na Hub Eagles.</p></div>:
     <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {creator.videos.map(video=><article key={video.id} className="overflow-hidden rounded-3xl border bg-card">
       <div className="aspect-[9/16] max-h-[560px] bg-black">
        {video.playbackUrl?<video className="h-full w-full object-contain" src={video.playbackUrl} controls playsInline preload="metadata" aria-label={video.title}/>:
         <a href={video.externalUrl??"#"} target="_blank" rel="noopener noreferrer" className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-white">
          <PlayCircle className="h-14 w-14"/><span className="font-bold">Assistir em {platformLabel[video.sourcePlatform]??"rede social"}</span><span className="text-xs text-white/70">A publicação original será aberta na plataforma de origem</span>
         </a>}
       </div>
       <div className="space-y-2 p-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-primary">{platformLabel[video.sourcePlatform]??"Conteúdo"}</p>
        <h3 className="font-bold">{video.title}</h3>
        {video.caption&&<p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{video.caption}</p>}
        {video.externalUrl&&<a href={video.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-semibold text-primary underline underline-offset-4">Abrir publicação original <ArrowUpRight className="ml-1 h-4 w-4"/></a>}
       </div>
      </article>)}
     </div>}
   </section>

   <section aria-label="Vitrine de produtos do criador" className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
     <div><p className="text-xs font-black uppercase tracking-widest text-primary">Produtos autorizados</p><h2 className="mt-1 text-2xl font-black">Vitrine do criador</h2><p className="text-sm text-muted-foreground">Produtos aprovados e liberados para este parceiro.</p></div>
     <Button asChild variant="outline"><Link to="/loja/$storeCode" params={{storeCode}}><Store className="mr-2 h-4 w-4"/>Abrir vitrine completa</Link></Button>
    </div>
    {store.isLoading&&<p role="status" className="text-sm text-muted-foreground">Carregando produtos...</p>}
    {store.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível carregar a vitrine.</p>}
    {store.data?.products?.length===0&&<p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">Nenhum produto está liberado para divulgação neste momento.</p>}
    {!!store.data?.products?.length&&<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
     {store.data.products.slice(0,6).map(product=><article key={product.id} className="overflow-hidden rounded-2xl border bg-card">
      <div className="aspect-[4/3] bg-muted/30">{product.imageUrl&&<img src={product.imageUrl} alt={product.title} loading="lazy" className="h-full w-full object-contain"/>}</div>
      <div className="space-y-2 p-4"><h3 className="font-bold">{product.title}</h3><p className="text-sm font-black">{product.retailPrice.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</p>
       <a href={`/r/${product.referralCode}`} className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground">Ver oferta indicada</a>
      </div>
     </article>)}
    </div>}
   </section>
   <footer className="rounded-2xl border p-5 text-xs leading-5 text-muted-foreground">Conteúdos externos são links para as publicações originais, sem cópia automática de mídia. Conteúdos nativos aparecem somente após revisão e publicação. A existência de uma indicação não confirma compra nem comissão.</footer>
  </div>
 </main>;
}

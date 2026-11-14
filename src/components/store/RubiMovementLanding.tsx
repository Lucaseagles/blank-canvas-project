import {useEffect,useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Button} from "@/components/ui/button";
import {RubiPublishedOffer} from "@/components/store/RubiPublishedOffer";
import {RubiMovementABOffer} from "@/components/store/RubiMovementABOffer";
import {readRubiOrganicAttribution,type RubiOrganicAttribution} from "@/lib/rubi-organic-campaigns";
import {getRubiMovementPublishedPage} from "@/lib/rubi-movement-publishing.functions";

/** Campaign-specific editorial text appears only when owner approved the exact source revisions. */
export function RubiMovementLanding({productId}:{productId:string}){
 const [campaign,setCampaign]=useState<RubiOrganicAttribution|null>(null);
 useEffect(()=>{
  const update=()=>setCampaign(readRubiOrganicAttribution(window.location.search));
  update();
  window.addEventListener("popstate",update);
  return ()=>window.removeEventListener("popstate",update);
 },[productId]);
 const load=useServerFn(getRubiMovementPublishedPage);
 const query=useQuery({
  queryKey:["rubi-movement-published-page",productId,campaign?.source,campaign?.campaign],
  queryFn:()=>load({data:{productId,channel:campaign!.source,campaign:campaign!.campaign}}),
  enabled:!!campaign,
  retry:false,
  staleTime:0,
  refetchOnWindowFocus:true,
 });
 // A campaign without an approved version never exposes a private draft.
 if(!campaign)return <RubiMovementABOffer productId={productId}/>;
 if(!query.data)return <RubiPublishedOffer productId={productId}/>;
 const page=query.data;
 return <section aria-label="Página da oferta por movimento" className="space-y-6 rounded-3xl border border-primary/30 bg-card p-6 md:p-10">
  <div className="space-y-3">
   <p className="text-xs font-black uppercase tracking-widest text-primary">Oferta RUBI · Apresentação aprovada</p>
   <h2 className="text-3xl font-black tracking-tight">{page.headline}</h2>
   <p className="whitespace-pre-line text-base">{page.promise}</p>
  </div>
  <p className="whitespace-pre-line leading-relaxed">{page.body}</p>
  <Button asChild><a href="#rubi-purchase">{page.callToAction}</a></Button>
  <p className="text-xs text-muted-foreground">A disponibilidade, o valor e a compra são confirmados no checkout oficial do fornecedor.</p>
 </section>;
}

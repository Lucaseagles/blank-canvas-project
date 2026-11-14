import {useEffect,useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {getRubiActiveMovementAB} from "@/lib/rubi-movement-ab.functions";
import {assignRubiABArm} from "@/lib/rubi-movement-ab-allocation";
import {trackEvent} from "@/lib/analytics";

const KEY="rubi_ab_random_visitor_v1";
function visitorId():string|null {
 try{
  const current=window.localStorage.getItem(KEY);
  if(current&&/^[0-9a-f-]{36}$/i.test(current))return current;
  const id=window.crypto.randomUUID();
  window.localStorage.setItem(KEY,id);
  return id;
 }catch{return null;}
}
/** Render only a reviewed, revision-locked experiment. No simulated purchase events. */
export function RubiMovementABOffer({productId}:{productId:string}){
 const load=useServerFn(getRubiActiveMovementAB);
 const [identity,setIdentity]=useState<string|null>(null);
 useEffect(()=>{setIdentity(visitorId());},[]);
 const query=useQuery({queryKey:["rubi-ab-public",productId],
  queryFn:()=>load({data:{productId}}),retry:false,staleTime:0,refetchOnWindowFocus:true});
 const experiment=query.data;
 const arm=identity&&experiment?
  assignRubiABArm(experiment.experimentId,experiment.revision,identity):null;
 const variant=arm&&experiment?experiment[arm]:null;
 useEffect(()=>{
  if(!experiment||!variant||!arm)return;
  const key="rubi_ab_exposure_"+experiment.experimentId+"_"+experiment.revision;
  try{
   if(window.sessionStorage.getItem(key)===variant.id)return;
   window.sessionStorage.setItem(key,variant.id);
  }catch{return;}
  void trackEvent("RUBI_AB_EXPOSURE",{
   experiment_id:experiment.experimentId,experiment_revision:experiment.revision,
   variant_id:variant.id,arm,product_id:productId,outcome:"view_only"
  },{productId,source:"rubi_ab"});
 },[experiment?.experimentId,experiment?.revision,variant?.id,arm,productId]);
 if(!variant||!experiment||!arm)return null;
 const onCTA=()=>{void trackEvent("RUBI_AB_CTA",{
  experiment_id:experiment.experimentId,experiment_revision:experiment.revision,
  variant_id:variant.id,arm,product_id:productId,outcome:"intent_only"
 },{productId,source:"rubi_ab"});};
 return <section aria-label="Apresentação alternativa aprovada" className="space-y-4 rounded-3xl border border-primary/30 bg-card p-6 md:p-10">
  <p className="text-xs font-black uppercase tracking-widest text-primary">RUBI Store · Apresentação em teste editorial</p>
  <h2 className="text-3xl font-black">{variant.headline}</h2>
  <p className="text-base font-semibold">{variant.hook}</p>
  <p className="whitespace-pre-line leading-relaxed">{variant.body}</p>
  <a href="#rubi-purchase" onClick={onCTA}
   className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground">
   {variant.cta}
  </a>
  <p className="text-xs text-muted-foreground">Teste de apresentação sem mudança de preço. Compra e disponibilidade são confirmadas somente no checkout oficial do fornecedor.</p>
 </section>;
}

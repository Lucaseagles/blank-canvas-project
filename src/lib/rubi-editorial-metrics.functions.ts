import {createServerFn} from "@tanstack/react-start";
import {requireOwnerRole} from "./auth-guards.server";
export type RubiEditorialMetricRow={
 sectionId:string;sectionTitle:string;productId:string;productTitle:string;
 clickEvents:number;clickSessions:number;productViews:number;productViewSessions:number;checkoutIntents:number;checkoutIntentSessions:number;
};
/** Private analytics, observations only: clicks are not sales and sessions are not unique people. */
export const getRubiEditorialMetricsAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const [sectionsResult,eventsResult]=await Promise.all([
   db.from("rubi_storefront_sections").select("id,title,product_ids").limit(100),
   db.rpc("rubi_editorial_funnel_summary",{p_days:30}),
  ]);
  if(sectionsResult.error)throw sectionsResult.error;
  if(eventsResult.error)throw eventsResult.error;
  const sections=(sectionsResult.data??[]) as Array<{id:string;title:string;product_ids:string[]}>;
  const relevantIds=[...new Set(sections.flatMap(s=>s.product_ids))];
  let names=new Map<string,string>();
  if(relevantIds.length){
   const {data,error}=await db.from("hub_products").select("id,title").in("id",relevantIds).limit(1200);
   if(error)throw error;
   names=new Map((data??[] as Array<{id:string;title:string}>).map((p:{id:string;title:string})=>[p.id,p.title]));
  }
  const counts=new Map<string,{card_clicks:number;card_click_sessions:number;product_views:number;product_view_sessions:number;checkout_intents:number;checkout_intent_sessions:number}>();
  for(const row of (eventsResult.data??[]) as Array<{section_id:string;product_id:string;card_clicks:number;card_click_sessions:number;product_views:number;product_view_sessions:number;checkout_intents:number;checkout_intent_sessions:number}>){
   counts.set(row.section_id+":"+row.product_id,row);
  }
  const rows:RubiEditorialMetricRow[]=sections.flatMap(section=>section.product_ids.map(productId=>{
   const match=counts.get(section.id+":"+productId);
   return {
    sectionId:section.id,sectionTitle:section.title,productId,productTitle:names.get(productId)??"Produto indisponível",
    clickEvents:Number(match?.card_clicks??0),clickSessions:Number(match?.card_click_sessions??0),
    productViews:Number(match?.product_views??0),productViewSessions:Number(match?.product_view_sessions??0),
    checkoutIntents:Number(match?.checkout_intents??0),checkoutIntentSessions:Number(match?.checkout_intent_sessions??0),
   };
  }));
  return {days:30,asOf:new Date().toISOString(),rows,
   note:"Eventos agregados por seção/produto atual. Etapas não formam necessariamente uma sequência da mesma pessoa. Saída ao checkout é intenção de compra, não venda confirmada."};
 });

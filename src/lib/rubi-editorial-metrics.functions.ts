import {createServerFn} from "@tanstack/react-start";
import {requireOwnerRole} from "./auth-guards.server";
export type RubiEditorialMetricRow={
 sectionId:string;sectionTitle:string;productId:string;productTitle:string;
 clickEvents:number;clickSessions:number;
};
/** Private analytics, observations only: clicks are not sales and sessions are not unique people. */
export const getRubiEditorialMetricsAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const [sectionsResult,eventsResult]=await Promise.all([
   db.from("rubi_storefront_sections").select("id,title,product_ids").limit(100),
   db.rpc("rubi_editorial_click_summary",{p_days:30}),
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
  const counts=new Map<string,{click_events:number;click_sessions:number}>();
  for(const row of (eventsResult.data??[]) as Array<{section_id:string;product_id:string;click_events:number;click_sessions:number}>){
   counts.set(row.section_id+":"+row.product_id,row);
  }
  const rows:RubiEditorialMetricRow[]=sections.flatMap(section=>section.product_ids.map(productId=>{
   const match=counts.get(section.id+":"+productId);
   return {
    sectionId:section.id,sectionTitle:section.title,productId,productTitle:names.get(productId)??"Produto indisponível",
    clickEvents:Number(match?.click_events??0),clickSessions:Number(match?.click_sessions??0),
   };
  }));
  return {days:30,asOf:new Date().toISOString(),rows,
   note:"Cliques de cards e sessões rastreadas não equivalem a CTR, retenção de vídeo, intenção de checkout, clientes únicos, receita ou vendas confirmadas."};
 });

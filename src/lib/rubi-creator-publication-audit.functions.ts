import {createServerFn} from "@tanstack/react-start";
import {requireOwnerRole} from "./auth-guards.server";
import {auditRubiCreatorPublications} from "./rubi-creator-publication-audit";

/** Master-only, bounded, non-causal reconciliation. No user IDs exposed. */
export const getRubiCreatorPublicationAuditAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const [p,a,d,v,m,raw]=await Promise.all([
   db.from("rubi_creator_team_publication_evidence")
    .select("id,assignment_id,channel,publication_url,review_status,published_at")
    .order("created_at",{ascending:false}).limit(200),
   db.from("rubi_creator_team_campaign_assignments").select("id,variant_id,status").limit(300),
   db.from("rubi_movement_distribution")
    .select("id,variant_id,channel,campaign,status,published_reference").limit(1000),
   db.from("rubi_movement_variants").select("id,movement_id").limit(500),
   db.from("rubi_movements").select("id,product_id").limit(300),
   db.rpc("rubi_organic_campaign_performance",{p_days:30,p_limit:200})
  ]);
  for(const r of [p,a,d,v,m,raw])if(r.error)throw r.error;
  const publications=p.data??[],assignments=a.data??[],distribution=d.data??[];
  const variantToMovement=new Map<string,string>((v.data??[]).map((x:{id:string;movement_id:string}):[string,string]=>[x.id,x.movement_id]));
  const movementToProduct=new Map<string,string>((m.data??[]).map((x:{id:string;product_id:string}):[string,string]=>[x.id,x.product_id]));
  const productByVariant:Record<string,string>={};
  for(const [variant,movement] of variantToMovement){
   const product=movementToProduct.get(movement);
   if(product)productByVariant[variant]=product;
  }
  const events=((raw.data??[]) as Array<Record<string,unknown>>).map(e=>({
   product_id:String(e["product_id"]??""),channel:String(e["channel"]??""),
   campaign:String(e["campaign"]??""),view_events:Number(e["view_events"]??0),
   checkout_intents:Number(e["checkout_intents"]??0)
  }));
  const limited=publications.length===200||assignments.length===300||distribution.length===1000||
   (v.data??[]).length===500||(m.data??[]).length===300||events.length===200;
  return {rows:auditRubiCreatorPublications(publications,assignments,distribution,events,productByVariant,limited),
   limited,days:30,asOf:new Date().toISOString()};
 });

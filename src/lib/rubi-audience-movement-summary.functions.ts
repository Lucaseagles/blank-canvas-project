import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {summarizeRubiAudienceMovements,type RubiAudienceMovement,type RubiAudienceVariant,type RubiAudiencePlan} from "./rubi-audience-movement-summary";
import type {RubiMovementTrafficRow} from "./rubi-movement-performance";
import {RUBI_ORGANIC_CHANNELS} from "./rubi-organic-campaigns";

const channels=new Set<string>(RUBI_ORGANIC_CHANNELS.map(c=>c.id));
export const getRubiAudienceMovementSummaryAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({productId:z.string().uuid()}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:movementRows,error:movementError}=await db.from("rubi_movements")
   .select("id,name,audience").eq("product_id",data.productId).limit(101);
  if(movementError)throw movementError;
  const movements=(movementRows??[]) as RubiAudienceMovement[];
  if(!movements.length)return {rows:[],partial:false,days:30};
  // Fail closed: missing movements/variants/plans would distort attribution.
  if(movements.length>100)return {rows:[],partial:true,days:30};
  const {data:variantRows,error:variantError}=await db.from("rubi_movement_variants")
   .select("id,movement_id").in("movement_id",movements.map(m=>m.id)).limit(501);
  if(variantError)throw variantError;
  const variants=(variantRows??[]) as RubiAudienceVariant[];
  if(variants.length>500)return {rows:[],partial:true,days:30};
  if(!variants.length)return {rows:summarizeRubiAudienceMovements(movements,[],[],[],data.productId,false),partial:false,days:30};
  const {data:planRows,error:planError}=await db.from("rubi_movement_distribution")
   .select("id,variant_id,channel,campaign").in("variant_id",variants.map(v=>v.id)).limit(1001);
  if(planError)throw planError;
  const allPlans=(planRows??[]) as RubiAudiencePlan[];
  if(allPlans.length>1000)return {rows:[],partial:true,days:30};
  const plans=allPlans.filter(p=>channels.has(p.channel));
  const {data:agg,error:aggError}=await db.rpc("rubi_organic_campaign_performance",{p_days:30,p_limit:200});
  if(aggError)throw aggError;
  const partial=(agg??[]).length>=200;
  const traffic:RubiMovementTrafficRow[]=((agg??[]) as Array<Record<string,unknown>>)
   .filter(x=>x["product_id"]===data.productId&&channels.has(String(x["channel"]??"")))
   .map(x=>({productId:String(x["product_id"]),channel:String(x["channel"]),
     campaign:String(x["campaign"]),viewEvents:Number(x["view_events"]??0),
     viewSessions:Number(x["view_sessions"]??0),checkoutIntents:Number(x["checkout_intents"]??0)}));
  return {rows:summarizeRubiAudienceMovements(movements,variants,plans,traffic,data.productId,partial),partial,days:30,
   disclaimer:"Eventos orgânicos observados, separados pelo público editorial do movimento; não comprovam perfil real dos visitantes, compra paga nem causalidade."};
 });

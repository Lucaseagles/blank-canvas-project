import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {correlateMovementTraffic,type RubiMovementCampaignPlan,type RubiMovementTrafficRow} from "./rubi-movement-performance";
import {RUBI_ORGANIC_CHANNELS} from "./rubi-organic-campaigns";
const validChannels=new Set<string>(RUBI_ORGANIC_CHANNELS.map(c=>c.id));
/** Owner-only aggregate from existing service-role RPC. No customer IDs or payment inference. */
export const getRubiMovementPerformanceAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({movementId:z.string().uuid()}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:movement,error:movementError}=await (supabaseAdmin as any).from("rubi_movements")
   .select("id,product_id").eq("id",data.movementId).maybeSingle();
  if(movementError)throw movementError;
  if(!movement)throw new Error("Movimento não encontrado.");
  const {data:variants,error:variantsError}=await (supabaseAdmin as any).from("rubi_movement_variants")
   .select("id,name").eq("movement_id",movement.id).limit(100);
  if(variantsError)throw variantsError;
  const variantRows=(variants??[]) as Array<{id:string;name:string}>;
  if(!variantRows.length)return {days:30,asOf:new Date().toISOString(),rows:[],variantNames:{},coverage:"empty"};
  const variantsTruncated=variantRows.length===100;
  const ids=variantRows.map(v=>v.id);
  const {data:planRows,error:plansError}=await (supabaseAdmin as any).from("rubi_movement_distribution")
   .select("id,variant_id,channel,campaign,status").in("variant_id",ids).limit(800);
  if(plansError)throw plansError;
  const plansTruncated=(planRows??[]).length===800;
  const plans=(planRows??[] as RubiMovementCampaignPlan[]).filter((p:RubiMovementCampaignPlan)=>validChannels.has(p.channel));
  const {data:agg,error:aggError}=await (supabaseAdmin as any).rpc("rubi_organic_campaign_performance",{p_days:30,p_limit:200});
  if(aggError)throw aggError;
  const traffic: RubiMovementTrafficRow[]=((agg??[]) as Array<Record<string,unknown>>)
    .filter(row=>row["product_id"]===movement.product_id && validChannels.has(String(row["channel"]??"")))
    .map(row=>({
      productId:String(row["product_id"]),
      channel:String(row["channel"]),campaign:String(row["campaign"]),
      viewEvents:Number(row["view_events"]??0),viewSessions:Number(row["view_sessions"]??0),
      checkoutIntents:Number(row["checkout_intents"]??0)
    }));
  const aggregateTruncated=(agg??[]).length>=200;
  const partial=variantsTruncated||plansTruncated||aggregateTruncated;
  const rows=correlateMovementTraffic(movement.product_id,plans,traffic);
  return {
   days:30,asOf:new Date().toISOString(),rows,
   variantNames:Object.fromEntries(variantRows.map(v=>[v.id,v.name])),
   coverage:partial?"partial":"bounded",partial,
   limitations:{variantsTruncated,plansTruncated,aggregateTruncated}
  };
 });

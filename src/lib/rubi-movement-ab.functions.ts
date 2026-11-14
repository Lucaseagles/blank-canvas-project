import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {approvedRubiCheckout} from "./rubi-checkout-validation";

const uuid=z.string().uuid();
const config=z.object({
 movementId:uuid,controlId:uuid,challengerId:uuid,
 expectedRevision:z.number().int().positive().nullable(),running:z.boolean()
});
type RubiABStatus={
 id:string;movementId:string;controlId:string;challengerId:string;
 status:"running"|"paused";revision:number;startedAt:string|null
};
export const getRubiMovementABAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({movementId:uuid}).parse(input))
 .handler(async({data}):Promise<RubiABStatus|null>=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:row,error}=await (supabaseAdmin as any).from("rubi_movement_ab_experiments")
   .select("id,movement_id,control_variant_id,challenger_variant_id,status,revision,started_at")
   .eq("movement_id",data.movementId).maybeSingle();
  if(error)throw error;
  return row?{id:row.id,movementId:row.movement_id,controlId:row.control_variant_id,
   challengerId:row.challenger_variant_id,status:row.status,revision:row.revision,
   startedAt:row.started_at}:null;
 });
export const configureRubiMovementABAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>config.parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_configure_movement_ab_audited",{
   p_actor:context.userId,p_movement:data.movementId,p_control:data.controlId,
   p_challenger:data.challengerId,p_expected_revision:data.expectedRevision,p_run:data.running
  });
  if(error)throw error;
  if(!rows?.[0]?.saved_id)throw new Error("Experimento e trilha de auditoria não confirmados.");
  return {revision:Number(rows[0].new_revision),status:String(rows[0].current_status)};
 });
export type RubiABPublic={
 experimentId:string;revision:number;startedAt:string;
 control:{id:string;headline:string;body:string;hook:string;cta:string};
 challenger:{id:string;headline:string;body:string;hook:string;cta:string};
};
/** Read-only, fail-closed checkout and revision gate. No draft data or personal profile is accessed. */
export const getRubiActiveMovementAB=createServerFn({method:"POST"})
 .validator((input:unknown)=>z.object({productId:uuid}).parse(input))
 .handler(async({data}):Promise<RubiABPublic|null>=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:products,error:productError}=await db.from("hub_products")
   .select("id,revision,active,retail_price,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)")
   .eq("id",data.productId).eq("active",true).eq("hub_suppliers.active",true)
   .maybeSingle();
  if(productError)throw productError;
  if(!products||!approvedRubiCheckout(products))return null;
  const {data:movements,error:movementError}=await db.from("rubi_movements")
   .select("id,status,audience,revision").eq("product_id",data.productId)
   .eq("status","review").eq("audience","consumer").limit(101);
  if(movementError)throw movementError;
  if((movements??[]).length>=101)return null;
  const ids=(movements??[]).map((m:{id:string})=>m.id);
  if(!ids.length)return null;
  const {data:experiments,error:experimentError}=await db.from("rubi_movement_ab_experiments")
   .select("id,movement_id,status,revision,started_at,control_variant_id,challenger_variant_id,control_revision,challenger_revision,movement_revision,product_revision")
   .in("movement_id",ids).eq("status","running").limit(2);
  if(experimentError)throw experimentError;
  if((experiments??[]).length!==1)return null;
  const x=experiments[0];
  const movement=(movements??[]).find((m:{id:string})=>m.id===x.movement_id);
  if(!movement||movement.revision!==x.movement_revision||products.revision!==x.product_revision)return null;
  const {data:variants,error:variantError}=await db.from("rubi_movement_variants")
   .select("id,movement_id,revision,status,media_rights_confirmed,page_headline,page_body,creative_hook,call_to_action")
   .in("id",[x.control_variant_id,x.challenger_variant_id]);
  if(variantError)throw variantError;
  if((variants??[]).length!==2)return null;
  const byId=new Map<string,any>(variants.map((v:any)=>[v.id,v]));
  const control=byId.get(x.control_variant_id),challenger=byId.get(x.challenger_variant_id);
  if(!control||!challenger||
   control.movement_id!==x.movement_id||challenger.movement_id!==x.movement_id||
   control.revision!==x.control_revision||challenger.revision!==x.challenger_revision||
   control.status!=="review"||challenger.status!=="review"||
   !control.media_rights_confirmed||!challenger.media_rights_confirmed)return null;
  const serialize=(v:any)=>({id:String(v.id),headline:String(v.page_headline),
   body:String(v.page_body),hook:String(v.creative_hook),cta:String(v.call_to_action)});
  return {experimentId:String(x.id),revision:Number(x.revision),startedAt:String(x.started_at),
   control:serialize(control),challenger:serialize(challenger)};
 });

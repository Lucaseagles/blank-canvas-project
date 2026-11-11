import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {canRecordPublication,movementCampaignPath, type RubiDistributionPlan} from "./rubi-movement-distribution";
const uuid=z.string().uuid();
const schema=z.object({
 id:uuid.optional(),variant_id:uuid,
 channel:z.enum(["instagram","tiktok","youtube","facebook","pinterest","whatsapp","telegram"]),
 campaign:z.string().regex(/^[a-z0-9][a-z0-9_-]{0,59}$/),
 status:z.enum(["planned","manually_published"]),
 notes:z.string().max(1500),
 published_reference:z.string().max(500)
});
export const listRubiDistributionAdmin=createServerFn({method:"POST"}).middleware([requireOwnerRole])
.validator((value:unknown)=>z.object({variantId:uuid}).parse(value))
.handler(async({data})=>{
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 const {data:rows,error}=await (supabaseAdmin as any).from("rubi_movement_distribution")
  .select("id,variant_id,channel,campaign,status,notes,published_reference")
  .eq("variant_id",data.variantId).order("channel").limit(20);
 if(error)throw error;
 return (rows??[]) as RubiDistributionPlan[];
});
export const saveRubiDistributionAdmin=createServerFn({method:"POST"}).middleware([requireOwnerRole])
.validator((value:unknown)=>schema.parse(value))
.handler(async({data})=>{
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 if(!canRecordPublication(data))throw new Error("Informe uma referência verificável da publicação manual.");
 const {data:variant,error:variantError}=await (supabaseAdmin as any).from("rubi_movement_variants")
  .select("id,status,movement_id").eq("id",data.variant_id).maybeSingle();
 if(variantError)throw variantError;
 if(!variant)throw new Error("Variante não encontrada.");
 if(data.status==="manually_published"&&variant.status!=="review")throw new Error("Revise o material antes de registrar publicação.");
 const {data:movement,error:movementError}=await (supabaseAdmin as any).from("rubi_movements")
  .select("id,product_id").eq("id",variant.movement_id).maybeSingle();
 if(movementError)throw movementError;
 if(!movement)throw new Error("Movimento ausente.");
 movementCampaignPath(movement.product_id,data.channel,data.campaign);
 // No attribution codes or checkout parameters are created; only UTM marketing labels.
 const {id,...values}=data;
 if(id){
  const {data:existing,error:existingError}=await (supabaseAdmin as any).from("rubi_movement_distribution")
    .select("id,variant_id").eq("id",id).maybeSingle();
  if(existingError)throw existingError;
  if(!existing || existing.variant_id!==data.variant_id)throw new Error("Plano pertence a outra variante.");
  const {error}=await (supabaseAdmin as any).from("rubi_movement_distribution")
    .update({...values,updated_at:new Date().toISOString()}).eq("id",id).eq("variant_id",data.variant_id);
  if(error)throw error;
 }else{
  const {error}=await (supabaseAdmin as any).from("rubi_movement_distribution").insert(values);
  if(error)throw error;
 }
 return {success:true};
});

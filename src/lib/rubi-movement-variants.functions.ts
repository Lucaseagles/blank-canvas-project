import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {canReviewRubiVariant,type RubiMovementVariant} from "./rubi-movement-variants";

const uuid=z.string().uuid();
const schema=z.object({
 id:uuid.optional(),movement_id:uuid,name:z.string().trim().min(3).max(120),
 format:z.enum(["short_video","story","carousel","post"]),
 creative_hook:z.string().trim().max(280),creative_script:z.string().trim().max(2500),
 page_headline:z.string().trim().max(240),page_body:z.string().trim().max(4000),
 call_to_action:z.string().trim().max(120),
 media_notes:z.string().trim().max(1200),proof_notes:z.string().trim().max(1200),
 media_rights_confirmed:z.boolean(),status:z.enum(["draft","review"]),
 revision:z.number().int().positive().optional(),
});
const fields="id,movement_id,name,format,creative_hook,creative_script,page_headline,page_body,call_to_action,media_notes,proof_notes,media_rights_confirmed,status,revision";
export const listRubiMovementVariantsAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({movementId:uuid}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).from("rubi_movement_variants")
   .select(fields).eq("movement_id",data.movementId).order("updated_at",{ascending:false}).limit(100);
  if(error)throw error;
  return (rows??[]) as RubiMovementVariant[];
 });
export const saveRubiMovementVariantAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>schema.parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:movement,error:movementError}=await (supabaseAdmin as any)
   .from("rubi_movements").select("id,status").eq("id",data.movement_id).maybeSingle();
  if(movementError)throw movementError;
  if(!movement)throw new Error("Movimento inexistente.");
  if(data.status==="review" && (movement.status!=="review" || !canReviewRubiVariant(data)))
   throw new Error("Revise o movimento, os textos e os direitos da mídia.");
  if(data.id&&!data.revision)throw new Error("Informe a versão atual da variante.");
  const {id,revision,...values}=data;
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_mutate_variant_audited",{
   p_action:id?"update":"create",p_id:id??null,p_movement_id:data.movement_id,
   p_expected_revision:revision??null,p_values:values,p_actor:context.userId
  });
  if(error)throw error;
  const row=rows?.[0];
  if(!row)throw new Error("Variante não registrada.");
  return {id:String(row.variant_id),revision:Number(row.new_revision)};
 });
export const deleteRubiMovementVariantAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({movementId:uuid,id:uuid,revision:z.number().int().positive()}).parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_mutate_variant_audited",{
   p_action:"delete",p_id:data.id,p_movement_id:data.movementId,
   p_expected_revision:data.revision,p_values:{},p_actor:context.userId
  });
  if(error)throw error;
  if(!rows?.length)throw new Error("Variante não removida.");
  return {success:true};
 });

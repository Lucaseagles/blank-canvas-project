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
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:movement,error:movementError}=await (supabaseAdmin as any).from("rubi_movements")
   .select("id,status").eq("id",data.movement_id).maybeSingle();
  if(movementError)throw movementError;
  if(!movement)throw new Error("Movimento inexistente.");
  if(data.status==="review" && (movement.status!=="review" || !canReviewRubiVariant(data))){
   throw new Error("Conclua a revisão do movimento, o checklist e os direitos da mídia antes de enviar a variante para revisão.");
  }
  const {id,revision,...changes}=data;
  if(id){
   const {data:old,error:oldError}=await (supabaseAdmin as any).from("rubi_movement_variants")
    .select("id,movement_id,revision").eq("id",id).maybeSingle();
   if(oldError)throw oldError;
   if(!old || old.movement_id!==data.movement_id)throw new Error("Variante fora do movimento selecionado.");
   if(old.revision!==revision)throw new Error("Versão antiga. Recarregue antes de salvar.");
   const {data:updated,error}=await (supabaseAdmin as any).from("rubi_movement_variants")
    .update({...changes,revision:old.revision+1,updated_at:new Date().toISOString()})
    .eq("id",id).eq("movement_id",data.movement_id).eq("revision",old.revision)
    .select("id,revision").maybeSingle();
   if(error)throw error;
   if(!updated)throw new Error("Atualização concorrente detectada.");
   return updated as {id:string;revision:number};
  }
  const {data:created,error}=await (supabaseAdmin as any).from("rubi_movement_variants")
   .insert(changes).select("id,revision").single();
  if(error)throw error;
  return created as {id:string;revision:number};
 });
export const deleteRubiMovementVariantAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({movementId:uuid,id:uuid,revision:z.number().int().positive()}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:deleted,error}=await (supabaseAdmin as any).from("rubi_movement_variants")
   .delete().eq("id",data.id).eq("movement_id",data.movementId).eq("revision",data.revision)
   .select("id").maybeSingle();
  if(error)throw error;
  if(!deleted)throw new Error("Variante alterada ou pertencente a outro movimento.");
  return {success:true};
 });

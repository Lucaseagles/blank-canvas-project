import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {canReviewRubiMovement,rubiMovementEditorialQuality,type RubiMovement} from "./rubi-movements";
const uuid=z.string().uuid();
const schema=z.object({
 id:uuid.optional(),
 product_id:uuid,
 name:z.string().trim().min(3).max(120),
 audience:z.enum(["consumer","merchant","partner"]),
 buyer_persona:z.string().trim().max(400),
 problem:z.string().trim().max(700),
 desired_outcome:z.string().trim().max(700),
 truthful_promise:z.string().trim().max(500),
 differentiator:z.string().trim().max(800),
 narrative:z.string().trim().max(1800),
 evidence_notes:z.string().trim().max(1400),
 status:z.enum(["draft","review"]),
 revision:z.number().int().positive().optional(),
});
const fields="id,product_id,name,audience,buyer_persona,problem,desired_outcome,truthful_promise,differentiator,narrative,evidence_notes,status,revision";
export const listRubiMovementsAdmin=createServerFn({method:"POST"}).middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({productId:uuid}).parse(input))
 .handler(async({data})=>{
   const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
   const {data:rows,error}=await (supabaseAdmin as any).from("rubi_movements").select(fields)
     .eq("product_id",data.productId).order("updated_at",{ascending:false}).limit(100);
   if(error)throw error;
   return (rows??[]) as RubiMovement[];
 });
export const saveRubiMovementAdmin=createServerFn({method:"POST"}).middleware([requireOwnerRole])
 .validator((input:unknown)=>schema.parse(input))
 .handler(async({data,context})=>{
   const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
   const {id,revision,...changes}=data;
   if(data.status==="review"&&!canReviewRubiMovement(data)){
     const quality=rubiMovementEditorialQuality(data);
     if(!quality.ready)throw new Error("Revise textos repetidos do movimento: "+quality.repeated.join("; "));
     throw new Error("Complete o checklist antes de enviar para revisão.");
   }
   if(id&&!revision)throw new Error("Informe a versão atual para editar o movimento.");
   const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_mutate_movement_audited",{
     p_action:id?"update":"create",p_id:id??null,p_product_id:data.product_id,
     p_expected_revision:revision??null,p_values:changes,p_actor:context.userId
   });
   if(error)throw error;
   const row=rows?.[0];
   if(!row)throw new Error("Movimento não registrado.");
   return {id:String(row.id),revision:Number(row.revision)};
 });
export const archiveRubiMovementAdmin=createServerFn({method:"POST"}).middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({productId:uuid,id:uuid,revision:z.number().int().positive()}).parse(input))
 .handler(async({data,context})=>{
   const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
   const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_mutate_movement_audited",{
     p_action:"archive",p_id:data.id,p_product_id:data.productId,
     p_expected_revision:data.revision,p_values:{},p_actor:context.userId
   });
   if(error)throw error;
   if(!rows?.length)throw new Error("Movimento não arquivado.");
   return {success:true};
 });

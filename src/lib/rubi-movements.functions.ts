import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {canReviewRubiMovement,type RubiMovement} from "./rubi-movements";
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
 .handler(async({data})=>{
   const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
   const {data:product,error:productError}=await (supabaseAdmin as any).from("hub_products").select("id").eq("id",data.product_id).maybeSingle();
   if(productError)throw productError;
   if(!product)throw new Error("Produto não encontrado no catálogo.");
   if(data.status==="review"&&!canReviewRubiMovement(data))throw new Error("Complete o checklist antes de enviar para revisão.");
   const {id,revision,...changes}=data;
   if(id){
     const {data:existing,error:existingError}=await (supabaseAdmin as any).from("rubi_movements")
       .select("id,product_id,revision").eq("id",id).maybeSingle();
     if(existingError)throw existingError;
     if(!existing||existing.product_id!==data.product_id)throw new Error("Movimento não pertence ao produto.");
     if(revision!==existing.revision)throw new Error("Movimento atualizado em outra sessão. Recarregue antes de salvar.");
     const {data:updated,error}=await (supabaseAdmin as any).from("rubi_movements")
       .update({...changes,revision:existing.revision+1,updated_at:new Date().toISOString()})
       .eq("id",id).eq("product_id",data.product_id).eq("revision",existing.revision)
       .select("id,revision").maybeSingle();
     if(error)throw error;
     if(!updated)throw new Error("Atualização concorrente detectada.");
     return updated as {id:string;revision:number};
   }
   const {data:created,error}=await (supabaseAdmin as any).from("rubi_movements")
     .insert({...changes}).select("id,revision").single();
   if(error)throw error;
   return created as {id:string;revision:number};
 });
export const archiveRubiMovementAdmin=createServerFn({method:"POST"}).middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({productId:uuid,id:uuid,revision:z.number().int().positive()}).parse(input))
 .handler(async({data})=>{
   const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
   // No public consumers exist yet. Remove private draft with optimistic lock.
   const {data:deleted,error}=await (supabaseAdmin as any).from("rubi_movements")
     .delete().eq("id",data.id).eq("product_id",data.productId).eq("revision",data.revision).select("id").maybeSingle();
   if(error)throw error;
   if(!deleted)throw new Error("Movimento já mudou ou não pertence ao produto.");
   return {success:true};
 });

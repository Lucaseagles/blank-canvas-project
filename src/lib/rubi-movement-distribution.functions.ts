import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {canRecordPublication,movementCampaignPath, type RubiDistributionPlan} from "./rubi-movement-distribution";
const uuid=z.string().uuid();
const schema=z.object({
 id:uuid.optional(),revision:z.number().int().positive().optional(),variant_id:uuid,
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
  .select("id,variant_id,channel,campaign,status,notes,published_reference,page_published_at,revision")
  .eq("variant_id",data.variantId).order("channel").limit(20);
 if(error)throw error;
 return (rows??[]) as RubiDistributionPlan[];
});
export const saveRubiDistributionAdmin=createServerFn({method:"POST"}).middleware([requireOwnerRole])
.validator((value:unknown)=>schema.parse(value))
.handler(async({data,context})=>{
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
 // Attribution must be unambiguous for the same product. This is an application
 // preflight; database-level transaction protection remains a separate hardening gate.
 const {data:collisions,error:collisionsError}=await (supabaseAdmin as any)
  .from("rubi_movement_distribution").select("id,variant_id")
  .eq("channel",data.channel).eq("campaign",data.campaign).limit(201);
 if(collisionsError)throw collisionsError;
 if((collisions??[]).length>=201)throw new Error("Consulta de campanhas incompleta: revise o identificador.");
 const othersOnLabel=(collisions??[]).filter((x:{id:string})=>x.id!==data.id);
 if(othersOnLabel.some((x:{variant_id:string})=>x.variant_id===data.variant_id))
  throw new Error("A mesma variante já usa este código neste canal. Informe um identificador diferente.");
 const otherVariantIds=[...new Set(othersOnLabel.map((x:{variant_id:string})=>x.variant_id))];
 if(otherVariantIds.length){
  const {data:others,error:othersError}=await (supabaseAdmin as any).from("rubi_movement_variants")
   .select("movement_id").in("id",otherVariantIds);
  if(othersError)throw othersError;
  const ids=[...new Set((others??[]).map((x:{movement_id:string})=>x.movement_id))];
  if(ids.length){
   const {data:otherMovements,error:otherMovementsError}=await (supabaseAdmin as any)
    .from("rubi_movements").select("product_id").in("id",ids);
   if(otherMovementsError)throw otherMovementsError;
   if((otherMovements??[]).some((x:{product_id:string})=>x.product_id===movement.product_id))
    throw new Error("Identificador de campanha já utilizado por outra variante deste produto. Use um código exclusivo para atribuição confiável.");
  }
 }
 // Saving a plan and recording the responsible Master are one database transaction.
 if(data.id&&!data.revision)throw new Error("Versão do plano ausente. Recarregue antes de salvar.");
 const {data:changed,error}=await (supabaseAdmin as any).rpc("rubi_save_distribution_audited",{
  p_id:data.id??null,p_variant_id:data.variant_id,p_expected_revision:data.revision??null,
  p_channel:data.channel,p_campaign:data.campaign,p_status:data.status,
  p_notes:data.notes,p_published_reference:data.published_reference,p_actor:context.userId
 });
 if(error)throw error;
 const row=changed?.[0];
 if(!row)throw new Error("Plano não salvo.");
 return {success:true,id:String(row.plan_id),revision:Number(row.new_revision)};
});

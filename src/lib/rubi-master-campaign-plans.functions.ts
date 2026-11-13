import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {approvedRubiCheckout} from "./rubi-checkout-validation";
const uuid=z.string().uuid();
const inputSchema=z.object({
 id:uuid.optional(),
 productId:uuid,
 campaignCode:z.string().regex(/^[a-z0-9][a-z0-9_-]{0,59}$/),
 mode:z.enum(["ai_seller_video","direct_response","creator_team"]),
 audience:z.enum(["consumer","merchant","partner"]),
 dailyBudget:z.number().finite().positive().max(10000),
 runDays:z.number().int().min(1).max(90),
 claimEvidence:z.string().trim().max(1500),
 responsibleName:z.string().trim().max(120)
});
const transitionSchema=z.object({
 id:uuid,
 action:z.enum(["submit","approve","pause"]),
 note:z.string().trim().max(1000)
});
export const listRubiMasterCampaignPlansAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data,error}=await db.from("rubi_master_campaign_plans")
   .select("id,product_id,campaign_code,mode,audience,daily_budget,run_days,claim_evidence,responsible_name,status,approval_note,approved_at,created_at,updated_at")
   .order("created_at",{ascending:false}).limit(100);
  if(error)throw error;
  return {rows:data??[],partial:(data??[]).length===100};
 });
export const saveRubiMasterCampaignPlanAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>inputSchema.parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:product,error:productError}=await db.from("hub_products")
   .select("id").eq("id",data.productId).maybeSingle();
  if(productError)throw productError;
  if(!product)throw new Error("Escolha um produto real cadastrado antes de planejar campanha.");
  const values={
   product_id:data.productId,campaign_code:data.campaignCode,mode:data.mode,audience:data.audience,
   daily_budget:data.dailyBudget,run_days:data.runDays,claim_evidence:data.claimEvidence,
   responsible_name:data.responsibleName,status:"draft",approved_at:null,approval_note:"",
   updated_at:new Date().toISOString()
  };
  if(data.id){
   // Approved campaigns cannot be silently mutated; pause first, then create a fresh draft revision.
   const {data:row,error}=await db.from("rubi_master_campaign_plans")
    .update(values).eq("id",data.id).in("status",["draft","ready_for_review","paused"])
    .select("id").maybeSingle();
   if(error)throw error;
   if(!row)throw new Error("Plano aprovado ou inexistente: pause antes de editar.");
   return {id:String(row.id)};
  }
  const {data:row,error}=await db.from("rubi_master_campaign_plans")
   .insert(values).select("id").single();
  if(error)throw error;
  return {id:String(row.id)};
 });
export const transitionRubiMasterCampaignPlanAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>transitionSchema.parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:plan,error:planError}=await db.from("rubi_master_campaign_plans")
   .select("*").eq("id",data.id).maybeSingle();
  if(planError)throw planError;
  if(!plan)throw new Error("Plano não localizado.");
  const previous=String(plan.status);
  const expected=data.action==="submit"?"draft":data.action==="approve"?"ready_for_review":"approved";
  if(previous!==expected)throw new Error("Transição não permitida neste estágio.");
  if(data.action!=="pause"&&String(plan.claim_evidence??"").trim().length<10)
   throw new Error("Informe evidências verificáveis da oferta antes de enviar para análise.");
  if(data.action==="approve"){
   if(data.note.length<10)throw new Error("Aprovação exige nota de revisão com ao menos dez caracteres.");
   const {data:product,error:productError}=await db.from("hub_products")
    .select("id,active,retail_price,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)")
    .eq("id",plan.product_id).maybeSingle();
   if(productError)throw productError;
   if(!product||!product.active||Number(product.retail_price)<=0||!approvedRubiCheckout(product))
    throw new Error("Campanha não pode ser aprovada sem produto e checkout oficial elegíveis.");
  }
  // The database commits state and named Owner audit in one transaction.
  const {data:changed,error}=await db.rpc("rubi_transition_campaign_audited",{
   p_id:data.id,p_action:data.action,p_expected_status:expected,
   p_note:data.note,p_actor:context.userId
  });
  if(error)throw error;
  const row=changed?.[0];
  if(!row)throw new Error("Decisão não registrada.");
  return {id:String(row.plan_id),status:String(row.new_status),
   disclaimer:"Aprovação interna apenas. Nenhum anúncio foi publicado ou orçamento gasto."};
 });

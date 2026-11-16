import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {rubiQaCommercialSnapshot} from "./rubi-launch-qa-snapshot";
import {RUBI_LAUNCH_QA_ITEMS,rubiQaReview,type RubiQaChecklist} from "./rubi-launch-qa";
const uuid=z.string().uuid();
const item=z.object({status:z.enum(["pending","verified","blocked"]),evidence:z.string().trim().max(1000)});
const schema=z.object({product_id:uuid,domain:item,desktop:item,mobile:item,supplier:item,terms:item});
export const getRubiLaunchQaAdmin=createServerFn({method:"POST"})
.middleware([requireOwnerRole]).validator((value:unknown)=>z.object({productId:uuid}).parse(value))
.handler(async({data})=>{
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 const {data:row,error}=await (supabaseAdmin as any).from("rubi_launch_qa_checklists").select("*").eq("product_id",data.productId).maybeSingle();
 if(error)throw error;
 if(!row)return null;
 return {
 product_id:row.product_id,
 ...Object.fromEntries(RUBI_LAUNCH_QA_ITEMS.map(item=>[item.key,{status:row[`${item.key}_status`],evidence:row[`${item.key}_evidence`]}]))
 } as RubiQaChecklist;
});
export const saveRubiLaunchQaAdmin=createServerFn({method:"POST"})
.middleware([requireOwnerRole]).validator((value:unknown)=>schema.parse(value))
.handler(async({data,context})=>{
 const review=rubiQaReview(data);
 if(review.invalid.length)throw new Error("Informe evidência para: "+review.invalid.join(", "));
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 const {data:product,error:productError}=await (supabaseAdmin as any).from("hub_products").select("id,active,retail_price,checkout_url,checkout_verified,supplier_id,hub_suppliers!inner(active,checkout_host)").eq("id",data.product_id).maybeSingle();
 if(productError)throw productError;
 if(!product)throw new Error("Produto não encontrado no catálogo.");
 const checklist=Object.fromEntries(RUBI_LAUNCH_QA_ITEMS.map(item=>[item.key,data[item.key]]));
 const {data: savedId,error}=await (supabaseAdmin as any).rpc("rubi_save_launch_qa_audited",{
  p_product_id:data.product_id,p_checklist:checklist,
  p_commercial_snapshot:rubiQaCommercialSnapshot(product),p_actor:context.userId
 });
 if(error)throw new Error(error.message);
 if(savedId!==data.product_id)throw new Error("Checklist e auditoria não registrados.");
 return {saved:true,review};
});

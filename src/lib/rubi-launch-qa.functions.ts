import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
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
.handler(async({data})=>{
 const review=rubiQaReview(data);
 if(review.invalid.length)throw new Error("Informe evidência para: "+review.invalid.join(", "));
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 const {data:product,error:productError}=await (supabaseAdmin as any).from("hub_products").select("id").eq("id",data.product_id).maybeSingle();
 if(productError)throw productError;
 if(!product)throw new Error("Produto não encontrado no catálogo.");
 const values:Record<string,unknown>={product_id:data.product_id,updated_at:new Date().toISOString()};
 for(const item of RUBI_LAUNCH_QA_ITEMS){
  values[`${item.key}_status`]=data[item.key].status;
  values[`${item.key}_evidence`]=data[item.key].evidence;
 }
 const {error}=await (supabaseAdmin as any).from("rubi_launch_qa_checklists").upsert(values,{onConflict:"product_id"});
 if(error)throw error;
 return {saved:true,review};
});

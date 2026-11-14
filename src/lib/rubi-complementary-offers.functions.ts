import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";
import { approvedRubiCheckout } from "./rubi-checkout-validation";
import { canSuggestComplementary } from "./rubi-complementary-offers";
const schema = z.object({
  id:z.string().uuid().optional(),
  revision:z.number().int().positive().optional(),
  primary_product_id:z.string().uuid(),
  suggested_product_id:z.string().uuid(),
  kind:z.enum(["order_bump","upsell","cross_sell","downsell"]),
  headline:z.string().trim().min(8).max(180),
  explanation:z.string().trim().max(700),
  position:z.number().int().min(0).max(10000).default(0),
  active:z.boolean().default(false),
});
const catalogFields="id,title,retail_price,active,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)";
export const listRubiComplementaryAdmin=createServerFn({method:"POST"}).middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({productId:z.string().uuid()}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).from("rubi_complementary_offers")
   .select("id,revision,primary_product_id,suggested_product_id,kind,headline,explanation,position,active")
   .eq("primary_product_id",data.productId).order("position").limit(100);
  if(error) throw error;
  return rows??[];
 });
export const saveRubiComplementaryAdmin=createServerFn({method:"POST"}).middleware([requireOwnerRole])
 .validator((input:unknown)=>schema.parse(input)).handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  if(data.primary_product_id===data.suggested_product_id)throw new Error("Selecione outro produto.");
  const {data:products,error:catalogError}=await db.from("hub_products")
   .select(catalogFields).in("id",[data.primary_product_id,data.suggested_product_id]);
  if(catalogError)throw catalogError;
  const primary=products?.find((p:any)=>p.id===data.primary_product_id);
  const suggested=products?.find((p:any)=>p.id===data.suggested_product_id);
  if(!primary||!suggested||!canSuggestComplementary(primary.id,suggested.id,data.kind,Number(primary.retail_price),Number(suggested.retail_price)))
   throw new Error("Combinação de produtos ou preço inválida.");
  if(data.active&&(!primary.active||!suggested.active||!approvedRubiCheckout(primary)||!approvedRubiCheckout(suggested)))
   throw new Error("Ambos os produtos exigem checkout oficial ativo.");
  if(data.id&&!data.revision)throw new Error("Revisão atual da estratégia obrigatória.");
  const {data:rows,error}=await db.rpc("rubi_save_complementary_offer_audited",{
   p_actor:context.userId,p_id:data.id??null,p_expected_revision:data.revision??null,
   p_primary:data.primary_product_id,p_suggested:data.suggested_product_id,
   p_kind:data.kind,p_headline:data.headline,p_explanation:data.explanation,
   p_position:data.position,p_active:data.active
  });
  if(error)throw error;
  if(!rows?.[0]?.saved_id)throw new Error("Estratégia e auditoria não registradas.");
  return {success:true,revision:Number(rows[0].saved_revision)};
 });
/** Public editorial suggestions: individual product links, NOT cart additions or external checkout upsells. */
export const listRubiComplementaryPublic=createServerFn({method:"POST"})
 .validator((input:unknown)=>z.object({productId:z.string().uuid()}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:main,error:mainError}=await (supabaseAdmin as any).from("hub_products")
    .select(catalogFields).eq("id",data.productId).maybeSingle();
  if(mainError) throw mainError;
  if(!main?.active || !approvedRubiCheckout(main)) return [];
  const {data:rows,error}=await (supabaseAdmin as any).from("rubi_complementary_offers")
    .select("id,suggested_product_id,kind,headline,explanation,position")
    .eq("primary_product_id",data.productId).eq("active",true).order("position").limit(12);
  if(error) throw error;
  if(!rows?.length) return [];
  const {data:products,error:productError}=await (supabaseAdmin as any).from("hub_products")
    .select(catalogFields).in("id",rows.map((x:any)=>x.suggested_product_id));
  if(productError) throw productError;
  return rows.flatMap((row:any)=>{
   // Only cross-sell and explicit alternatives can be offered as separate independent
   // product journeys here. Bumps/upsells need supplier's transaction-specific tooling.
   if(row.kind!=="cross_sell" && row.kind!=="downsell") return [];
   const p=products?.find((item:any)=>item.id===row.suggested_product_id);
   if(!p?.active||!approvedRubiCheckout(p)||!canSuggestComplementary(main.id,p.id,row.kind,Number(main.retail_price),Number(p.retail_price)))return [];
   return [{id:row.id,kind:row.kind,headline:row.headline,explanation:row.explanation,product_id:p.id,title:p.title,retail_price:Number(p.retail_price)}];
  });
 });
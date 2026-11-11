import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { activeRubiStorefrontSection, type RubiStorefrontSection } from "./rubi-storefront-sections";

/** A campaign deadline is shown only for a published and currently active editorial section.
 * It is NOT evidence of price expiration, stock scarcity or checkout closure.
 */
export const getRubiProductEditorialDeadline = createServerFn({method:"POST"})
 .validator((input:unknown)=>z.object({productId:z.string().uuid()}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:product,error:productError}=await db.from("hub_products")
   .select("id,active").eq("id",data.productId).eq("active",true).maybeSingle();
  if(productError||!product)return null;
  const {data:sections,error}=await db.from("rubi_storefront_sections")
   .select("status,starts_at,ends_at,product_ids")
   .eq("status","published").not("ends_at","is",null)
   .contains("product_ids",[data.productId]).limit(30);
  if(error||!sections?.length)return null;
  const now=new Date();
  const valid=(sections as RubiStorefrontSection[]).filter(section=>
   section.ends_at && activeRubiStorefrontSection(section,now) && Number.isFinite(Date.parse(section.ends_at)));
  if(!valid.length)return null;
  const endsAt=valid.map(section=>section.ends_at!).sort((a,b)=>Date.parse(a)-Date.parse(b))[0];
  return endsAt?{endsAt}:null;
 });

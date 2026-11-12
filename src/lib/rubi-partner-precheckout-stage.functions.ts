import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {approvedRubiCheckout} from "./rubi-checkout-validation";

const schema=z.object({
 partnerCode:z.string().uuid(),productId:z.string().uuid(),
 visitToken:z.string().uuid(),publicationId:z.string().uuid().optional()
});
/**
 * Record an actual mounted precheckout for one previously validated, tokenized
 * partner visit. This does NOT imply external checkout, purchase or commission.
 * The primary referral landing action remains the only visit writer.
 */
export const markRubiPartnerPrecheckoutViewed=createServerFn({method:"POST"})
 .validator((input:unknown)=>schema.parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:link,error:linkError}=await db.from("hub_partner_referral_links")
   .select("id,commercial_profile_id,product_id").eq("code",data.partnerCode)
   .eq("active",true).maybeSingle();
  if(linkError)throw linkError;
  if(!link||link.product_id!==data.productId)return {recorded:false};
  const [profile,grant,product]=await Promise.all([
   db.from("commercial_profiles").select("id").eq("id",link.commercial_profile_id)
    .eq("audience","partner").eq("status","approved").maybeSingle(),
   db.from("hub_partner_product_grants").select("id").eq("commercial_profile_id",link.commercial_profile_id)
    .eq("product_id",data.productId).eq("active",true).maybeSingle(),
   db.from("hub_products")
    .select("id,checkout_url,checkout_verified,retail_price,hub_suppliers!inner(active,checkout_host)")
    .eq("id",data.productId).eq("active",true).eq("hub_suppliers.active",true)
    .gt("retail_price",0).maybeSingle()
  ]);
  for(const result of [profile,grant,product])if(result.error)throw result.error;
  if(!profile.data||!grant.data||!product.data||!approvedRubiCheckout(product.data))
   return {recorded:false};
  // Token ownership is scoped to the existing validated visit; never insert
  // a visit or infer a new origin from an untrusted URL parameter.
  const cutoff=new Date(Date.now()-31*60_000).toISOString();
  let update=db.from("hub_partner_referral_visits")
   .update({precheckout_viewed_at:new Date().toISOString()})
   .eq("referral_link_id",link.id).eq("visit_token",data.visitToken)
   .gte("visited_at",cutoff).is("precheckout_viewed_at",null);
  update=data.publicationId
   ?update.eq("publication_id",data.publicationId)
   :update.is("publication_id",null);
  const {data:marked,error}=await update.select("id").maybeSingle();
  if(error)throw error;
  return {recorded:!!marked};
 });

import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {approvedRubiCheckout} from "./rubi-checkout-validation";

const bindSchema=z.object({accessToken:z.string().min(1),code:z.string().uuid()});

/** Bind a first-touch partner acquisition only after the customer authenticates.
 * This is acquisition evidence, not an order, sale or commission.
 */
export const bindMyPartnerCustomerAcquisition=createServerFn({method:"POST"})
 .validator((input:unknown)=>bindSchema.parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:identity,error:authError}=await supabaseAdmin.auth.getUser(data.accessToken);
  const customerId=identity.user?.id;
  if(authError||!customerId)throw new Error("Sessão inválida. Entre novamente.");
  const {data:link,error:linkError}=await db.from("hub_partner_referral_links")
   .select("id,commercial_profile_id,product_id").eq("code",data.code).eq("active",true).maybeSingle();
  if(linkError)throw linkError;
  if(!link)return {bound:false,status:"invalid_or_inactive_link"};
  const [profile,agreement,grant,product]=await Promise.all([
   db.from("commercial_profiles").select("id,user_id,status,audience")
    .eq("id",link.commercial_profile_id).eq("audience","partner").eq("status","approved").maybeSingle(),
   db.from("hub_partner_agreements").select("id")
    .eq("commercial_profile_id",link.commercial_profile_id).eq("active",true).maybeSingle(),
   db.from("hub_partner_product_grants").select("id")
    .eq("commercial_profile_id",link.commercial_profile_id).eq("product_id",link.product_id).eq("active",true).maybeSingle(),
   db.from("hub_products").select("id,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)")
    .eq("id",link.product_id).eq("active",true).eq("hub_suppliers.active",true).gt("retail_price",0).maybeSingle()
  ]);
  for(const result of [profile,agreement,grant,product])if(result.error)throw result.error;
  if(!profile.data||profile.data.user_id===customerId||!agreement.data||!grant.data||
     !product.data||!approvedRubiCheckout(product.data))
    return {bound:false,status:"partner_not_eligible"};
  const {data:result,error}=await db.rpc("rubi_bind_partner_customer_acquisition",{
   p_actor:customerId,p_code:data.code
  });
  if(error)throw error;
  return result as {bound:boolean;status:string;window_days?:number};
});

/** Privacy-safe partner totals; no customer identities or contact data are returned. */
export const getMyPartnerCustomerAcquisitionStats=createServerFn({method:"POST"})
 .validator((input:unknown)=>z.object({accessToken:z.string().min(1)}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:identity,error:authError}=await supabaseAdmin.auth.getUser(data.accessToken);
  const userId=identity.user?.id;
  if(authError||!userId)throw new Error("Sessão inválida. Entre novamente.");
  const {data:profile,error:profileError}=await db.from("commercial_profiles")
   .select("id").eq("user_id",userId).eq("audience","partner").eq("status","approved").maybeSingle();
  if(profileError)throw profileError;
  if(!profile)return {total:0,active:0,expired:0,windowDays:90};
  const now=new Date().toISOString();
  const [total,active]=await Promise.all([
   db.from("hub_partner_customer_acquisitions").select("customer_user_id",{count:"exact",head:true})
    .eq("commercial_profile_id",profile.id),
   db.from("hub_partner_customer_acquisitions").select("customer_user_id",{count:"exact",head:true})
    .eq("commercial_profile_id",profile.id).gt("expires_at",now)
  ]);
  if(total.error)throw total.error;
  if(active.error)throw active.error;
  const count=total.count??0,live=active.count??0;
  return {total:count,active:live,expired:Math.max(0,count-live),windowDays:90};
 });

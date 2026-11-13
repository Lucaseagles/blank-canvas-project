import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {approvedRubiCheckout} from "./rubi-checkout-validation";

const channel=z.enum(["instagram","tiktok","youtube","whatsapp","telegram","site"]);
/** Partner materials only. Never return proof documents or media evidence paths. */
export const getMyLicensedRubiCreativeAssets=createServerFn({method:"POST"})
 .validator((input:unknown)=>z.object({accessToken:z.string().min(1),channel}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:identity,error:authError}=await supabaseAdmin.auth.getUser(data.accessToken);
  if(authError||!identity.user?.id)throw new Error("Sessão expirada. Entre novamente.");
  const {data:profile,error:profileError}=await db.from("commercial_profiles")
   .select("id,status").eq("user_id",identity.user.id).eq("audience","partner").maybeSingle();
  if(profileError)throw profileError;
  if(!profile||profile.status!=="approved")return {items:[],partial:false};
  const {data:agreements,error:agreementError}=await db.from("hub_partner_agreements")
   .select("id").eq("commercial_profile_id",profile.id).eq("active",true).limit(1);
  if(agreementError)throw agreementError;
  if(!(agreements??[]).length)return {items:[],partial:false};
  const {data:grants,error:grantError}=await db.from("hub_partner_product_grants")
   .select("product_id").eq("commercial_profile_id",profile.id).eq("active",true).limit(201);
  if(grantError)throw grantError;
  if((grants??[]).length>=201)return {items:[],partial:true};
  const productIds=[...new Set<string>((grants??[]).map((g:{product_id:string})=>g.product_id))];
  if(!productIds.length)return {items:[],partial:false};
  const {data:products,error:productError}=await db.from("hub_products")
   .select("id,title,active,retail_price,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)")
   .in("id",productIds).eq("active",true).limit(201);
  if(productError)throw productError;
  if((products??[]).length>=201)return {items:[],partial:true};
  const eligible=new Map<string,any>((products??[]).filter((p:any)=>approvedRubiCheckout(p)).map((p:any)=>[p.id,p]));
  if(!eligible.size)return {items:[],partial:false};
  const {data:movements,error:movementError}=await db.from("rubi_movements")
   .select("id,product_id,status").in("product_id",[...eligible.keys()]).eq("status","review").limit(201);
  if(movementError)throw movementError;
  if((movements??[]).length>=201)return {items:[],partial:true};
  const movementProduct=new Map<string,string>((movements??[]).map((m:{id:string;product_id:string})=>[m.id,m.product_id]));
  if(!movementProduct.size)return {items:[],partial:false};
  const {data:variants,error:variantError}=await db.from("rubi_movement_variants")
   .select("id,movement_id,status,revision,media_rights_confirmed,name,creative_hook,creative_script,page_headline,page_body,call_to_action")
   .in("movement_id",[...movementProduct.keys()]).eq("status","review").eq("media_rights_confirmed",true).limit(201);
  if(variantError)throw variantError;
  if((variants??[]).length>=201)return {items:[],partial:true};
  const variantMap=new Map<string,any>((variants??[]).map((v:any)=>[v.id,v]));
  if(!variantMap.size)return {items:[],partial:false};
  const now=new Date().toISOString();
  const {data:licenses,error:licenseError}=await db.from("rubi_creative_licenses")
   .select("variant_id,approved_variant_revision,permitted_channels,permitted_audiences,valid_from,valid_until")
   .in("variant_id",[...variantMap.keys()]).eq("status","approved")
   .contains("permitted_channels",[data.channel]).contains("permitted_audiences",["partner"])
   .lte("valid_from",now).gt("valid_until",now).limit(201);
  if(licenseError)throw licenseError;
  if((licenses??[]).length>=201)return {items:[],partial:true};
  const items=(licenses??[]).flatMap((license:any)=>{
   const variant=variantMap.get(license.variant_id);
   if(!variant||variant.revision!==license.approved_variant_revision)return [];
   const productId=movementProduct.get(variant.movement_id);
   const product=productId?eligible.get(productId):null;
   if(!product)return [];
   return [{id:variant.id,productId,productTitle:product.title,name:variant.name,hook:variant.creative_hook,
    script:variant.creative_script,headline:variant.page_headline,body:variant.page_body,cta:variant.call_to_action,
    channel:data.channel,validUntil:license.valid_until}];
  });
  return {items,partial:false};
 });

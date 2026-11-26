import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {approvedRubiCheckout} from "./rubi-checkout-validation";

const channels=["instagram","tiktok","youtube","whatsapp","telegram","site"] as const;
const limit=201;

/**
 * Partner-facing campaign opportunities are composed from already-approved records.
 * No write, grant, commission, publication or external distribution is performed.
 */
export const getMyRubiCampaignOpportunities=createServerFn({method:"POST"})
 .validator((input:unknown)=>z.object({accessToken:z.string().min(1)}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:identity,error:authError}=await supabaseAdmin.auth.getUser(data.accessToken);
  if(authError||!identity.user?.id)throw new Error("Sessão expirada. Entre novamente.");
  const {data:profile,error:profileError}=await db.from("commercial_profiles")
   .select("id,status").eq("user_id",identity.user.id).eq("audience","partner").maybeSingle();
  if(profileError)throw profileError;
  if(!profile||profile.status!=="approved")return {items:[],partial:false};
  const [agreements,grants,memberships]=await Promise.all([
   db.from("hub_partner_agreements").select("id").eq("commercial_profile_id",profile.id).eq("active",true).limit(2),
   db.from("hub_partner_product_grants").select("product_id").eq("commercial_profile_id",profile.id).eq("active",true).limit(limit),
   db.from("rubi_creator_team_members").select("id,team_id").eq("commercial_profile_id",profile.id).eq("status","active").limit(limit)
  ]);
  for(const r of [agreements,grants,memberships])if(r.error)throw r.error;
  if(!(agreements.data??[]).length)return {items:[],partial:false};
  if((grants.data??[]).length>=limit||(memberships.data??[]).length>=limit)return {items:[],partial:true};
  const productIds=[...new Set<string>((grants.data??[]).map((x:any)=>x.product_id))];
  const teamIds=[...new Set<string>((memberships.data??[]).map((x:any)=>x.team_id))];
  if(!productIds.length||!teamIds.length)return {items:[],partial:false};
  const [teams,assignments,products]=await Promise.all([
   db.from("rubi_creator_teams").select("id,name,niche,stage").in("id",teamIds).limit(limit),
   db.from("rubi_creator_team_campaign_assignments").select("id,team_id,campaign_plan_id,movement_id,variant_id,status")
    .in("team_id",teamIds).eq("status","ready").limit(limit),
   db.from("hub_products").select("id,title,description,image_url,category,retail_price,active,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)")
    .in("id",productIds).eq("active",true).eq("hub_suppliers.active",true).gt("retail_price",0).limit(limit)
  ]);
  for(const r of [teams,assignments,products])if(r.error)throw r.error;
  if((teams.data??[]).length>=limit||(assignments.data??[]).length>=limit||(products.data??[]).length>=limit)return {items:[],partial:true};
  const safeProducts=(products.data??[]).filter((p:any)=>approvedRubiCheckout(p));
  if(!safeProducts.length||!(assignments.data??[]).length)return {items:[],partial:false};
  const productById=new Map<string,any>(safeProducts.map((p:any)=>[p.id,p]));
  const teamById=new Map<string,any>((teams.data??[]).filter((t:any)=>t.stage!=="paused").map((t:any)=>[t.id,t]));
  const membershipsByTeam=new Set<string>((memberships.data??[]).map((m:any)=>m.team_id));
  const [plans,movements,variants]=await Promise.all([
   db.from("rubi_master_campaign_plans").select("id,product_id,campaign_code,status,mode,audience")
    .in("id",[...new Set((assignments.data??[]).map((a:any)=>a.campaign_plan_id))]).eq("status","approved").eq("mode","creator_team").eq("audience","consumer").limit(limit),
   db.from("rubi_movements").select("id,product_id,name,audience,status")
    .in("id",[...new Set((assignments.data??[]).map((a:any)=>a.movement_id))]).eq("status","review").eq("audience","consumer").limit(limit),
   db.from("rubi_movement_variants").select("id,movement_id,name,status,revision,media_rights_confirmed,creative_hook,creative_script,page_headline,page_body,call_to_action")
    .in("id",[...new Set((assignments.data??[]).map((a:any)=>a.variant_id))]).eq("status","review").eq("media_rights_confirmed",true).limit(limit)
  ]);
  for(const r of [plans,movements,variants])if(r.error)throw r.error;
  if((plans.data??[]).length>=limit||(movements.data??[]).length>=limit||(variants.data??[]).length>=limit)return {items:[],partial:true};
  const planById=new Map<string,any>((plans.data??[]).map((p:any)=>[p.id,p]));
  const movementById=new Map<string,any>((movements.data??[]).map((m:any)=>[m.id,m]));
  const variantById=new Map<string,any>((variants.data??[]).map((v:any)=>[v.id,v]));
  const candidates=(assignments.data??[]).flatMap((a:any)=>{
   const team=teamById.get(a.team_id),plan=planById.get(a.campaign_plan_id);
   const movement=movementById.get(a.movement_id),variant=variantById.get(a.variant_id);
   if(!team||!membershipsByTeam.has(a.team_id)||!plan||!movement||!variant||
      variant.movement_id!==movement.id||plan.product_id!==movement.product_id||
      !productById.has(plan.product_id))return [];
   return [{assignmentId:a.id,team,plan,movement,variant,product:productById.get(plan.product_id)}];
  });
  if(!candidates.length)return {items:[],partial:false};
  const variantIds=[...new Set(candidates.map(x=>x.variant.id))];
  const now=new Date().toISOString();
  const {data:licenses,error:licenseError}=await db.from("rubi_creative_licenses")
   .select("variant_id,approved_variant_revision,permitted_channels,permitted_audiences,valid_until")
   .in("variant_id",variantIds).eq("status","approved")
   .contains("permitted_audiences",["partner"]).lte("valid_from",now).gt("valid_until",now).limit(limit);
  if(licenseError)throw licenseError;
  if((licenses??[]).length>=limit)return {items:[],partial:true};
  const licenseByVariant=new Map<string,any>();
  for(const license of licenses??[]){
   const old=licenseByVariant.get(license.variant_id);
   if(!old||new Date(license.valid_until)>new Date(old.valid_until))licenseByVariant.set(license.variant_id,license);
  }
  const items=candidates.flatMap(({assignmentId,team,plan,movement,variant,product})=>{
   const license=licenseByVariant.get(variant.id);
   if(!license||license.approved_variant_revision!==variant.revision)return [];
   const permitted=(license.permitted_channels??[]).filter((c:string)=>channels.includes(c as any));
   return permitted.map((channel:string)=>({
    id:assignmentId+":"+variant.id+":"+channel,assignmentId,teamName:team.name,teamNiche:team.niche,
    campaignCode:plan.campaign_code,movementName:movement.name,productId:product.id,
    productTitle:product.title,productImage:product.image_url,productCategory:product.category,
    retailPrice:Number(product.retail_price),variantName:variant.name,channel,
    hook:variant.creative_hook,script:variant.creative_script,headline:variant.page_headline,
    body:variant.page_body,cta:variant.call_to_action,licenseValidUntil:license.valid_until
   }));
  });
  return {items,partial:false};
 });

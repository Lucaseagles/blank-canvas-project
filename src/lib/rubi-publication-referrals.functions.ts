import {createServerFn} from "@tanstack/react-start";
import {requireOwnerRole} from "./auth-guards.server";
import {approvedRubiCheckout} from "./rubi-checkout-validation";

/**
 * Master-only bridge to EXISTING partner/product referral links.
 * Reusing /r/:code preserves the original visit tracker and its checkout safeguards.
 * One code belongs to partner+SKU, NOT to an individual post; never claim post attribution.
 */
export const getRubiPublicationAuthorizedReferralsAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const [posts,assignments,members,plans,profiles,grants,links,products]=await Promise.all([
   db.from("rubi_creator_team_publication_evidence")
    .select("id,assignment_id,membership_id,review_status")
    .eq("review_status","reviewed").order("created_at",{ascending:false}).limit(200),
   db.from("rubi_creator_team_campaign_assignments")
    .select("id,team_id,campaign_plan_id,status").limit(300),
   db.from("rubi_creator_team_members")
    .select("id,team_id,commercial_profile_id,status").limit(500),
   db.from("rubi_master_campaign_plans")
    .select("id,product_id,status,mode").limit(300),
   db.from("commercial_profiles").select("id")
    .eq("audience","partner").eq("status","approved").limit(500),
   db.from("hub_partner_product_grants")
    .select("commercial_profile_id,product_id,active").eq("active",true).limit(1000),
   db.from("hub_partner_referral_links")
    .select("commercial_profile_id,product_id,code,active").eq("active",true).limit(1000),
   db.from("hub_products")
    .select("id,active,retail_price,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)")
    .limit(500)
  ]);
  for(const result of [posts,assignments,members,plans,profiles,grants,links,products])
   if(result.error)throw result.error;
  const limited=(posts.data??[]).length===200||(assignments.data??[]).length===300||
   (members.data??[]).length===500||(plans.data??[]).length===300||
   (profiles.data??[]).length===500||(grants.data??[]).length===1000||
   (links.data??[]).length===1000||(products.data??[]).length===500;
  // Fail closed for capped sources. Missing rows in a partial snapshot must not be
  // interpreted as revoked or authorized grants.
  if(limited)return {links:[] as {publicationId:string;code:string}[],limited:true};
  const byAssignment=new Map<string,any>((assignments.data??[]).map((r:any)=>[r.id,r]));
  const byMember=new Map<string,any>((members.data??[]).map((r:any)=>[r.id,r]));
  const byPlan=new Map<string,any>((plans.data??[]).map((r:any)=>[r.id,r]));
  const byProduct=new Map<string,any>((products.data??[]).map((r:any)=>[r.id,r]));
  const approvedProfiles=new Set<string>((profiles.data??[]).map((r:any)=>r.id));
  const activeGrants=new Set<string>((grants.data??[]).map((r:any)=>r.commercial_profile_id+":"+r.product_id));
  const activeLinks=new Map<string,string>((links.data??[]).map((r:any)=>[r.commercial_profile_id+":"+r.product_id,r.code]));
  const authorized:{publicationId:string;code:string}[]=[];
  for(const post of posts.data??[]){
   const assignment=byAssignment.get(post.assignment_id),member=byMember.get(post.membership_id);
   if(!assignment||assignment.status!=="ready"||!member||member.status!=="active"||
      member.team_id!==assignment.team_id||!approvedProfiles.has(member.commercial_profile_id))continue;
   const plan=byPlan.get(assignment.campaign_plan_id);
   if(!plan||plan.status!=="approved"||plan.mode!=="creator_team")continue;
   const product=byProduct.get(plan.product_id);
   if(!product||!product.active||Number(product.retail_price)<=0||!approvedRubiCheckout(product))continue;
   const key=member.commercial_profile_id+":"+plan.product_id;
   const code=activeGrants.has(key)?activeLinks.get(key):undefined;
   if(code)authorized.push({publicationId:String(post.id),code:String(code)});
  }
  return {links:authorized,limited:false};
 });

import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {approvedRubiCheckout} from "./rubi-checkout-validation";
import {rubiOfferReadiness,type RubiOfferPlaybook} from "./rubi-offer-playbook";
const id=z.string().uuid();

/** Master-only brief for an EXISTING team+campaign+product assignment.
 * Does not expose private drafts to creators or establish commission terms.
 */
export const getRubiTeamOfferKitAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({assignmentId:id}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const getOne=async(table:string,columns:string,field:string,value:string)=>{
   const result=await db.from(table).select(columns).eq(field,value).maybeSingle();
   if(result.error)throw result.error;
   return result.data as any;
  };
  const assignment=await getOne("rubi_creator_team_campaign_assignments",
   "id,team_id,campaign_plan_id,movement_id,variant_id,status,editorial_notes",
   "id",data.assignmentId);
  if(!assignment)throw new Error("Associação de time não encontrada.");
  const [team,plan,movement,variant]=await Promise.all([
   getOne("rubi_creator_teams","id,name,niche,stage","id",assignment.team_id),
   getOne("rubi_master_campaign_plans","id,product_id,campaign_code,mode,status,audience","id",assignment.campaign_plan_id),
   getOne("rubi_movements","id,product_id,name,status,truthful_promise,buyer_persona,problem,desired_outcome,evidence_notes","id",assignment.movement_id),
   getOne("rubi_movement_variants","id,movement_id,name,status,media_rights_confirmed,creative_hook,creative_script,page_headline,page_body,call_to_action,proof_notes","id",assignment.variant_id)
  ]);
  if(!team||!plan||!movement||!variant||
    plan.mode!=="creator_team"||plan.product_id!==movement.product_id||
    variant.movement_id!==movement.id)
   throw new Error("A associação possui referências inconsistentes.");
  const [offerResult,product,members]=await Promise.all([
   db.from("rubi_offer_playbooks").select("product_id,audience,promise,verified_benefits,proof_notes,creative_hook,creative_script,page_headline,page_body,objections,movement_plan,channels,stage").eq("product_id",plan.product_id).eq("audience","consumer").maybeSingle(),
   getOne("hub_products","id,title,category,active,retail_price,checkout_url,checkout_verified,hub_suppliers!inner(active,checkout_host)","id",plan.product_id),
   db.from("rubi_creator_team_members").select("id,commercial_profile_id,status").eq("team_id",team.id).limit(201)
  ]);
  if(offerResult.error)throw offerResult.error;
  if(members.error)throw members.error;
  const offer=offerResult.data as RubiOfferPlaybook|null;
  if(!product)throw new Error("Produto original não encontrado.");
  const offerReadiness=offer?rubiOfferReadiness(offer as RubiOfferPlaybook):null;
  const eligibleProduct=product.active===true&&Number(product.retail_price)>0&&!!approvedRubiCheckout(product);
  const approvedPackage=assignment.status==="ready"&&team.stage!=="paused"&&
   plan.status==="approved"&&movement.status==="review"&&variant.status==="review"&&
   variant.media_rights_confirmed===true;
  const people=members.data??[];
  // A team with >200 members is intentionally not displayed as fully assessed.
  const partial=people.length>=201;
  let authorizedMembers:number|null=null;
  if(!partial&&people.length>0){
   const activeIds=people.filter((m:any)=>m.status==="active").map((m:any)=>m.commercial_profile_id);
   if(activeIds.length===0)authorizedMembers=0;
   else{
    const [profiles,grants,links]=await Promise.all([
     db.from("commercial_profiles").select("id").in("id",activeIds).eq("audience","partner").eq("status","approved").limit(201),
     db.from("hub_partner_product_grants").select("commercial_profile_id").in("commercial_profile_id",activeIds).eq("product_id",product.id).eq("active",true).limit(201),
     db.from("hub_partner_referral_links").select("commercial_profile_id").in("commercial_profile_id",activeIds).eq("product_id",product.id).eq("active",true).limit(201)
    ]);
    for(const r of [profiles,grants,links])if(r.error)throw r.error;
    const safe=(profiles.data??[]).length<201&&(grants.data??[]).length<201&&(links.data??[]).length<201;
    if(safe){
     const p=new Set((profiles.data??[]).map((x:any)=>x.id));
     const g=new Set((grants.data??[]).map((x:any)=>x.commercial_profile_id));
     const l=new Set((links.data??[]).map((x:any)=>x.commercial_profile_id));
     authorizedMembers=activeIds.filter((value:string)=>p.has(value)&&g.has(value)&&l.has(value)).length;
    }
   }
  }else if(!partial)authorizedMembers=0;
  const checks=[
   {name:"Produto ativo e checkout oficial verificado",ok:eligibleProduct},
   {name:"Plano, movimento, criativo e direitos aprovados",ok:approvedPackage},
   {name:"Oferta completa revisável (8 critérios)",ok:offerReadiness?.score===100&&offer?.stage==="ready_for_review"},
   {name:"Ao menos um integrante com autorização e link comercial ativo",ok:authorizedMembers!==null&&authorizedMembers>0}
  ];
  return {
   team:{name:String(team.name),niche:String(team.niche),stage:String(team.stage)},
   product:{id:String(product.id),title:String(product.title),category:String(product.category??"Não categorizado")},
   campaign:{code:String(plan.campaign_code),status:String(plan.status),audience:String(plan.audience)},
   movement:{name:String(movement.name),promise:String(movement.truthful_promise??""),persona:String(movement.buyer_persona??""),problem:String(movement.problem??""),outcome:String(movement.desired_outcome??"")},
   variant:{name:String(variant.name),hook:String(variant.creative_hook??""),script:String(variant.creative_script??""),headline:String(variant.page_headline??""),page:String(variant.page_body??""),cta:String(variant.call_to_action??"")},
   offer:offer?{promise:String(offer.promise??""),benefits:String(offer.verified_benefits??""),proof:String(offer.proof_notes??""),objections:String(offer.objections??""),channels:(offer.channels??[]) as string[],score:offerReadiness?.score??0,missing:offerReadiness?.missing??[]}:null,
   checks,authorizedMembers,partial,readyForEditorialHandoff:checks.every(item=>item.ok),
   caution:"Kit privado do Master. Compatibilidade entre nicho e categoria exige revisão humana. Não fixa porcentagem de comissão, não libera checkout de parceiro e não autoriza publicação."
  };
 });

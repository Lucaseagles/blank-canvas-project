import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";
import {approvedRubiCheckout} from "./rubi-checkout-validation";
import {validRubiStoryMediaUrl} from "./rubi-product-stories";
import {activeRubiStorefrontSection,validRubiStorefrontWindow,type RubiStorefrontSection} from "./rubi-storefront-sections";
const uuid=z.string().uuid();
const form=z.object({
 id:uuid.optional(),kind:z.enum(["hero","collection"]),title:z.string().trim().min(4).max(100),
 subtitle:z.string().trim().max(280),product_ids:z.array(uuid).min(1).max(12),
 status:z.enum(["draft","published"]),starts_at:z.string().datetime({offset:true}).nullable(),
 ends_at:z.string().datetime({offset:true}).nullable(),
 position:z.number().int().min(0).max(1000),revision:z.number().int().positive().optional()
}).refine(s=>new Set(s.product_ids).size===s.product_ids.length,{message:"Não repita produtos na mesma coleção."})
 .refine(validRubiStorefrontWindow,{message:"O início precisa ocorrer antes do fim."});
const db=async()=>{const {supabaseAdmin}=await import("@/integrations/supabase/client.server");return supabaseAdmin as any;};
const retailProductFields="id,title,description,image_url,category,retail_price,active,checkout_verified,checkout_url,hub_suppliers!inner(active,checkout_host)";
async function authorizedProducts(admin:any,ids:string[]){
 const {data,error}=await admin.from("hub_products").select(retailProductFields).in("id",ids).eq("active",true).eq("hub_suppliers.active",true);
 if(error)throw error;
 return (data??[]).filter((p:any)=>Number(p.retail_price)>0&&approvedRubiCheckout(p));
}
export const listRubiStorefrontSectionsAdmin=createServerFn({method:"GET"}).middleware([requireOwnerRole]).handler(async()=>{
 const admin=await db();
 const {data,error}=await admin.from("rubi_storefront_sections").select("*").order("position").limit(100);
 if(error)throw error;
 return (data??[]) as RubiStorefrontSection[];
});
export const saveRubiStorefrontSectionAdmin=createServerFn({method:"POST"}).middleware([requireOwnerRole])
 .validator((input:unknown)=>form.parse(input))
 .handler(async({data,context})=>{
  const admin=await db();
  // The DB repeats eligibility checks within the authoritative transaction.
  if(data.status==="published"){
   const validated=await authorizedProducts(admin,data.product_ids);
   if(validated.length!==data.product_ids.length)throw new Error("Todos os produtos precisam de checkout oficial verificado.");
  }
  if(data.id&&!data.revision)throw new Error("Revisão da seção obrigatória.");
  const {data:rows,error}=await admin.rpc("rubi_save_storefront_section_audited",{
   p_actor:context.userId,p_id:data.id??null,p_expected_revision:data.revision??null,
   p_kind:data.kind,p_title:data.title,p_subtitle:data.subtitle,p_products:data.product_ids,
   p_status:data.status,p_starts_at:data.starts_at,p_ends_at:data.ends_at,p_position:data.position
  });
  if(error)throw error;
  if(!rows?.[0]?.saved_id)throw new Error("Seção e auditoria não registradas.");
  return {id:String(rows[0].saved_id),revision:Number(rows[0].new_revision)};
 });
export const getRubiStorefrontPublishedSections=createServerFn({method:"GET"}).handler(async()=>{
 const admin=await db();
 const now=new Date();
 const {data,error}=await admin.from("rubi_storefront_sections")
  .select("id,kind,title,subtitle,product_ids,position,status,starts_at,ends_at")
  .eq("status","published").order("position").limit(20);
 if(error)throw error;
 const sections=((data??[]) as RubiStorefrontSection[]).filter(s=>activeRubiStorefrontSection(s,now));
 if(!sections.length)return [];
 const ids=[...new Set(sections.flatMap(s=>s.product_ids))];
 const products=await authorizedProducts(admin,ids);
 const byId=new Map<string,any>(products.map((p:any)=>[p.id,p]));
 // Only approved, licensed media for products with a currently authorized checkout.
 const approvedIds=products.map((p:any)=>p.id as string);
 const {data:storyRows,error:storyError}=await admin.from("rubi_product_stories")
  .select("product_id,title,poster_url,video_url,position")
  .in("product_id",approvedIds).eq("status","approved").eq("rights_confirmed",true)
  .order("position",{ascending:true}).limit(500);
 if(storyError)throw storyError;
 const storyByProduct=new Map<string,{title:string;poster_url:string|null}>();
 for(const row of (storyRows??[]) as Array<{product_id:string;title:string;poster_url:string|null;video_url:string}>){
  if(storyByProduct.has(row.product_id)||!validRubiStoryMediaUrl(row.video_url,"video")||
     (row.poster_url&&!validRubiStoryMediaUrl(row.poster_url,"poster")))continue;
  storyByProduct.set(row.product_id,{title:row.title,poster_url:row.poster_url});
 }

 return sections.map(section=>({
  id:section.id!,kind:section.kind,title:section.title,subtitle:section.subtitle,
  products:section.product_ids.map(id=>byId.get(id)).filter(Boolean).map((p:any)=>({
   id:p.id,title:p.title,image_url:p.image_url,retail_price:Number(p.retail_price),
   story:storyByProduct.get(p.id)??null
  }))
 })).filter(s=>s.products.length>0);
});

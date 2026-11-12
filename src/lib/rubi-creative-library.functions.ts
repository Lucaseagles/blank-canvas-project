import {createServerFn} from "@tanstack/react-start";
import {requireOwnerRole} from "./auth-guards.server";

/**
 * Master-only catalog of reviewed reusable creative text assets.
 * media_rights_confirmed is a declaration, NOT documentary proof of license.
 * No asset is exposed automatically to partner login or public pages.
 */
export const listRubiCreativeLibraryAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const variantsResult=await db.from("rubi_movement_variants")
   .select("id,movement_id,name,format,creative_hook,creative_script,page_headline,page_body,call_to_action,media_notes,proof_notes,media_rights_confirmed,status,revision")
   .eq("status","review").eq("media_rights_confirmed",true)
   .order("updated_at",{ascending:false}).limit(201);
  if(variantsResult.error)throw variantsResult.error;
  const variants=variantsResult.data??[];
  if(variants.length>=201)return {items:[],partial:true};
  if(variants.length===0)return {items:[],partial:false};
  const movementIds=[...new Set<string>(variants.map((v:{movement_id:string})=>v.movement_id))];
  const movementsResult=await db.from("rubi_movements")
   .select("id,product_id,name,status,truthful_promise")
   .in("id",movementIds).limit(201);
  if(movementsResult.error)throw movementsResult.error;
  const movements=movementsResult.data??[];
  if(movements.length>=201)return {items:[],partial:true};
  const productIds=[...new Set<string>(movements.map((m:{product_id:string})=>m.product_id))];
  const productsResult=productIds.length?await db.from("hub_products")
   .select("id,title,category").in("id",productIds).limit(201):{data:[],error:null};
  if(productsResult.error)throw productsResult.error;
  if((productsResult.data??[]).length>=201)return {items:[],partial:true};
  const movementById=new Map<string,any>(movements.map((m:{id:string})=>[m.id,m]));
  const productById=new Map<string,any>((productsResult.data??[]).map((p:{id:string})=>[p.id,p]));
  const items=variants.flatMap((v:any)=>{
   const movement=movementById.get(v.movement_id);
   const product=movement?productById.get(movement.product_id):null;
   // Fail closed for unreviewed movement or missing product; never label draft licensed.
   if(!movement||movement.status!=="review"||!product)return [];
   return [{
    id:String(v.id),productId:String(product.id),productTitle:String(product.title),
    category:String(product.category??"Sem categoria"),movement:String(movement.name),
    name:String(v.name),format:String(v.format),revision:Number(v.revision),
    hook:String(v.creative_hook??""),script:String(v.creative_script??""),
    pageHeadline:String(v.page_headline??""),pageBody:String(v.page_body??""),
    cta:String(v.call_to_action??""),mediaNotes:String(v.media_notes??""),
    proofNotes:String(v.proof_notes??""),rightsDeclaration:true
   }];
  });
  return {items,partial:false};
 });

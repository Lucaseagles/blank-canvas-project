import {createServerFn} from "@tanstack/react-start";

/** Public directory of approved creator profiles; exposes no private partner/customer data. */
export const getPublicRubiCreatorDirectory=createServerFn({method:"GET"})
 .handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:profiles,error:profileError}=await db.from("commercial_profiles")
   .select("id,display_name,partner_type,public_store_code")
   .eq("audience","partner").eq("status","approved").not("public_store_code","is",null)
   .order("display_name",{ascending:true}).limit(100);
  if(profileError)throw profileError;
  const rows=(profiles??[]).filter((profile:any)=>typeof profile.public_store_code==="string"&&/^[a-f0-9]{12}$/i.test(profile.public_store_code));
  if(!rows.length)return [];
  const {data:published,error:publishedError}=await db.from("rubi_partner_creator_submissions")
   .select("commercial_profile_id,videos!inner(id,status,scheduled_for)")
   .in("commercial_profile_id",rows.map((profile:any)=>profile.id))
   .eq("status","approved").eq("videos.status","published").limit(501);
  if(publishedError)throw publishedError;
  if((published??[]).length>=501)return [];
  const counts=new Map<string,number>();
  for(const item of published??[]){
   const video=Array.isArray(item.videos)?item.videos[0]:item.videos;
   if(!video||video.status!=="published"||(video.scheduled_for&&new Date(video.scheduled_for).getTime()>Date.now()))continue;
   counts.set(item.commercial_profile_id,(counts.get(item.commercial_profile_id)??0)+1);
  }
  return rows.map((profile:any)=>({
   displayName:String(profile.display_name||"Criador RUBI"),
   partnerType:profile.partner_type as string|null,
   storeCode:String(profile.public_store_code),
   publishedVideoCount:counts.get(profile.id)??0
  })).sort((a:any,b:any)=>b.publishedVideoCount-a.publishedVideoCount||a.displayName.localeCompare(b.displayName,"pt-BR"));
 });

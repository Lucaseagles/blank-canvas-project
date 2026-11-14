import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";

const uuid=z.string().uuid();
const pair=z.object({variantId:uuid,videoId:uuid});
const videoFields="id,title,status,scheduled_for";
export const listRubiVariantVideoLinksAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({variantId:uuid}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:links,error}=await db.from("rubi_variant_video_links")
   .select("video_id,variant_id,linked_at").eq("variant_id",data.variantId)
   .order("linked_at",{ascending:false}).limit(51);
  if(error)throw error;
  const selected=(links??[]).slice(0,50) as Array<{video_id:string;variant_id:string;linked_at:string}>;
  if(!selected.length)return {rows:[],partial:false};
  const {data:videos,error:videoError}=await db.from("videos").select(videoFields).in("id",selected.map(x=>x.video_id));
  if(videoError)throw videoError;
  const byId=new Map<string,{title:string;status:string}>((videos??[]).map((v:{id:string;title:string;status:string})=>[v.id,{title:v.title,status:v.status}]));
  return {rows:selected.map(x=>({...x,title:byId.get(x.video_id)?.title??"Vídeo indisponível",
   status:byId.get(x.video_id)?.status??"unknown"})),partial:(links??[]).length>50};
 });
export const saveRubiVariantVideoLinkAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>pair.parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_set_variant_video_link_audited",{
   p_actor:context.userId,p_variant:data.variantId,p_video:data.videoId,p_link:true
  });
  if(error)throw error;
  if(!rows?.[0]?.saved_video_id)throw new Error("Vínculo e auditoria não registrados.");
  return {success:true,note:"Vínculo editorial auditado, sem atribuição automática de vendas ou retenção."};
 });
export const deleteRubiVariantVideoLinkAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>pair.parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_set_variant_video_link_audited",{
   p_actor:context.userId,p_variant:data.variantId,p_video:data.videoId,p_link:false
  });
  if(error)throw error;
  if(!rows?.[0]?.saved_video_id)throw new Error("Desvinculação e auditoria não registradas.");
  return {success:true};
 });

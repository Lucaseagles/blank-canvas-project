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
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:variant,error:variantError}=await db.from("rubi_movement_variants")
   .select("id,format,status").eq("id",data.variantId).maybeSingle();
  if(variantError)throw variantError;
  if(!variant || variant.format!=="short_video" || variant.status!=="review")
   throw new Error("Selecione uma variante de vídeo revisada.");
  const {data:video,error:videoError}=await db.from("videos").select(videoFields).eq("id",data.videoId).maybeSingle();
  if(videoError)throw videoError;
  if(!video||video.status!=="published"||
   (video.scheduled_for&&new Date(video.scheduled_for).getTime()>Date.now()))
   throw new Error("Selecione um vídeo publicado e disponível.");
  // Reject competing links; never silently overwrite another variant's association.
  const {data:existing,error:existingError}=await db.from("rubi_variant_video_links")
   .select("variant_id").eq("video_id",data.videoId).maybeSingle();
  if(existingError)throw existingError;
  if(existing&&existing.variant_id!==data.variantId)
   throw new Error("Vídeo já associado a outra variante. Desvincule antes de reutilizar.");
  if(!existing){
   const {error}=await db.from("rubi_variant_video_links")
    .insert({video_id:data.videoId,variant_id:data.variantId});
   if(error)throw error;
  }
  return {success:true,note:"Vínculo editorial, sem atribuição automática de vendas ou retenção."};
 });
export const deleteRubiVariantVideoLinkAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>pair.parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {error}=await (supabaseAdmin as any).from("rubi_variant_video_links")
   .delete().eq("video_id",data.videoId).eq("variant_id",data.variantId);
  if(error)throw error;
  return {success:true};
 });

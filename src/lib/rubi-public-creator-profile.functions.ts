import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";

const STORE_CODE=z.string().regex(/^[a-f0-9]{12}$/i);
const SOCIAL_HOSTS=[
 "youtube.com","youtu.be","youtube-nocookie.com","tiktok.com","instagram.com",
 "shopee.com.br","shopee.com","shope.ee","kwai.com","kuaishou.com",
 "shein.com","shein.com.br","mercadolivre.com.br","mercadolibre.com"
];
const allowedHost=(host:string)=>SOCIAL_HOSTS.some(domain=>host===domain||host.endsWith("."+domain));

/** Public creator profile: approved partner identity plus Owner-published creator submissions only. */
export const getPublicRubiCreatorProfile=createServerFn({method:"GET"})
 .validator((input:unknown)=>z.object({storeCode:STORE_CODE}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:profile,error:profileError}=await db.from("commercial_profiles")
   .select("id,display_name,partner_type,public_store_code")
   .eq("public_store_code",data.storeCode).eq("audience","partner").eq("status","approved").maybeSingle();
  if(profileError)throw profileError;
  if(!profile)return null;
  const {data:rows,error}=await db.from("rubi_partner_creator_submissions")
   .select("id,title,caption,content_source,source_platform,external_url,reviewed_at,videos!inner(id,title,video_url,storage_path,external_url,status,scheduled_for,created_at)")
   .eq("commercial_profile_id",profile.id).eq("status","approved").eq("videos.status","published")
   .order("reviewed_at",{ascending:false}).limit(60);
  if(error)throw error;
  const videos=[];
  for(const row of rows??[]){
   const video=Array.isArray(row.videos)?row.videos[0]:row.videos;
   if(!video||video.status!=="published")continue;
   if(video.scheduled_for&&new Date(video.scheduled_for).getTime()>Date.now())continue;
   const externalUrl=String(row.external_url??video.external_url??"");
   let safeExternalUrl:string|null=null;
   if(externalUrl){
    try{
     const url=new URL(externalUrl);
     if(url.protocol==="https:"&&!url.username&&!url.password&&!url.port&&allowedHost(url.hostname.toLowerCase()))
      safeExternalUrl=url.toString();
    }catch{/* Invalid legacy social URL stays hidden. */}
    if(!safeExternalUrl)continue;
   }
   let playbackUrl:string|null=null;
   if(video.storage_path){
    const {data:signed,error:signedError}=await supabaseAdmin.storage.from("videos")
     .createSignedUrl(video.storage_path,60*60);
    if(signedError||!signed?.signedUrl)continue;
    playbackUrl=signed.signedUrl;
   }
   if(!playbackUrl&&!safeExternalUrl)continue;
   videos.push({
    id:row.id,title:String(row.title||video.title||"Vídeo RUBI"),
    caption:String(row.caption||""),sourcePlatform:String(row.source_platform||"native"),
    contentSource:String(row.content_source),publishedAt:String(video.created_at),
    playbackUrl,externalUrl:safeExternalUrl
   });
  }
  return {
   displayName:String(profile.display_name||"Criador RUBI"),
   partnerType:profile.partner_type as string|null,
   storeCode:String(profile.public_store_code),
   videos
  };
 });

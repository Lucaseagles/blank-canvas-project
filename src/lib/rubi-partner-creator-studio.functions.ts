import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";

const VIDEO_BUCKET="videos";
const VIDEO_MAX_BYTES=50*1024*1024;
const VIDEO_MIME_TYPES=["video/mp4","video/webm"] as const;
const SOCIAL_HOSTS=[
  "youtube.com","youtu.be","youtube-nocookie.com","tiktok.com","instagram.com",
  "shopee.com.br","shopee.com","shope.ee","kwai.com","kuaishou.com",
  "shein.com","shein.com.br","mercadolivre.com.br","mercadolibre.com"
] as const;
type SocialPlatform="youtube"|"tiktok"|"instagram"|"shopee"|"kwai"|"shein"|"mercado_livre";
const PLATFORM_HOSTS:Record<SocialPlatform,readonly string[]>={
  youtube:["youtube.com","youtu.be","youtube-nocookie.com"],
  tiktok:["tiktok.com"],
  instagram:["instagram.com"],
  shopee:["shopee.com.br","shopee.com","shope.ee"],
  kwai:["kwai.com","kuaishou.com"],
  shein:["shein.com","shein.com.br"],
  mercado_livre:["mercadolivre.com.br","mercadolibre.com"]
};
const isHost=(host:string,domain:string)=>host===domain||host.endsWith("."+domain);
function parseSocialUrl(raw:string,platform:SocialPlatform){
  let url:URL;
  try{url=new URL(raw.trim());}catch{throw new Error("Informe um link válido da rede social.");}
  if(url.protocol!=="https:"||url.username||url.password||url.port||!PLATFORM_HOSTS[platform].some(domain=>isHost(url.hostname.toLowerCase(),domain)))
    throw new Error("O endereço não corresponde à plataforma selecionada ou não é seguro.");
  if(!SOCIAL_HOSTS.some(domain=>isHost(url.hostname.toLowerCase(),domain)))throw new Error("Plataforma não autorizada.");
  return url.toString();
}
async function verifiedPartner(accessToken:string){
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:auth,error:authError}=await supabaseAdmin.auth.getUser(accessToken);
  const userId=auth.user?.id;
  if(authError||!userId)throw new Error("Sessão inválida. Entre novamente.");
  const {data:profile,error}=await (supabaseAdmin as any).from("commercial_profiles")
    .select("id,user_id,status,audience,display_name")
    .eq("user_id",userId).eq("audience","partner").eq("status","approved").maybeSingle();
  if(error)throw new Error(error.message);
  if(!profile)throw new Error("Somente parceiros aprovados podem enviar conteúdo.");
  return {supabaseAdmin,userId,profile};
}

export const createPartnerCreatorUploadUrl=createServerFn({method:"POST"})
.validator((input:unknown)=>z.object({
  accessToken:z.string().min(1),fileName:z.string().trim().min(1).max(255),
  contentType:z.enum(VIDEO_MIME_TYPES),size:z.number().int().positive().max(VIDEO_MAX_BYTES)
}).parse(input))
.handler(async({data})=>{
  const {supabaseAdmin,userId}=await verifiedPartner(data.accessToken);
  const extension=data.contentType==="video/mp4"?"mp4":"webm";
  if(data.fileName.split(".").pop()?.toLowerCase()!==extension)throw new Error("A extensão não corresponde ao formato do vídeo.");
  const bucket=await supabaseAdmin.storage.getBucket(VIDEO_BUCKET);
  if(bucket.error)throw new Error("O armazenamento privado de vídeos não está disponível.");
  if(bucket.data.public||bucket.data.file_size_limit!==VIDEO_MAX_BYTES||
    JSON.stringify([...(bucket.data.allowed_mime_types??[])].sort())!==JSON.stringify([...VIDEO_MIME_TYPES].sort()))
    throw new Error("O armazenamento de vídeos precisa de ajuste administrativo antes de receber conteúdo de parceiros.");
  const path=`partner/${userId}/${crypto.randomUUID()}.${extension}`;
  const {data:signed,error}=await supabaseAdmin.storage.from(VIDEO_BUCKET).createSignedUploadUrl(path);
  if(error||!signed?.token)throw new Error(error?.message??"Não foi possível preparar o envio.");
  return {path,token:String(signed.token),expiresInSeconds:7200,maxBytes:VIDEO_MAX_BYTES};
});

export const discardPartnerCreatorUpload=createServerFn({method:"POST"})
.validator((input:unknown)=>z.object({accessToken:z.string().min(1),path:z.string().trim().min(1).max(2000)}).parse(input))
.handler(async({data})=>{
  const {supabaseAdmin,userId}=await verifiedPartner(data.accessToken);
  if(!data.path.startsWith(`partner/${userId}/`))throw new Error("O arquivo não pertence à sua conta.");
  const {data:existing,error:lookupError}=await (supabaseAdmin as any).from("rubi_partner_creator_submissions")
    .select("id").eq("storage_path",data.path).maybeSingle();
  if(lookupError)throw new Error(lookupError.message);
  if(existing)throw new Error("O arquivo já está vinculado a um envio e não pode ser removido por esta ação.");
  const {error}=await supabaseAdmin.storage.from(VIDEO_BUCKET).remove([data.path]);
  if(error)throw new Error(error.message);
  return {success:true};
});

export const submitPartnerCreatorContent=createServerFn({method:"POST"})
.validator((input:unknown)=>z.object({
  accessToken:z.string().min(1),title:z.string().trim().min(1).max(120),
  caption:z.string().trim().max(1200).default(""),
  contentSource:z.enum(["native_upload","social_link"]),
  storagePath:z.string().trim().min(1).max(2000).optional(),
  externalUrl:z.string().url().max(2000).optional(),
  sourcePlatform:z.enum(["native","youtube","tiktok","instagram","shopee","kwai","shein","mercado_livre"])
}).superRefine((value,ctx)=>{
  if(value.contentSource==="native_upload"&&(!value.storagePath||value.externalUrl||value.sourcePlatform!=="native"))
    ctx.addIssue({code:z.ZodIssueCode.custom,message:"Envio nativo requer arquivo e plataforma nativa."});
  if(value.contentSource==="social_link"&&(!value.externalUrl||value.storagePath||value.sourcePlatform==="native"))
    ctx.addIssue({code:z.ZodIssueCode.custom,message:"Link externo requer URL e plataforma social."});
}).parse(input))
.handler(async({data})=>{
  const {supabaseAdmin,userId,profile}=await verifiedPartner(data.accessToken);
  let externalUrl:string|null=null;
  if(data.contentSource==="native_upload"&&!data.storagePath?.startsWith(`partner/${userId}/`))
    throw new Error("O arquivo não pertence à sua conta.");
  if(data.contentSource==="social_link")externalUrl=parseSocialUrl(data.externalUrl!,data.sourcePlatform as SocialPlatform);
  const {count,error:countError}=await (supabaseAdmin as any).from("rubi_partner_creator_submissions")
    .select("id",{count:"exact",head:true}).eq("user_id",userId).eq("status","pending");
  if(countError)throw new Error(countError.message);
  if((count??0)>=20)throw new Error("Você já tem 20 conteúdos em análise. Aguarde a revisão antes de enviar mais.");
  const {data:created,error}=await (supabaseAdmin as any).from("rubi_partner_creator_submissions").insert({
    commercial_profile_id:profile.id,user_id:userId,title:data.title,caption:data.caption,
    content_source:data.contentSource,storage_path:data.storagePath??null,
    external_url:externalUrl,source_platform:data.sourcePlatform,status:"pending"
  }).select("id,status,submitted_at").single();
  if(error)throw new Error(error.message);
  return created;
});

export const getMyPartnerCreatorSubmissions=createServerFn({method:"POST"})
.validator((input:unknown)=>z.object({accessToken:z.string().min(1)}).parse(input))
.handler(async({data})=>{
  const {supabaseAdmin,userId}=await verifiedPartner(data.accessToken);
  const {data:rows,error}=await (supabaseAdmin as any).from("rubi_partner_creator_submissions")
    .select("id,title,caption,content_source,source_platform,status,review_notes,video_id,submitted_at,reviewed_at")
    .eq("user_id",userId).order("submitted_at",{ascending:false}).limit(50);
  if(error)throw new Error(error.message);
  return rows??[];
});

export const getAdminPartnerCreatorSubmissions=createServerFn({method:"GET"})
.middleware([requireOwnerRole])
.validator((input:unknown)=>z.object({status:z.enum(["pending","approved","rejected"]).optional().default("pending")}).parse(input))
.handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:rows,error}=await (supabaseAdmin as any).from("rubi_partner_creator_submissions")
    .select("id,user_id,title,caption,content_source,source_platform,storage_path,external_url,status,submitted_at,commercial_profiles!inner(display_name,partner_type)")
    .eq("status",data.status).order("submitted_at",{ascending:true}).limit(100);
  if(error)throw new Error(error.message);
  return rows??[];
});

export const reviewPartnerCreatorSubmission=createServerFn({method:"POST"})
.middleware([requireOwnerRole])
.validator((input:unknown)=>z.object({
  submissionId:z.string().uuid(),decision:z.enum(["approve","reject"]),reviewNotes:z.string().trim().max(500).optional()
}).parse(input))
.handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:result,error}=await supabaseAdmin.rpc("rubi_review_partner_creator_submission",{
    p_actor:context.userId,p_submission_id:data.submissionId,p_decision:data.decision,
    p_review_notes:data.reviewNotes??null
  });
  if(error)throw new Error(error.message);
  return result;
});

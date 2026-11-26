import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";

const COMMON_LESSONS=new Set([
 "common:foundations","common:product-offer","common:content","common:distribution",
 "common:backstage","common:network"
]);
const SPECIALIZED_LESSONS:Record<string,Set<string>>={
 affiliate:new Set(["affiliate:catalog-to-sale"]),
 micro_influencer:new Set(["micro_influencer:community"]),
 influencer:new Set(["influencer:campaigns"]),
 expert:new Set(["expert:authority"])
};

async function verifiedApprovedPartner(accessToken:string){
 const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
 const {data:auth,error:authError}=await supabaseAdmin.auth.getUser(accessToken);
 const userId=auth.user?.id;
 if(authError||!userId)throw new Error("Sessão inválida. Entre novamente.");
 const {data:profile,error}=await (supabaseAdmin as any).from("commercial_profiles")
  .select("id,user_id,partner_type,status,audience").eq("user_id",userId)
  .eq("audience","partner").eq("status","approved").maybeSingle();
 if(error)throw new Error(error.message);
 if(!profile)throw new Error("A Academia está disponível somente para parceiros aprovados.");
 return {supabaseAdmin,userId,profile};
}

function allowedLessons(partnerType:string){
 return new Set([...COMMON_LESSONS,...(SPECIALIZED_LESSONS[partnerType]??[])]);
}

export const getMyRubiPartnerAcademyProgress=createServerFn({method:"POST"})
 .validator((input:unknown)=>z.object({accessToken:z.string().min(20).max(8192)}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin,userId,profile}=await verifiedApprovedPartner(data.accessToken);
  const {data:rows,error}=await (supabaseAdmin as any).from("hub_partner_academy_progress")
   .select("lesson_key").eq("commercial_profile_id",profile.id).eq("user_id",userId)
   .order("completed_at",{ascending:true});
  if(error)throw new Error(error.message);
  const allowed=allowedLessons(String(profile.partner_type??""));
  return (rows??[]).map((row:{lesson_key:string})=>row.lesson_key).filter((key:string)=>allowed.has(key));
 });

export const setMyRubiPartnerAcademyLessonCompletion=createServerFn({method:"POST"})
 .validator((input:unknown)=>z.object({
  accessToken:z.string().min(20).max(8192),
  lessonKey:z.string().trim().min(3).max(80).regex(/^(common|affiliate|micro_influencer|influencer|expert):[a-z0-9-]+$/),
  completed:z.boolean()
 }).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin,userId,profile}=await verifiedApprovedPartner(data.accessToken);
  const lessonKey=data.lessonKey;
  if(!allowedLessons(String(profile.partner_type??"")).has(lessonKey))
   throw new Error("Esta aula não pertence à trilha liberada para seu perfil.");
  const table=(supabaseAdmin as any).from("hub_partner_academy_progress");
  if(data.completed){
   const {error}=await table.upsert({
    commercial_profile_id:profile.id,user_id:userId,lesson_key:lessonKey,
    completed_at:new Date().toISOString(),updated_at:new Date().toISOString()
   },{onConflict:"commercial_profile_id,lesson_key"});
   if(error)throw new Error(error.message);
  }else{
   const {error}=await table.delete().eq("commercial_profile_id",profile.id)
    .eq("user_id",userId).eq("lesson_key",lessonKey);
   if(error)throw new Error(error.message);
  }
  return {lessonKey,completed:data.completed};
 });

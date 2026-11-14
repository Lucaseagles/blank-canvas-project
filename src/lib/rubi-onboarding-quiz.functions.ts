import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";

const answers=z.record(z.string().max(100)).refine(v=>Object.keys(v).length<=5,"Excesso de respostas.");
const schema=z.object({
 accessToken:z.string().min(20).max(8192),
 audience:z.enum(["consumer","merchant","partner"]),
 partnerType:z.enum(["micro_influencer","influencer","affiliate","expert"]).nullable(),
 displayName:z.string().trim().min(2).max(120),
 businessName:z.string().trim().max(120),instagram:z.string().trim().max(100),
 document:z.string().trim().max(30),notes:z.string().trim().max(500),
 answers,categoryIds:z.array(z.string().uuid()).max(20)
}).superRefine((d,ctx)=>{
 const rules={
  consumer:[],
  merchant:["merchant_segment","restock_frequency","batch_size"],
  partner:["niche","creator_background","audience_range","channel"],
 } as const;
 const allowed=rules[d.audience] as readonly string[];
 for(const key of Object.keys(d.answers))if(!allowed.includes(key))ctx.addIssue({
  code:"custom",message:"Campo não autorizado no quiz: "+key
 });
 if(d.audience==="consumer"&&d.partnerType!==null)ctx.addIssue({code:"custom",message:"Tipo de parceiro inválido"});
 if(d.audience!=="consumer"&&d.categoryIds.length)ctx.addIssue({code:"custom",message:"Categoria de consumidor inválida"});
 if(d.audience==="merchant"&&(!d.businessName||!["fashion","beauty","home","electronics","other"].includes(d.answers["merchant_segment"]??"")||
  !["weekly","monthly","quarterly","unsure"].includes(d.answers["restock_frequency"]??"")||
  !["1_4","5_9","10_29","30_plus","unsure"].includes(d.answers["batch_size"]??"")))
  ctx.addIssue({code:"custom",message:"Responda às perguntas do lojista"});
 if(d.audience==="partner"&&(!d.partnerType||!["professional","creator","both","unspecified"].includes(d.answers["creator_background"]??"")||
  !["under_1000","1000_10000","10000_100000","over_100000","unspecified"].includes(d.answers["audience_range"]??"")||
  !["instagram","tiktok","youtube","whatsapp","other","unspecified"].includes(d.answers["channel"]??"")))
  ctx.addIssue({code:"custom",message:"Responda às perguntas do parceiro"});
 if(new Set(d.categoryIds).size!==d.categoryIds.length)ctx.addIssue({code:"custom",message:"Categoria repetida"});
});
/** Verified caller identity binds all three commercial profiles, no automatic approval. */
export const completeRubiOnboarding=createServerFn({method:"POST"})
 .validator((input:unknown)=>schema.parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:auth,error:authError}=await supabaseAdmin.auth.getUser(data.accessToken);
  if(authError||!auth.user?.id)throw new Error("Sessão inválida. Faça login novamente.");
  const {data:rows,error}=await (supabaseAdmin as any).rpc("rubi_complete_commercial_onboarding",{
   p_actor:auth.user.id,p_audience:data.audience,p_partner_type:data.partnerType,
   p_name:data.displayName,p_business_name:data.businessName,p_instagram:data.instagram,
   p_document:data.document,p_notes:data.notes,p_answers:data.answers,p_categories:data.categoryIds
  });
  if(error)throw error;
  if(!rows?.[0]?.saved_id)throw new Error("O cadastro e as preferências não foram confirmados.");
  return {id:String(rows[0].saved_id)};
 });

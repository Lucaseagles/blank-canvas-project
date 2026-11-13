import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";
import {requireOwnerRole} from "./auth-guards.server";

const uuid=z.string().uuid();
const channels=z.array(z.enum(["instagram","tiktok","youtube","whatsapp","telegram","site"])).min(1);
const audiences=z.array(z.enum(["partner","consumer","merchant"])).min(1);
const licensePeriod=z.object({validFrom:z.string().datetime({offset:true}),validUntil:z.string().datetime({offset:true})})
 .refine(v=>Date.parse(v.validUntil)>Date.parse(v.validFrom)&&Date.parse(v.validUntil)>Date.now(),
  "Informe um período válido com vencimento futuro.");
const bucket="rubi-creative-license-evidence";

export const listRubiCreativeLicensesAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data,error}=await (supabaseAdmin as any).from("rubi_creative_licenses")
   .select("id,variant_id,evidence_path,permitted_channels,permitted_audiences,valid_from,valid_until,status,revision,approved_variant_revision,reviewed_at,revoked_at")
   .order("updated_at",{ascending:false}).limit(201);
  if(error)throw error;
  if((data??[]).length>=201)return {items:[],partial:true};
  // The path is intentionally not returned to the UI; documents remain private.
  return {items:(data??[]).map((v:any)=>({
   id:v.id,variantId:v.variant_id,channels:v.permitted_channels,audiences:v.permitted_audiences,
   validFrom:v.valid_from,validUntil:v.valid_until,status:v.status,revision:v.revision,
   approvedVariantRevision:v.approved_variant_revision,reviewedAt:v.reviewed_at,revokedAt:v.revoked_at,
   hasEvidence:true
  })),partial:false};
 });

export const createRubiCreativeLicenseDraftAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({variantId:uuid,mime:z.enum(["application/pdf","image/png","image/jpeg"]),
   channels,audiences}).and(licensePeriod).parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  // Every upload uses a unique object: replacing approved evidence is forbidden.
  const ext=data.mime==="application/pdf"?"pdf":data.mime==="image/png"?"png":"jpg";
  const path=`${data.variantId}/${crypto.randomUUID()}.${ext}`;
  const {data:existing,error:readError}=await db.from("rubi_creative_licenses")
   .select("status,revision").eq("variant_id",data.variantId).maybeSingle();
  if(readError)throw readError;
  if(existing&&existing.status!=="draft")throw new Error("Licença aprovada ou revogada não pode ser substituída.");
  const {error:rpcError}=await db.rpc("rubi_mutate_creative_license_audited",{
   p_actor:context.userId,p_variant_id:data.variantId,p_expected_revision:existing?.revision??null,
   p_evidence_path:path,p_channels:data.channels,p_audiences:data.audiences,
   p_valid_from:data.validFrom,p_valid_until:data.validUntil,p_action:"draft"
  });
  if(rpcError)throw rpcError;
  const {data:signed,error:signError}=await db.storage.from(bucket).createSignedUploadUrl(path);
  if(signError||!signed?.token)throw signError??new Error("Não foi possível emitir upload privado.");
  // One-time, path-scoped signed upload; only Master may request it.
  return {path,token:String(signed.token)};
 });

const transition=z.object({variantId:uuid,revision:z.number().int().positive(),action:z.enum(["approve","revoke"])});
export const reviewRubiCreativeLicenseAdmin=createServerFn({method:"POST"})
 .middleware([requireOwnerRole]).validator((input:unknown)=>transition.parse(input))
 .handler(async({data,context})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {data:existing,error:readError}=await db.from("rubi_creative_licenses")
   .select("evidence_path,permitted_channels,permitted_audiences,valid_from,valid_until")
   .eq("variant_id",data.variantId).maybeSingle();
  if(readError)throw readError;
  if(!existing)throw new Error("Documento e licença não cadastrados.");
  // The database performs the authoritative locked revision check and audit.
  const {error}=await db.rpc("rubi_mutate_creative_license_audited",{
   p_actor:context.userId,p_variant_id:data.variantId,p_expected_revision:data.revision,
   p_evidence_path:existing.evidence_path,p_channels:existing.permitted_channels,
   p_audiences:existing.permitted_audiences,p_valid_from:existing.valid_from,
   p_valid_until:existing.valid_until,p_action:data.action
  });
  if(error)throw error;
  return {success:true};
 });

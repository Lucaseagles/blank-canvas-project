import {createServerFn} from "@tanstack/react-start";
import {z} from "zod";

/** Opt-in discovery prompt; counts are not partner performance or auto-approval. */
export const getMyRubiAffiliateInvitation=createServerFn({method:"POST"})
 .validator((input:unknown)=>z.object({accessToken:z.string().min(20).max(8192)}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const {data:auth,error:identityError}=await supabaseAdmin.auth.getUser(data.accessToken);
  if(identityError||!auth.user?.id)throw new Error("Sessão inválida");
  const db=supabaseAdmin as any;
  const userId=auth.user.id;
  const [consumer,partner,preferences,events]=await Promise.all([
   db.from("commercial_profiles").select("id,status").eq("user_id",userId).eq("audience","consumer").maybeSingle(),
   db.from("commercial_profiles").select("id,status").eq("user_id",userId).eq("audience","partner").maybeSingle(),
   db.from("user_preferences").select("preferred_categories").eq("user_id",userId).maybeSingle(),
   db.from("analytics_events").select("event_name,event_type,created_at")
    .eq("user_id",userId).gte("created_at",new Date(Date.now()-60*86400000).toISOString())
    .order("created_at",{ascending:false}).limit(201),
  ]);
  for(const result of [consumer,partner,preferences,events])if(result.error)throw result.error;
  const categories=Array.isArray(preferences.data?.preferred_categories)?preferences.data.preferred_categories.length:0;
  const approvedEvents=new Set(["RUBI_STORE_PRODUCT_VIEW","PRODUCT_VIEW","PREFERENCE_UPDATED","RUBI_FEED_VIDEO_VIEW","RUBI_STORE_SECTION_VIEW"]);
  const rows=(events.data??[]) as Array<{event_name:string|null;event_type:string|null;created_at:string}>;
  // Conservative fail-closed for truncated event history: do not declare eligibility.
  const capped=rows.length>200;
  const meaningful=rows.filter(e=>approvedEvents.has(e.event_name??e.event_type??""));
  const days=new Set(meaningful.map(e=>String(e.created_at).slice(0,10))).size;
  const score=(consumer.data?25:0)+(categories>0?20:0)
   +(meaningful.length>=3?20:0)+(meaningful.length>=8?20:0)+(days>=3?15:0);
  return {
   score:capped?0:score,
   eligible:!capped&&!partner.data&&score>=60,
   alreadyApplied:!!partner.data,
   days,meaningfulActions:meaningful.length,
   criteria:{consumerProfile:!!consumer.data,preferences:categories>0,
    firstActions:meaningful.length>=3,consistentUse:meaningful.length>=8,repeatDays:days>=3},
   disclaimer:"Preparação estimada por uso registrado e interesses declarados, não aprovação comercial ou garantia de renda."
  };
 });

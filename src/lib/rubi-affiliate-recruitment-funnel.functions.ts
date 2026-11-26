import {createServerFn} from "@tanstack/react-start";
import {requireOwnerRole} from "./auth-guards.server";

/** Owner-only, event-backed consumer-to-affiliate conversion funnel. No inferred earnings. */
export const getRubiAffiliateRecruitmentFunnelAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const since=new Date(Date.now()-30*86400000).toISOString();
  const events=[
   "RUBI_AFFILIATE_INVITE_SHOWN",
   "RUBI_AFFILIATE_INVITE_OPENED",
   "RUBI_AFFILIATE_INVITE_CTA",
   "RUBI_AFFILIATE_APPLICATION_SUBMITTED",
   "RUBI_AFFILIATE_INVITE_PAUSED",
   "RUBI_AFFILIATE_INVITE_OPTED_OUT"
  ] as const;
  const results=await Promise.all(events.map(async event=>{
   const {count,error}=await (supabaseAdmin as any).from("analytics_events")
    .select("id",{count:"exact",head:true})
    .eq("event_name",event).gte("created_at",since);
   if(error)throw error;
   return [event,count??0] as const;
  }));
  const counts=Object.fromEntries(results) as Record<(typeof events)[number],number>;
  const shown=counts.RUBI_AFFILIATE_INVITE_SHOWN;
  const opened=counts.RUBI_AFFILIATE_INVITE_OPENED;
  const cta=counts.RUBI_AFFILIATE_INVITE_CTA;
  const applications=counts.RUBI_AFFILIATE_APPLICATION_SUBMITTED;
  return {
   periodDays:30,asOf:new Date().toISOString(),counts,
   rates:{
    openFromShown:shown?Number((opened/shown*100).toFixed(1)):null,
    ctaFromOpened:opened?Number((cta/opened*100).toFixed(1)):null,
    applicationFromCta:cta?Number((applications/cta*100).toFixed(1)):null
   },
   note:"Contagens de eventos, não pessoas únicas. Aplicação registrada não significa aprovação, venda ou comissão."
  };
 });

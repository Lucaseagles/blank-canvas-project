import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireOwnerRole } from "./auth-guards.server";

/** Owner-only event totals, not people, buyers, paid orders or a user-level funnel. */
export const getRubiAudienceConversionPulse = createServerFn({method:"POST"})
 .middleware([requireOwnerRole])
 .validator((input:unknown)=>z.object({days:z.union([z.literal(7),z.literal(30)])}).parse(input))
 .handler(async({data})=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const since=new Date(Date.now()-data.days*86400000).toISOString();
  const db=supabaseAdmin as any;
  // Only the 1000 most recent matching events are used: report coverage explicitly.
  const {data:events,error}=await db.from("analytics_events")
   .select("event_type,metadata").in("event_type",["RUBI_CONVERSION_GUIDE_OPEN","RUBI_PARTNER_KIT_COPIED"])
   .gte("created_at",since).order("created_at",{ascending:false}).limit(1000);
  if(error)throw error;
  const rows=(events??[]) as Array<{event_type:string;metadata:unknown}>;
  const guideCounts={consumer:0,merchant:0,partner:0};
  let kitCopies=0;
  for(const row of rows){
   if(row.event_type==="RUBI_PARTNER_KIT_COPIED"){kitCopies++;continue;}
   if(row.event_type!=="RUBI_CONVERSION_GUIDE_OPEN")continue;
   const metadata=row.metadata && typeof row.metadata==="object"?row.metadata as Record<string,unknown>:{};
   const audience=metadata["audience"];
   if(audience==="consumer"||audience==="merchant"||audience==="partner")guideCounts[audience]++;
  }
  return {days:data.days,guideCounts,kitCopies,eventRows:rows.length,partial:rows.length===1000,
   generatedAt:new Date().toISOString()};
 });

import {createServerFn} from "@tanstack/react-start";
import {requireOwnerRole} from "./auth-guards.server";

type DailyRow={visit_day:string;total_events:number;tokenized_events:number;legacy_events:number;tagged_publication_events:number};
const safeCount=(value:unknown)=>{
 const n=Number(value);
 if(!Number.isSafeInteger(n)||n<0)throw new Error("Contagem diária inválida.");
 return n;
};
/** Master-only diagnostic; no IP, device fingerprint, visitor ID or bot classification. */
export const getRubiReferralTrafficQualityAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole]).handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const since=new Date(Date.now()-30*86400000).toISOString();
  const {data,error}=await (supabaseAdmin as any).rpc("rubi_referral_visit_quality_daily",{p_since:since});
  if(error)throw error;
  const rows:DailyRow[]=(data??[]).map((r:Record<string,unknown>)=>({
   visit_day:String(r["visit_day"]),
   total_events:safeCount(r["total_events"]),
   tokenized_events:safeCount(r["tokenized_events"]),
   legacy_events:safeCount(r["legacy_events"]),
   tagged_publication_events:safeCount(r["tagged_publication_events"])
  }));
  if(rows.length>31||rows.some(r=>r.tokenized_events+r.legacy_events!==r.total_events||
      r.tagged_publication_events>r.total_events))throw new Error("Resumo diário de visitas inconsistente.");
  const totals=rows.reduce((acc,row)=>({
   total_events:acc.total_events+row.total_events,
   tokenized_events:acc.tokenized_events+row.tokenized_events,
   legacy_events:acc.legacy_events+row.legacy_events,
   tagged_publication_events:acc.tagged_publication_events+row.tagged_publication_events
  }),{total_events:0,tokenized_events:0,legacy_events:0,tagged_publication_events:0});
  return {rows,totals,periodDays:30,asOf:new Date().toISOString(),
   note:"Eventos registrados por dia UTC. Token significa proteção contra repetição de requisições com mesmo token, não visitante único ou avaliação de bots."};
 });

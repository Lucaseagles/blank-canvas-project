import {createServerFn} from "@tanstack/react-start";
import {requireOwnerRole} from "./auth-guards.server";
import {summarizeRubiAuditIntegrity,type RubiAuditEvent} from "./rubi-master-audit-integrity";

/** Owner-only audit health. Counts for the latest 50 records are explicitly sample-scoped. */
export const getRubiMasterAuditIntegrityAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole])
 .handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const {count,error:countError}=await db.from("admin_audit_log")
   .select("id",{count:"exact",head:true});
  if(countError)throw countError;
  const {data,error}=await db.from("admin_audit_log")
   .select("id,action_type,entity_type,entity_id,actor_user_id,created_at")
   .order("created_at",{ascending:false}).limit(51);
  if(error)throw error;
  const raw=(data??[]) as RubiAuditEvent[];
  const sampled=raw.slice(0,50);
  const health=summarizeRubiAuditIntegrity(sampled,count??0);
  return {
   summary:{...health,examined:sampled.length,partial:(count??0)>50||raw.length>50},
   recent:sampled.map(e=>({
    id:e.id,action:e.action_type,entityType:e.entity_type,
    entityId:e.entity_id,actorRecorded:!!e.actor_user_id,createdAt:e.created_at
   })),
   disclaimer:"Histórico amostral, não comprova que todas as mudanças administrativas são auditadas."
  };
 });

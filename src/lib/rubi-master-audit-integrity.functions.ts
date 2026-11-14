import {createServerFn} from "@tanstack/react-start";
import {requireOwnerRole} from "./auth-guards.server";
import {fetchAllFinancialRows} from "./financial-pagination.server";
import {summarizeRubiAuditIntegrity,type RubiAuditEvent} from "./rubi-master-audit-integrity";

/** Owner-only audit health. Review all accessible events or fail closed on the pagination ceiling. */
export const getRubiMasterAuditIntegrityAdmin=createServerFn({method:"GET"})
 .middleware([requireOwnerRole])
 .handler(async()=>{
  const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
  const db=supabaseAdmin as any;
  const raw=await fetchAllFinancialRows(() => db.from("admin_audit_log")
   .select("id,action_type,entity_type,entity_id,actor_user_id,created_at")
   .order("id",{ascending:true}));
  const events=raw as RubiAuditEvent[];
  const health=summarizeRubiAuditIntegrity(events,events.length);
  const recent=[...events].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,50);
  return {
   summary:{...health,examined:events.length,partial:false},
   recent:recent.map(e=>({
    id:e.id,action:e.action_type,entityType:e.entity_type,
    entityId:e.entity_id,actorRecorded:!!e.actor_user_id,createdAt:e.created_at
   })),
   disclaimer:"Integridade dos registros existentes, sem garantia de cobertura de todas as mutações."
  };
 });

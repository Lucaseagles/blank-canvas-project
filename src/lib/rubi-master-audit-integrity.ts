export type RubiAuditEvent = {
 id:string;
 action_type:string;
 entity_type:string;
 entity_id:string|null;
 actor_user_id:string|null;
 created_at:string;
};
export type RubiAuditIntegrity = {
 total:number;
 missingActor:number;
 invalidTimestamps:number;
 distinctActions:number;
 status:"empty"|"review_required"|"observed";
};
export function summarizeRubiAuditIntegrity(events:RubiAuditEvent[],total:number):RubiAuditIntegrity {
 const missingActor=events.filter(x=>!x.actor_user_id).length;
 const invalidTimestamps=events.filter(x=>!Number.isFinite(Date.parse(x.created_at))).length;
 const distinctActions=new Set(events.map(x=>x.action_type)).size;
 return {total,missingActor,invalidTimestamps,distinctActions,
  status:total===0?"empty":missingActor>0||invalidTimestamps>0?"review_required":"observed"};
}

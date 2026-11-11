import {RUBI_LAUNCH_QA_ITEMS,type RubiQaKey,type RubiQaChecklist} from "./rubi-launch-qa.ts";

export type RubiLaunchGate = {
  qaVerified:number;qaTotal:number;qaMissing:string[];qaBlocked:string[];
  manuallyChecked:boolean;catalogReady:boolean;launchReviewed:boolean;
};
/** Manual records are attestations only, not independently executed browser tests or paid orders. */
export function assessRubiLaunchGate(catalogReady:boolean,qa:RubiQaChecklist|null):RubiLaunchGate {
 const missing:string[]=[],blocked:string[]=[];
 let qaVerified=0;
 for(const item of RUBI_LAUNCH_QA_ITEMS){
  const record=qa?.[item.key as RubiQaKey];
  if(record?.status==="verified" && record.evidence.trim().length>=8)qaVerified++;
  else if(record?.status==="blocked")blocked.push(item.label);
  else missing.push(item.label);
 }
 return {
  qaVerified,qaTotal:RUBI_LAUNCH_QA_ITEMS.length,qaMissing:missing,qaBlocked:blocked,
  manuallyChecked:qaVerified===RUBI_LAUNCH_QA_ITEMS.length && !blocked.length,
  catalogReady,launchReviewed:catalogReady&&qaVerified===RUBI_LAUNCH_QA_ITEMS.length&&!blocked.length
 };
}

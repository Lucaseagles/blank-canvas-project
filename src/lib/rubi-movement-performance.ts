/** Match aggregate analytics to planned movement campaigns without treating events as sales. */
export type RubiMovementCampaignPlan = {
 id:string; variant_id:string; channel:string; campaign:string; status:string;
};
export type RubiMovementTrafficRow = {
 productId:string; channel:string; campaign:string;
 viewEvents:number; viewSessions:number; checkoutIntents:number;
};
export type RubiMovementPerformanceRow = {
 planId:string; variantId:string; channel:string; campaign:string;
 publicationStatus:string; viewEvents:number; viewSessions:number; checkoutIntents:number;
 intentPerViewPercent:number | null; ambiguousAttribution:boolean;
};
export function percentOfIntentToView(intents:number,views:number):number|null {
 if(!Number.isFinite(views)||views<=0||!Number.isFinite(intents)||intents<0)return null;
 return Math.round((intents/views)*1000)/10;
}
/** Same channel/campaign label in several variants cannot reliably identify the winning creative. */
export function correlateMovementTraffic(
 productId:string,plans:RubiMovementCampaignPlan[],traffic:RubiMovementTrafficRow[],
):RubiMovementPerformanceRow[] {
 const occurrences=new Map<string,number>();
 for(const plan of plans){
  const key=plan.channel+"::"+plan.campaign;
  occurrences.set(key,(occurrences.get(key)??0)+1);
 }
 return plans.map(plan=>{
  const matched=traffic.find(row=>row.productId===productId&&row.channel===plan.channel&&row.campaign===plan.campaign);
  const ambiguousAttribution=(occurrences.get(plan.channel+"::"+plan.campaign)??0)>1;
  const viewEvents=matched?.viewEvents??0,viewSessions=matched?.viewSessions??0,checkoutIntents=matched?.checkoutIntents??0;
  return {
   planId:plan.id,variantId:plan.variant_id,channel:plan.channel,campaign:plan.campaign,
   publicationStatus:plan.status,viewEvents,viewSessions,checkoutIntents,
   intentPerViewPercent:ambiguousAttribution?null:percentOfIntentToView(checkoutIntents,viewEvents),
   ambiguousAttribution
  };
 });
}

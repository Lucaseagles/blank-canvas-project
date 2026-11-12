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

/** Comparable observed events only. Campaigns without attribution or observed views are not zeros. */
export type RubiVariantTrafficSummary = {
 variantId:string; observedCampaigns:number; ambiguousCampaigns:number; unobservedCampaigns:number;
 viewEvents:number; checkoutIntents:number; intentPerViewPercent:number|null;
};
export function summarizeMovementVariants(rows:RubiMovementPerformanceRow[]):RubiVariantTrafficSummary[] {
 const summaries=new Map<string,RubiVariantTrafficSummary>();
 for(const row of rows){
  let item=summaries.get(row.variantId);
  if(!item){
   item={variantId:row.variantId,observedCampaigns:0,ambiguousCampaigns:0,unobservedCampaigns:0,
    viewEvents:0,checkoutIntents:0,intentPerViewPercent:null};
   summaries.set(row.variantId,item);
  }
  if(row.ambiguousAttribution){item.ambiguousCampaigns++;continue;}
  // Aggregate has a top-N bound. A missing campaign must never count as a verified zero.
  if(!Number.isFinite(row.viewEvents)||row.viewEvents<=0||
    !Number.isFinite(row.checkoutIntents)||row.checkoutIntents<0){
   item.unobservedCampaigns++;continue;
  }
  item.observedCampaigns++;
  item.viewEvents+=row.viewEvents;
  item.checkoutIntents+=row.checkoutIntents;
 }
 return [...summaries.values()].map(item=>({
  ...item,intentPerViewPercent:percentOfIntentToView(item.checkoutIntents,item.viewEvents)
 })).sort((a,b)=>b.viewEvents-a.viewEvents||a.variantId.localeCompare(b.variantId));
}


/** Conservative Master decision support: observational events are never an A/B winner. */
export type RubiVariantDecisionReadiness={
 variantId:string;
 status:"no_observations"|"incomplete_attribution"|"observational_only";
 reason:string;
 viewEvents:number;
 checkoutIntents:number;
 intentPerViewPercent:number|null;
};
export function assessRubiVariantDecisionReadiness(
 summaries:RubiVariantTrafficSummary[],
 reportPartial:boolean
):RubiVariantDecisionReadiness[]{
 return summaries.map(item=>{
  const incomplete=reportPartial||item.ambiguousCampaigns>0||item.unobservedCampaigns>0;
  const status:RubiVariantDecisionReadiness["status"]=
   item.observedCampaigns===0?"no_observations":
   incomplete?"incomplete_attribution":"observational_only";
  const reason=status==="no_observations"
   ?"Sem campanhas observadas: não há base para comparação."
   :status==="incomplete_attribution"
    ?"Há dados parciais, campanhas ausentes ou atribuição ambígua. Não escolher vencedor."
    :"Dados observacionais disponíveis; sem alocação controlada e desfecho de compra não há vencedor A/B.";
  return {variantId:item.variantId,status,reason,
   viewEvents:item.viewEvents,checkoutIntents:item.checkoutIntents,
   intentPerViewPercent:item.intentPerViewPercent};
 });
}

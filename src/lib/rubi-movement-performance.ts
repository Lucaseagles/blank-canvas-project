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


/** Data-quality preflight for a future controlled experiment, never a significance test. */
export type RubiExperimentTrafficPreflight={
 readyForDesign:boolean;
 blockers:string[];
 observedVariants:number;
};
export function preflightRubiExperimentTraffic(
 summaries:RubiVariantTrafficSummary[],
 reportPartial:boolean
):RubiExperimentTrafficPreflight{
 const blockers:string[]=[];
 if(reportPartial)blockers.push("Relatório parcial: consulte todas as campanhas antes de desenhar o teste.");
 const observed=summaries.filter(s=>s.observedCampaigns>0 && s.viewEvents>0);
 if(observed.length!==2)blockers.push("São necessárias exatamente duas variantes com eventos observados.");
 if(summaries.some(s=>s.ambiguousCampaigns>0))
  blockers.push("Identificação de campanha ambígua: use rótulos exclusivos por variante.");
 if(summaries.some(s=>s.unobservedCampaigns>0))
  blockers.push("Há campanhas sem observação; verifique publicação e rastreamento.");
 if(summaries.some(s=>s.checkoutIntents>s.viewEvents))
  blockers.push("Eventos de saída excedem visualizações; revise a qualidade da instrumentação.");
 if(blockers.length===0)
  blockers.push("Os dados são observacionais: o teste causal ainda exige alocação controlada, métrica primária e plano de amostra.");
 return {readyForDesign:!reportPartial && observed.length===2 &&
  !summaries.some(s=>s.ambiguousCampaigns>0||s.unobservedCampaigns>0||s.checkoutIntents>s.viewEvents),
  blockers,observedVariants:observed.length};
}

/** Operational attribution coverage, never a rate of paid purchases or a statistical test. */
export function summarizeRubiTrackingCoverage(
 summaries:RubiVariantTrafficSummary[],reportPartial:boolean
){
 const observed=summaries.reduce((n,s)=>n+s.observedCampaigns,0);
 const ambiguous=summaries.reduce((n,s)=>n+s.ambiguousCampaigns,0);
 const unobserved=summaries.reduce((n,s)=>n+s.unobservedCampaigns,0);
 const total=observed+ambiguous+unobserved;
 return {
  observed,ambiguous,unobserved,total,
  coveragePercent:reportPartial||total===0?null:Math.round(observed/total*1000)/10,
  status:reportPartial?"partial":total===0?"empty":ambiguous+unobserved===0?"complete":"needs_attention"
 } as const;
}

/** Compare recent 7 days with the previous 23 within the 30-day window.
 * Event counts are observational, not verified unique customers or paid sales.
 */
export function compareRubiMovementPeriods(
 thirtyDay:RubiMovementTrafficRow[],sevenDay:RubiMovementTrafficRow[],
 productId:string,partial:boolean
){
 const byKey=(rows:RubiMovementTrafficRow[])=>new Map(rows.filter(x=>x.productId===productId)
  .map(x=>[x.channel+"::"+x.campaign,x]));
 const month=byKey(thirtyDay),recent=byKey(sevenDay);
 const result: Array<{channel:string;campaign:string;recentViews:number;priorViews:number;recentIntents:number;priorIntents:number;recentRate:number|null;priorRate:number|null;quality:"comparable"|"invalid"}>=[];
 for(const [key,m] of month){
  const w=recent.get(key);
  const rv=w?.viewEvents??0,ri=w?.checkoutIntents??0;
  const pv=m.viewEvents-rv,pi=m.checkoutIntents-ri;
  const valid=!partial&&[rv,ri,pv,pi].every(n=>Number.isFinite(n)&&n>=0)
   && Number.isFinite(m.viewEvents)&&Number.isFinite(m.checkoutIntents);
  result.push({
   channel:m.channel,campaign:m.campaign,recentViews:rv,priorViews:pv,
   recentIntents:ri,priorIntents:pi,
   recentRate:valid?percentOfIntentToView(ri,rv):null,
   priorRate:valid?percentOfIntentToView(pi,pv):null,
   quality:valid?"comparable":"invalid"
  });
 }
 return result;
}

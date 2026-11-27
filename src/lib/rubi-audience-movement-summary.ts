import {percentOfIntentToView,type RubiMovementTrafficRow} from "./rubi-movement-performance.ts";

export type RubiAudienceMovement = {id:string;name:string;audience:"consumer"|"merchant"|"partner"};
export type RubiAudienceVariant = {id:string;movement_id:string};
export type RubiAudiencePlan = {id:string;variant_id:string;channel:string;campaign:string};
export type RubiAudienceMovementSummary={
 movementId:string;movementName:string;audience:RubiAudienceMovement["audience"];
 observedCampaigns:number;missingCampaigns:number;ambiguousCampaigns:number;
 viewEvents:number;checkoutIntents:number;intentPerViewPercent:number|null;
};
export function summarizeRubiAudienceMovements(
 movements:RubiAudienceMovement[],variants:RubiAudienceVariant[],plans:RubiAudiencePlan[],
 traffic:RubiMovementTrafficRow[],productId:string,partial:boolean
):RubiAudienceMovementSummary[]{
 const byVariant=new Map(variants.map(v=>[v.id,v.movement_id]));
 const identity=(channel:string,campaign:string)=>JSON.stringify([channel,campaign]);
 const collisions=new Map<string,number>();
 for(const plan of plans){
  const key=identity(plan.channel,plan.campaign);
  collisions.set(key,(collisions.get(key)??0)+1);
 }
 // Duplicate aggregate keys are ambiguous telemetry, not "last row wins".
 const trafficByKey=new Map<string,RubiMovementTrafficRow[]>();
 for(const row of traffic.filter(t=>t.productId===productId)){
  const key=identity(row.channel,row.campaign);
  const rows=trafficByKey.get(key)??[];
  rows.push(row);
  trafficByKey.set(key,rows);
 }
 return movements.map(m=>{
  let observedCampaigns=0,missingCampaigns=0,ambiguousCampaigns=0,viewEvents=0,checkoutIntents=0;
  for(const p of plans){
   if(byVariant.get(p.variant_id)!==m.id)continue;
   const key=identity(p.channel,p.campaign);
   if((collisions.get(key)??0)>1){ambiguousCampaigns++;continue;}
   const matches=trafficByKey.get(key)??[];
   if(matches.length>1){ambiguousCampaigns++;continue;}
   const row=matches[0];
   if(!row||!Number.isSafeInteger(row.viewEvents)||row.viewEvents<=0||
     !Number.isSafeInteger(row.viewSessions)||row.viewSessions<0||row.viewSessions>row.viewEvents||
     !Number.isSafeInteger(row.checkoutIntents)||row.checkoutIntents<0||
     row.checkoutIntents>row.viewEvents){missingCampaigns++;continue;}
   observedCampaigns++;viewEvents+=row.viewEvents;checkoutIntents+=row.checkoutIntents;
  }
  return {movementId:m.id,movementName:m.name,audience:m.audience,observedCampaigns,
   missingCampaigns,ambiguousCampaigns,viewEvents,checkoutIntents,
   intentPerViewPercent:partial||missingCampaigns>0||ambiguousCampaigns>0
    ?null:percentOfIntentToView(checkoutIntents,viewEvents)};
 });
}

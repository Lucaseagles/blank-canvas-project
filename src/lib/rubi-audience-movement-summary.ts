import {percentOfIntentToView,type RubiMovementTrafficRow} from "./rubi-movement-performance";

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
 const byTraffic=new Map(traffic.filter(t=>t.productId===productId).map(t=>[identity(t.channel,t.campaign),t]));
 return movements.map(m=>{
  let observedCampaigns=0,missingCampaigns=0,ambiguousCampaigns=0,viewEvents=0,checkoutIntents=0;
  for(const p of plans){
   if(byVariant.get(p.variant_id)!==m.id)continue;
   const key=identity(p.channel,p.campaign);
   if((collisions.get(key)??0)>1){ambiguousCampaigns++;continue;}
   const row=byTraffic.get(key);
   if(!row||!Number.isSafeInteger(row.viewEvents)||row.viewEvents<=0||
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

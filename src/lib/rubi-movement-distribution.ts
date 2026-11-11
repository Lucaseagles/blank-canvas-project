import {normalizeRubiCampaign,rubiOrganicProductPath, RUBI_ORGANIC_CHANNELS,type RubiOrganicChannel} from "./rubi-organic-campaigns.ts";
export type RubiDistributionPlan = {
 id?:string | undefined;variant_id:string;channel:RubiOrganicChannel;campaign:string;
 status:"planned"|"manually_published";notes:string;published_reference:string;
};
export function movementCampaign(name:string,variantId:string){
 const suffix=variantId.replaceAll("-","").slice(0,12).toLowerCase();
 const slug=normalizeRubiCampaign(name).slice(0,45).replace(/[-_]+$/g,"");
 return normalizeRubiCampaign(`${slug||"movimento"}-${suffix}`);
}
export function movementCampaignPath(productId:string,channel:RubiOrganicChannel,campaign:string){
 return rubiOrganicProductPath(productId,channel,campaign);
}
export function canRecordPublication(plan:RubiDistributionPlan){
 return plan.status!=="manually_published" || plan.published_reference.trim().length>=8;
}
export {RUBI_ORGANIC_CHANNELS};

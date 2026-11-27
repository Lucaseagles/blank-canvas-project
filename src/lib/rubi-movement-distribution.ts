import {normalizeRubiCampaign,rubiOrganicProductPath, RUBI_ORGANIC_CHANNELS,type RubiOrganicChannel} from "./rubi-organic-campaigns.ts";
export type RubiDistributionPlan = {
 id?:string | undefined;revision?:number | undefined;variant_id:string;channel:RubiOrganicChannel;campaign:string;
 status:"planned"|"manually_published";notes:string;published_reference:string;page_published_at?:string|null;
};
export function movementCampaign(name:string,variantId:string){
 const suffix=variantId.replaceAll("-","").slice(0,12).toLowerCase();
 const slug=normalizeRubiCampaign(name).slice(0,45).replace(/[-_]+$/g,"");
 return normalizeRubiCampaign(`${slug||"movimento"}-${suffix}`);
}
export function movementCampaignPath(productId:string,channel:RubiOrganicChannel,campaign:string){
 return rubiOrganicProductPath(productId,channel,campaign);
}
/**
 * A manual publication reference must be a stable HTTPS permalink on the
 * selected platform. WhatsApp has no public post permalink contract here;
 * it must use a future provider-confirmed connector instead.
 */
export function isValidRubiPublicationReference(channel:RubiOrganicChannel,reference:string):boolean{
 let url:URL;
 try{url=new URL(reference.trim());}catch{return false;}
 if(url.protocol!=="https:"||url.username||url.password||url.hash)return false;
 const host=url.hostname.toLowerCase();
 const path=url.pathname;
 switch(channel){
  case "instagram":
   return ["instagram.com","www.instagram.com"].includes(host)&&/^\\/(p|reel)\\/[A-Za-z0-9_-]+\\/?$/.test(path);
  case "tiktok":
   return ["tiktok.com","www.tiktok.com","m.tiktok.com"].includes(host)&&/^\\/@[A-Za-z0-9._]+\\/video\\/[0-9]+\\/?$/.test(path);
  case "youtube":
   return ["youtube.com","www.youtube.com"].includes(host)&&(
    /^\\/shorts\\/[A-Za-z0-9_-]{6,}\\/?$/.test(path)&&!url.search||
    path==="/watch"&&/^[A-Za-z0-9_-]{6,}$/.test(url.searchParams.get("v")??"")
   )||host==="youtu.be"&&/^\\/[A-Za-z0-9_-]{6,}\\/?$/.test(path);
  case "facebook":
   return ["facebook.com","www.facebook.com","m.facebook.com"].includes(host)&&
    (/\\/(posts|videos|reel)\\/[A-Za-z0-9_-]+\\/?$/.test(path)||/^\\/watch\\/?$/.test(path)&&url.searchParams.has("v"));
  case "pinterest":
   return ["pinterest.com","www.pinterest.com"].includes(host)&&/^\\/pin\\/[0-9]+\\/?$/.test(path);
  case "telegram":
   return ["t.me","telegram.me"].includes(host)&&
    (/^\\/[A-Za-z0-9_]{5,}\\/[0-9]+\\/?$/.test(path)||/^\\/c\\/[0-9]+\\/[0-9]+\\/?$/.test(path));
  case "whatsapp":
   return false;
 }
}
export function canRecordPublication(plan:RubiDistributionPlan){
 return plan.status!=="manually_published" ||
  isValidRubiPublicationReference(plan.channel,plan.published_reference);
}
export {RUBI_ORGANIC_CHANNELS};

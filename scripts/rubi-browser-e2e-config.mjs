import {parseDeploymentOrigin} from "./rubi-live-storefront-smoke.mjs";

export const RUBI_BROWSER_PATHS=Object.freeze({
 store:"/hub-shop",videos:"/videos",feed:"/feed",wholesale:"/wholesale",partner:"/partner/portal",master:"/admin"
});
export function browserTarget(raw){
 return parseDeploymentOrigin(raw);
}
export function sameOriginNavigation(origin,actual){
 try {
  const url=new URL(actual);
  return url.origin===origin;
 } catch {return false;}
}
export function externalCheckoutNotPermitted(url){
 const lower=String(url).toLowerCase();
 return !lower.startsWith("https://")||/\/checkout|\/pay(?:ment)?(?:[/?#]|$)/i.test(lower);
}

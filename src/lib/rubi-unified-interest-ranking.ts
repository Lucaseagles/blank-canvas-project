/** Category-based ranking shared by marketplace and RUBI Store discovery.
 * Matches only user-selected or opt-in interest categories, never private characteristics.
 */
export type RubiInterestCategory = { name:string; slug:string|null; score:number };
export type RubiRankableOffer = { category:string|null; productId:string };
export function normalizeRubiInterestLabel(input:string|null|undefined):string {
 return (input??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
  .trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}
export function rankRubiOffersByInterests<T extends RubiRankableOffer>(
 offers:T[], interests:RubiInterestCategory[], maxItems=6
):T[] {
 const weights=new Map<string,number>();
 for(const interest of interests) {
  const weight=Number.isFinite(interest.score)?Math.min(100,Math.max(0,interest.score)):0;
  for(const label of [interest.name,interest.slug]) {
   const normalized=normalizeRubiInterestLabel(label);
   if(normalized)weights.set(normalized,Math.max(weights.get(normalized)??0,weight));
  }
 }
 const original=offers.map((offer,index)=>({
  offer,index,weight:weights.get(normalizeRubiInterestLabel(offer.category))??0
 }));
 // Maintain original editorial order when no interest applies; include discovery.
 const chosen:T[]=[];
 const seen=new Set<string>();
 const limit=Number.isFinite(maxItems)?Math.min(40,Math.max(0,Math.floor(maxItems))):6;
 for(const item of original.sort((a,b)=>b.weight-a.weight||a.index-b.index)){
  // One product per shelf; duplicates must not displace relevant discovery items.
  if(!item.offer.productId||seen.has(item.offer.productId))continue;
  seen.add(item.offer.productId);
  chosen.push(item.offer);
  if(chosen.length>=limit)break;
 }
 return limit===0?[]:chosen;
}

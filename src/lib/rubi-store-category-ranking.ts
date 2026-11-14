import {normalizeRubiInterestLabel,type RubiInterestCategory} from "./rubi-unified-interest-ranking";
export type RubiStoreCatalogItem={id:string;category:string|null};

/** Balanced discovery using only opted-in categories: three relevant SKUs then one discovery.
 * Never drops or duplicates an eligible product; anonymous catalog retains editorial order.
 */
export function rankRubiStoreCatalog<T extends RubiStoreCatalogItem>(items:T[],preferences:RubiInterestCategory[]):T[]{
 const categories=new Set<string>();
 for(const pref of preferences){
  if(!Number.isFinite(pref.score)||pref.score<=0)continue;
  for(const value of [pref.name,pref.slug]){
   const label=normalizeRubiInterestLabel(value);
   if(label)categories.add(label);
  }
 }
 if(!categories.size)return [...items];
 const relevant:T[]=[],discovery:T[]=[];
 for(const item of items){
  const normalized=normalizeRubiInterestLabel(item.category);
  (normalized&&categories.has(normalized)?relevant:discovery).push(item);
 }
 if(!relevant.length||!discovery.length)return [...relevant,...discovery];
 const sorted:T[]=[];
 let ri=0,di=0;
 while(ri<relevant.length||di<discovery.length){
  for(let i=0;i<3&&ri<relevant.length;i++)sorted.push(relevant[ri++]!);
  if(di<discovery.length)sorted.push(discovery[di++]!);
 }
 return sorted;
}

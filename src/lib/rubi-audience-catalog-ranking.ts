import {normalizeRubiInterestLabel} from "./rubi-unified-interest-ranking";

export type RubiAudienceProduct={id:string;category:string|null;min_b2b_quantity?:number};
export type RubiMerchantQuiz={merchant_segment?:string;batch_size?:string};
export type RubiPartnerQuiz={niche?:string};

/** The onboarding quiz is an explicit preference, not an assessment of purchasing power. */
const categoryAliases:Record<string,readonly string[]>={
 fashion:["moda","roupas","vestuario","calcados","acessorios","fashion"],
 beauty:["beleza","cosmeticos","maquiagem","skincare","cuidados-pessoais"],
 home:["casa","decoracao","lar","cozinha","utilidades-domesticas"],
 electronics:["eletronicos","eletronica","tecnologia","informatica","gadgets"]
};
const merchantQuantityCeiling:Record<string,number>={
 "1_4":4,"5_9":9,"10_29":29,"30_plus":Number.POSITIVE_INFINITY
};
const uselessNicheWords=new Set(["produto","produtos","outros","geral","digital","marketing","online","conteudo","publico"]);
function categoryWords(category:string|null):Set<string>{
 const normalized=normalizeRubiInterestLabel(category);
 if(!normalized)return new Set();
 const tokens=normalized.split("-").filter(t=>t.length>=4);
 return new Set([normalized,...tokens]);
}
function matchesCategory(category:string|null,desired:string):boolean{
 const normalized=normalizeRubiInterestLabel(category);
 if(!normalized||!desired)return false;
 const aliases=categoryAliases[desired];
 const allowed=new Set([desired,...(aliases??[]).flatMap(c=>[c,...c.split("-")])]);
 return [...categoryWords(category)].some(w=>allowed.has(w));
}
function matchesNiche(category:string|null,niche:string):boolean{
 const target=normalizeRubiInterestLabel(niche);
 const cat=normalizeRubiInterestLabel(category);
 if(!target||!cat)return false;
 if(target===cat)return true;
 const tokens=target.split("-").filter(t=>t.length>=4&&!uselessNicheWords.has(t));
 const catTokens=categoryWords(category);
 if(tokens.some(t=>catTokens.has(t)))return true;
 // Known category synonyms only; never infer commercial quality or sensitive traits.
 return Object.entries(categoryAliases).some(([group,aliases])=>{
  const groupTokens=new Set([group,...aliases.flatMap(a=>a.split("-"))]);
  return tokens.some(t=>groupTokens.has(t))&&
   [...catTokens].some(t=>groupTokens.has(t));
 });
}
export type RubiAudienceSuggestion<T> = T & {suggestedForAudience:boolean};

/** Rank *only* already-authorized items passed by the caller. Never change grants/prices.
 * Three relevant items followed by one discovery item. If there are no matches, preserve original order.
 */
export function rankRubiAudienceCatalog<T extends RubiAudienceProduct>(
 products:readonly T[],audience:"merchant"|"partner",
 quiz:RubiMerchantQuiz|RubiPartnerQuiz|null
):RubiAudienceSuggestion<T>[]{
 const verified=products.map(p=>({...p,suggestedForAudience:false}));
 if(!quiz||!products.length)return verified;
 const segment=audience==="merchant"&&"merchant_segment" in quiz?
  String(quiz.merchant_segment??""):"";
 const batch=audience==="merchant"&&"batch_size" in quiz?
  String(quiz.batch_size??""):"";
 const niche=audience==="partner"&&"niche" in quiz?
  String(quiz.niche??"").slice(0,100):"";
 const ceiling=merchantQuantityCeiling[batch];
 if(audience==="merchant"&&(!categoryAliases[segment]||ceiling===undefined))return verified;
 if(audience==="partner"&&!normalizeRubiInterestLabel(niche))return verified;
 const relevant:RubiAudienceSuggestion<T>[]=[],discovery:RubiAudienceSuggestion<T>[]=[];
 for(const p of products){
  const correctCategory=audience==="merchant"?
   matchesCategory(p.category,segment):matchesNiche(p.category,niche);
  const lotCompatible=audience!=="merchant"||
   (Number.isSafeInteger(p.min_b2b_quantity)&&(p.min_b2b_quantity??0)>0&&(p.min_b2b_quantity??0)<=ceiling);
  const suggestion=correctCategory&&lotCompatible;
  (suggestion?relevant:discovery).push({...p,suggestedForAudience:suggestion});
 }
 if(!relevant.length)return verified;
 const result:RubiAudienceSuggestion<T>[]=[];
 let i=0,j=0;
 while(i<relevant.length||j<discovery.length){
  for(let k=0;k<3&&i<relevant.length;k++)result.push(relevant[i++]!);
  if(j<discovery.length)result.push(discovery[j++]!);
 }
 return result;
}

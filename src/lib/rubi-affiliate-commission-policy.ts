/** RUBI Indica: advisory-only ladder. Never overrides an active agreement or confirmed-sale ledger.
 * The Master must separately authorize any real commission policy for the product.
 */
export type AffiliateTier = "starter"|"rising"|"pro"|"elite"|"ambassador";
export type AffiliateCommissionQuote={
 tier:AffiliateTier;confirmedSales:number;nextGoal:number|null;remaining:number;
 basePercent:number;bonusPercent:number;proposedPercent:number;
 maximumMarginSafePercent:number;recommendedPercent:number;
 reservePerOrder:number;eligibleForQuote:boolean;warning:string|null;
};
const LEVELS=[
 {name:"starter" as const,min:0,bonus:0,next:5},
 {name:"rising" as const,min:5,bonus:2,next:15},
 {name:"pro" as const,min:15,bonus:5,next:40},
 {name:"elite" as const,min:40,bonus:10,next:100},
 {name:"ambassador" as const,min:100,bonus:15,next:null}
];
function cents(value:number):number{
 if(!Number.isFinite(value)||value<0||value>10_000_000)throw new Error("Valor monetário inválido");
 return Math.round(value*100);
}
/** Additional costs must be included. Profit guard reserves at least 20% of the sale price.
 * Price bands are provisional, not a promise or executed commission.
 */
export function quoteRubiAffiliateCommission(input:{
 retailPrice:number;supplierCost:number;additionalCosts:number;confirmedSales:number;
 marginReservePercent?:number;
}):AffiliateCommissionQuote{
 const {retailPrice,supplierCost,additionalCosts,confirmedSales}=input;
 if(!Number.isSafeInteger(confirmedSales)||confirmedSales<0||confirmedSales>10_000_000)
  throw new Error("Quantidade confirmada inválida");
 const price=cents(retailPrice),cost=cents(supplierCost)+cents(additionalCosts);
 const reservePct=input.marginReservePercent??20;
 if(!Number.isFinite(reservePct)||reservePct<0||reservePct>95)throw new Error("Reserva inválida");
 const level=[...LEVELS].reverse().find(x=>confirmedSales>=x.min)!;
 const basePercent=price<=9900?8:price<=29900?6:5;
 const proposedPercent=Math.min(20,basePercent+level.bonus);
 const available=Math.max(0,price-cost-Math.ceil(price*reservePct/100));
 const safePct=price===0?0:Math.floor(available/price*10000)/100;
 const recommendedPercent=Math.min(proposedPercent,safePct);
 const enoughData=price>0&&price>cost&&supplierCost>0;
 return {
  tier:level.name,confirmedSales,nextGoal:level.next,
  remaining:level.next===null?0:Math.max(0,level.next-confirmedSales),
  basePercent,bonusPercent:level.bonus,proposedPercent,
  maximumMarginSafePercent:safePct,
  recommendedPercent:enoughData?recommendedPercent:0,
  reservePerOrder:price/100*reservePct/100,eligibleForQuote:enoughData,
  warning:!enoughData?"Preço e custos precisam de validação":
   recommendedPercent<proposedPercent?"Margem insuficiente para a faixa proposta":null
 };
}
export function rubiAffiliateMilestoneFromConfirmedSales(count:number){
 if(!Number.isSafeInteger(count)||count<0)throw new Error("Número de pedidos inválido");
 const level=[...LEVELS].reverse().find(x=>count>=x.min)!;
 return {tier:level.name,confirmedSales:count,bonusPercent:level.bonus,
  nextGoal:level.next,remaining:level.next===null?0:level.next-count};
}

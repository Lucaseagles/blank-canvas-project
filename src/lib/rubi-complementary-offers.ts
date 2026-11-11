export const RUBI_COMPLEMENTARY_KINDS = ["order_bump","upsell","cross_sell","downsell"] as const;
export type RubiComplementaryKind = (typeof RUBI_COMPLEMENTARY_KINDS)[number];
export const RUBI_COMPLEMENTARY_LABELS:Record<RubiComplementaryKind,string> = {
  order_bump:"Order bump (sugestão para checkout externo)",
  upsell:"Upsell (pós-compra somente com confirmação da Kairos)",
  cross_sell:"Cross-sell (produto complementar na RUBI)",
  downsell:"Downsell (alternativa de menor preço)",
};
export function canSuggestComplementary(primaryId:string,suggestedId:string,kind:RubiComplementaryKind,primaryPrice:number,suggestedPrice:number) {
  if(!primaryId || !suggestedId || primaryId===suggestedId) return false;
  if(!Number.isFinite(primaryPrice)||primaryPrice<=0||!Number.isFinite(suggestedPrice)||suggestedPrice<=0) return false;
  return kind!=="downsell" || suggestedPrice<primaryPrice;
}

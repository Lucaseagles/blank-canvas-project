import type {RubiMovementVariant} from "./rubi-movement-variants";

/** Editorial readiness only. This does NOT allocate users or conduct a causal A/B test. */
export type RubiExperimentReadiness={
 eligible:boolean;
 reasons:string[];
 controlId:string|null;
 challengerId:string|null;
};
export function assessRubiExperimentReadiness(
 variants:RubiMovementVariant[],
 movementStatus:"draft"|"review"
):RubiExperimentReadiness {
 const reasons:string[]=[];
 const ready=variants.filter(v=>v.status==="review"&&Boolean(v.id))
  .sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 if(movementStatus!=="review")reasons.push("O movimento ainda não está em revisão.");
 if(ready.length<2)reasons.push("Cadastre duas variantes revisadas para comparar.");
 if(ready.length>2)reasons.push("Selecione um par de controle e desafio; múltiplas variantes impedem uma comparação direta.");
 const control=ready.length===2?ready[0]:undefined;
 const challenger=ready.length===2?ready[1]:undefined;
 if(control&&challenger){
  if(control.movement_id!==challenger.movement_id)reasons.push("As variantes precisam pertencer ao mesmo movimento.");
  if(control.format!==challenger.format)reasons.push("Controle e desafio devem usar o mesmo formato.");
  if(control.creative_hook.trim().toLocaleLowerCase("pt-BR")===challenger.creative_hook.trim().toLocaleLowerCase("pt-BR"))
   reasons.push("Os ganchos são idênticos: defina a hipótese criativa.");
  if(!control.media_rights_confirmed||!challenger.media_rights_confirmed)
   reasons.push("Ambas as variantes precisam declarar direitos de mídia (declaração não equivale a licença).");
 }
 return {
  eligible:reasons.length===0,
  reasons,
  controlId:control?.id??null,
  challengerId:challenger?.id??null,
 };
}

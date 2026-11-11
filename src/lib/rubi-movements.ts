export type RubiMovement = {
  id?: string | undefined;
  product_id:string;
  name:string;
  audience:"consumer"|"merchant"|"partner";
  buyer_persona:string;
  problem:string;
  desired_outcome:string;
  truthful_promise:string;
  differentiator:string;
  narrative:string;
  evidence_notes:string;
  status:"draft"|"review";
  revision?:number | undefined;
};
export function emptyRubiMovement(productId:string):RubiMovement {
  return {product_id:productId,name:"",audience:"consumer",buyer_persona:"",problem:"",desired_outcome:"",truthful_promise:"",differentiator:"",narrative:"",evidence_notes:"",status:"draft"};
}
export function rubiMovementChecklist(m:RubiMovement) {
  const checks:[string,boolean][]=[
   ["Nome do movimento",m.name.trim().length>=3],
   ["Público e situação",m.buyer_persona.trim().length>=12],
   ["Problema real",m.problem.trim().length>=12],
   ["Resultado desejado",m.desired_outcome.trim().length>=12],
   ["Promessa verificável",m.truthful_promise.trim().length>=12],
   ["Diferenciação",m.differentiator.trim().length>=12],
   ["Narrativa",m.narrative.trim().length>=30],
   ["Evidências",m.evidence_notes.trim().length>=12],
  ];
  return {completed:checks.filter(x=>x[1]).length,total:checks.length,missing:checks.filter(x=>!x[1]).map(x=>x[0])};
}
export function canReviewRubiMovement(m:RubiMovement){return rubiMovementChecklist(m).missing.length===0;}

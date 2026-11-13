/** An evidence record is a human declaration, not independent verification of a market hypothesis. */
export type RubiAudienceEvidenceInput={
 source:string;
 observedAt:string;
 method:string;
 finding:string;
 counterEvidence:string;
 hypothesis:string;
};
export function buildRubiAudienceEvidence(input:RubiAudienceEvidenceInput):{valid:boolean;issues:string[];notes:string}{
 const issues:string[]=[];
 const value=(s:string)=>s.trim().replace(/\s+/g," ");
 if(value(input.source).length<12)issues.push("Identifique a fonte verificável.");
 if(value(input.method).length<12)issues.push("Descreva o método de obtenção.");
 if(value(input.finding).length<20)issues.push("Descreva o resultado observado.");
 if(value(input.counterEvidence).length<12)issues.push("Registre limitações ou contraevidências.");
 if(value(input.hypothesis).length<20)issues.push("Registre a hipótese de público/ângulo.");
 const date=new Date(input.observedAt+"T12:00:00Z");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.observedAt)||
  Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==input.observedAt||
  date.getTime()>Date.now()+86400000)issues.push("Informe uma data real e não futura.");
 const notes=[
  "[VALIDAÇÃO DECLARADA — REVISÃO HUMANA PENDENTE]",
  "Fonte: "+value(input.source),
  "Data: "+input.observedAt,
  "Método: "+value(input.method),
  "Observação: "+value(input.finding),
  "Contraevidência/limites: "+value(input.counterEvidence),
  "Hipótese: "+value(input.hypothesis),
 ].join("\n");
 if(notes.length>1400)issues.push("Registro excede o limite de 1.400 caracteres do campo.");
 return {valid:issues.length===0,issues,notes:issues.length===0?notes:""};
}

/** A declaration is not independent market validation; it is a traceable research record. */
export type RubiAudienceEvidenceSourceKind=
 |"interview"|"survey"|"usability_test"|"support_feedback"
 |"supplier_document"|"market_report"|"search_trend"|"other";
export type RubiAudienceEvidenceInput={
 source:string;sourceKind:RubiAudienceEvidenceSourceKind;observedAt:string;
 sampleSize:number;consentConfirmed:boolean;containsPersonalData:boolean;
 method:string;finding:string;counterEvidence:string;hypothesis:string;
};
const participantMethods=new Set<RubiAudienceEvidenceSourceKind>(["interview","survey","usability_test","support_feedback"]);
export function buildRubiAudienceEvidence(input:RubiAudienceEvidenceInput):{valid:boolean;issues:string[];notes:string}{
 const issues:string[]=[];
 const value=(s:string)=>s.trim().replace(/\s+/g," ");
 if(value(input.source).length<12)issues.push("Identifique a fonte verificável.");
 if(!["interview","survey","usability_test","support_feedback","supplier_document","market_report","search_trend","other"].includes(input.sourceKind))issues.push("Selecione o tipo real da fonte.");
 if(value(input.method).length<12)issues.push("Descreva o método de obtenção.");
 if(value(input.finding).length<20)issues.push("Descreva o resultado observado.");
 if(value(input.counterEvidence).length<12)issues.push("Registre limitações ou contraevidências.");
 if(value(input.hypothesis).length<20)issues.push("Registre a hipótese de público/ângulo.");
 if(!Number.isSafeInteger(input.sampleSize)||input.sampleSize<0||input.sampleSize>100000)issues.push("Informe uma quantidade de amostra inteira entre 0 e 100.000.");
 if(participantMethods.has(input.sourceKind)&&input.sampleSize<1)issues.push("Pesquisa com participantes exige a quantidade real de participantes.");
 if(participantMethods.has(input.sourceKind)&&!input.consentConfirmed)issues.push("Confirme que a coleta com participantes teve consentimento adequado.");
 if(input.containsPersonalData)issues.push("Remova dados pessoais; registre somente resultados agregados e anonimizados.");
 const date=new Date(input.observedAt+"T12:00:00Z");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.observedAt)||Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==input.observedAt||input.observedAt>new Date().toISOString().slice(0,10))issues.push("Informe uma data real e não futura.");
 if(/^http:\/\//i.test(value(input.source)))issues.push("Use HTTPS para referências web.");
 const notes=[
  "[VALIDAÇÃO DECLARADA — REVISÃO HUMANA PENDENTE]",
  "Fonte: "+value(input.source),"Tipo de fonte: "+input.sourceKind,
  "Data: "+input.observedAt,"Amostra: "+input.sampleSize,
  "Consentimento: "+(participantMethods.has(input.sourceKind)?"confirmado":input.consentConfirmed?"confirmado":"não aplicável"),
  "Dados pessoais: não incluídos","Método: "+value(input.method),
  "Observação: "+value(input.finding),"Contraevidência/limites: "+value(input.counterEvidence),
  "Hipótese: "+value(input.hypothesis),
 ].join("\n");
 if(notes.length>1400)issues.push("Registro excede o limite de 1.400 caracteres do campo.");
 return {valid:issues.length===0,issues,notes:issues.length===0?notes:""};
}

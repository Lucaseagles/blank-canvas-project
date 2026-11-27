/** Distinguish an editorial draft from declared evidence awaiting human review. */
export type RubiAudienceEvidenceStatus={kind:"missing"|"legacy_unstructured"|"declared_pending_review";label:string;blockers:string[]};
const prefix="[VALIDAÇÃO DECLARADA — REVISÃO HUMANA PENDENTE]";
const fields=[
 ["Fonte: ",12,"Fonte"],["Tipo de fonte: ",6,"Tipo de fonte"],["Data: ",10,"Data"],
 ["Amostra: ",1,"Amostra"],["Consentimento: ",1,"Consentimento"],["Dados pessoais: ",1,"Dados pessoais"],
 ["Método: ",12,"Método"],["Observação: ",20,"Observação"],
 ["Contraevidência/limites: ",12,"Contraevidência/limites"],["Hipótese: ",20,"Hipótese"],
] as const;
function validCalendarDate(value:string):boolean{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const parsed=new Date(value+"T12:00:00.000Z");
 return !Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===value&&value<=new Date().toISOString().slice(0,10);
}
export function assessRubiAudienceEvidenceStatus(notes:string):RubiAudienceEvidenceStatus{
 const value=notes.trim();
 if(!value)return {kind:"missing",label:"Nenhuma evidência registrada",blockers:["Registre uma fonte real, o método e o resultado observado."]};
 if(!value.startsWith(prefix))return {kind:"legacy_unstructured",label:"Notas livres: evidência não verificada",blockers:["Converta notas livres em registro estruturado, mantendo fontes originais."]};
 const lines=value.split("\n"),blockers:string[]=[],parsed=new Map<string,string>();
 if(value.length>1400)blockers.push("Registro excede o limite de 1.400 caracteres.");
 for(const [field,minLength,label] of fields){
  const matches=lines.filter(line=>line.startsWith(field));
  if(matches.length!==1){blockers.push(matches.length===0?"Campo ausente: "+label:"Campo duplicado: "+label);continue;}
  const content=(matches[0]??"").slice(field.length).trim();
  if(content.length<minLength)blockers.push("Campo insuficiente: "+label);
  parsed.set(label,content);
 }
 const date=parsed.get("Data");if(date&&!validCalendarDate(date))blockers.push("Data inválida ou futura.");
 const kind=parsed.get("Tipo de fonte"),sample=Number(parsed.get("Amostra"));
 const participantKinds=["interview","survey","usability_test","support_feedback"];
 if(kind&&!["interview","survey","usability_test","support_feedback","supplier_document","market_report","search_trend","other"].includes(kind))blockers.push("Tipo de fonte não reconhecido.");
 if(kind&&participantKinds.includes(kind)&&(!Number.isSafeInteger(sample)||sample<1))blockers.push("Pesquisa com participantes exige amostra positiva.");
 if(kind&&participantKinds.includes(kind)&&parsed.get("Consentimento")!=="confirmado")blockers.push("Pesquisa com participantes exige consentimento confirmado.");
 if(parsed.get("Dados pessoais")!=="não incluídos")blockers.push("Remova dados pessoais antes da revisão.");
 blockers.push("A documentação informada não equivale à verificação independente do público e do ângulo.");
 return {kind:"declared_pending_review",label:"Evidência declarada — revisão humana pendente",blockers};
}

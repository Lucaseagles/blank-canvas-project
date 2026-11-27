/** Distinguish an editorial draft from declared evidence awaiting human review. */
export type RubiAudienceEvidenceStatus={
 kind:"missing"|"legacy_unstructured"|"declared_pending_review";
 label:string;
 blockers:string[];
};
const prefix="[VALIDAÇÃO DECLARADA — REVISÃO HUMANA PENDENTE]";
const fields=[
 ["Fonte: ",12,"Fonte"],
 ["Data: ",10,"Data"],
 ["Método: ",12,"Método"],
 ["Observação: ",20,"Observação"],
 ["Contraevidência/limites: ",12,"Contraevidência/limites"],
 ["Hipótese: ",20,"Hipótese"],
] as const;
function validCalendarDate(value:string):boolean {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const parsed=new Date(value+"T12:00:00.000Z");
 return !Number.isNaN(parsed.getTime())&&parsed.toISOString().slice(0,10)===value&&
  value<=new Date().toISOString().slice(0,10);
}
export function assessRubiAudienceEvidenceStatus(notes:string):RubiAudienceEvidenceStatus{
 const value=notes.trim();
 if(!value)return {kind:"missing",label:"Nenhuma evidência registrada",blockers:["Registre uma fonte real, o método e o resultado observado."]};
 if(!value.startsWith(prefix))return {kind:"legacy_unstructured",label:"Notas livres: evidência não verificada",blockers:["Converta notas livres em registro estruturado, mantendo fontes originais."]};
 const lines=value.split("\n");
 const blockers:string[]=[];
 if(value.length>1400)blockers.push("Registro excede o limite de 1.400 caracteres.");
 const parsed=new Map<string,string>();
 for(const [field,minLength,label] of fields){
  const matches=lines.filter(line=>line.startsWith(field));
  if(matches.length!==1){blockers.push(matches.length===0? "Campo ausente: "+label:"Campo duplicado: "+label);continue;}
  const line=matches[0];
  if(!line)continue;
  const content=line.slice(field.length).trim();
  if(content.length<minLength)blockers.push("Campo insuficiente: "+label);
  parsed.set(label,content);
 }
 const date=parsed.get("Data");
 if(date&&!validCalendarDate(date))blockers.push("Data inválida ou futura.");
 blockers.push("A documentação informada não equivale à verificação independente do público e do ângulo.");
 return {kind:"declared_pending_review",label:"Evidência declarada — revisão humana pendente",blockers};
}

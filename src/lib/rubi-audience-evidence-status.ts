/** Explicitly distinguish an editorial draft from independently reviewed audience evidence. */
export type RubiAudienceEvidenceStatus={
 kind:"missing"|"legacy_unstructured"|"declared_pending_review";
 label:string;
 blockers:string[];
};
export function assessRubiAudienceEvidenceStatus(notes:string):RubiAudienceEvidenceStatus{
 const value=notes.trim();
 if(!value)return {kind:"missing",label:"Nenhuma evidência registrada",blockers:["Registre uma fonte real, o método e o resultado observado."]};
 const prefix="[VALIDAÇÃO DECLARADA — REVISÃO HUMANA PENDENTE]";
 if(!value.startsWith(prefix))return {kind:"legacy_unstructured",label:"Notas livres: evidência não verificada",blockers:["Converta notas livres em registro estruturado, mantendo fontes originais."]};
 const required=["Fonte: ","Data: ","Método: ","Observação: ","Contraevidência/limites: ","Hipótese: "];
 const missing=required.filter(field=>!value.split("\n").some(line=>line.startsWith(field)&&line.slice(field.length).trim().length>0));
 return {kind:"declared_pending_review",label:"Evidência declarada — revisão humana pendente",
  blockers:[...missing.map(field=>"Campo ausente: "+field.trim()),"A documentação informada não equivale à verificação independente do público e do ângulo."]};
}

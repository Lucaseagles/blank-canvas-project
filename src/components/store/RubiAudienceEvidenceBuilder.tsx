import {useState} from "react";
import {Button} from "@/components/ui/button";
import {buildRubiAudienceEvidence,type RubiAudienceEvidenceInput} from "@/lib/rubi-audience-evidence";

/** Private Master aid: a record is never treated as validated until independently reviewed. */
export function RubiAudienceEvidenceBuilder({onApply}:{onApply:(notes:string)=>void}){
 const [value,setValue]=useState<RubiAudienceEvidenceInput>({
  source:"",sourceKind:"other",observedAt:"",sampleSize:0,consentConfirmed:false,
  containsPersonalData:false,method:"",finding:"",counterEvidence:"",hypothesis:""
 });
 const [attempted,setAttempted]=useState(false);
 const result=buildRubiAudienceEvidence(value);
 const field=(key:"source"|"method"|"finding"|"counterEvidence"|"hypothesis",label:string)=>(
  <label className="block space-y-1 text-xs font-semibold">{label}
   <textarea rows={2} className="block w-full rounded-lg border bg-background p-2 text-sm"
    value={value[key]} onChange={e=>setValue(v=>({...v,[key]:e.target.value}))}/>
  </label>
 );
 return <aside className="space-y-3 rounded-xl border p-3" aria-label="Registro estruturado de evidências do público">
  <h4 className="text-sm font-bold">Registrar evidência real do público e ângulo</h4>
  <p className="text-xs text-muted-foreground">Registre somente fontes e observações que realmente existam. Use resultados agregados e anonimizados; não inclua respostas brutas, nomes, contatos ou identificadores de participantes.</p>
  {field("source","Fonte verificável (URL HTTPS, relatório ou referência consentida)")}
  <label className="block space-y-1 text-xs font-semibold">Tipo de fonte
   <select className="block w-full rounded-lg border bg-background p-2 text-sm" value={value.sourceKind}
    onChange={e=>setValue(v=>({...v,sourceKind:e.target.value as RubiAudienceEvidenceInput["sourceKind"]}))}>
    <option value="interview">Entrevista voluntária</option><option value="survey">Pesquisa / questionário</option>
    <option value="usability_test">Teste de usabilidade</option><option value="support_feedback">Feedback de suporte</option>
    <option value="supplier_document">Documento do fornecedor</option><option value="market_report">Relatório de mercado</option>
    <option value="search_trend">Tendência de busca</option><option value="other">Outra fonte identificável</option>
   </select>
  </label>
  <label className="block space-y-1 text-xs font-semibold">Data da observação
   <input type="date" className="block w-full rounded-lg border bg-background p-2 text-sm"
    value={value.observedAt} onChange={e=>setValue(v=>({...v,observedAt:e.target.value}))}/>
  </label>
  <label className="block space-y-1 text-xs font-semibold">Quantidade real da amostra (0 para fonte documental)
   <input type="number" min={0} max={100000} step={1} className="block w-full rounded-lg border bg-background p-2 text-sm"
    value={value.sampleSize} onChange={e=>setValue(v=>({...v,sampleSize:Number(e.target.value)}))}/>
  </label>
  {(["interview","survey","usability_test","support_feedback"] as const).includes(value.sourceKind as "interview"|"survey"|"usability_test"|"support_feedback")&&
   <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={value.consentConfirmed}
    onChange={e=>setValue(v=>({...v,consentConfirmed:e.target.checked}))}/>
    <span>Confirmo que a coleta com participantes teve consentimento adequado.</span>
   </label>}
  <label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={value.containsPersonalData}
   onChange={e=>setValue(v=>({...v,containsPersonalData:e.target.checked}))}/>
   <span>O material contém dados pessoais identificáveis (marque para bloquear o registro até anonimizar).</span>
  </label>
  {field("method","Método de obtenção e período")}
  {field("finding","Resultado agregado observado (sem dados pessoais)")}
  {field("counterEvidence","Limitações ou fatos contrários à hipótese")}
  {field("hypothesis","Hipótese de público e ângulo a testar")}
  {attempted&&!result.valid&&<p role="alert" className="text-xs text-destructive">{result.issues.join(" · ")}</p>}
  <Button type="button" variant="outline" onClick={()=>{setAttempted(true);if(result.valid)onApply(result.notes);}}>
   Inserir registro no movimento
  </Button>
  <p className="text-xs text-muted-foreground">Amostra e consentimento são declarações do operador, não verificações automáticas. Inserir não significa validação de mercado, publicação ou autorização comercial.</p>
 </aside>;
}

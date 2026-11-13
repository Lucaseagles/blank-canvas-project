import {useState} from "react";
import {Button} from "@/components/ui/button";
import {buildRubiAudienceEvidence,type RubiAudienceEvidenceInput} from "@/lib/rubi-audience-evidence";

/** Private Master aid: a record is never treated as validated until independently reviewed. */
export function RubiAudienceEvidenceBuilder({onApply}:{onApply:(notes:string)=>void}){
 const [value,setValue]=useState<RubiAudienceEvidenceInput>({
  source:"",observedAt:"",method:"",finding:"",counterEvidence:"",hypothesis:""
 });
 const [attempted,setAttempted]=useState(false);
 const result=buildRubiAudienceEvidence(value);
 const field=(key:Exclude<keyof RubiAudienceEvidenceInput,"observedAt">,label:string)=>
  <label className="block space-y-1 text-xs font-semibold">{label}
   <textarea rows={2} className="block w-full rounded-lg border bg-background p-2 text-sm"
    value={value[key]} onChange={e=>setValue(v=>({...v,[key]:e.target.value}))}/>
  </label>;
 return <aside className="space-y-3 rounded-xl border p-3" aria-label="Registro estruturado de evidências do público">
  <h4 className="text-sm font-bold">Registrar evidência real do público e ângulo</h4>
  <p className="text-xs text-muted-foreground">Apenas pesquisas, entrevistas ou fontes reais. Este registro é uma declaração sujeita a verificação humana; não aprova o movimento automaticamente.</p>
  {field("source","Fonte verificável (URL, referência ou identificação consentida)")}
  <label className="block space-y-1 text-xs font-semibold">Data da observação
   <input type="date" className="block w-full rounded-lg border bg-background p-2 text-sm"
    value={value.observedAt} onChange={e=>setValue(v=>({...v,observedAt:e.target.value}))}/>
  </label>
  {field("method","Como a evidência foi obtida?")}
  {field("finding","O que foi observado de fato?")}
  {field("counterEvidence","Limitações ou fatos contrários à hipótese")}
  {field("hypothesis","Hipótese de público e ângulo a testar")}
  {attempted&&!result.valid&&<p role="alert" className="text-xs text-destructive">{result.issues.join(" · ")}</p>}
  <Button type="button" variant="outline" onClick={()=>{
   setAttempted(true);
   if(result.valid)onApply(result.notes);
  }}>Inserir registro no movimento</Button>
  <p className="text-xs text-muted-foreground">Confira e salve o movimento. Inserir não significa publicação, pesquisa validada nem autorização comercial.</p>
 </aside>;
}

import {useState} from "react";
import {useQuery,useMutation,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {getRubiMovementABAdmin,configureRubiMovementABAdmin} from "@/lib/rubi-movement-ab.functions";
import {assessRubiExperimentReadiness} from "@/lib/rubi-experiment-readiness";
import type {RubiMovementVariant} from "@/lib/rubi-movement-variants";

/** Master controls reviewed experimental copy; prices and checkouts never change by arm. */
export function RubiMovementABAdmin({movementId,movementStatus,variants}:{
 movementId:string;movementStatus:"draft"|"review";variants:RubiMovementVariant[]
}){
 const get=useServerFn(getRubiMovementABAdmin);
 const configure=useServerFn(configureRubiMovementABAdmin);
 const client=useQueryClient();
 const query=useQuery({queryKey:["rubi-movement-ab-admin",movementId],
  queryFn:()=>get({data:{movementId}}),retry:false});
 const preflight=assessRubiExperimentReadiness(variants,movementStatus);
 const [acknowledge,setAcknowledge]=useState(false);
 const current=query.data;
 const mutation=useMutation({
  mutationFn:(running:boolean)=>{
   const controlId=running?preflight.controlId:current?.controlId;
   const challengerId=running?preflight.challengerId:current?.challengerId;
   if(!controlId||!challengerId)throw new Error("Cadastre duas variantes distintas.");
   return configure({data:{movementId,controlId,challengerId,
    expectedRevision:current?.revision??null,running}});
  },
  onSuccess:()=>{setAcknowledge(false);toast.success("Configuração registrada e auditada.");void client.invalidateQueries({queryKey:["rubi-movement-ab-admin",movementId]});},
  onError:(e:Error)=>toast.error(e.message)
 });
 return <aside className="space-y-3 rounded-2xl border border-primary/30 p-4" aria-label="Experimento controlado A/B">
  <h5 className="font-bold">Experimento A/B controlado da Store</h5>
  <p className="text-xs text-muted-foreground">
   Público visitante da loja, dividido de forma estável 50/50 por identificador aleatório do navegador.
   Cada variação altera a apresentação editorial, nunca preço, promessa aprovada ou checkout.
  </p>
  {query.isLoading?<p className="text-xs">Consultando configuração...</p>:query.isError?
   <p role="alert" className="text-xs text-destructive">Não foi possível verificar o experimento.</p>:
   <p className="text-xs font-semibold">Situação: {current?.status==="running"?"Ativo":current?"Pausado":"Não configurado"} · revisão {current?.revision??"—"}</p>}
  {!preflight.eligible&&<p className="text-xs text-muted-foreground">Pré-requisitos: {preflight.reasons.join(" · ")}</p>}
  {preflight.eligible&&<p className="text-xs">Controle: {variants.find(v=>v.id===preflight.controlId)?.name??"—"} · Desafio: {variants.find(v=>v.id===preflight.challengerId)?.name??"—"}</p>}
  {current?.status!=="running"&&<label className="flex items-start gap-2 text-xs">
   <input type="checkbox" checked={acknowledge} onChange={e=>setAcknowledge(e.target.checked)}/>
   Confirmo revisão de direitos, a hipótese do experimento e que os eventos de clique não são pedidos pagos.
  </label>}
  <div className="flex gap-2">
   {current?.status==="running"?
    <Button size="sm" variant="outline" disabled={mutation.isPending||query.isLoading||query.isError}
      onClick={()=>mutation.mutate(false)}>Pausar teste</Button>:
    <Button size="sm" disabled={!preflight.eligible||!acknowledge||mutation.isPending||query.isLoading||query.isError}
      onClick={()=>mutation.mutate(true)}>Iniciar teste 50/50</Button>}
  </div>
  <p className="text-xs text-muted-foreground">
   Sessões e eventos registrados são sinais operacionais, não prova de incremento causal.
   Uma análise estatística requer coortes, amostra, integridade de exposição e conciliação de compras reais.
  </p>
 </aside>;
}

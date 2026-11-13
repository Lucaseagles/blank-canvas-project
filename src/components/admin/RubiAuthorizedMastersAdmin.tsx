import {useState} from "react";
import {useQuery,useMutation,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {listRubiAuthorizedMastersAdmin,changeRubiAuthorizedMasterAdmin} from "@/lib/rubi-authorized-masters.functions";

export function RubiAuthorizedMastersAdmin(){
 const [targetId,setTargetId]=useState("");
 const load=useServerFn(listRubiAuthorizedMastersAdmin);
 const change=useServerFn(changeRubiAuthorizedMasterAdmin);
 const cache=useQueryClient();
 const query=useQuery({queryKey:["rubi-authorized-masters"],queryFn:()=>load(),retry:false});
 const mutation=useMutation({
  mutationFn:(input:{userId:string;grant:boolean})=>change({data:input}),
  onSuccess:()=>{toast.success("Permissão Master atualizada e auditada.");setTargetId("");void cache.invalidateQueries({queryKey:["rubi-authorized-masters"]});},
  onError:(error:Error)=>toast.error(error.message)
 });
 const validId=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetId);
 const manage=(userId:string,grant:boolean)=>{
  if(!window.confirm(grant?"Confirmar concessão de acesso administrativo completo a esta conta existente?":"Confirmar revogação do acesso administrativo desta conta?"))return;
  mutation.mutate({userId,grant});
 };
 return <section className="space-y-3 rounded-2xl border p-4" aria-label="Controle de Masters">
  <h2 className="font-bold text-lg">Controle dos Masters</h2>
  <p className="text-sm text-muted-foreground">O fundador permanece protegido. A autorização só aceita contas já existentes. O papel Master concede acesso administrativo completo; compartilhe apenas com pessoas de confiança.</p>
  {query.isLoading&&<p role="status">Consultando permissões...</p>}
  {query.isError&&<p role="alert" className="text-destructive">Falha ao consultar permissões.</p>}
  {query.data?.partial&&<p role="alert" className="text-xs">Listagem limitada aos 100 primeiros Masters. Revise antes de alterar permissões.</p>}
  {query.data?.masters.map((item:{userId:string;isFoundingMaster:boolean})=><div key={item.userId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3">
   <div className="min-w-0"><p className="text-sm font-semibold">{item.isFoundingMaster?"Master fundador":"Master autorizado"}</p><p className="break-all font-mono text-xs text-muted-foreground">{item.userId}</p></div>
   {query.data?.isFoundingMaster&&!item.isFoundingMaster&&<Button type="button" variant="outline" disabled={mutation.isPending} onClick={()=>manage(item.userId,false)}>Revogar acesso</Button>}
  </div>)}
  {query.data?.isFoundingMaster&&<div className="space-y-2 rounded-xl bg-muted/20 p-3">
   <label className="block space-y-1 text-sm font-semibold">ID de uma conta já cadastrada
    <input className="block w-full rounded-lg border bg-background p-2 font-mono text-xs" value={targetId} onChange={e=>setTargetId(e.target.value.trim())} placeholder="UUID do usuário"/>
   </label>
   <Button type="button" disabled={mutation.isPending||!validId||!!query.data?.masters.some((m:{userId:string})=>m.userId===targetId)} onClick={()=>manage(targetId,true)}>Autorizar novo Master</Button>
  </div>}
 </section>;
}

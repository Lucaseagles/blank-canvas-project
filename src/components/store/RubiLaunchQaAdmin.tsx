import {useEffect,useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {RUBI_LAUNCH_QA_ITEMS,emptyRubiQaChecklist,rubiQaReview,type RubiQaChecklist,type RubiQaKey,type RubiQaStatus} from "@/lib/rubi-launch-qa";
import {getRubiLaunchQaAdmin,saveRubiLaunchQaAdmin} from "@/lib/rubi-launch-qa.functions";

export function RubiLaunchQaAdmin({products}:{products:Array<{id:string;title:string}>}){
 const [productId,setProductId]=useState("");
 const [draft,setDraft]=useState<RubiQaChecklist|null>(null);
 const [dirty,setDirty]=useState(false);
 const load=useServerFn(getRubiLaunchQaAdmin);
 const save=useServerFn(saveRubiLaunchQaAdmin);
 const client=useQueryClient();
 const query=useQuery({queryKey:["rubi-launch-qa",productId],enabled:!!productId,retry:false,queryFn:()=>load({data:{productId}})});
 useEffect(()=>{
  if(!productId||!query.isFetched||query.isError||query.isLoading)return;
  setDraft(query.data??emptyRubiQaChecklist(productId));setDirty(false);
 },[productId,query.data,query.isFetched,query.isError,query.isLoading]);
 const mutation=useMutation({
  mutationFn:async()=>{if(!draft)throw new Error("Escolha um produto.");return save({data:draft});},
  onSuccess:()=>{toast.success("Conferência manual registrada.");setDirty(false);void client.invalidateQueries({queryKey:["rubi-launch-qa",productId]});},
  onError:(error:Error)=>toast.error(error.message),
 });
 const update=(key:RubiQaKey,field:"status"|"evidence",value:string)=>{
  setDraft(old=>old?{...old,[key]:{...old[key],[field]:value}}:old);setDirty(true);
 };
 const review=draft?rubiQaReview(draft):null;
 return <section className="space-y-5 rounded-3xl border border-primary/30 bg-card p-6" aria-label="Conferência operacional do lançamento">
  <div className="space-y-2">
   <p className="text-xs font-black uppercase tracking-widest text-primary">RUBI 11× · Validação operacional</p>
   <h2 className="text-2xl font-black">Checklist por produto · Domínio, QA e Kairos</h2>
   <p className="text-sm text-muted-foreground">Registre os testes realmente realizados. Marcar um item como verificado é uma declaração manual com evidência, não um teste executado automaticamente nem uma confirmação de pagamento.</p>
  </div>
  <label className="block space-y-2 text-sm font-semibold">Produto do catálogo
   <select className="w-full rounded-lg border bg-background p-3" value={productId} onChange={e=>{
     if(dirty&&!window.confirm("Descartar alterações não salvas?"))return;
     setProductId(e.target.value);setDraft(null);setDirty(false);
   }}>
    <option value="">Selecione um produto</option>{products.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
   </select>
  </label>
  {query.isLoading&&<p role="status">Carregando conferências...</p>}
  {query.isError&&<p role="alert" className="text-destructive">Não foi possível carregar. Verifique a migração e as permissões.</p>}
  {draft&&!query.isError&&<div className="space-y-4">
   <div className="rounded-xl border p-3 text-sm">
    <p className="font-semibold">Conferências informadas: {review?.verified}/{review?.total}</p>
    <p className="text-xs text-muted-foreground">{review?.allAttested?"Todos os itens possuem confirmação manual. Ainda falta validar operação financeira com o fornecedor.":"A validação operacional permanece pendente."}</p>
   </div>
   {RUBI_LAUNCH_QA_ITEMS.map(item=><div key={item.key} className="space-y-2 rounded-xl border p-4">
    <p className="font-semibold">{item.label}</p>
    <p className="text-xs text-muted-foreground">{item.instructions}</p>
    <label className="block space-y-1 text-sm">Estado
     <select className="w-full rounded-lg border bg-background p-2" value={draft[item.key].status} onChange={e=>update(item.key,"status",e.target.value as RubiQaStatus)}>
      <option value="pending">Pendente</option><option value="blocked">Bloqueado</option><option value="verified">Verificado manualmente</option>
     </select>
    </label>
    <label className="block space-y-1 text-sm">Evidência / referência do teste
     <textarea className="w-full rounded-lg border bg-background p-2" rows={2} maxLength={1000} value={draft[item.key].evidence} onChange={e=>update(item.key,"evidence",e.target.value)} placeholder="URL, resultado ou detalhe da verificação; não inclua dados sensíveis."/>
    </label>
   </div>)}
   {review?.invalid.length? <p role="alert" className="text-sm text-destructive">Falta evidência para: {review.invalid.join(", ")}</p>:null}
   <Button disabled={!dirty||mutation.isPending||!!review?.invalid.length} onClick={()=>mutation.mutate()}>{mutation.isPending?"Salvando...":"Salvar evidências no Shadow Master"}</Button>
  </div>}
 </section>;
}

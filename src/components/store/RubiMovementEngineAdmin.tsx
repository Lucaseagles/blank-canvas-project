import {useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {RubiMovementVariantsAdmin} from "@/components/store/RubiMovementVariantsAdmin";
import {RubiMovementPerformanceAdmin} from "@/components/store/RubiMovementPerformanceAdmin";
import {RubiAudienceMovementSummaryAdmin} from "@/components/store/RubiAudienceMovementSummaryAdmin";
import {RubiAudienceEvidenceBuilder} from "@/components/store/RubiAudienceEvidenceBuilder";
import {RubiAudienceEvidenceReviewAdmin} from "@/components/store/RubiAudienceEvidenceReviewAdmin";
import {assessRubiAudienceEvidenceStatus} from "@/lib/rubi-audience-evidence-status";
import {emptyRubiMovement,rubiMovementChecklist,rubiMovementEditorialQuality,type RubiMovement} from "@/lib/rubi-movements";
import {listRubiMovementsAdmin,saveRubiMovementAdmin,archiveRubiMovementAdmin} from "@/lib/rubi-movements.functions";

type Product={id:string;title:string};
export function RubiMovementEngineAdmin({products}:{products:Product[]}){
 const [productId,setProductId]=useState("");
 const [draft,setDraft]=useState<RubiMovement|null>(null);
 const [dirty,setDirty]=useState(false);
 const client=useQueryClient();
 const list=useServerFn(listRubiMovementsAdmin);
 const save=useServerFn(saveRubiMovementAdmin);
 const archive=useServerFn(archiveRubiMovementAdmin);
 const query=useQuery({queryKey:["rubi-movements-admin",productId],queryFn:()=>list({data:{productId}}),enabled:!!productId,retry:false});
 const change=<K extends keyof RubiMovement>(key:K,value:RubiMovement[K])=>{setDraft(previous=>previous?{...previous,[key]:value}:previous);setDirty(true);};
 const mutation=useMutation({
  mutationFn:async()=>{if(!draft)throw new Error("Selecione um movimento.");return save({data:draft});},
  onSuccess:()=>{toast.success("Movimento salvo com revisão registrada.");setDraft(null);setDirty(false);void client.invalidateQueries({queryKey:["rubi-movements-admin",productId]});},
  onError:(error:Error)=>toast.error(error.message),
 });
 const remove=useMutation({
  mutationFn:async()=>{if(!draft?.id||!draft.revision)throw new Error("Salve primeiro.");return archive({data:{productId:draft.product_id,id:draft.id,revision:draft.revision}});},
  onSuccess:()=>{toast.success("Rascunho retirado.");setDraft(null);setDirty(false);void client.invalidateQueries({queryKey:["rubi-movements-admin",productId]});},
  onError:(error:Error)=>toast.error(error.message),
 });
 const field=(key:"name"|"buyer_persona"|"problem"|"desired_outcome"|"truthful_promise"|"differentiator"|"narrative"|"evidence_notes",label:string,placeholder:string,rows=2)=>
 <label className="block space-y-1 text-sm font-semibold"><span>{label}</span><textarea className="w-full rounded-xl border bg-background p-3 text-sm" rows={rows} value={draft?.[key]??""} placeholder={placeholder} onChange={event=>change(key,event.target.value)} /></label>;
 const check=draft?rubiMovementChecklist(draft):null;
 const editorialQuality=draft?rubiMovementEditorialQuality(draft):null;
 const evidenceStatus=draft?assessRubiAudienceEvidenceStatus(draft.evidence_notes):null;
 const canSendToReview=check?.missing.length===0&&editorialQuality?.ready===true;
 return <section aria-label="RUBI Movement Engine" className="space-y-5 rounded-3xl border border-primary/30 bg-card p-6">
  <header className="space-y-2"><p className="text-xs font-black uppercase tracking-widest text-primary">RUBI 11× · Movement Engine</p>
   <h2 className="text-2xl font-black">Movimentos comerciais por produto</h2>
   <p className="text-sm text-muted-foreground">Crie narrativas diferentes para públicos diferentes. São hipóteses privadas: não são criativos publicados, ofertas comprovadas, promessas aprovadas nem vendas.</p>
  </header>
  <label className="block space-y-1 text-sm font-semibold">Produto
   <select className="w-full rounded-lg border bg-background p-2" value={productId} onChange={event=>{
      if(dirty&&!window.confirm("Descartar alterações não salvas?"))return;
      setProductId(event.target.value);setDraft(null);setDirty(false);
    }}><option value="">Selecione um produto</option>{products.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select>
  </label>
  {query.isLoading&&<p role="status">Carregando movimentos...</p>}
  {query.isError&&<p role="alert" className="text-destructive">Não foi possível carregar. Confira a migração e as permissões.</p>}
  {productId&&!query.isError&&<div className="space-y-3">
   <Button type="button" variant="outline" disabled={mutation.isPending||remove.isPending} onClick={()=>{
     if(dirty&&!window.confirm("Descartar alterações não salvas?"))return;
     setDraft(emptyRubiMovement(productId));setDirty(false);
   }}>Criar novo movimento</Button>
   <div className="grid gap-2 sm:grid-cols-2">
    {query.data?.map(m=><button key={m.id} type="button" className="rounded-xl border p-3 text-left hover:border-primary" onClick={()=>{
      if(dirty&&!window.confirm("Descartar alterações não salvas?"))return;
      setDraft({...m});setDirty(false);
     }}><span className="block font-bold">{m.name}</span><span className="text-xs text-muted-foreground">{m.audience} · {m.status==="review"?"Pronto para revisão":"Rascunho"} · revisão {m.revision}</span></button>)}
   </div>
   {query.data?.length===0&&<p className="text-sm text-muted-foreground">Nenhum movimento. Crie o primeiro para este produto.</p>}
  </div>}
  {productId&&<RubiAudienceMovementSummaryAdmin productId={productId}/>}
  {draft&&<div className="space-y-4 rounded-xl border p-4">
   <h3 className="text-lg font-bold">{draft.id?"Editar movimento existente":"Novo movimento"}</h3>
   {field("name","Nome do movimento","Ex.: Sua Casa, Seu Olhar")}
   <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm font-semibold">Público comercial
    <select className="w-full rounded-lg border bg-background p-2" value={draft.audience} onChange={e=>change("audience",e.target.value as RubiMovement["audience"])}>
      <option value="consumer">Consumidor</option><option value="merchant">Lojista</option><option value="partner">Parceiro autorizado</option>
    </select></label>
    <label className="space-y-1 text-sm font-semibold">Estado editorial
    <select className="w-full rounded-lg border bg-background p-2" value={draft.status} onChange={e=>change("status",e.target.value as RubiMovement["status"])}>
      <option value="draft">Rascunho</option><option value="review" disabled={!canSendToReview}>Pronto para revisão humana</option>
    </select></label></div>
   {field("buyer_persona","Para quem?","Perfil comprador e contexto sem inferir dados privados")}
   {field("problem","Qual problema concreto?","Situação legítima e comprovável")}
   {field("desired_outcome","Qual resultado o cliente deseja?","Resultado ou benefício realista")}
   {field("truthful_promise","Qual promessa verificável?","Não inventar benefícios do produto")}
   {field("differentiator","Qual é a diferença da narrativa?","Por que esse enfoque interessa ao público?")}
   {field("narrative","Qual história conecta tudo?","Gancho → situação → benefício → convite para conhecer",4)}
   {field("evidence_notes","Quais fontes sustentam a mensagem?","Referência à ficha do fornecedor e direitos de uso")}
   <RubiAudienceEvidenceBuilder onApply={notes=>change("evidence_notes",notes)}/>
   {evidenceStatus&&<aside aria-label="Situação da evidência comercial" className="rounded-xl border border-amber-500/30 p-3 space-y-1">
    <p className="text-sm font-bold">{evidenceStatus.label}</p>
    {evidenceStatus.blockers.map((issue,index)=><p key={index} className="text-xs text-muted-foreground">{issue}</p>)}
    <p className="text-xs text-muted-foreground">A classificação não libera o movimento, a publicidade nem concede validação de mercado.</p>
   </aside>}
   <div className="rounded-lg bg-muted/40 p-3 text-sm"><strong>Checklist de preparação: {check?.completed}/{check?.total}</strong>
    <p className="mt-1 text-muted-foreground">{check?.missing.length? "Faltam: "+check.missing.join(", "):"Campos completos. A revisão e a comprovação ainda são humanas."}</p>
    {editorialQuality&&!editorialQuality.ready&&<p role="alert" className="mt-2 text-amber-700 dark:text-amber-300">Corrija antes da revisão: {editorialQuality.repeated.join(" · ")}</p>}
   </div>
   <aside className="space-y-2 rounded-xl border bg-muted/20 p-3" aria-label="Plano de validação do público e do ângulo">
    <h4 className="text-sm font-bold">Validação do público e do ângulo · requisito 08.2</h4>
    <p className="text-xs text-muted-foreground">No campo de evidências, documente fonte e data da pesquisa, perfil consultado, problema confirmado, hipótese do gancho e resultados verificáveis. Inclua o que contradiz a hipótese. Não registre entrevistas, métricas ou provas que não aconteceram.</p>
    <p className="text-xs text-muted-foreground">Checklist editorial preenchido não equivale a público validado. O Master deve revisar as evidências antes de usar o movimento comercialmente.</p>
   </aside>
   <div className="flex flex-wrap gap-2">
    <Button disabled={mutation.isPending||remove.isPending||(!dirty&&!!draft.id)||draft.name.trim().length<3} onClick={()=>mutation.mutate()}>{mutation.isPending?"Salvando...":"Salvar movimento privado"}</Button>
    {draft.id&&<Button variant="outline" disabled={mutation.isPending||remove.isPending} onClick={()=>{
      if(window.confirm("Excluir este movimento privado? Esta ação não altera o checkout."))remove.mutate();
    }}>Excluir rascunho</Button>}
    <Button variant="outline" onClick={()=>{if(dirty&&!window.confirm("Descartar alterações?"))return;setDraft(null);setDirty(false);}}>Fechar editor</Button>
   </div>
  </div>}
  {draft?.id&&draft.revision&&!dirty&&<RubiAudienceEvidenceReviewAdmin movementId={draft.id} movementRevision={draft.revision} evidenceNotes={draft.evidence_notes}/>}
  {draft?.id&&<RubiMovementVariantsAdmin key={draft.id} movementId={draft.id} movementName={draft.name} movementStatus={draft.status} productId={draft.product_id}/>}
  {draft?.id&&<RubiMovementPerformanceAdmin key={draft.id} movementId={draft.id}/>}
 </section>;
}

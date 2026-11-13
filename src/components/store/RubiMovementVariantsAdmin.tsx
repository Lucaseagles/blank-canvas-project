import {useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {RubiMovementDistributionAdmin} from "@/components/store/RubiMovementDistributionAdmin";
import {RubiVariantVideoLinksAdmin} from "@/components/store/RubiVariantVideoLinksAdmin";
import {emptyRubiMovementVariant,rubiVariantChecklist,type RubiMovementVariant} from "@/lib/rubi-movement-variants";
import {assessRubiExperimentReadiness} from "@/lib/rubi-experiment-readiness";
import {listRubiMovementVariantsAdmin,saveRubiMovementVariantAdmin,deleteRubiMovementVariantAdmin} from "@/lib/rubi-movement-variants.functions";

export function RubiMovementVariantsAdmin({movementId,movementName,movementStatus,productId}:{movementId:string;movementName:string;movementStatus:"draft"|"review";productId:string}){
 const [draft,setDraft]=useState<RubiMovementVariant|null>(null);
 const [dirty,setDirty]=useState(false);
 const list=useServerFn(listRubiMovementVariantsAdmin);
 const save=useServerFn(saveRubiMovementVariantAdmin);
 const remove=useServerFn(deleteRubiMovementVariantAdmin);
 const client=useQueryClient();
 const query=useQuery({queryKey:["rubi-movement-variants",movementId],queryFn:()=>list({data:{movementId}}),retry:false});
 const mutation=useMutation({
  mutationFn:async()=>{if(!draft)throw new Error("Selecione uma variante.");return save({data:draft});},
  onSuccess:()=>{toast.success("Variante editorial salva.");setDraft(null);setDirty(false);void client.invalidateQueries({queryKey:["rubi-movement-variants",movementId]});},
  onError:(e:Error)=>toast.error(e.message)
 });
 const deletion=useMutation({
  mutationFn:async()=>{if(!draft?.id||!draft.revision)throw new Error("Variante não salva.");return remove({data:{movementId,id:draft.id,revision:draft.revision}});},
  onSuccess:()=>{toast.success("Variante removida.");setDraft(null);setDirty(false);void client.invalidateQueries({queryKey:["rubi-movement-variants",movementId]});},
  onError:(e:Error)=>toast.error(e.message)
 });
 const change=<K extends keyof RubiMovementVariant>(key:K,value:RubiMovementVariant[K])=>{setDraft(prev=>prev?{...prev,[key]:value}:prev);setDirty(true);};
 const field=(key:"name"|"creative_hook"|"creative_script"|"page_headline"|"page_body"|"call_to_action"|"media_notes"|"proof_notes",label:string,rows=2)=>
  <label className="block space-y-1 text-sm font-semibold"><span>{label}</span><textarea className="w-full rounded-xl border bg-background p-3 text-sm" rows={rows} value={draft?.[key]??""} onChange={event=>change(key,event.target.value)}/></label>;
 const checklist=draft?rubiVariantChecklist(draft):null;
 const experiment=assessRubiExperimentReadiness(query.data??[],movementStatus);
 const text=draft?[`Movimento: ${movementName}`,`Variante: ${draft.name}`,`Formato: ${draft.format}`,`Gancho: ${draft.creative_hook}`,`Roteiro: ${draft.creative_script}`,`Página: ${draft.page_headline}`,draft.page_body,`CTA: ${draft.call_to_action}`,`Mídias e direitos: ${draft.media_notes}`,`Evidências: ${draft.proof_notes}`].join("\n\n"):"";
 return <section className="space-y-4 rounded-xl border border-primary/30 p-4" aria-label="Variantes de criativo e página">
  <div><h4 className="text-lg font-bold">Criativos e páginas · {movementName}</h4><p className="text-xs text-muted-foreground">Variantes privadas e independentes. Nenhuma publicação, anúncio, checkout ou cobrança é disparada.</p></div>
  <Button variant="outline" type="button" onClick={()=>{if(dirty&&!window.confirm("Descartar alterações?"))return;setDraft(emptyRubiMovementVariant(movementId));setDirty(false);}}>Nova variante</Button>
  {query.isLoading&&<p role="status">Carregando variantes...</p>}
  {query.isError&&<p role="alert" className="text-destructive">Falha ao carregar variantes. Confirme a migração.</p>}
  <div className="grid gap-2 sm:grid-cols-2">{query.data?.map(v=><button type="button" key={v.id} className="rounded-lg border p-3 text-left hover:border-primary" onClick={()=>{if(dirty&&!window.confirm("Descartar alterações?"))return;setDraft({...v});setDirty(false);}}>
   <span className="block font-semibold">{v.name}</span><span className="text-xs text-muted-foreground">{v.format} · {v.status==="review"?"Pronta para revisão":"Rascunho"} · revisão {v.revision}</span>
  </button>)}</div>
  {query.data?.length===0&&<p className="text-xs text-muted-foreground">Nenhuma variante cadastrada.</p>}
  {query.data&&<aside className="space-y-2 rounded-xl border bg-muted/20 p-3" aria-label="Preparação para experimento A/B">
   <h5 className="font-bold text-sm">Preparação editorial para experimento A/B</h5>
   <p className="text-xs text-muted-foreground">{experiment.eligible?"Par de variantes com pré-requisitos editoriais básicos; ainda falta definir alocação controlada, evento de sucesso e amostra.":experiment.reasons.join(" · ")}</p>
   <p className="text-xs text-muted-foreground">Este diagnóstico não executa testes nem declara vencedor. Nenhum tráfego ou orçamento é distribuído automaticamente.</p>
  </aside>}
  {draft&&<div className="space-y-3 rounded-xl border p-4">
   {field("name","Nome da variante")}
   <div className="grid gap-2 sm:grid-cols-2">
    <label className="space-y-1 text-sm font-semibold">Formato<select className="w-full rounded-lg border bg-background p-2" value={draft.format} onChange={e=>change("format",e.target.value as RubiMovementVariant["format"])}>
     <option value="short_video">Vídeo curto</option><option value="story">Story</option><option value="carousel">Carrossel</option><option value="post">Post</option>
    </select></label>
    <label className="space-y-1 text-sm font-semibold">Revisão<select className="w-full rounded-lg border bg-background p-2" value={draft.status} onChange={e=>change("status",e.target.value as RubiMovementVariant["status"])}>
     <option value="draft">Rascunho</option><option value="review" disabled={movementStatus!=="review"||checklist?.missing.length!==0}>Enviar para revisão humana</option>
    </select></label>
   </div>
   {field("creative_hook","Gancho do primeiro contato")}
   {field("creative_script","Roteiro criativo",5)}
   {field("page_headline","Título da página")}
   {field("page_body","Texto da página",5)}
   {field("call_to_action","Chamada para ação")}
   {field("media_notes","Mídias e referência dos arquivos")}
   {field("proof_notes","Evidências das afirmações")}
   <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.media_rights_confirmed} onChange={e=>change("media_rights_confirmed",e.target.checked)}/> Confirmo que possuo autorização para usar as mídias</label>
   <div className="rounded-xl bg-muted/40 p-3 text-sm"><strong>Checklist {checklist?.complete}/{checklist?.total}</strong><p className="text-xs text-muted-foreground">{checklist?.missing.length?checklist.missing.join(" · "):"Campos preenchidos; aprovação da mensagem ainda exige revisão humana."}</p></div>
   <div className="space-y-2 rounded-xl border bg-background p-4" aria-label="Pré-visualização editorial">
    <p className="text-xs font-black uppercase tracking-widest text-primary">Prévia privada · {draft.format}</p>
    <p className="text-lg font-black">{draft.creative_hook||"Gancho da peça"}</p>
    <p className="whitespace-pre-line text-sm">{draft.creative_script||"Roteiro do material"}</p>
    <hr/>
    <h5 className="text-xl font-bold">{draft.page_headline||"Título da página"}</h5>
    <p className="whitespace-pre-line text-sm">{draft.page_body||"Texto de apoio e benefícios"}</p>
    <span className="inline-flex rounded-lg border px-3 py-2 text-sm font-semibold">{draft.call_to_action||"CTA em revisão"} (prévia)</span>
   </div>
   <div className="flex flex-wrap gap-2">
    <Button disabled={mutation.isPending||!draft.name.trim()||(!dirty&&!!draft.id)} onClick={()=>mutation.mutate()}>{mutation.isPending?"Salvando...":"Salvar variante"}</Button>
    <Button variant="outline" onClick={()=>{void navigator.clipboard.writeText(text).then(()=>toast.success("Material copiado."),()=>toast.error("Não foi possível copiar."));}}>Copiar material</Button>
    {draft.id&&<Button variant="outline" disabled={deletion.isPending} onClick={()=>{if(window.confirm("Excluir esta variante privada?"))deletion.mutate();}}>Excluir</Button>}
    <Button variant="outline" onClick={()=>{if(dirty&&!window.confirm("Descartar alterações?"))return;setDraft(null);setDirty(false);}}>Fechar</Button>
   </div>
   {draft.id&&draft.format==="short_video"&&draft.status==="review"&&!dirty&&<RubiVariantVideoLinksAdmin variantId={draft.id}/>}
   {draft.id&&<RubiMovementDistributionAdmin key={draft.id} variantId={draft.id} variantName={draft.name} variantStatus={draft.status} productId={productId}/>}
  </div>}
 </section>;
}

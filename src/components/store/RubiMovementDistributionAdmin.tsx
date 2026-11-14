import {useState} from "react";
import {RubiAiPaidFunnelPlanner} from "./RubiAiPaidFunnelPlanner";
import {RubiMasterCampaignApprovalAdmin} from "./RubiMasterCampaignApprovalAdmin";
import {useQuery,useMutation,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {RUBI_ORGANIC_CHANNELS,movementCampaign,movementCampaignPath,type RubiDistributionPlan} from "@/lib/rubi-movement-distribution";
import {listRubiDistributionAdmin,saveRubiDistributionAdmin} from "@/lib/rubi-movement-distribution.functions";
import {setRubiMovementPagePublishedAdmin} from "@/lib/rubi-movement-publishing.functions";

const blank=(variantId:string,variantName:string):RubiDistributionPlan=>({
 variant_id:variantId,channel:"instagram",campaign:movementCampaign(variantName,variantId),
 status:"planned",notes:"",published_reference:""
});
export function RubiMovementDistributionAdmin({variantId,variantName,variantStatus,productId}:{variantId:string;variantName:string;variantStatus:"draft"|"review";productId:string}){
 const [draft,setDraft]=useState<RubiDistributionPlan|null>(null);
 const [dirty,setDirty]=useState(false);
 const [publishing,setPublishing]=useState(false);
 const list=useServerFn(listRubiDistributionAdmin);
 const save=useServerFn(saveRubiDistributionAdmin);
 const setPublished=useServerFn(setRubiMovementPagePublishedAdmin);
 const qc=useQueryClient();
 const query=useQuery({queryKey:["rubi-distribution",variantId],queryFn:()=>list({data:{variantId}}),retry:false});
 const change=<K extends keyof RubiDistributionPlan>(key:K,value:RubiDistributionPlan[K])=>{setDraft(p=>p?{...p,[key]:value}:p);setDirty(true);};
 const mutation=useMutation({
  mutationFn:async()=>{if(!draft)throw new Error("Selecione um plano.");return save({data:draft});},
  onSuccess:()=>{toast.success("Plano de divulgação salvo sem publicar automaticamente.");setDraft(null);setDirty(false);void qc.invalidateQueries({queryKey:["rubi-distribution",variantId]});},
  onError:(error:Error)=>toast.error(error.message)
 });
 const path=draft?movementCampaignPath(productId,draft.channel,draft.campaign):"";
 const changePagePublication=async(publish:boolean)=>{
  if(!draft?.id||dirty||publishing)return;
  if(publish&&!window.confirm("Confirmo revisão das afirmações, direitos das mídias e condições reais do produto. Publicar esta página?"))return;
  setPublishing(true);
  try{
   if(!draft.revision)throw new Error("Versão do plano ausente. Recarregue.");
   await setPublished({data:{planId:draft.id,publish,confirmedEvidence:publish,expectedRevision:draft.revision}});
   toast.success(publish?"Página do movimento publicada.":"Página retirada do público.");
   setDraft(null);setDirty(false);
   await qc.invalidateQueries({queryKey:["rubi-distribution",variantId]});
  }catch(e){toast.error(e instanceof Error?e.message:"Falha na publicação.");}
  finally{setPublishing(false);}
 };
 const open=(p:RubiDistributionPlan)=>{if(dirty&&!window.confirm("Descartar alterações não salvas?"))return;setDraft({...p});setDirty(false);};
 return <section className="space-y-3 rounded-xl border border-primary/20 p-4" aria-label="Distribuição do criativo por canal">
  <h5 className="font-bold">Movimentação e links rastreáveis · {variantName}</h5>
  <p className="text-xs text-muted-foreground">Planeje a publicação manual por canal e gere UTMs. O domínio do link será o do aplicativo que estiver aberto; configure seu domínio anual separadamente. CTR só poderá ser calculado se houver impressões reais de origem confiável.</p>
  <Button type="button" variant="outline" onClick={()=>{if(dirty&&!window.confirm("Descartar alterações?"))return;setDraft(blank(variantId,variantName));setDirty(false);}}>Planejar novo canal</Button>
  {query.isLoading&&<p role="status">Carregando plano...</p>}
  {query.isError&&<p role="alert" className="text-destructive">Não foi possível carregar. Confirme banco e permissões.</p>}
  <div className="grid gap-2 sm:grid-cols-2">{query.data?.map(p=><button type="button" key={p.id} className="rounded-xl border p-3 text-left hover:border-primary" onClick={()=>open(p)}>
   <strong className="block text-sm">{RUBI_ORGANIC_CHANNELS.find(c=>c.id===p.channel)?.label||p.channel}</strong>
   <span className="text-xs text-muted-foreground">{p.status==="planned"?"Planejado":"Post informado manualmente"} · {p.campaign} · {p.page_published_at?"Página pública":"Página privada"}</span>
  </button>)}</div>
  {draft&&<div className="space-y-3 rounded-lg border p-3">
   <label className="block space-y-1 text-sm font-semibold">Canal<select value={draft.channel} className="w-full rounded-lg border bg-background p-2" disabled={!!draft.id} onChange={e=>change("channel",e.target.value as RubiDistributionPlan["channel"])}>
    {RUBI_ORGANIC_CHANNELS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
   </select></label>
   <label className="block space-y-1 text-sm font-semibold">Identificador da campanha<input className="w-full rounded-lg border bg-background p-2" value={draft.campaign} maxLength={60} onChange={e=>change("campaign",e.target.value)}/></label>
   <p className="text-xs text-muted-foreground">Link de marketing, sem código de parceiro e sem ligação direta com uma cobrança. Para parceiros use exclusivamente links atribuíveis homologados.</p>
   <div className="rounded-lg bg-muted/40 p-3 text-sm break-all">{path}</div>
   <label className="block space-y-1 text-sm font-semibold">Orientações de publicação<textarea className="w-full rounded-lg border bg-background p-2" rows={3} maxLength={1500} value={draft.notes} onChange={e=>change("notes",e.target.value)} placeholder="Formato, mensagem, público, CTA e revisão manual"/></label>
   <label className="block space-y-1 text-sm font-semibold">Estado<select className="w-full rounded-lg border bg-background p-2" value={draft.status} onChange={e=>change("status",e.target.value as RubiDistributionPlan["status"])}>
     <option value="planned">Planejado</option><option value="manually_published" disabled={variantStatus!=="review"}>Publicado por mim (declaração)</option>
   </select></label>
   {draft.status==="manually_published"&&<label className="block space-y-1 text-sm font-semibold">Referência do post publicado<input className="w-full rounded-lg border bg-background p-2" maxLength={500} value={draft.published_reference} onChange={e=>change("published_reference",e.target.value)} placeholder="URL ou identificação do post"/></label>}
   {draft.id&&<div className="space-y-2 rounded-lg border p-3">
    <p className="font-semibold text-sm">Página deste movimento: {draft.page_published_at?"Publicada":"Não publicada"}</p>
    <p className="text-xs text-muted-foreground">Aprovação separada do post na rede. O produto precisa estar ativo e com checkout oficial validado. Alterar o plano, movimento ou criativo exige nova aprovação.</p>
    <Button type="button" variant="outline" disabled={dirty||publishing||(!draft.page_published_at&&variantStatus!=="review")}
      onClick={()=>void changePagePublication(!draft.page_published_at)}>
      {draft.page_published_at?"Despublicar página":"Aprovar e publicar página"}
    </Button>
   </div>}
   <RubiAiPaidFunnelPlanner productId={productId} variantName={variantName} campaign={draft.campaign} />
   <RubiMasterCampaignApprovalAdmin productId={productId} campaign={draft.campaign} />
   <div className="flex flex-wrap gap-2">
    <Button disabled={mutation.isPending||(!dirty&&!!draft.id)||!draft.campaign||draft.status==="manually_published"&&(variantStatus!=="review"||draft.published_reference.trim().length<8)} onClick={()=>mutation.mutate()}>{mutation.isPending?"Salvando...":"Salvar plano"}</Button>
    <Button variant="outline" onClick={()=>{const url=window.location.origin+path;void navigator.clipboard.writeText(url).then(()=>toast.success("Link copiado."),()=>toast.error("Não foi possível copiar."));}}>Copiar link da RUBI</Button>
    <Button variant="outline" onClick={()=>{if(dirty&&!window.confirm("Descartar alterações?"))return;setDraft(null);setDirty(false);}}>Fechar</Button>
   </div>
  </div>}
 </section>;
}

import {useState} from "react";
import {useQuery,useMutation,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {emptyRubiProductStory,canApproveRubiProductStory,type RubiProductStory} from "@/lib/rubi-product-stories";
import {listRubiProductStoriesAdmin,saveRubiProductStoryAdmin,setRubiProductStoryApprovalAdmin} from "@/lib/rubi-product-stories.functions";
export function RubiProductStoriesAdmin({products}:{products:Array<{id:string;title:string}>}){
 const [productId,setProductId]=useState("");
 const [draft,setDraft]=useState<RubiProductStory|null>(null);
 const [dirty,setDirty]=useState(false);
 const [publishing,setPublishing]=useState(false);
 const load=useServerFn(listRubiProductStoriesAdmin);
 const save=useServerFn(saveRubiProductStoryAdmin);
 const approve=useServerFn(setRubiProductStoryApprovalAdmin);
 const client=useQueryClient();
 const query=useQuery({queryKey:["rubi-product-stories-admin",productId],enabled:!!productId,retry:false,queryFn:()=>load({data:{productId}})});
 const change=<K extends keyof RubiProductStory>(key:K,value:RubiProductStory[K])=>{setDraft(p=>p?{...p,[key]:value}:p);setDirty(true);};
 const mutation=useMutation({
  mutationFn:async()=>{if(!draft)throw new Error("Selecione um Story.");const {id,revision,status,...rest}=draft;return save({data:{...rest,...(id?{id}:{}),...(revision?{revision}:{})}});},
  onSuccess:()=>{toast.success("Story salvo como rascunho privado.");setDraft(null);setDirty(false);void client.invalidateQueries({queryKey:["rubi-product-stories-admin",productId]});},
  onError:(error:Error)=>toast.error(error.message),
 });
 const setApproval=async(value:boolean)=>{
  if(!draft?.id||!draft.revision||dirty||publishing)return;
  if(value&&!window.confirm("Confirmo direitos da mídia, veracidade do vídeo e autorização do fornecedor. Publicar este Story?"))return;
  setPublishing(true);
  try{
   await approve({data:{id:draft.id,productId:draft.product_id,revision:draft.revision,approved:value,confirmedEvidence:value}});
   toast.success(value?"Story aprovado para exibição.":"Story retirado da página pública.");
   setDraft(null);setDirty(false);
   await client.invalidateQueries({queryKey:["rubi-product-stories-admin",productId]});
  }catch(e){toast.error(e instanceof Error?e.message:"Não foi possível alterar a aprovação.");}
  finally{setPublishing(false);}
 };
 const field=(key:"title"|"description"|"video_url"|"poster_url"|"evidence_notes",label:string,rows=2)=>
 <label className="block space-y-1 text-sm font-semibold">{label}<textarea rows={rows} className="w-full rounded-xl border bg-background p-3 text-sm" value={draft?.[key]??""} onChange={e=>change(key,e.target.value)}/></label>;
 return <section aria-label="RUBI Stories por produto" className="space-y-5 rounded-3xl border border-primary/30 bg-card p-6">
  <div><p className="text-xs font-black uppercase tracking-widest text-primary">RUBI · Marca Própria</p><h2 className="mt-1 text-2xl font-black">Stories e vídeos do catálogo</h2><p className="mt-2 text-sm text-muted-foreground">Associe um vídeo real a cada produto, conte sua história e aprove ou retire sua exibição. Use apenas URL HTTPS direta para um arquivo MP4/WebM com direitos autorizados; links externos do TikTok não são convertidos em vídeos hospedados automaticamente.</p></div>
  <label className="block space-y-1 text-sm font-semibold">Produto<select className="w-full rounded-xl border bg-background p-2" value={productId} onChange={e=>{if(dirty&&!window.confirm("Descartar alterações?"))return;setProductId(e.target.value);setDraft(null);setDirty(false);}}>
   <option value="">Selecione um produto</option>{products.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
  </select></label>
  {productId&&<Button variant="outline" type="button" onClick={()=>{if(dirty&&!window.confirm("Descartar alterações?"))return;setDraft(emptyRubiProductStory(productId));setDirty(false);}}>Criar Story para este produto</Button>}
  {query.isLoading&&<p role="status">Carregando Stories...</p>}
  {query.isError&&<p role="alert" className="text-destructive">Não foi possível carregar Stories. Confira o Supabase.</p>}
  <div className="grid gap-2 sm:grid-cols-2">{query.data?.map(story=><button key={story.id} type="button" className="rounded-xl border p-3 text-left transition hover:border-primary" onClick={()=>{if(dirty&&!window.confirm("Descartar alterações?"))return;setDraft({...story});setDirty(false);}}>
   <strong className="block">{story.title}</strong><span className="text-xs text-muted-foreground">{story.status==="approved"?"Aprovado e visível":"Rascunho privado"} · versão {story.revision}</span>
  </button>)}</div>
  {draft&&<div className="space-y-4 rounded-xl border p-4">
   {field("title","Título da história")}
   {field("description","Narrativa e benefício verificável",4)}
   {field("video_url","URL HTTPS direta do vídeo .mp4 ou .webm")}
   {field("poster_url","Capa HTTPS .png / .jpg / .webp (opcional)")}
   {field("evidence_notes","Evidências, fornecedor e licença do conteúdo",3)}
   <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={draft.rights_confirmed} onChange={e=>change("rights_confirmed",e.target.checked)}/> Possuo autorização para usar, divulgar e incorporar este vídeo na loja.</label>
   <label className="block space-y-1 text-sm font-semibold">Ordem na página<input type="number" min={0} max={1000} className="w-full rounded-lg border bg-background p-2" value={draft.position} onChange={e=>change("position",Math.max(0,Math.min(1000,Number(e.target.value)||0)))}/></label>
   <p className="text-xs text-muted-foreground">Aprovação editorial: {canApproveRubiProductStory(draft)?"Campos e confirmação presentes; ainda exige revisão humana.":"Complete os dados e a licença para solicitar publicação."}</p>
   {draft.video_url&&<video key={draft.video_url} controls playsInline preload="none" className="max-h-80 w-full rounded-xl bg-black" src={draft.video_url} poster={draft.poster_url||undefined}>Seu navegador não suporta vídeo.</video>}
   <div className="flex flex-wrap gap-2">
    <Button disabled={mutation.isPending||(!dirty&&!!draft.id)} onClick={()=>mutation.mutate()}>{mutation.isPending?"Salvando...":"Salvar rascunho"}</Button>
    {draft.id&&<Button variant="outline" disabled={dirty||publishing||(!draft.status||draft.status==="draft")&&!canApproveRubiProductStory(draft)} onClick={()=>void setApproval(draft.status!=="approved")}>{draft.status==="approved"?"Retirar Story do público":"Aprovar e publicar Story"}</Button>}
    <Button variant="outline" onClick={()=>{if(dirty&&!window.confirm("Descartar alterações?"))return;setDraft(null);setDirty(false);}}>Fechar editor</Button>
   </div>
   <p className="text-xs text-muted-foreground">Qualquer edição salva volta o Story para rascunho. Pagamentos e preços de fornecedor nunca são alterados.</p>
  </div>}
 </section>;
}

import {useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {emptyRubiStorefrontSection,type RubiStorefrontSection} from "@/lib/rubi-storefront-sections";
import {listRubiStorefrontSectionsAdmin,saveRubiStorefrontSectionAdmin} from "@/lib/rubi-storefront-sections.functions";
export function RubiStorefrontSectionsAdmin({products}:{products:Array<{id:string;title:string}>}){
 const [draft,setDraft]=useState<RubiStorefrontSection|null>(null);
 const [dirty,setDirty]=useState(false);
 const list=useServerFn(listRubiStorefrontSectionsAdmin);
 const save=useServerFn(saveRubiStorefrontSectionAdmin);
 const qc=useQueryClient();
 const query=useQuery({queryKey:["rubi-storefront-sections-admin"],queryFn:()=>list(),retry:false});
 const mutation=useMutation({
  mutationFn:async()=>{if(!draft)throw new Error("Selecione uma seção.");return save({data:draft});},
  onSuccess:()=>{toast.success("Seção da vitrine salva.");setDraft(null);setDirty(false);void qc.invalidateQueries({queryKey:["rubi-storefront-sections-admin"]});void qc.invalidateQueries({queryKey:["rubi-storefront-sections-public"]});},
  onError:(error:Error)=>toast.error(error.message),
 });
 const update=<K extends keyof RubiStorefrontSection>(key:K,value:RubiStorefrontSection[K])=>{setDraft(d=>d?{...d,[key]:value}:d);setDirty(true);};
 const open=(data:RubiStorefrontSection)=>{if(dirty&&!window.confirm("Descartar alterações?"))return;setDraft({...data});setDirty(false);};
 const dateInput=(value:string|null)=>value?new Date(value).toISOString().slice(0,16):"";
 const updateDate=(key:"starts_at"|"ends_at",value:string)=>update(key,value?new Date(value).toISOString():null);
 return <section aria-label="Editor da vitrine principal" className="space-y-4 rounded-3xl border border-primary/30 bg-card p-6">
  <div><p className="text-xs font-black uppercase tracking-widest text-primary">RUBI STORE · SHADOW MASTER</p><h2 className="mt-2 text-2xl font-black">Coleções e destaques da vitrine</h2>
   <p className="mt-2 text-sm text-muted-foreground">Monte seções com produtos do catálogo, organize a posição e programe datas. Publicar exige checkout oficial validado para todos os produtos. Nenhum preço ou cobrança é alterado.</p></div>
  <Button variant="outline" onClick={()=>open(emptyRubiStorefrontSection())}>Criar seção</Button>
  {query.isLoading&&<p role="status">Carregando seções...</p>}
  {query.isError&&<p role="alert" className="text-destructive">Não foi possível carregar as seções.</p>}
  <div className="grid gap-2 sm:grid-cols-2">{query.data?.map(s=><button key={s.id} type="button" onClick={()=>open(s)} className="rounded-xl border p-4 text-left hover:border-primary">
   <strong className="block">{s.title}</strong><span className="text-xs text-muted-foreground">{s.kind==="hero"?"Destaque":"Coleção"} · {s.status==="published"?"Publicada":"Rascunho"} · {s.product_ids.length} produtos</span>
  </button>)}</div>
  {draft&&<div className="space-y-4 rounded-xl border p-4">
   <label className="block space-y-1 text-sm">Título<input className="w-full rounded-lg border bg-background p-2" maxLength={100} value={draft.title} onChange={e=>update("title",e.target.value)}/></label>
   <label className="block space-y-1 text-sm">Descrição<textarea className="w-full rounded-lg border bg-background p-2" maxLength={280} rows={3} value={draft.subtitle} onChange={e=>update("subtitle",e.target.value)}/></label>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="block space-y-1 text-sm">Formato<select className="w-full rounded-lg border bg-background p-2" value={draft.kind} onChange={e=>update("kind",e.target.value as RubiStorefrontSection["kind"])}><option value="hero">Destaque</option><option value="collection">Coleção</option></select></label>
    <label className="block space-y-1 text-sm">Status<select className="w-full rounded-lg border bg-background p-2" value={draft.status} onChange={e=>update("status",e.target.value as RubiStorefrontSection["status"])}><option value="draft">Rascunho privado</option><option value="published">Publicar após validação</option></select></label>
    <label className="block space-y-1 text-sm">Início (opcional)<input className="w-full rounded-lg border bg-background p-2" type="datetime-local" value={dateInput(draft.starts_at)} onChange={e=>updateDate("starts_at",e.target.value)}/></label>
    <label className="block space-y-1 text-sm">Fim (opcional)<input className="w-full rounded-lg border bg-background p-2" type="datetime-local" value={dateInput(draft.ends_at)} onChange={e=>updateDate("ends_at",e.target.value)}/></label>
    <label className="block space-y-1 text-sm">Ordem na vitrine<input type="number" min={0} max={1000} className="w-full rounded-lg border bg-background p-2" value={draft.position} onChange={e=>update("position",Math.max(0,Math.min(1000,Number(e.target.value)||0)))}/></label>
   </div>
   <fieldset className="space-y-2"><legend className="text-sm font-semibold">Produtos da seção ({draft.product_ids.length}/12)</legend>
    <div className="grid max-h-56 gap-2 overflow-auto rounded-xl border p-3 sm:grid-cols-2">{products.map(p=><label key={p.id} className="flex items-start gap-2 text-xs"><input type="checkbox" checked={draft.product_ids.includes(p.id)} disabled={!draft.product_ids.includes(p.id)&&draft.product_ids.length>=12} onChange={e=>update("product_ids",e.target.checked?[...draft.product_ids,p.id]:draft.product_ids.filter(id=>id!==p.id))}/><span>{p.title}</span></label>)}</div>
   </fieldset>
   <p className="text-xs text-muted-foreground">Prévia editorial: <strong>{draft.title||"Título da coleção"}</strong> — {draft.subtitle||"Descrição"} ({draft.product_ids.length} itens). A publicação pode iniciar/encerrar no período escolhido.</p>
   <div className="flex flex-wrap gap-2"><Button disabled={mutation.isPending||(!dirty&&!!draft.id)||draft.title.trim().length<4||!draft.product_ids.length} onClick={()=>mutation.mutate()}>{mutation.isPending?"Salvando...":"Salvar seção"}</Button>
    <Button variant="outline" onClick={()=>{if(dirty&&!window.confirm("Descartar alterações?"))return;setDraft(null);setDirty(false);}}>Fechar</Button></div>
  </div>}
 </section>;
}

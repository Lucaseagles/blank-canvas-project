import {useState} from "react";
import {useQuery,useMutation,useQueryClient} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {listRubiComplementaryAdmin,saveRubiComplementaryAdmin} from "@/lib/rubi-complementary-offers.functions";
import {RUBI_COMPLEMENTARY_LABELS,canSuggestComplementary,type RubiComplementaryKind} from "@/lib/rubi-complementary-offers";
type Product={id:string;title:string;retail_price:number;active:boolean;checkout_url:string|null;checkout_verified:boolean};
type Item={id:string;revision:number;primary_product_id:string;suggested_product_id:string;kind:RubiComplementaryKind;headline:string;explanation:string;position:number;active:boolean};
export function RubiComplementaryOffersAdmin({products}:{products:Product[]}) {
 const [primary,setPrimary]=useState("");
 const [suggested,setSuggested]=useState("");
 const [kind,setKind]=useState<RubiComplementaryKind>("cross_sell");
 const [headline,setHeadline]=useState("");
 const [explanation,setExplanation]=useState("");
 const [editingId,setEditingId]=useState<string|undefined>();
 const [editingRevision,setEditingRevision]=useState<number|undefined>();
 const [active,setActive]=useState(false);
 const list=useServerFn(listRubiComplementaryAdmin);
 const save=useServerFn(saveRubiComplementaryAdmin);
 const qc=useQueryClient();
 const query=useQuery({queryKey:["rubi-complementary-admin",primary],queryFn:()=>list({data:{productId:primary}}),enabled:!!primary,retry:false});
 const main=products.find(x=>x.id===primary);
 const candidates=products.filter(x=>x.id!==primary && (kind!=="downsell"||Number(x.retail_price)<Number(main?.retail_price??0)));
 const reset=()=>{setSuggested("");setKind("cross_sell");setHeadline("");setExplanation("");setEditingId(undefined);setEditingRevision(undefined);setActive(false);};
 const mutation=useMutation({
  mutationFn:()=>save({data:{...(editingId?{id:editingId,revision:editingRevision}:{}),primary_product_id:primary,suggested_product_id:suggested,kind,headline,explanation,position:0,active}}),
  onSuccess:()=>{toast.success("Sugestão comercial salva.");reset();void qc.invalidateQueries({queryKey:["rubi-complementary-admin",primary]});},
  onError:(e:Error)=>toast.error(e.message),
 });
 const edit=(item:Item)=>{setEditingId(item.id);setEditingRevision(item.revision);setSuggested(item.suggested_product_id);setKind(item.kind);setHeadline(item.headline);setExplanation(item.explanation);setActive(item.active);};
 return <section aria-label="Ofertas complementares" className="space-y-4 rounded-3xl border border-primary/30 bg-card p-6">
  <div><p className="text-xs font-black uppercase tracking-widest text-primary">RUBI · Engenharia de ticket médio</p>
   <h2 className="text-2xl font-black">Produtos complementares por oferta</h2>
   <p className="text-sm text-muted-foreground">Organize bumps, upsells, cross-sells e downsells pelo painel. Sugestões públicas levam a páginas de produtos independentes; order bumps e upsells reais devem ser configurados e comprovados no checkout oficial da Kairos.</p>
  </div>
  <label className="block text-sm font-semibold space-y-1">Produto principal
   <select className="w-full rounded-lg border bg-background p-2" value={primary} onChange={e=>{setPrimary(e.target.value);reset();}}>
    <option value="">Escolha o produto principal</option>{products.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
   </select>
  </label>
  {primary&&<div className="space-y-4">
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="space-y-1 text-sm font-semibold">Tipo de estratégia
     <select className="w-full rounded-lg border bg-background p-2" value={kind} onChange={e=>{setKind(e.target.value as RubiComplementaryKind);setSuggested("");}}>
      {(Object.keys(RUBI_COMPLEMENTARY_LABELS) as RubiComplementaryKind[]).map(x=><option key={x} value={x}>{RUBI_COMPLEMENTARY_LABELS[x]}</option>)}
     </select>
    </label>
    <label className="space-y-1 text-sm font-semibold">Produto complementar
     <select className="w-full rounded-lg border bg-background p-2" value={suggested} onChange={e=>setSuggested(e.target.value)}>
      <option value="">Escolha um complemento real do catálogo</option>{candidates.map(p=><option key={p.id} value={p.id}>{p.title} — R$ {Number(p.retail_price).toFixed(2)}</option>)}
     </select>
    </label>
   </div>
   <label className="block space-y-1 text-sm font-semibold">Título da recomendação
    <input className="w-full rounded-lg border bg-background p-2" maxLength={180} value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="Por exemplo: complete sua instalação com um acessório compatível"/>
   </label>
   <label className="block space-y-1 text-sm font-semibold">Por que complementa a compra?
    <textarea className="w-full rounded-lg border bg-background p-2" rows={3} maxLength={700} value={explanation} onChange={e=>setExplanation(e.target.value)} placeholder="Explique a compatibilidade e utilidade, sem inventar necessidade ou benefício."/>
   </label>
   <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/> Ativar recomendação elegível (não adiciona ao checkout nem cobra ninguém)</label>
   <div className="flex flex-wrap gap-2">
    <Button disabled={mutation.isPending||!main||!suggested||!canSuggestComplementary(primary,suggested,kind,Number(main.retail_price),Number(products.find(p=>p.id===suggested)?.retail_price))||headline.trim().length<8} onClick={()=>mutation.mutate()}>{mutation.isPending?"Salvando...":"Salvar estratégia"}</Button>
    {editingId&&<Button variant="outline" onClick={reset}>Cancelar edição</Button>}
   </div>
   {query.isLoading&&<p>Carregando estratégias...</p>}
   {query.isError&&<p role="alert" className="text-destructive">Falha ao carregar; confirme migração e permissões.</p>}
   <div className="space-y-2">
    <h3 className="font-semibold">Estratégias cadastradas</h3>
    {(query.data as Item[]|undefined)?.map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
     <div className="space-y-1"><strong className="text-sm">{item.headline}</strong><p className="text-xs text-muted-foreground">{RUBI_COMPLEMENTARY_LABELS[item.kind]} · {products.find(p=>p.id===item.suggested_product_id)?.title??"Produto"} · {item.active?"Ativa":"Rascunho"}</p></div>
     <Button size="sm" variant="outline" onClick={()=>edit(item)}>Editar</Button>
    </div>)}
    {query.data?.length===0&&<p className="text-sm text-muted-foreground">Nenhuma sugestão cadastrada.</p>}
   </div>
  </div>}
 </section>;
}

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getRubiOfferPlaybookAdmin, saveRubiOfferPlaybookAdmin } from "@/lib/rubi-offer-playbook.functions";
import { emptyRubiOfferPlaybook, rubiOfferReadiness, RUBI_OFFER_CHANNELS, type RubiOfferPlaybook } from "@/lib/rubi-offer-playbook";

type Product = {id:string; title:string; description:string|null; active:boolean; checkout_verified:boolean; checkout_url:string|null};

export function RubiOfferEngineAdmin({products}:{products:Product[]}) {
  const [productId,setProductId] = useState("");
  const [draft,setDraft] = useState<RubiOfferPlaybook|null>(null);
  const [dirty,setDirty] = useState(false);
  const get = useServerFn(getRubiOfferPlaybookAdmin);
  const save = useServerFn(saveRubiOfferPlaybookAdmin);
  const client = useQueryClient();
  const selected = products.find(p=>p.id===productId);
  const data = useQuery({
    queryKey:["rubi-offer-playbook",productId],
    queryFn:()=>get({data:{productId}}),
    enabled:!!productId, retry:false,
  });
  useEffect(()=>{
    if(!selected || data.isLoading || data.isError || !data.isFetched) return;
    setDraft(data.data ? data.data as RubiOfferPlaybook : emptyRubiOfferPlaybook(selected.id,selected.title,selected.description));
    setDirty(false);
  },[data.data,data.isLoading,data.isError,data.isFetched,selected?.id]);
  const mutation=useMutation({
    mutationFn:async()=>{if(!draft) throw new Error("Selecione um produto.");return save({data:draft});},
    onSuccess:()=>{setDirty(false);void client.invalidateQueries({queryKey:["rubi-offer-playbook",productId]});toast.success("Plano editorial privado salvo.");},
    onError:(error:Error)=>toast.error(error.message),
  });
  const change = <K extends keyof RubiOfferPlaybook>(key:K,value:RubiOfferPlaybook[K])=>{
    setDraft(previous=>previous?{...previous,[key]:value}:previous);setDirty(true);
  };
  const field=(key:"promise"|"verified_benefits"|"proof_notes"|"creative_hook"|"creative_script"|"page_headline"|"page_body"|"objections"|"movement_plan",label:string,placeholder:string,rows=3)=>
    <label className="block space-y-2 text-sm font-medium"><span>{label}</span>
      <textarea rows={rows} className="w-full rounded-xl border bg-background p-3 text-sm" placeholder={placeholder}
        value={draft?.[key]??""} onChange={e=>change(key,e.target.value)} />
    </label>;
  const readiness=draft?rubiOfferReadiness(draft):null;
  const productLink=selected?`/hub-product/${selected.id}`:"";
  const planText = draft&&selected ? [
    `RUBI Offer Engine — ${selected.title}`,`Público: ${draft.audience}`,
    `Proposta: ${draft.promise}`,`Benefícios a confirmar: ${draft.verified_benefits}`,
    `Evidências: ${draft.proof_notes}`,`Criativo: ${draft.creative_hook}\n${draft.creative_script}`,
    `Página: ${draft.page_headline}\n${draft.page_body}`,`Dúvidas: ${draft.objections}`,
    `Movimento: ${draft.movement_plan}`,`Canais: ${draft.channels.join(", ")}`,
    `Link interno do produto: ${productLink}`, "Aprovação de materiais e checkout é manual. Nenhuma mensagem é enviada automaticamente."
  ].join("\n\n"):"";
  return <section aria-label="RUBI Offer Engine" className="space-y-5 rounded-3xl border border-primary/30 bg-card/80 p-6">
    <div><p className="text-xs font-black uppercase tracking-widest text-primary">RUBI 11× · Offer Engine</p>
      <h2 className="mt-1 text-2xl font-black">Central de oferta por produto</h2>
      <p className="text-sm text-muted-foreground">Organize proposta, criativo, página e movimento numa ficha privada. Nada é publicado ou disparado automaticamente; preços e checkout Kairos permanecem intactos.</p>
    </div>
    <label className="block space-y-2 text-sm font-semibold">Produto do catálogo
      <select className="w-full rounded-lg border bg-background p-3" value={productId}
        onChange={e=>{if(dirty&&!window.confirm("Descartar alterações não salvas?"))return;setProductId(e.target.value);setDraft(null);setDirty(false);}}>
        <option value="">Selecione um produto</option>{products.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
      </select>
    </label>
    {data.isLoading && <p role="status">Carregando plano...</p>}
    {data.isError && <p role="alert" className="text-destructive">Não foi possível carregar a ficha. Confirme a migração no Supabase. <Button size="sm" variant="outline" onClick={()=>void data.refetch()}>Repetir</Button></p>}
    {selected&&draft&&!data.isError&&<>
      <div className="rounded-xl border p-3 text-sm">
        <p className="font-semibold">{selected.title}</p>
        <p className="text-muted-foreground">Checkout: {selected.active&&selected.checkout_verified&&selected.checkout_url?"Cadastro indicado como aprovado (verificar no servidor antes de usar)":"Indisponível ou pendente de aprovação"} · <a className="underline" href={productLink} target="_blank" rel="noreferrer">Abrir página RUBI</a></p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold">Público
          <select className="w-full rounded-lg border bg-background p-2" value={draft.audience} onChange={e=>change("audience",e.target.value as RubiOfferPlaybook["audience"])}>
            <option value="consumer">Consumidor</option><option value="merchant">Lojista</option><option value="partner">Parceiro</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-semibold">Etapa
          <select className="w-full rounded-lg border bg-background p-2" value={draft.stage} onChange={e=>change("stage",e.target.value as RubiOfferPlaybook["stage"])}>
            <option value="draft">Rascunho</option><option value="ready_for_review">Pronto para revisão manual</option>
          </select>
        </label>
      </div>
      <div className="space-y-3 rounded-xl border p-4"><h3 className="font-bold">1. Oferta e provas</h3>
        {field("promise","Proposta de valor","Qual problema verdadeiro o produto resolve?")}
        {field("verified_benefits","Benefícios verificáveis","Liste benefícios reais confirmados pelo fornecedor.")}
        {field("proof_notes","Fontes e comprovações","Onde estão as evidências? Não invente depoimentos, descontos nem prazos.")}
      </div>
      <div className="space-y-3 rounded-xl border p-4"><h3 className="font-bold">2. Criativo — primeiro contato</h3>
        {field("creative_hook","Abertura / gancho","Uma pergunta ou benefício real que chama atenção",2)}
        {field("creative_script","Roteiro de vídeo / carrossel","Gancho → demonstração real → benefício → CTA",5)}
      </div>
      <div className="space-y-3 rounded-xl border p-4"><h3 className="font-bold">3. Página — segundo contato</h3>
        {field("page_headline","Título da página","Título claro e verificável",2)}
        {field("page_body","Corpo da oferta","Benefícios, demonstração e condições verdadeiras",5)}
        {field("objections","Objeções e perguntas","Dúvidas reais do cliente e respostas verificadas")}
        <p className="text-xs text-muted-foreground">Por enquanto este conteúdo fica privado: a página pública existente continua inalterada.</p>
      </div>
      <div className="space-y-3 rounded-xl border p-4"><h3 className="font-bold">4. Movimento — contato contínuo</h3>
        <div className="grid gap-2 sm:grid-cols-2">{RUBI_OFFER_CHANNELS.map(c=><label key={c.value} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.channels.includes(c.value)} onChange={e=>change("channels",e.target.checked?[...draft.channels,c.value]:draft.channels.filter(v=>v!==c.value))}/>
          {c.label}</label>)}</div>
        {field("movement_plan","Plano de circulação e revisão","Quando criar material, onde publicar manualmente, como revisar resultados",5)}
        <p className="text-xs text-muted-foreground">Selecionar canal não publica posts nem envia mensagens. Respeite consentimentos e direitos de uso.</p>
      </div>
      <div className="rounded-xl border p-4"><p className="font-semibold">5. Checklist de preparação · {readiness?.score??0}%</p>
        <p className="text-xs text-muted-foreground">Nota editorial automática de preenchimento, não uma taxa de conversão ou garantia de venda.</p>
        {readiness?.missing.length?<p className="mt-2 text-sm">Ainda falta: {readiness.missing.join(", ")}</p>:<p className="mt-2 text-sm">Campos essenciais preenchidos; conteúdo e evidências ainda exigem revisão humana.</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={mutation.isPending||!dirty} onClick={()=>mutation.mutate()}>{mutation.isPending?"Salvando...":"Salvar ficha privada"}</Button>
        <Button type="button" variant="outline" onClick={()=>{void navigator.clipboard.writeText(planText).then(()=>toast.success("Plano copiado."),()=>toast.error("Não foi possível copiar."));}}>Copiar plano para criar materiais</Button>
      </div>
    </>}
  </section>;
}

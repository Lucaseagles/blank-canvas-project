import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { getRubiPublishedOffer } from "@/lib/rubi-offer-playbook.functions";

/** Editorial copy appears only after a separate explicit owner approval. */
export function RubiPublishedOffer({productId}:{productId:string}) {
  const getOffer=useServerFn(getRubiPublishedOffer);
  const query=useQuery({
    queryKey:["rubi-offer-published",productId],
    queryFn:()=>getOffer({data:{productId}}),
    retry:false,
    staleTime:30000,
  });
  if(!query.data) return null;
  const offer=query.data;
  return <section aria-label="Detalhes da oferta RUBI" className="space-y-6 rounded-3xl border border-primary/30 bg-card p-6 md:p-10">
    <div className="space-y-3">
      <p className="text-xs font-black uppercase tracking-widest text-primary">Oferta RUBI · Conteúdo revisado</p>
      <h2 className="text-3xl font-black tracking-tight">{offer.page_headline}</h2>
      <p className="whitespace-pre-line text-base leading-relaxed">{offer.promise}</p>
    </div>
    {offer.verified_benefits && <div className="rounded-xl border p-5">
      <h3 className="text-lg font-bold">Benefícios do produto</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{offer.verified_benefits}</p>
    </div>}
    <div className="space-y-2">
      <h3 className="text-lg font-bold">Saiba mais</h3>
      <p className="whitespace-pre-line leading-relaxed">{offer.page_body}</p>
    </div>
    {offer.objections && <div className="space-y-2">
      <h3 className="text-lg font-bold">Dúvidas frequentes</h3>
      <p className="whitespace-pre-line text-sm leading-relaxed">{offer.objections}</p>
    </div>}
    <Button asChild><a href="#rubi-purchase">Ver preço e disponibilidade</a></Button>
    <p className="text-xs text-muted-foreground">Os valores e as condições finais são conferidos no checkout oficial do fornecedor.</p>
  </section>;
}

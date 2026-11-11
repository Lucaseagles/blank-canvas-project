import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Link} from "@tanstack/react-router";
import {listRubiComplementaryPublic} from "@/lib/rubi-complementary-offers.functions";
export function RubiComplementarySuggestions({productId}:{productId:string}){
 const load=useServerFn(listRubiComplementaryPublic);
 const query=useQuery({queryKey:["rubi-complementary-public",productId],queryFn:()=>load({data:{productId}}),retry:false,staleTime:60000});
 if(!query.data?.length)return null;
 return <section className="space-y-4 rounded-3xl border border-primary/20 bg-card/70 p-6" aria-label="Sugestões complementares">
  <h2 className="text-2xl font-bold">Combine com produtos relacionados</h2>
  <p className="text-sm text-muted-foreground">Estas são sugestões independentes, não itens adicionados ao checkout. Confira a compatibilidade, o preço e as condições de cada produto antes de decidir.</p>
  <div className="grid gap-3 sm:grid-cols-2">{query.data.map(item=><article key={item.id} className="space-y-2 rounded-xl border p-4">
   <p className="text-xs font-semibold text-primary">{item.kind==="downsell"?"Alternativa econômica":"Produto complementar"}</p>
   <h3 className="font-bold">{item.headline}</h3><p className="text-sm">{item.explanation}</p>
   <p className="text-sm font-semibold">{item.title} · {Number(item.retail_price).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</p>
   <Link className="text-sm font-semibold underline" to="/hub-product/$productId" params={{productId:item.product_id}}>Ver produto e condições</Link>
  </article>)}</div>
 </section>;
}

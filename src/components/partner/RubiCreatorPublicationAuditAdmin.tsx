import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {BarChart3,ShieldAlert} from "lucide-react";
import {getRubiCreatorPublicationAuditAdmin} from "@/lib/rubi-creator-publication-audit.functions";
export function RubiCreatorPublicationAuditAdmin(){
 const load=useServerFn(getRubiCreatorPublicationAuditAdmin);
 const query=useQuery({queryKey:["rubi-creator-publication-campaign-audit"],queryFn:()=>load(),retry:false,staleTime:60000});
 return <section aria-label="Auditoria de divulgação e tráfego dos criadores" className="space-y-4 rounded-3xl border border-primary/20 bg-card p-5 sm:p-7">
  <header className="space-y-2">
   <h2 className="flex items-center gap-2 text-xl font-black"><BarChart3 className="h-5 w-5 text-primary"/> Publicações e tráfego de campanhas</h2>
   <p className="text-xs leading-5 text-muted-foreground">Conferência de URLs editoriais revisadas contra registros da distribuição e rótulos das campanhas orgânicas nos últimos 30 dias. Não mede alcance das redes sociais nem vendas por criador.</p>
  </header>
  {query.isLoading&&<p role="status" className="text-sm text-muted-foreground">Conferindo referências de publicação e campanhas...</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível carregar a conferência das campanhas.</p>}
  {query.data&&<div className="space-y-3">
   {query.data.rows.length===0&&<p className="text-sm text-muted-foreground">Nenhuma referência de publicação para conferir.</p>}
   {query.data.limited&&<p role="status" className="text-xs text-amber-700">Consulta limitada. Correspondências quantitativas são omitidas para evitar atribuição incorreta.</p>}
   {query.data.rows.map(row=><article key={row.id} className="space-y-2 rounded-xl border bg-background/60 p-4">
    <div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">{row.channel} · {row.campaign??"Sem campanha vinculada"}</strong>
     <span className="text-xs font-semibold">{row.status==="matched_campaign"?"Campanha correspondente":row.status==="unreviewed"?"Sem revisão":row.status==="ambiguous_campaign"||row.status==="ambiguous_distribution"?"Atribuição ambígua":"Sem correspondência"}</span></div>
    <p className="text-xs leading-5 text-muted-foreground">{row.explanation}</p>
    {row.status==="matched_campaign"&&<div className="grid grid-cols-2 gap-2">
     <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Eventos de visualização da campanha</p><p className="text-xl font-black tabular-nums">{row.viewEvents===null?"Não observado":row.viewEvents.toLocaleString("pt-BR")}</p></div>
     <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Intenções de checkout da campanha</p><p className="text-xl font-black tabular-nums">{row.checkoutIntents===null?"Não observado":row.checkoutIntents.toLocaleString("pt-BR")}</p></div>
    </div>}
   </article>)}
  </div>}
  <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary"/> Uma campanha pode ser divulgada por vários criadores. Sem identificador individual no evento e confirmação do fornecedor, nenhum evento pertence comprovadamente a uma publicação específica e nenhuma comissão pode ser calculada a partir deste relatório.</p>
 </section>;
}

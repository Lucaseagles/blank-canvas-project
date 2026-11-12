import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {BarChart3,ShieldCheck} from "lucide-react";
import {getRubiCreatorTaggedVisitsAdmin} from "@/lib/rubi-creator-tagged-visits.functions";

type TaggedVisitRow={publicationId:string;channel:string;creator:string;team:string;campaignId:string|null;taggedVisitEvents:number;precheckoutViews:number};
export function RubiCreatorTaggedVisitsAdmin(){
 const load=useServerFn(getRubiCreatorTaggedVisitsAdmin);
 const query=useQuery({queryKey:["rubi-creator-tagged-visits-30d"],queryFn:()=>load(),retry:false,staleTime:60000});
 return <section aria-label="Eventos de visita por publicação dos criadores" className="space-y-4 rounded-3xl border border-primary/20 bg-card p-5 sm:p-7">
  <header className="space-y-2">
   <h2 className="flex items-center gap-2 text-xl font-black"><BarChart3 className="h-5 w-5 text-primary"/> Visitas por publicação identificada</h2>
   <p className="text-xs leading-5 text-muted-foreground">Eventos de acesso a links RUBI com identificador de publicação, registrados nos últimos 30 dias. As visitas e os pré-checkouts exibidos são eventos distintos da mesma indicação; não representam pessoas únicas, intenção de pagamento, vendas ou comissões.</p>
  </header>
  {query.isLoading&&<p role="status" className="text-sm text-muted-foreground">Consultando registros de indicação...</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível confirmar as visitas identificadas.</p>}
  {query.data?.limited&&<p role="alert" className="text-sm text-amber-600">Há registros além do limite de identificação. Totais omitidos para evitar comparações incompletas.</p>}
  {query.data&&!query.data.limited&&<div className="space-y-3">
   {query.data.rows.length===0&&<p className="text-sm text-muted-foreground">Nenhuma publicação revisada cadastrada. Nenhuma taxa de visita pode ser calculada.</p>}
   {(query.data.rows as TaggedVisitRow[]).map(row=><article key={row.publicationId} className="rounded-2xl border bg-background/60 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
     <div className="space-y-1">
      <p className="text-sm font-black">{row.creator} · {row.channel}</p>
      <p className="text-xs text-muted-foreground">{row.team} · Campanha {row.campaignId?.slice(0,8)??"não vinculada"}</p>
      <p className="break-all text-[11px] text-muted-foreground">Publicação {row.publicationId}</p>
     </div>
     <div className="flex flex-wrap gap-2">
      <div className="rounded-xl border bg-card p-3 text-right">
       <p className="text-xs text-muted-foreground">Eventos de acesso</p>
       <p className="text-2xl font-black tabular-nums">{row.taggedVisitEvents.toLocaleString("pt-BR")}</p>
      </div>
      <div className="rounded-xl border bg-card p-3 text-right">
       <p className="text-xs text-muted-foreground">Pré-checkouts exibidos</p>
       <p className="text-2xl font-black tabular-nums">{row.precheckoutViews.toLocaleString("pt-BR")}</p>
      </div>
     </div>
    </div>
   </article>)}
   <p className="text-xs text-muted-foreground">Apuração de {query.data.days} dias, consultada em {new Date(query.data.asOf).toLocaleString("pt-BR")}. Sem identificação pessoal do visitante.</p>
  </div>}
  <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary"/> Estes são eventos do link marcado, não a origem real confirmada na rede social. Nenhuma publicação tem comissão, pedido pago ou visualização de vídeo inferida. Para conversão comercial é necessária conciliação oficial do fornecedor.</p>
 </section>;
}

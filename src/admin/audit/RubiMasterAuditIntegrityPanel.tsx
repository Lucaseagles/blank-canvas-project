import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Button} from "@/components/ui/button";
import {getRubiMasterAuditIntegrityAdmin} from "@/lib/rubi-master-audit-integrity.functions";

export function RubiMasterAuditIntegrityPanel(){
 const load=useServerFn(getRubiMasterAuditIntegrityAdmin);
 const query=useQuery({queryKey:["rubi-master-audit-integrity"],
  queryFn:()=>load(),retry:false,staleTime:60_000});
 const data=query.data;
 return <section aria-label="Integridade de auditoria administrativa" className="space-y-3 rounded-xl border bg-card p-5">
  <h2 className="text-lg font-bold">Integridade das decisões administrativas</h2>
  <p className="text-sm text-muted-foreground">Conferência integral dos registros existentes, sem mostrar identificadores de administradores. O histórico ainda não comprova que todas as mutações tenham trilha auditável.</p>
  <Button type="button" variant="outline" size="sm" disabled={query.isFetching}
   onClick={()=>void query.refetch()}>{query.isFetching?"Consultando...":"Atualizar histórico"}</Button>
  {query.isLoading&&<p role="status" className="text-sm">Consultando histórico administrativo...</p>}
  {query.isError&&<p role="alert" className="text-sm text-destructive">Não foi possível consultar o histórico de auditoria.</p>}
  {data&&<>
   <p className="text-sm tabular-nums">{data.summary.total.toLocaleString("pt-BR")} registros existentes · {data.summary.examined.toLocaleString("pt-BR")} examinados</p>
   {data.summary.partial&&<p role="alert" className="text-xs text-amber-700 dark:text-amber-300">Amostra parcial: integridade verificada apenas nos últimos 50 registros. Não extrapole os resultados para todo o histórico.</p>}
   {data.summary.status==="empty"&&<p className="text-sm">Sem decisões administrativas registradas.</p>}
   {data.summary.missingActor>0&&<p role="alert" className="text-sm text-amber-700 dark:text-amber-300">{data.summary.missingActor} registro(s) sem responsável identificado; revisar trilha.</p>}
   {data.summary.invalidTimestamps>0&&<p role="alert" className="text-sm text-amber-700 dark:text-amber-300">Há datas inválidas nos registros existentes.</p>}
   <div className="space-y-2">{data.recent.map(event=><article key={event.id} className="rounded-lg border bg-muted/20 p-3">
    <p className="text-sm font-semibold">{event.action} · {event.entityType}</p>
    <p className="text-xs text-muted-foreground">{event.actorRecorded?"Responsável registrado":"Responsável ausente"} · {Number.isFinite(Date.parse(event.createdAt))?new Date(event.createdAt).toLocaleString("pt-BR"):"Data indisponível"}</p>
   </article>)}</div>
  </>}
 </section>;
}

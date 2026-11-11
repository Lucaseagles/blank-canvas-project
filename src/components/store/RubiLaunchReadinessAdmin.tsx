import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {Button} from "@/components/ui/button";
import {getRubiLaunchReadinessAdmin} from "@/lib/rubi-launch-readiness.functions";

export function RubiLaunchReadinessAdmin(){
 const load=useServerFn(getRubiLaunchReadinessAdmin);
 const query=useQuery({queryKey:["rubi-launch-readiness"],queryFn:()=>load(),retry:false,staleTime:30000});
 return <section className="space-y-5 rounded-3xl border border-primary/30 bg-card p-6" aria-label="Prontidão de lançamento Kairos">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div><p className="text-xs font-black uppercase tracking-widest text-primary">RUBI 11× · Operação real</p>
    <h2 className="text-2xl font-black">Diagnóstico de lançamentos e fornecedores</h2>
    <p className="text-sm text-muted-foreground">Identifique o que falta para lançar produtos sem alterar código. A prontidão é técnica e cadastral; não comprova checkout Kairos transacionado nem venda confirmada.</p>
   </div>
   <Button size="sm" variant="outline" disabled={query.isFetching} onClick={()=>void query.refetch()}>{query.isFetching?"Atualizando...":"Atualizar diagnóstico"}</Button>
  </div>
  {query.isLoading&&<p role="status">Verificando o catálogo...</p>}
  {query.isError&&<p role="alert" className="text-destructive">Falha no diagnóstico. Confirme permissões e conexão do Supabase.</p>}
  {query.data&&<>
   <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
    {[
     {label:"Fornecedores",value:query.data.suppliersCount},
     {label:"Produtos analisados",value:query.data.productsCount},
     {label:"Prontos no cadastro",value:query.data.readyCount},
     {label:"Bloqueados",value:query.data.blockedCount}
    ].map(x=><div key={x.label} className="rounded-xl border p-3"><p className="text-xl font-bold tabular-nums">{x.value}</p><p className="text-xs text-muted-foreground">{x.label}</p></div>)}
   </div>
   {query.data.productsCount===0&&<div className="rounded-xl border p-4 text-sm">
    <p className="font-semibold">Ainda não há produto no catálogo para lançar.</p>
    <p className="text-muted-foreground">Cadastre primeiro o fornecedor, o domínio oficial exato do checkout, os preços e o produto. Ative somente após verificar as informações reais.</p>
   </div>}
   <div className="space-y-3">
    {query.data.productRows.map(p=><article key={p.productId} className="rounded-xl border p-4 space-y-2">
     <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{p.title}</h3>
      <span className="text-xs font-semibold">{p.readyForRetail?"Cadastro apto para publicação":"Cadastro bloqueado"}</span>
     </div>
     <div className="grid gap-2 text-xs sm:grid-cols-3">
      <span>Margem bruta: {p.grossMarginAmount===null?"Não calculável":p.grossMarginAmount.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</span>
      <span>Margem bruta %: {p.grossMarginPercent===null?"Não calculável":p.grossMarginPercent.toLocaleString("pt-BR")+"%"}</span>
      <span>Campanha: {p.editorial.movements} movimentos · {p.editorial.variants} variantes · {p.editorial.approvedPages} páginas aprovadas</span>
     </div>
     {p.blocking.length>0&&<div className="space-y-1"><p className="text-sm font-semibold">Bloqueios de cadastro</p><ul className="list-disc pl-5 text-sm text-muted-foreground">{p.blocking.map(x=><li key={x}>{x}</li>)}</ul></div>}
     {p.recommendations.length>0&&<div className="space-y-1"><p className="text-sm font-semibold">Próximas melhorias</p><ul className="list-disc pl-5 text-sm text-muted-foreground">{p.recommendations.map(x=><li key={x}>{x}</li>)}</ul></div>}
     <p className="text-xs text-muted-foreground">A margem é preço menos custo declarado, antes de taxas, impostos, frete, reembolsos e comissões. Não é lucro líquido.</p>
    </article>)}
   </div>
   <div className="rounded-xl border p-4 space-y-2">
    <h3 className="font-bold">Verificações externas ainda necessárias</h3>
    <ul className="list-disc pl-5 text-sm text-muted-foreground">{query.data.externalDependencies.map(d=><li key={d}>{d}</li>)}</ul>
    <p className="text-xs text-muted-foreground">Consultado em {new Date(query.data.asOf).toLocaleString("pt-BR")}. Máximo de {query.data.productLimit} produtos por consulta. Atividade comercial não inferida.</p>
   </div>
  </>}
 </section>;
}

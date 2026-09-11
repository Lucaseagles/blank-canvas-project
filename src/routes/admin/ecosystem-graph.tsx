import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Network, ArrowRight, Database } from "lucide-react";
import { getEcosystemGraph } from "@/lib/ecosystem-graph.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/ecosystem-graph")({ component: EcosystemGraphPage });

function EcosystemGraphPage() {
  const query = useQuery({ queryKey: ["admin-ecosystem-graph"], queryFn: () => getEcosystemGraph() });
  const data = query.data;
  return <div className="mx-auto max-w-7xl space-y-8 p-4 lg:p-8">
    <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div><Badge variant="outline" className="gap-2 text-[10px] font-black uppercase tracking-widest text-primary"><Network className="h-3 w-3"/> Owner Only</Badge><h1 className="mt-2 text-4xl font-black uppercase italic tracking-tighter">Ecosystem <span className="text-primary">Graph</span></h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Visão estrutural das entidades reais do ecossistema e das relações existentes entre elas. Nenhuma relação é criada ou simulada por este painel.</p></div>
      <Button variant="outline" className="gap-2 rounded-xl" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}/> Atualizar</Button>
    </header>
    {query.isError ? <Card className="rounded-3xl border-destructive/30"><CardContent className="py-12 text-center text-sm text-destructive">Falha ao carregar o grafo: {query.error.message}</CardContent></Card> : query.isLoading ? <Card className="rounded-3xl"><CardContent className="py-16 text-center text-sm text-muted-foreground">Lendo relações reais…</CardContent></Card> : <>
      <div className="grid gap-4 sm:grid-cols-2"><Metric label="Entidades" value={data?.totals.nodes ?? 0}/><Metric label="Tipos de relação" value={data?.totals.relations ?? 0}/></div>
      <Card className="rounded-[2rem]"><CardHeader><CardTitle className="flex items-center gap-2 text-lg font-black uppercase"><Database className="h-5 w-5 text-primary"/> Entidades</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(data?.nodes ?? []).map((node) => <div key={node.id} className="rounded-2xl border p-4"><div className="flex items-center justify-between gap-3"><span className="font-bold">{node.label}</span><Badge variant="secondary">{node.count}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{node.description}</p></div>)}</CardContent></Card>
      <Card className="rounded-[2rem]"><CardHeader><CardTitle className="text-lg font-black uppercase">Relações reais</CardTitle></CardHeader><CardContent className="space-y-3">{(data?.edges ?? []).length === 0 ? <Empty/> : data?.edges.map((edge) => <div key={`${edge.from}-${edge.to}`} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center"><div className="flex items-center gap-2 font-bold"><Badge variant="outline">{labelFor(data?.nodes, edge.from)}</Badge><ArrowRight className="h-4 w-4 text-muted-foreground"/><Badge variant="outline">{labelFor(data?.nodes, edge.to)}</Badge></div><span className="text-sm text-muted-foreground sm:ml-auto">{edge.label}: <strong className="text-foreground">{edge.count}</strong></span></div>)}</CardContent></Card>
    </>}
  </div>;
}
function labelFor(nodes: Array<{id:string;label:string}> | undefined, id: string) { return nodes?.find((node) => node.id === id)?.label ?? id; }
function Metric({ label, value }: { label: string; value: number }) { return <Card className="rounded-3xl"><CardContent className="p-5"><p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-black">{value}</p></CardContent></Card>; }
function Empty() { return <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhuma relação registrada ainda.</div>; }

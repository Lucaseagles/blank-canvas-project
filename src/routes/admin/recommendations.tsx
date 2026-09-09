import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCategoryHighlightsAdmin, saveManualHighlight, deleteHighlight, recalculateCategoryHighlights } from "@/lib/highlights.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCcw, Trash2, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/recommendations")({ component: AdminRecommendationsPage });

function AdminRecommendationsPage() {
  const qc = useQueryClient();
  const getData = useServerFn(getCategoryHighlightsAdmin);
  const save = useServerFn(saveManualHighlight);
  const remove = useServerFn(deleteHighlight);
  const recalc = useServerFn(recalculateCategoryHighlights);
  const [categoryId, setCategoryId] = useState("");
  const [productId, setProductId] = useState("");
  const [rank, setRank] = useState("1");
  const [search, setSearch] = useState("");
  const q = useQuery({ queryKey: ["admin-highlights-data"], queryFn: () => getData({ data: undefined }) });
  const categories = q.data?.categories ?? [];
  const highlights = q.data?.highlights ?? [];
  const products = q.data?.products ?? [];
  const visibleProducts = products.filter((p: any) => !search || p.title.toLowerCase().includes(search.toLowerCase())).slice(0, 20);
  const recalcMutation = useMutation({ mutationFn: () => recalc({ data: undefined }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-highlights-data"] }); toast.success("Recomendações recalculadas."); }, onError: e => toast.error(e instanceof Error ? e.message : "Falha ao recalcular.") });
  const saveMutation = useMutation({ mutationFn: () => save({ data: { categoryId, productId, rank: Number(rank) } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-highlights-data"] }); setProductId(""); toast.success("Destaque manual aplicado."); }, onError: e => toast.error(e instanceof Error ? e.message : "Falha ao salvar.") });
  const deleteMutation = useMutation({ mutationFn: (id: string) => remove({ data: { id } }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-highlights-data"] }); toast.success("Destaque removido."); }, onError: e => toast.error(e instanceof Error ? e.message : "Falha ao remover.") });
  return <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><Badge variant="outline">Recommendation Engine</Badge><h1 className="mt-2 text-3xl font-black uppercase italic tracking-tight sm:text-5xl">Offer Intelligence</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Controle os destaques por categoria e mantenha o ranking automático baseado em dados reais.</p></div><Button onClick={() => recalcMutation.mutate()} disabled={recalcMutation.isPending} className="w-full sm:w-auto"><RefreshCcw className={`mr-2 h-4 w-4 ${recalcMutation.isPending ? "animate-spin" : ""}`}/>Recalcular</Button></div>
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1"><CardHeader><CardTitle className="text-lg">Override editorial</CardTitle></CardHeader><CardContent className="space-y-4">
        <Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger><SelectValue placeholder="Categoria"/></SelectTrigger><SelectContent>{categories.map((c: any)=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
        <Select value={rank} onValueChange={setRank}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{[1,2,3].map(r=><SelectItem key={r} value={String(r)}>Posição #{r}</SelectItem>)}</SelectContent></Select>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto..." className="h-11 w-full rounded-md border bg-background px-3 text-sm"/>
        <div className="max-h-56 overflow-y-auto rounded-md border">{visibleProducts.map((p: any)=><button type="button" key={p.id} onClick={()=>setProductId(p.id)} className={`block w-full border-b px-3 py-3 text-left text-sm last:border-0 hover:bg-muted ${productId===p.id?"bg-muted font-bold":""}`}>{p.title}</button>)}{!q.isLoading&&visibleProducts.length===0&&<p className="p-4 text-sm text-muted-foreground">Nenhum produto encontrado.</p>}</div>
        <Button className="w-full" disabled={!categoryId||!productId||saveMutation.isPending} onClick={()=>saveMutation.mutate()}><Plus className="mr-2 h-4 w-4"/>{saveMutation.isPending?"Salvando...":"Aplicar destaque"}</Button>
      </CardContent></Card>
      <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5"/>Destaques atuais</CardTitle></CardHeader><CardContent>{q.isLoading?<div className="py-12 text-center text-muted-foreground">Carregando...</div>:q.isError?<div className="py-12 text-center text-destructive">Não foi possível carregar as recomendações.</div>:highlights.length===0?<div className="py-12 text-center text-muted-foreground">Nenhum destaque cadastrado. Execute o recálculo ou aplique um override.</div>:<div className="space-y-3">{highlights.map((h:any)=><div key={h.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="font-bold">{categories.find((c:any)=>c.id===h.category_id)?.name??"Categoria"}</p><p className="truncate text-sm text-muted-foreground">#{h.rank} · {h.products?.title??"Produto removido"}</p></div><Badge variant={h.is_manual_override?"default":"secondary"}>{h.is_manual_override?"Manual":"Automático"}</Badge><Button variant="ghost" size="icon" aria-label="Excluir destaque" disabled={deleteMutation.isPending} onClick={()=>window.confirm("Remover este destaque?")&&deleteMutation.mutate(h.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>)}</div>}</CardContent></Card>
    </div>
  </div>;
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Layers, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getOfferGroups, getOfferGroupDetails, saveOfferGroup, deleteOfferGroup } from "@/lib/admin_intel.functions";

export const Route = createFileRoute("/admin/offers")({ component: AdminOffersPage });

function AdminOffersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getGroups = useServerFn(getOfferGroups);
  const getDetails = useServerFn(getOfferGroupDetails);
  const saveGroup = useServerFn(saveOfferGroup);
  const removeGroup = useServerFn(deleteOfferGroup);
  const [editing, setEditing] = useState<{ id: string; canonical_title: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: groups, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admin-offer-groups"],
    queryFn: () => getGroups({ data: {} as never }),
  });

  const edit = async (id: string) => {
    try {
      const result = await getDetails({ data: { id } });
      setEditing({ id, canonical_title: result.group.canonical_title });
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível carregar a oferta.");
    }
  };

  const save = async () => {
    if (!editing?.canonical_title.trim()) return toast.error("Informe o nome da oferta.");
    setSaving(true);
    try {
      await saveGroup({ data: { id: editing.id, canonical_title: editing.canonical_title.trim() } });
      toast.success("Oferta atualizada.");
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ["admin-offer-groups"] });
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível atualizar a oferta.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Excluir esta oferta? Produtos vinculados precisam ser desvinculados antes.")) return;
    try {
      await removeGroup({ data: { id } });
      toast.success("Oferta excluída.");
      await qc.invalidateQueries({ queryKey: ["admin-offer-groups"] });
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível excluir a oferta.");
    }
  };

  return <div className="container mx-auto py-12 px-4 max-w-7xl min-h-[80vh] space-y-8">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div><Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3">Offer Intelligence</Badge><h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tighter uppercase italic">Direct Offers</h1><p className="mt-2 max-w-2xl text-muted-foreground">Gerencie grupos de ofertas e acompanhe os produtos vinculados.</p></div>
      <div className="flex gap-2"><Button variant="outline" onClick={() => refetch()} disabled={isLoading}><RefreshCw className={isLoading ? "animate-spin" : ""} />Atualizar</Button><Button onClick={() => navigate({ to: "/admin/offers/new" })} className="h-11 rounded-2xl px-6 font-black uppercase italic gap-2"><Plus className="h-4 w-4" />New Offer</Button></div>
    </div>

    {isError && <Card className="border-destructive/30"><CardContent className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"><p className="text-sm font-medium text-destructive">{(error as any)?.message || "Erro ao carregar ofertas."}</p><Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button></CardContent></Card>}

    {!isError && isLoading && <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <div key={i} className="h-40 rounded-[2rem] border border-glass-border bg-glass animate-pulse" />)}</div>}

    {!isLoading && !isError && (groups?.length ?? 0) === 0 && <Card className="rounded-[2rem] border-glass-border bg-glass"><CardContent className="p-12 text-center"><Layers className="mx-auto mb-4 h-10 w-10 text-muted-foreground" /><p className="font-bold">Nenhuma oferta cadastrada.</p><p className="text-sm text-muted-foreground mt-1">Crie a primeira oferta para começar a agrupar produtos.</p></CardContent></Card>}

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{groups?.map((group: any) => <Card key={group.id} className="rounded-[2rem] border-glass-border bg-glass backdrop-blur-xl"><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><CardTitle className="text-lg font-black uppercase italic">{group.canonical_title}</CardTitle><Badge variant="outline">Oferta</Badge></div></CardHeader><CardContent className="space-y-4"><div className="text-xs text-muted-foreground">ID: {group.id.slice(0, 8)} · Atualizada {new Date(group.updated_at || group.created_at).toLocaleString("pt-BR")}</div><div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={() => edit(group.id)}><Pencil />Editar</Button><Button variant="destructive" size="icon" onClick={() => remove(group.id)} title="Excluir oferta"><Trash2 /></Button></div></CardContent></Card>)}</div>

    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"><Card className="w-full max-w-lg rounded-[2rem] border-glass-border bg-background"><CardHeader><CardTitle className="text-2xl font-black uppercase italic">Editar oferta</CardTitle></CardHeader><CardContent className="space-y-5"><div className="space-y-2"><label htmlFor="offer-edit-name" className="text-sm font-medium">Nome da oferta</label><Input id="offer-edit-name" value={editing.canonical_title} onChange={e => setEditing({ ...editing, canonical_title: e.target.value })} disabled={saving} autoFocus /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</Button></div></CardContent></Card></div>}
  </div>;
}

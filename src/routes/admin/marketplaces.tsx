import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, Link2, AlertCircle, CheckCircle2, Clock, Edit3, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/marketplaces")({ component: AdminMarketplacesPage });

function AdminMarketplacesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: marketplaces, isLoading } = useQuery({
    queryKey: ["admin-marketplaces"],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketplaces").select("id,name,slug,status,api_status,created_at,affiliate_link_structure").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("marketplaces").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-marketplaces"] }); toast.success("Status atualizado."); },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketplaces").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-marketplaces"] }); queryClient.invalidateQueries({ queryKey: ["product-categories"] }); toast.success("Marketplace excluído."); },
    onError: (e: any) => toast.error(`Não foi possível excluir: ${e.message}`),
  });
  const icon = (status: string) => status === "active" || status === "connected" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : status === "pending" ? <Clock className="w-4 h-4 text-yellow-500" /> : <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  return <div className="container mx-auto py-12 px-4 max-w-7xl space-y-8">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6"><div><Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3">Connectors</Badge><h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">MARKETPLACES</h1></div><div className="flex gap-3"><Button onClick={() => navigate({ to: "/admin/marketplaces/new" })} className="h-11 px-6 font-black gap-2 rounded-xl"><Plus className="w-4 h-4" />Adicionar</Button><Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-marketplaces"] })} className="h-11 px-6 font-bold gap-2 rounded-xl"><RefreshCw className="w-4 h-4" />Atualizar</Button></div></div>
    <div className="bg-glass-fallback border border-glass-border rounded-3xl overflow-hidden shadow-2xl"><Table><TableHeader><TableRow><TableHead className="font-black py-6 pl-8">Marketplace</TableHead><TableHead>Slug</TableHead><TableHead>Status</TableHead><TableHead>API</TableHead><TableHead>Link Logic</TableHead><TableHead className="text-right pr-8">Controle</TableHead></TableRow></TableHeader><TableBody>{isLoading ? [1,2,3].map(i => <TableRow key={i}><TableCell colSpan={6} className="h-20"><div className="h-4 w-48 bg-muted animate-pulse rounded" /></TableCell></TableRow>) : marketplaces?.map(m => <TableRow key={m.id}><TableCell className="font-bold py-6 pl-8"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Database className="w-4 h-4" /></div>{m.name}</div></TableCell><TableCell className="font-mono text-xs text-muted-foreground">{m.slug}</TableCell><TableCell><div className="flex items-center gap-2">{icon(m.status ?? "")}<Badge>{m.status}</Badge></div></TableCell><TableCell className="text-xs">{m.api_status || "Pendente"}</TableCell><TableCell className="font-mono text-[9px] text-muted-foreground max-w-[180px] truncate">{m.affiliate_link_structure || "Padrão"}</TableCell><TableCell className="text-right pr-8"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={() => updateStatus.mutate({ id: m.id, status: m.status === "disabled" ? "active" : "disabled" })}>{m.status === "disabled" ? "ATIVAR" : "DESATIVAR"}</Button><Button variant="ghost" size="icon" title="Editar" onClick={() => navigate({ to: `/admin/marketplaces/${m.id}` })}><Edit3 className="w-4 h-4" /></Button><Button variant="ghost" size="icon" title="Excluir" disabled={remove.isPending} onClick={() => { if (window.confirm(`Excluir o marketplace ${m.name}?`)) remove.mutate(m.id); }}><Trash2 className="w-4 h-4" /></Button><Button variant="ghost" size="icon" title="Abrir" onClick={() => navigate({ to: `/admin/marketplaces/${m.id}` })}><Link2 className="w-4 h-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table></div>
  </div>;
}

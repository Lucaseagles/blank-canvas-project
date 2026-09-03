import { useEffect, useState } from "react";
import { GripVertical, Power, PowerOff, RefreshCw, Save } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminHomeModules, reorderHomeModules, setHomeModuleEnabled, type HomeModule } from "@/lib/admin-modules.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HomeModulesConfig() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin-home-modules"], queryFn: () => getAdminHomeModules({ data: undefined }) });
  const [modules, setModules] = useState<HomeModule[]>([]);
  const [dragged, setDragged] = useState<string | null>(null);
  useEffect(() => { if (query.data) setModules(query.data); }, [query.data]);
  const toggle = useMutation({ mutationFn: (m: HomeModule) => setHomeModuleEnabled({ data: { id: m.id, enabled: !m.is_enabled } }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-home-modules"] }) });
  const saveOrder = useMutation({ mutationFn: () => reorderHomeModules({ data: { ids: modules.map(m => m.id) } }), onSuccess: (data) => { setModules(data); queryClient.setQueryData(["admin-home-modules"], data); } });
  const move = (from: number, to: number) => { if (to < 0 || to >= modules.length) return; const next = [...modules]; const [item] = next.splice(from, 1); next.splice(to, 0, item); setModules(next.map((m, i) => ({ ...m, display_order: i + 1 }))); };
  if (query.isLoading) return <div className="py-12 text-center text-muted-foreground">Carregando módulos...</div>;
  if (query.isError) return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">Não foi possível carregar os módulos.</div>;
  return <Card className="border-white/10 bg-background/60 backdrop-blur-xl"><CardHeader className="flex flex-row items-center justify-between gap-4"><div><CardTitle className="text-2xl font-black uppercase italic">Módulos da Home</CardTitle><p className="mt-1 text-sm text-muted-foreground">Controle a presença e a ordem dos módulos públicos.</p></div><Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={query.isFetching ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />Recarregar</Button></CardHeader><CardContent className="space-y-3">{modules.map((module, index) => <div key={module.id} draggable onDragStart={() => setDragged(module.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragged) { const from = modules.findIndex(m => m.id === dragged); move(from, index); } setDragged(null); }} className={`flex items-center gap-3 rounded-2xl border p-4 transition ${module.is_enabled ? "border-primary/20 bg-primary/5" : "border-white/5 bg-muted/20 opacity-70"}`}><GripVertical className="h-5 w-5 shrink-0 cursor-grab text-muted-foreground" /><div className="min-w-0 flex-1"><p className="font-bold">{module.module_name}</p><p className="text-xs text-muted-foreground">{module.module_key} · posição {index + 1}</p></div><Badge variant={module.is_enabled ? "default" : "secondary"}>{module.is_enabled ? "Ativo" : "Inativo"}</Badge><Button variant="outline" size="sm" onClick={() => toggle.mutate(module)} disabled={toggle.isPending}>{module.is_enabled ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}{module.is_enabled ? "Desativar" : "Ativar"}</Button></div>)}<div className="flex justify-end border-t border-white/10 pt-4"><Button onClick={() => saveOrder.mutate()} disabled={saveOrder.isPending || !modules.length}><Save className="mr-2 h-4 w-4" />{saveOrder.isPending ? "Salvando..." : "Salvar ordem"}</Button></div></CardContent></Card>;
}

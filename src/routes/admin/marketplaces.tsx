import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, Link2, AlertCircle, CheckCircle2, Clock, Edit3, Plus, Trash2, Search, Store, Activity, PlugZap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/admin/marketplaces")({ component: AdminMarketplacesPage });

type StatusFilter = "all" | "active" | "pending" | "disabled";

const statusMeta: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  active: { label: "Ativo", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  connected: { label: "Conectado", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  pending: { label: "Pendente", icon: Clock, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  disabled: { label: "Desativado", icon: AlertCircle, className: "bg-muted text-muted-foreground" },
};

function AdminMarketplacesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const { data: marketplaces = [], isLoading, isError, refetch } = useQuery({
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
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin-marketplaces"] }); toast.success("Status atualizado."); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketplaces").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin-marketplaces"] }); await queryClient.invalidateQueries({ queryKey: ["product-categories"] }); toast.success("Marketplace excluído."); },
    onError: (e: any) => toast.error(`Não foi possível excluir: ${e.message}`),
  });

  const stats = useMemo(() => ({
    total: marketplaces.length,
    active: marketplaces.filter((m: any) => m.status === "active" || m.status === "connected").length,
    pending: marketplaces.filter((m: any) => m.status === "pending").length,
    disabled: marketplaces.filter((m: any) => m.status === "disabled").length,
  }), [marketplaces]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return marketplaces.filter((m: any) => {
      const matchesStatus = filter === "all" || m.status === filter || (filter === "active" && m.status === "connected");
      const matchesSearch = !term || [m.name, m.slug, m.api_status, m.affiliate_link_structure].filter(Boolean).some((v) => String(v).toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [marketplaces, search, filter]);

  return (
    <div className="relative min-h-full overflow-hidden pb-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/[0.08] via-primary/[0.025] to-transparent" />
      <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 shadow-sm backdrop-blur-xl">
          <div className="relative p-6 sm:p-8">
            <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                  <PlugZap className="h-3.5 w-3.5" /> Connectors
                </div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Marketplaces</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Gerencie os marketplaces e as estruturas de afiliados usadas pelo catálogo.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void refetch()} className="h-11 rounded-xl font-bold"><RefreshCw className="mr-2 h-4 w-4" /> Atualizar</Button>
                <Button onClick={() => navigate({ to: "/admin/marketplaces/new" })} className="h-11 rounded-xl px-5 font-black shadow-lg shadow-primary/10"><Plus className="mr-2 h-4 w-4" /> Adicionar marketplace</Button>
              </div>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-4">
              {[
                { label: "Total", value: stats.total, icon: Store },
                { label: "Ativos", value: stats.active, icon: CheckCircle2 },
                { label: "Pendentes", value: stats.pending, icon: Clock },
                { label: "Desativados", value: stats.disabled, icon: AlertCircle },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">{label}</span><Icon className="h-4 w-4 text-primary" /></div>
                  <div className="mt-2 text-2xl font-black tracking-tight">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-3 shadow-sm backdrop-blur-xl md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar marketplace, slug ou configuração..." className="h-11 border-0 bg-background/70 pl-9 shadow-none" />
          </div>
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/60 p-1">
            {(["all", "active", "pending", "disabled"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-2 text-xs font-black transition ${filter === value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {value === "all" ? "Todos" : value === "active" ? "Ativos" : value === "pending" ? "Pendentes" : "Desativados"}
              </button>
            ))}
          </div>
        </section>

        {isLoading && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1,2,3].map((i) => <div key={i} className="h-56 animate-pulse rounded-3xl border border-border/60 bg-muted/40" />)}</div>}
        {isError && <Card className="rounded-3xl border-destructive/20 bg-destructive/5"><CardContent className="flex flex-col items-center gap-3 py-14 text-center"><AlertCircle className="h-8 w-8 text-destructive" /><p className="font-bold">Não foi possível carregar os marketplaces.</p><Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button></CardContent></Card>}
        {!isLoading && !isError && filtered.length === 0 && <Card className="rounded-3xl border-dashed bg-card/60"><CardContent className="flex flex-col items-center py-16 text-center"><div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Store className="h-7 w-7" /></div><h2 className="text-lg font-black">{marketplaces.length ? "Nenhum resultado encontrado" : "Nenhum marketplace cadastrado"}</h2><p className="mt-1 text-sm text-muted-foreground">{marketplaces.length ? "Ajuste a busca ou o filtro." : "Cadastre o primeiro conector para começar a estruturar seus links."}</p>{!marketplaces.length && <Button onClick={() => navigate({ to: "/admin/marketplaces/new" })} className="mt-5 rounded-xl font-black"><Plus className="mr-2 h-4 w-4" /> Adicionar marketplace</Button>}</CardContent></Card>}

        {!isLoading && !isError && filtered.length > 0 && <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m: any) => {
            const meta = statusMeta[m.status] ?? { label: m.status ?? "Desconhecido", icon: AlertCircle, className: "bg-muted text-muted-foreground" };
            const StatusIcon = meta.icon;
            return <Card key={m.id} className="group overflow-hidden rounded-3xl border-border/60 bg-card/80 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
              <CardContent className="space-y-5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Database className="h-5 w-5" /></div>
                    <div className="min-w-0"><h2 className="truncate text-base font-black">{m.name}</h2><p className="truncate text-xs font-mono text-muted-foreground">{m.slug}</p></div>
                  </div>
                  <Badge className={`shrink-0 border-0 font-black ${meta.className}`}><StatusIcon className="mr-1.5 h-3.5 w-3.5" />{meta.label}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/50 bg-muted/30 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">API</p><p className="mt-1 truncate text-sm font-bold">{m.api_status || "Pendente"}</p></div>
                  <div className="rounded-xl border border-border/50 bg-muted/30 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Afiliado</p><p className="mt-1 truncate text-sm font-bold">{m.affiliate_link_structure ? "Configurado" : "Padrão"}</p></div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Activity className="h-3.5 w-3.5 text-primary" /><span className="truncate">{m.affiliate_link_structure || "Sem estrutura de link definida"}</span></div>
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => updateStatus.mutate({ id: m.id, status: m.status === "disabled" ? "active" : "disabled" })} disabled={updateStatus.isPending}>{m.status === "disabled" ? "Ativar" : "Desativar"}</Button>
                  <Button variant="outline" className="rounded-xl" onClick={() => navigate({ to: `/admin/marketplaces/${m.id}` })} aria-label="Editar"><Edit3 className="h-4 w-4" /></Button>
                  <Button variant="outline" className="rounded-xl" onClick={() => navigate({ to: `/admin/marketplaces/${m.id}` })} aria-label="Abrir"><Link2 className="h-4 w-4" /></Button>
                  <Button variant="outline" className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={remove.isPending} onClick={() => { if (window.confirm(`Excluir o marketplace ${m.name}?`)) remove.mutate(m.id); }} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>;
          })}
        </div>}
      </div>
    </div>
  );
}

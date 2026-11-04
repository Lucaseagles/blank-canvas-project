import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyPartnerFinancialNotifications, markMyPartnerFinancialNotificationRead } from "@/lib/partner-financial-notifications.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/partner/notifications")({ component: PartnerNotifications });
type Notification = { id: string; title: string; message: string; created_at: string; read_at: string | null };
function PartnerNotifications() {
  const load = useServerFn(getMyPartnerFinancialNotifications);
  const markRead = useServerFn(markMyPartnerFinancialNotificationRead);
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ["my-partner-financial-notifications"], queryFn: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Entre na sua conta.");
    return load({ data: { accessToken: session.access_token } });
  }, retry: false });
  const mutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Entre na sua conta.");
      return markRead({ data: { accessToken: session.access_token, notificationId } });
    },
    onSuccess: () => void cache.invalidateQueries({ queryKey: ["my-partner-financial-notifications"] }),
  });
  const notifications = (query.data ?? []) as Notification[];
  return <main className="mx-auto max-w-4xl space-y-6 px-4 py-28">
    <header className="space-y-2"><p className="text-xs font-bold uppercase tracking-widest text-primary">Hub Eagles · Parceiros</p><h1 className="text-3xl font-black">Notificações financeiras</h1><p className="text-muted-foreground">Avisos gerados por vendas confirmadas e pagamentos registrados.</p><Button asChild variant="outline"><Link to="/partner/portal">Voltar ao portal</Link></Button></header>
    {query.isLoading && <p role="status">Carregando notificações...</p>}
    {query.isError && <div role="alert"><p>Não foi possível consultar as notificações.</p><Button onClick={() => void query.refetch()}>Tentar novamente</Button></div>}
    {query.isSuccess && notifications.length === 0 && <p className="rounded-xl border p-5">Nenhuma notificação financeira registrada.</p>}
    <section aria-label="Notificações" className="space-y-3">
      {notifications.map(item => <article key={item.id} className="space-y-2 rounded-xl border bg-card p-5">
        <div className="flex flex-wrap justify-between gap-3"><h2 className="font-bold">{item.title}</h2><span className="text-xs text-muted-foreground">{item.read_at ? "Lida" : "Não lida"}</span></div>
        <p className="text-sm">{item.message}</p>
        <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("pt-BR")}</p>
        {!item.read_at && <Button variant="outline" size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate(item.id)}>Marcar como lida</Button>}
      </article>)}
    </section>
  </main>;
}

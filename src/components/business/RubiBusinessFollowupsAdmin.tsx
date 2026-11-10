import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { classifyRubiFollowup } from "@/lib/rubi-business-followup";
import { getHubBusinessFollowupsAdmin, completeHubBusinessFollowupAdmin } from "@/lib/hub-business-quotes.functions";

type QueueItem = {
  id: string;
  commercial_profile_id: string;
  created_at: string;
  followup_opt_in: boolean;
  followup_due_at: string | null;
  followup_completed_at: string | null;
  followup_interval_days: number | null;
  requested_lines: Array<{ title: string; quantity: number }>;
  status: string;
};

/** Private owner task queue, with no automatic contacting of merchants. */
export function RubiBusinessFollowupsAdmin() {
  const getQueue = useServerFn(getHubBusinessFollowupsAdmin);
  const complete = useServerFn(completeHubBusinessFollowupAdmin);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["rubi-business-followups-admin"],
    queryFn: () => getQueue(),
    staleTime: 60_000,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: (quoteId: string) => complete({ data: { quoteId } }),
    onSuccess: () => {
      toast.success("Tarefa interna encerrada, sem envio de mensagem.");
      void client.invalidateQueries({ queryKey: ["rubi-business-followups-admin"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const items = (query.data ?? []) as QueueItem[];
  const now = new Date();
  const due = items.filter(item => ["due", "overdue"].includes(classifyRubiFollowup(item, now))).length;

  return <section aria-label="Acompanhamentos internos de lojistas" className="space-y-4 rounded-3xl border border-primary/25 bg-card/80 p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-2xl font-black">RUBI Business · Oportunidades de acompanhamento</h2>
        <p className="text-sm text-muted-foreground">
          Fila interna, criada apenas quando o lojista aceita o convite. Datas vencidas primeiro.
          Nenhuma mensagem, notificação, cobrança ou venda é gerada automaticamente.
        </p>
      </div>
      <Button type="button" size="sm" variant="outline" disabled={query.isFetching}
        onClick={() => void query.refetch()}>Atualizar fila</Button>
    </div>
    {query.isLoading && <p role="status">Carregando acompanhamentos...</p>}
    {query.isError && <p role="alert" className="text-sm text-destructive">
      Não foi possível consultar a fila de acompanhamento.
    </p>}
    {query.data && <p className="text-sm font-semibold">
      {due.toLocaleString("pt-BR")} tarefa(s) vencida(s) ou para hoje · {items.length.toLocaleString("pt-BR")} acompanhamentos pendentes exibidos
    </p>}
    {query.data?.length === 0 && <p className="text-sm text-muted-foreground">
      Nenhum lojista autorizou acompanhamento interno ou todas as tarefas foram concluídas.
    </p>}
    {items.length > 0 && <div className="max-h-[500px] space-y-3 overflow-y-auto">
      {items.map(item => {
        const status = classifyRubiFollowup(item, now);
        return <article key={item.id} className="space-y-2 rounded-xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">
                {status === "overdue" ? "Atrasado" : status === "due" ? "Para hoje" : "Próximo"} ·
                {" "}{item.followup_due_at ? new Date(item.followup_due_at).toLocaleDateString("pt-BR") : "Data indisponível"}
              </p>
              <p className="text-xs text-muted-foreground">
                Cotação {item.id.slice(0, 8)} · Perfil {item.commercial_profile_id.slice(0, 8)}
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" disabled={mutation.isPending}
              onClick={() => mutation.mutate(item.id)}>Marcar tarefa interna concluída</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {item.requested_lines?.map(line => `${line.title} (${line.quantity} un.)`).join(" · ") || "Produtos indisponíveis"}
          </p>
        </article>;
      })}
      {items.length === 100 && <p className="text-xs text-muted-foreground">
        Exibindo somente os 100 acompanhamentos pendentes mais próximos. Paginação é necessária para filas maiores.
      </p>}
    </div>}
  </section>;
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { createHubBusinessQuote, getMyHubBusinessQuotes } from "@/lib/hub-business-quotes.functions";
import { toast } from "sonner";

type NewQuoteLine = { id: string; title: string; quantity: number; unitPrice: number; total: number; valid: boolean };
type PriorQuoteLine = { productId: string; title: string; quantity: number; unitPrice: number; total: number };
type QuoteRow = {
  id: string;
  status: string;
  total_estimate: number;
  requested_lines: PriorQuoteLine[];
  merchant_note: string;
  owner_note: string;
  created_at: string;
  replenishment_of_quote_id: string | null;
  responded_at: string | null;
};
const money = (value: number) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const labels: Record<string,string> = {
  requested: "Aguardando atendimento",
  reviewing: "Em análise",
  responded: "Respondida pelo comercial",
  closed: "Encerrada",
};

/** Quotes are requests for commercial contact, not orders or inventory reservations. */
export function RubiBusinessQuotePanel({
  lines,
  valid,
  onRepeat,
}: {
  lines: NewQuoteLine[];
  valid: boolean;
  onRepeat: (lines: PriorQuoteLine[], sourceQuoteId: string) => void;
}) {
  const load = useServerFn(getMyHubBusinessQuotes);
  const create = useServerFn(createHubBusinessQuote);
  const client = useQueryClient();
  const [note, setNote] = useState("");
  const [replenishmentOfQuoteId, setReplenishmentOfQuoteId] = useState<string | null>(null);
  const quotes = useQuery({
    queryKey: ["hub-business-my-quotes"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Entre na sua conta.");
      return load({ data: { accessToken: session.access_token } });
    },
    staleTime: 60_000,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: async () => {
      if (!valid || lines.length === 0) throw new Error("Escolha os produtos e quantidades válidas.");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada. Entre novamente.");
      return create({ data: {
        accessToken: session.access_token,
        merchantNote: note.trim(),
        ...(replenishmentOfQuoteId ? { replenishmentOfQuoteId } : {}),
        lines: lines.map(line => ({ productId: line.id, quantity: line.quantity })),
      } });
    },
    onSuccess: () => {
      toast.success("Solicitação de cotação registrada. Ainda não é um pedido.");
      setNote("");
      setReplenishmentOfQuoteId(null);
      void client.invalidateQueries({ queryKey: ["hub-business-my-quotes"] });
      void client.invalidateQueries({ queryKey: ["admin-hub-business-quotes"] });
    },
    onError: error => toast.error(error instanceof Error ? error.message : "Não foi possível enviar a solicitação."),
  });

  return <section aria-label="Solicitações comerciais RUBI Business" className="space-y-5 rounded-2xl border border-primary/30 bg-card p-5">
    <div className="space-y-2">
      <h2 className="text-xl font-bold">Solicite uma cotação comercial</h2>
      <p className="text-sm text-muted-foreground">
        Reúna até 12 produtos com as quantidades desejadas. O servidor calculará novamente os preços
        de atacado no envio. O valor é uma estimativa, sem reserva de estoque, pedido pago ou compromisso de entrega.
      </p>
    </div>
    <label className="block space-y-2 text-sm font-semibold">Observações para a equipe (opcional)
      <textarea rows={2} maxLength={500} className="w-full rounded-lg border bg-background p-3 text-sm"
        placeholder="Ex.: interesse em reposição mensal, prazo desejado, dúvidas sobre volume"
        value={note} onChange={event => setNote(event.target.value)}/>
    </label>
    {replenishmentOfQuoteId && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <p className="text-sm font-semibold">Solicitação de reposição vinculada à cotação {replenishmentOfQuoteId.slice(0, 8)}</p>
      <Button type="button" size="sm" variant="outline" onClick={() => setReplenishmentOfQuoteId(null)}>Desvincular reposição</Button>
      <p className="w-full text-xs text-muted-foreground">O servidor exigirá pelo menos um produto da cotação original. Os preços atuais serão recalculados. Isto não é uma compra.</p>
    </div>}
    {lines.length > 12 && <p role="alert" className="text-sm text-destructive">Selecione até 12 produtos por solicitação.</p>}
    <Button type="button" disabled={!valid || lines.length === 0 || lines.length > 12 || mutation.isPending}
      onClick={() => mutation.mutate()}>
      {mutation.isPending ? "Enviando solicitação..." : "Enviar solicitação de cotação"}
    </Button>
    <p className="text-xs text-muted-foreground">A solicitação não gera pagamento, cobrança, faturamento ou pedido no fornecedor. Antes de uma negociação definitiva, as condições e o estoque serão reconfirmados.</p>
    <div className="space-y-3 border-t pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold">Minhas solicitações anteriores</h3>
        <Button size="sm" variant="outline" disabled={quotes.isFetching} onClick={() => void quotes.refetch()}>Atualizar histórico</Button>
      </div>
      {quotes.isLoading && <p role="status" className="text-sm">Carregando solicitações...</p>}
      {quotes.isError && <p role="alert" className="text-sm text-destructive">Não foi possível carregar o histórico comercial.</p>}
      {quotes.data?.length === 0 && <p className="text-sm text-muted-foreground">Você ainda não enviou uma cotação.</p>}
      {quotes.data && quotes.data.length > 0 && <div className="max-h-96 space-y-3 overflow-y-auto">
        {(quotes.data as QuoteRow[]).map(quote => <article key={quote.id} className="space-y-2 rounded-xl border p-4">
          <div className="flex flex-wrap justify-between gap-2">
            <strong className="text-sm">{money(quote.total_estimate)} (estimado)</strong>
            <span className="text-xs font-semibold">{labels[quote.status] ?? "Em atendimento"}</span>
          </div>
          <p className="text-xs text-muted-foreground">Enviada em {new Date(quote.created_at).toLocaleString("pt-BR")} · {quote.requested_lines.length} produto(s)</p>
          <p className="text-xs text-muted-foreground">{quote.requested_lines.map(item => `${item.title} (${item.quantity} un.)`).join(" · ")}</p>
          {quote.owner_note && <p className="rounded-lg border bg-muted/40 p-3 text-sm"><strong>Resposta comercial:</strong> {quote.owner_note}</p>}
          {quote.responded_at && <p className="text-xs text-muted-foreground">Primeira resposta: {new Date(quote.responded_at).toLocaleString("pt-BR")}</p>}
          {quote.replenishment_of_quote_id && <p className="text-xs font-semibold text-primary">Reposição solicitada com base na cotação {quote.replenishment_of_quote_id.slice(0, 8)}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => { setReplenishmentOfQuoteId(null); onRepeat(quote.requested_lines, quote.id); }}>
              Usar quantidades em nova simulação
            </Button>
            <Button type="button" size="sm" onClick={() => { setReplenishmentOfQuoteId(quote.id); onRepeat(quote.requested_lines, quote.id); }}>
              Solicitar reposição destes produtos
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Repetir prepara uma nova simulação; solicitar reposição registra um vínculo apenas quando uma nova cotação for enviada. Nenhuma opção cria pedido pago.</p>
        </article>)}
      </div>}
    </div>
  </section>;
}

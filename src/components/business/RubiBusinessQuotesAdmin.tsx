import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getHubBusinessQuotesAdmin, updateHubBusinessQuoteAdmin } from "@/lib/hub-business-quotes.functions";

type QuoteAdmin = {
  id: string;
  commercial_profile_id: string;
  status: string;
  total_estimate: number;
  merchant_note: string;
  owner_note: string;
  requested_lines: { productId: string; title: string; quantity: number; unitPrice: number; total: number }[];
  created_at: string;
};

const labels: Record<string, string> = {
  requested: "Recebida",
  reviewing: "Em análise",
  responded: "Respondida",
  closed: "Encerrada",
};
const money = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function QuoteAdminItem({ quote, update }: {
  quote: QuoteAdmin;
  update: (id: string, status: "requested" | "reviewing" | "responded" | "closed", note: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<"requested" | "reviewing" | "responded" | "closed">(quote.status as "requested" | "reviewing" | "responded" | "closed");
  const [note, setNote] = useState(quote.owner_note ?? "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { await update(quote.id, status, note); } finally { setSaving(false); }
  };
  return <article className="space-y-3 rounded-xl border p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        <p className="font-semibold">{money(quote.total_estimate)} · estimativa</p>
        <p className="text-xs text-muted-foreground">{new Date(quote.created_at).toLocaleString("pt-BR")} · Cotação {quote.id.slice(0,8)}</p>
      </div>
      <span className="text-xs font-semibold">{labels[quote.status] ?? "Recebida"}</span>
    </div>
    <p className="text-xs text-muted-foreground">Perfil comercial: {quote.commercial_profile_id}</p>
    <ul className="space-y-1 text-sm">
      {quote.requested_lines.map(line => <li key={line.productId} className="flex flex-wrap justify-between gap-2">
        <span>{line.title} · {line.quantity} unidades</span><strong>{money(line.total)}</strong>
      </li>)}
    </ul>
    {quote.merchant_note && <p className="rounded-lg border p-3 text-sm"><strong>Observação do lojista:</strong> {quote.merchant_note}</p>}
    <div className="grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
      <label className="space-y-1 text-xs font-semibold">Situação comercial
        <select value={status} onChange={event => setStatus(event.target.value as typeof status)}
          disabled={quote.status === "closed"}
          className="block w-full rounded-lg border bg-background p-2 text-sm">
          {Object.entries(labels).map(([value, label]) =>
            <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-xs font-semibold">Resposta para o lojista
        <textarea rows={2} maxLength={500} value={note} onChange={event => setNote(event.target.value)}
          className="block w-full rounded-lg border bg-background p-2 text-sm"
          placeholder="Solicite dados para negociar condições, sem confirmar pedido ou pagamento." />
      </label>
      <Button type="button" size="sm" disabled={saving} onClick={() => void save()}>
        {saving ? "Salvando..." : "Salvar atendimento"}
      </Button>
    </div>
    <p className="text-xs text-muted-foreground">
      Mudar a situação não aprova pagamento, estoque, entrega, repasse ou faturamento.
    </p>
  </article>;
}

/** Owner-only view; server function enforces owner privileges independently. */
export function RubiBusinessQuotesAdmin() {
  const load = useServerFn(getHubBusinessQuotesAdmin);
  const save = useServerFn(updateHubBusinessQuoteAdmin);
  const client = useQueryClient();
  const quotes = useQuery({ queryKey: ["admin-hub-business-quotes"], queryFn: () => load(), staleTime: 60_000 });
  const mutation = useMutation({
    mutationFn: (values: { quoteId: string; status: "requested" | "reviewing" | "responded" | "closed"; ownerNote: string }) =>
      save({ data: values }),
    onSuccess: () => { toast.success("Atendimento atualizado."); void client.invalidateQueries({ queryKey: ["admin-hub-business-quotes"] }); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a cotação."),
  });
  return <section aria-label="RUBI Business · Solicitações de cotação" className="space-y-4 rounded-3xl border border-primary/25 bg-card/80 p-6">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="text-2xl font-black">RUBI Business · Atendimento de cotações</h2>
        <p className="text-sm text-muted-foreground">
          Lojistas aprovados podem solicitar uma cotação; revise as condições e responda aqui.
          Cada registro é apenas uma solicitação comercial, nunca pedido faturado.
        </p>
      </div>
      <Button variant="outline" size="sm" type="button" disabled={quotes.isFetching} onClick={() => void quotes.refetch()}>Atualizar fila</Button>
    </div>
    {quotes.isLoading && <p role="status">Buscando solicitações...</p>}
    {quotes.isError && <p role="alert" className="text-sm text-destructive">Não foi possível consultar as solicitações B2B. Confirme a migração no Supabase.</p>}
    {quotes.data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma solicitação de cotação registrada.</p>}
    {quotes.data && quotes.data.length > 0 && <div className="max-h-[620px] space-y-3 overflow-y-auto">
      {(quotes.data as QuoteAdmin[]).map(quote => <QuoteAdminItem key={quote.id} quote={quote}
        update={async (id, status, note) => { await mutation.mutateAsync({ quoteId: id, status, ownerNote: note }); }} />)}
      {quotes.data.length === 100 && <p className="text-xs text-muted-foreground">Exibindo as 100 solicitações mais recentes. Paginação ficará para uma etapa específica.</p>}
    </div>}
  </section>;
}

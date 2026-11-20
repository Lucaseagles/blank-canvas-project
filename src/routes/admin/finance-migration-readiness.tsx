import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLegacyFinanceMigrationReadiness } from "@/lib/rubi-legacy-finance-readiness.functions";

export const Route = createFileRoute("/admin/finance-migration-readiness")({
  component: FinanceMigrationReadiness,
});

function FinanceMigrationReadiness() {
  const load = useServerFn(getLegacyFinanceMigrationReadiness);
  const query = useQuery({
    queryKey: ["rubi-legacy-finance-migration-readiness"],
    queryFn: () => load(),
    retry: false,
  });
  const result = query.data;

  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-28">
    <header className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">Shadow Master · Controle financeiro</p>
      <h1 className="text-3xl font-black">Prontidão da migração financeira</h1>
      <p className="text-muted-foreground">Prévia somente leitura do subledger legado de parceiros. Nenhum dado é migrado ou alterado nesta tela.</p>
    </header>
    {query.isLoading && <p role="status">Analisando registros financeiros legados...</p>}
    {query.isError && <div role="alert" className="rounded-xl border p-4">Não foi possível carregar a prévia. Verifique o acesso Master e tente novamente.</div>}
    {result && <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Resumo da prontidão">
        {[
          ["Vendas com comissão", result.commissionSales],
          ["Itens de repasse", result.payoutItems],
          ["Vendas sem moeda", result.salesMissingCurrency],
          ["Repasses sem moeda", result.payoutItemsMissingCurrency],
          ["Itens órfãos", result.orphanPayoutItems],
          ["Repasses com liquidação bancária verificada", result.bankVerifiedPayoutItems],
        ].map(([label, value]) => <article key={label} className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-black tabular-nums">{value}</p>
        </article>)}
      </section>
      <section role="status" className="rounded-xl border p-5 space-y-2">
        <h2 className="text-lg font-bold">{result.status === "empty" ? "Subledger sem registros" : result.status === "blocked" ? "Migração bloqueada" : "Revisão manual obrigatória"}</h2>
        <p className="text-sm text-muted-foreground">{result.note}</p>
        {result.status === "blocked" && <p className="text-sm">Existem campos essenciais ausentes ou referências inconsistentes. Nenhum valor deve ser convertido ou importado automaticamente.</p>}
        {result.status === "review_required" && <p className="text-sm">Os dados estruturais permitem avançar para revisão, mas isso não equivale a autorização de migração nem a confirmação de pagamentos externos.</p>}
      </section>
    </>}
  </main>;
}

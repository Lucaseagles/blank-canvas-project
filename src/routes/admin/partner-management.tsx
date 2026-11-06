import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, ClipboardCheck, FileText, Handshake, Receipt, Wallet } from "lucide-react";

export const Route = createFileRoute("/admin/partner-management")({ component: PartnerManagement });

const sections = [
  { title: "Resumo financeiro", description: "Vendas confirmadas, comissões calculadas, pagas e pendentes por parceiro.", to: "/admin/partner-finance", icon: BarChart3 },
  { title: "Acordos comerciais", description: "Percentuais e condições comerciais negociadas para cada parceiro.", to: "/admin/partner-agreements", icon: Handshake },
  { title: "Conciliação de vendas", description: "Registrar pedidos reais confirmados no checkout do fornecedor.", to: "/admin/partner-sales", icon: ClipboardCheck },
  { title: "Histórico financeiro", description: "Consultar vendas confirmadas e comissões por parceiro.", to: "/admin/partner-finance-history", icon: FileText },
  { title: "Pagamentos de comissões", description: "Consultar baixas e registrar transferências já realizadas.", to: "/admin/partner-payouts", icon: Wallet },
] as const;

function PartnerManagement() {
  return <main className="mx-auto max-w-6xl space-y-8 px-4 py-24">
    <header className="space-y-3">
      <p className="text-xs font-black uppercase tracking-widest text-primary">Shadow Master · Hub Eagles</p>
      <h1 className="text-3xl font-black sm:text-4xl">Central de parceiros</h1>
      <p className="max-w-3xl text-muted-foreground">Acesse os módulos de acordos, vendas e comissões em um só lugar. Esta central usa a proteção de acesso do painel administrativo; cada operação financeira também exige autorização no servidor.</p>
    </header>
    <section aria-label="Gestão comercial e financeira" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {sections.map(section => <Link key={section.to} to={section.to} className="group flex min-h-44 flex-col gap-3 rounded-2xl border bg-card p-6 transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <section.icon aria-hidden="true" className="h-6 w-6 text-primary" />
        <h2 className="text-lg font-bold group-hover:text-primary">{section.title}</h2>
        <p className="text-sm text-muted-foreground">{section.description}</p>
      </Link>)}
    </section>
    <aside className="rounded-xl border p-5 text-sm text-muted-foreground">
      <div className="flex items-center gap-2 font-semibold text-foreground"><Receipt aria-hidden="true" className="h-4 w-4" /> Regras de conciliação</div>
      <p className="mt-2">Visitas não comprovam vendas. Comissões calculadas não são pagamentos. Uma baixa só deve ser registrada após confirmação de transferência real.</p>
    </aside>
  </main>;
}

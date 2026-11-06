import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createMyPartnerReferralLink, getMyPartnerReferralLinks } from "@/lib/partner-referrals.functions";
import { toast } from "sonner";
import { getMyPartnerVisitStats } from "@/lib/partner-visit-stats.functions";
import { getMyPartnerSalesSummary } from "@/lib/partner-sales-summary.functions";
import { getMyPartnerCommissionStatus } from "@/lib/partner-commission-status.functions";
import { getMyPartnerUnreadFinancialNotificationCount } from "@/lib/partner-financial-notifications.functions";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyPartnerPortal } from "@/lib/partner-portal.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/partner/portal")({ component: PartnerPortal });

type Product = { id: string; title: string; description: string | null; image_url: string | null; category: string | null; retail_price: number };
function PartnerPortal() {
  const load = useServerFn(getMyPartnerPortal);
  const loadUnread = useServerFn(getMyPartnerUnreadFinancialNotificationCount);
  const unreadQuery = useQuery({ queryKey: ["my-partner-unread-financial-notifications"], queryFn: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Entre na sua conta.");
    return loadUnread({ data: { accessToken: session.access_token } });
  }, retry: false });
  const loadCommissions = useServerFn(getMyPartnerCommissionStatus);
  const commissionsQuery = useQuery({ queryKey: ["my-partner-commission-status"], queryFn: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Entre na sua conta.");
    return loadCommissions({ data: { accessToken: session.access_token } });
  }, retry: false });
  const loadSales = useServerFn(getMyPartnerSalesSummary);
  const salesQuery = useQuery({ queryKey: ["my-partner-confirmed-sales"], queryFn: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Entre na sua conta.");
    return loadSales({ data: { accessToken: session.access_token } });
  }, retry: false });
  const loadStats = useServerFn(getMyPartnerVisitStats);
  const statsQuery = useQuery({ queryKey: ["my-partner-visit-stats"], queryFn: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Entre na sua conta.");
    return loadStats({ data: { accessToken: session.access_token } });
  }, retry: false });
  const loadLinks = useServerFn(getMyPartnerReferralLinks);
  const createLink = useServerFn(createMyPartnerReferralLink);
  const queryClient = useQueryClient();
  const linksQuery = useQuery({ queryKey: ["my-partner-links"], queryFn: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return [];
    return loadLinks({ data: { accessToken: session.access_token } });
  }, retry: false });
  const generate = useMutation({ mutationFn: async (productId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Entre na sua conta.");
    return createLink({ data: { accessToken: session.access_token, productId } });
  }, onSuccess: () => { toast.success("Link individual gerado."); void queryClient.invalidateQueries({ queryKey: ["my-partner-links"] }); }, onError: (error: Error) => toast.error(error.message) });
  const query = useQuery({
    queryKey: ["my-partner-portal"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Entre na sua conta para acessar o portal de parceiros.");
      return load({ data: { accessToken: session.access_token } });
    },
    retry: false,
  });
  const profile = query.data?.profile;
  const products = (query.data?.products ?? []) as Product[];
  return <main className="mx-auto max-w-6xl space-y-8 px-4 py-28">
    <header className="space-y-3">
      <p className="text-xs font-black uppercase tracking-widest text-primary">RUBI · Parceiros</p>
      <h1 className="text-4xl font-black">Seu portal de parceiros</h1>
      <p className="text-muted-foreground">Produtos autorizados individualmente pelo Admin Master. Acesso exclusivo à sua conta.</p>
    </header>
    {query.isLoading && <p role="status">Carregando seu portal...</p>}
    {query.isError && <div role="alert" className="space-y-3 rounded-2xl border p-6">
      <p>{query.error instanceof Error ? query.error.message : "Não foi possível carregar o portal."}</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
        <Button asChild variant="outline"><Link to="/auth" search={{ returnTo: "/partner/portal", audience: "partner", ref: undefined, campaign_id: undefined }}>Entrar na conta</Link></Button>
      </div>
    </div>}
    {!query.isLoading && !query.isError && !profile && <div className="rounded-2xl border p-6 space-y-3">
      <p>Você ainda não possui um cadastro de parceiro.</p>
      <Button asChild><Link to="/onboarding" search={{ audience: "partner", returnTo: "/partner/portal" }}>Solicitar cadastro</Link></Button>
    </div>}
    {profile && profile.status !== "approved" && <div className="rounded-2xl border p-6 space-y-2">
      <h2 className="text-xl font-bold">Cadastro {profile.status === "pending" ? "em análise" : "não aprovado"}</h2>
      <p className="text-muted-foreground">Os produtos só são liberados após aprovação comercial.</p>
    </div>}
    {profile?.status === "approved" && <>
      <p className="text-sm text-muted-foreground">Bem-vindo, {profile.display_name}. {products.length} produtos autorizados.</p>
      <section aria-label="Resumo das visitas" className="space-y-3">
        <h2 className="text-2xl font-bold">Seu desempenho</h2>
        {statsQuery.isLoading && <p role="status">Carregando indicadores...</p>}
        {statsQuery.isError && <div role="alert"><p>Não foi possível consultar as visitas.</p><Button variant="outline" onClick={() => void statsQuery.refetch()}>Tentar novamente</Button></div>}
        {statsQuery.data && <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Links de produtos disponíveis</p><p className="text-3xl font-black">{statsQuery.data.links}</p></div>
          <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Visitas dos links disponíveis</p><p className="text-3xl font-black">{statsQuery.data.visits}</p></div>
        </div>}
        <p className="text-xs text-muted-foreground">Os indicadores de links e visitas incluem apenas ofertas atualmente disponíveis e autorizadas. Visitas históricas de ofertas revogadas permanecem registradas, mas não entram nesses indicadores. Visitas não representam compradores únicos, pedidos pagos ou comissões.</p>
      </section>
      <section aria-label="Vendas confirmadas" className="space-y-3">
        <h2 className="text-2xl font-bold">Vendas e comissões confirmadas</h2>
        {salesQuery.isLoading && <p role="status">Carregando vendas confirmadas...</p>}
        {salesQuery.isError && <div role="alert"><p>Não foi possível consultar as vendas.</p><Button variant="outline" onClick={() => void salesQuery.refetch()}>Tentar novamente</Button></div>}
        {salesQuery.data && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Vendas confirmadas</p><p className="text-3xl font-black">{salesQuery.data.sales}</p></div>
          <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Valor das vendas</p><p className="text-2xl font-black">{Number(salesQuery.data.grossAmount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>
          <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Comissões registradas</p><p className="text-2xl font-black">{Number(salesQuery.data.commissionAmount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>
          <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Acordo ativo</p><p className="text-2xl font-black">{salesQuery.data.agreementPercent === null ? "Não definido" : `${salesQuery.data.agreementPercent}%`}</p></div>
        </div>}
        <p className="text-xs text-muted-foreground">Somente pedidos confirmados por fonte confiável. Comissões registradas não significam pagamento realizado.</p>
      </section>
      <div className="flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/partner/statement">Ver meu extrato de comissões</Link></Button><Button asChild variant="outline"><Link to="/partner/notifications">Notificações financeiras{unreadQuery.data && unreadQuery.data.unread > 0 ? ` (${unreadQuery.data.unread})` : ""}</Link></Button></div>
      <section aria-label="Situação das comissões" className="space-y-3">
        <h2 className="text-2xl font-bold">Situação das suas comissões</h2>
        {commissionsQuery.isLoading && <p role="status">Carregando comissões...</p>}
        {commissionsQuery.isError && <div role="alert"><p>Não foi possível consultar suas comissões.</p><Button variant="outline" onClick={() => void commissionsQuery.refetch()}>Tentar novamente</Button></div>}
        {commissionsQuery.data && <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Comissões calculadas</p><p className="text-2xl font-black">{Number(commissionsQuery.data.calculated).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>
          <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Comissões pagas</p><p className="text-2xl font-black">{Number(commissionsQuery.data.paid).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>
          <div className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Comissões pendentes</p><p className="text-2xl font-black">{Number(commissionsQuery.data.pending).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>
        </div>}
        <p className="text-xs text-muted-foreground">Comissões pagas são valores com baixa registrada pelo financeiro. Pagamentos parciais continuam pendentes até a quitação integral da comissão; visitas não geram comissão automaticamente.</p>
      </section>
      {products.length === 0 && <p className="rounded-2xl border p-6">Nenhum produto liberado para seu perfil no momento.</p>}
      <section aria-label="Produtos autorizados" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map(product => <article key={product.id} className="overflow-hidden rounded-2xl border bg-card">
          {product.image_url && <img src={product.image_url} alt={product.title} loading="lazy" className="aspect-video w-full object-cover" />}
          <div className="space-y-3 p-5">
            <p className="text-xs uppercase text-primary">{product.category ?? "RUBI"}</p>
            <h2 className="text-xl font-bold">{product.title}</h2>
            {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
            <p className="text-lg font-semibold">{Number(product.retail_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            {(() => { const link = (linksQuery.data ?? []).find((item: { product_id: string; code: string }) => item.product_id === product.id); return link ? <div className="space-y-2"><p className="text-xs text-muted-foreground">Seu link individual de divulgação:</p><code className="block break-all text-xs">{typeof window !== "undefined" ? `${window.location.origin}/r/${link.code}` : `/r/${link.code}`}</code><Button variant="outline" size="sm" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/r/${link.code}`).then(() => toast.success("Link copiado."))}>Copiar link</Button></div> : <Button size="sm" disabled={generate.isPending || linksQuery.isLoading} onClick={() => generate.mutate(product.id)}>Gerar meu link</Button>; })()}
            {statsQuery.data && <p className="text-sm font-semibold">Visitas do link disponível: {statsQuery.data.byProduct.find((item: { productId: string; visits: number }) => item.productId === product.id)?.visits ?? 0}</p>}
            <p className="text-xs text-muted-foreground">O link identifica a origem da visita. Vendas e comissões dependem de confirmação do checkout.</p>
          </div>
        </article>)}
      </section>
    </>}
  </main>;
}

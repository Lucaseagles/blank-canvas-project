import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHubCatalogAdmin, saveHubProductAdmin, saveHubSupplierAdmin, saveHubB2BTierAdmin } from "@/lib/hub-catalog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { GROWTH_PILLARS, GROWTH_STRATEGIES, GROWTH_11X_TARGETS, type GrowthPillar } from "@/lib/rubi-growth-11x";
import { RubiAdminOfferPreview } from "@/components/store/RubiAdminOfferPreview";
import { getRubiGrowthFunnelAdmin } from "@/lib/rubi-growth-funnel.functions";
import { getRubiCommercialPulseAdmin } from "@/lib/rubi-commercial-pulse.functions";
import { RubiOrganicLinkBuilder } from "@/components/store/RubiOrganicLinkBuilder";
import { getRubiOrganicCampaignPerformanceAdmin } from "@/lib/rubi-organic-performance.functions";
import { RubiBusinessQuotesAdmin } from "@/components/business/RubiBusinessQuotesAdmin";
import { RubiCreatorTeamsAdmin } from "@/components/partner/RubiCreatorTeamsAdmin";
import { RubiCreatorTeamMembersAdmin } from "@/components/partner/RubiCreatorTeamMembersAdmin";
import { RubiCreatorTeamPerformanceAdmin } from "@/components/partner/RubiCreatorTeamPerformanceAdmin";
import { RubiTeamCampaignAssignmentsAdmin } from "@/components/partner/RubiTeamCampaignAssignmentsAdmin";
import { RubiTeamOfferKitAdmin } from "@/components/partner/RubiTeamOfferKitAdmin";
import { RubiCreativeLibraryAdmin } from "@/components/store/RubiCreativeLibraryAdmin";
import { RubiTeamPublicationsAdmin } from "@/components/partner/RubiTeamPublicationsAdmin";
import { RubiCreatorPublicationAuditAdmin } from "@/components/partner/RubiCreatorPublicationAuditAdmin";
import { RubiConnectedCommercialFlowAdmin } from "@/components/admin/RubiConnectedCommercialFlowAdmin";
import { RubiCreatorTaggedVisitsAdmin } from "@/components/partner/RubiCreatorTaggedVisitsAdmin";
import { RubiReferralTrafficQualityAdmin } from "@/components/partner/RubiReferralTrafficQualityAdmin";
import { RubiBusinessRetentionAdmin } from "@/components/business/RubiBusinessRetentionAdmin";
import { RubiBusinessFollowupsAdmin } from "@/components/business/RubiBusinessFollowupsAdmin";
import { RubiOfferEngineAdmin } from "@/components/store/RubiOfferEngineAdmin";
import { RubiComplementaryOffersAdmin } from "@/components/store/RubiComplementaryOffersAdmin";
import { RubiMovementEngineAdmin } from "@/components/store/RubiMovementEngineAdmin";
import { RubiLaunchReadinessAdmin } from "@/components/store/RubiLaunchReadinessAdmin";
import { RubiLaunchQaAdmin } from "@/components/store/RubiLaunchQaAdmin";
import { RubiSupplierCsvAdmin } from "@/components/store/RubiSupplierCsvAdmin";
import { RubiProductStoriesAdmin } from "@/components/store/RubiProductStoriesAdmin";
import { RubiStorefrontSectionsAdmin } from "@/components/store/RubiStorefrontSectionsAdmin";
import { RubiEditorialMetricsAdmin } from "@/components/store/RubiEditorialMetricsAdmin";
import { approvedRubiCheckout } from "@/lib/rubi-checkout-validation";

export const Route = createFileRoute("/admin/hub-catalog")({ component: HubCatalogAdmin });

type Supplier = { id: string; name: string; active: boolean; checkout_host: string | null; fulfillment_mode: "supplier" | "hub" };
type Product = {
  id: string; title: string; description: string | null; image_url: string | null;
  category: string | null; sku: string | null; supplier_id: string;
  retail_price: number; supplier_cost: number; b2b_base_price: number | null;
  min_b2b_quantity: number; active: boolean; checkout_url: string | null; checkout_verified: boolean;
};
type ProductForm = {
  id?: string; title: string; description: string; image_url: string;
  category: string; sku: string; supplier_id: string; retail_price: string;
  supplier_cost: string; b2b_base_price: string; min_b2b_quantity: string; active: boolean; checkout_url: string; checkout_verified: boolean;
};
const emptyForm = (): ProductForm => ({
  title: "", description: "", image_url: "", category: "", sku: "",
  supplier_id: "", retail_price: "", supplier_cost: "",
  b2b_base_price: "", min_b2b_quantity: "1", active: false, checkout_url: "", checkout_verified: false,
});
const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function HubCatalogAdmin() {
  const queryClient = useQueryClient();
  const load = useServerFn(getHubCatalogAdmin);
  const save = useServerFn(saveHubProductAdmin);
  const saveSupplier = useServerFn(saveHubSupplierAdmin);
  const saveTier = useServerFn(saveHubB2BTierAdmin);
  const [tierProductId, setTierProductId] = useState("");
  const [tierQuantity, setTierQuantity] = useState("");
  const [tierPrice, setTierPrice] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [supplierCheckoutHost, setSupplierCheckoutHost] = useState("");
  const [supplierMode, setSupplierMode] = useState<"supplier" | "hub">("supplier");
  const query = useQuery({ queryKey: ["admin-hub-catalog"], queryFn: () => load() });
  const loadGrowthFunnel = useServerFn(getRubiGrowthFunnelAdmin);
  const funnel = useQuery({ queryKey: ["admin-rubi-growth-11x-funnel-30d"], queryFn: () => loadGrowthFunnel(), staleTime: 60_000 });
  const loadCommercialPulse = useServerFn(getRubiCommercialPulseAdmin);
  const commercialPulse = useQuery({ queryKey: ["admin-rubi11x-commercial-pulse-30d"], queryFn: () => loadCommercialPulse(), staleTime: 60_000 });
  const loadOrganicPerformance = useServerFn(getRubiOrganicCampaignPerformanceAdmin);
  const organicPerformance = useQuery({ queryKey: ["admin-rubi11x-organic-campaign-performance"], queryFn: () => loadOrganicPerformance(), staleTime: 60_000 });

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [strategyPillar, setStrategyPillar] = useState<GrowthPillar | "all">("all");
  const filteredStrategies = GROWTH_STRATEGIES.filter(item => strategyPillar === "all" || item.pillar === strategyPillar);

  const suppliers = (query.data?.suppliers ?? []) as Supplier[];
  const products = (query.data?.products ?? []) as Product[];
  const tiers = (query.data?.tiers ?? []) as Array<{ id: string; product_id: string; min_quantity: number; unit_price: number }>;
  const publishedCount = products.filter(product => {
    const supplier = suppliers.find(item => item.id === product.supplier_id);
    return product.active && !!approvedRubiCheckout({
      checkout_url: product.checkout_url,
      checkout_verified: product.checkout_verified,
      hub_suppliers: supplier ? { active: supplier.active, checkout_host: supplier.checkout_host } : null,
    });
  }).length;
  const wholesaleCount = products.filter(product => product.active && Number(product.b2b_base_price) > 0).length;

  const mutation = useMutation({
    mutationFn: () => {
      if (!form.supplier_id || !form.title.trim()) throw new Error("Informe o fornecedor e o nome do produto.");
      if (!form.retail_price.trim() || !form.supplier_cost.trim()) throw new Error("Informe os preços reais de varejo e de custo.");
      const retail = Number(form.retail_price);
      const cost = Number(form.supplier_cost);
      const b2b = form.b2b_base_price.trim() === "" ? null : Number(form.b2b_base_price);
      const minimum = Number(form.min_b2b_quantity);
      if (![retail, cost, ...(b2b === null ? [] : [b2b])].every(n => Number.isFinite(n) && n >= 0)) {
        throw new Error("Os preços precisam ser valores numéricos válidos e não negativos.");
      }
      if (!Number.isSafeInteger(minimum) || minimum < 1) throw new Error("A quantidade mínima deve ser um inteiro positivo.");
      if (form.active && (retail <= 0 || (b2b !== null && b2b <= 0))) {
        throw new Error("Para publicar, informe preços de venda maiores que zero.");
      }
      return save({ data: {
        ...(form.id ? { id: form.id } : {}),
        supplier_id: form.supplier_id, title: form.title.trim(),
        description: form.description.trim(), image_url: form.image_url.trim(),
        category: form.category.trim(), sku: form.sku.trim(),
        retail_price: retail, supplier_cost: cost, b2b_base_price: b2b,
        min_b2b_quantity: minimum, active: form.active,
        checkout_url: form.checkout_url.trim(), checkout_verified: form.checkout_verified,
      } });
    },
    onSuccess: () => {
      toast.success(form.id ? "Produto atualizado" : "Produto cadastrado");
      void queryClient.invalidateQueries({ queryKey: ["admin-hub-catalog"] });
      setForm(emptyForm());
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const supplierMutation = useMutation({
    mutationFn: () => saveSupplier({ data: { ...(supplierId ? { id: supplierId } : {}), name: supplierName.trim(), fulfillment_mode: supplierMode, active: true, checkout_host: supplierCheckoutHost.trim() || null } }),
    onSuccess: () => {
      toast.success("Fornecedor salvo. Confira a aprovação dos links antes de publicar.");
      setSupplierName("");
      setSupplierId("");
      setSupplierCheckoutHost("");
      setSupplierMode("supplier");
      void queryClient.invalidateQueries({ queryKey: ["admin-hub-catalog"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const tierMutation = useMutation({
    mutationFn: () => {
      const min_quantity = Number(tierQuantity);
      const unit_price = Number(tierPrice);
      if (!tierProductId || !Number.isSafeInteger(min_quantity) || min_quantity < 1 || !Number.isFinite(unit_price) || unit_price <= 0) {
        throw new Error("Selecione um produto e informe quantidade e preço válidos.");
      }
      return saveTier({ data: { product_id: tierProductId, min_quantity, unit_price } });
    },
    onSuccess: () => {
      toast.success("Faixa de preço salva");
      setTierQuantity("");
      setTierPrice("");
      void queryClient.invalidateQueries({ queryKey: ["admin-hub-catalog"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const edit = (product: Product) => {
    setForm({
      id: product.id, title: product.title, description: product.description ?? "",
      image_url: product.image_url ?? "", category: product.category ?? "",
      sku: product.sku ?? "", supplier_id: product.supplier_id,
      retail_price: String(product.retail_price), supplier_cost: String(product.supplier_cost),
      b2b_base_price: product.b2b_base_price === null ? "" : String(product.b2b_base_price),
      min_b2b_quantity: String(product.min_b2b_quantity), active: product.active,
      checkout_url: product.checkout_url ?? "", checkout_verified: product.checkout_verified,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Simulação comercial a partir do custo informado pelo fornecedor; nunca equivale a lucro líquido.
  const hasMarginInputs = form.retail_price.trim() !== "" && form.supplier_cost.trim() !== "";
  const previewRetail = Number(form.retail_price);
  const previewCost = Number(form.supplier_cost);
  const previewB2B = form.b2b_base_price.trim() ? Number(form.b2b_base_price) : null;
  const previewMinimum = Number(form.min_b2b_quantity);
  const previewReady = hasMarginInputs && Number.isFinite(previewRetail) && previewRetail >= 0
    && Number.isFinite(previewCost) && previewCost >= 0;
  const previewRetailMargin = previewRetail - previewCost;
  const previewWholesaleMargin = previewB2B === null ? null : previewB2B - previewCost;
  const previewPartnerMargin = previewRetailMargin / 2;

  const field = (key: keyof Omit<ProductForm, "id" | "active" | "checkout_verified">, label: string, type = "text") => (
    <label className="space-y-2 text-sm font-medium">
      <span className="block">{label}</span>
      <Input
        type={type}
        required={["title", "retail_price", "supplier_cost", "min_b2b_quantity"].includes(key)}
        min={type === "number" ? (key === "min_b2b_quantity" ? 1 : 0) : undefined}
        step={type === "number" ? (key === "min_b2b_quantity" ? 1 : "0.01") : undefined}
        value={form[key]}
        onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))}
      />
    </label>
  );

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-28">
      <header>
        <p className="text-xs font-black uppercase tracking-widest text-primary">RUBI · Shadow Master</p>
        <h1 className="mt-3 text-4xl font-black">Catálogo & fornecedores</h1>
        <p className="mt-3 text-muted-foreground">Cadastre uma vez, defina varejo e atacado, e publique para o público correto. Preços de custo são privados; use apenas dados confirmados pelo fornecedor.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Resumo do catálogo">
          <div className="rounded-2xl border bg-card/70 p-4"><p className="text-sm text-muted-foreground">Produtos cadastrados</p><p className="text-3xl font-black">{products.length}</p></div>
          <div className="rounded-2xl border bg-card/70 p-4"><p className="text-sm text-muted-foreground">Publicados no varejo</p><p className="text-3xl font-black">{publishedCount}</p></div>
          <div className="rounded-2xl border bg-card/70 p-4"><p className="text-sm text-muted-foreground">Disponíveis no atacado</p><p className="text-3xl font-black">{wholesaleCount}</p></div>
        </div>
      </header>
      <RubiSupplierCsvAdmin suppliers={suppliers} />
      <RubiProductStoriesAdmin products={products} />
      <RubiStorefrontSectionsAdmin products={products} />
      <RubiEditorialMetricsAdmin />
      <RubiLaunchReadinessAdmin />
      <RubiLaunchQaAdmin products={products} />
      <div id="rubi-movement-entry" className="scroll-mt-24"><RubiMovementEngineAdmin products={products} /></div>
      <RubiOfferEngineAdmin products={products} />
      <RubiComplementaryOffersAdmin products={products} />
      <RubiOrganicLinkBuilder products={products} />
      <section aria-label="RUBI 11× · Desempenho de campanhas por produto" className="space-y-4 rounded-3xl border border-primary/25 bg-card/80 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary">Orgânico · Resultados observados</p>
            <h2 className="mt-1 text-2xl font-black">Campanhas e produtos · Últimos 30 dias</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Compara visualizações registradas, sessões com visualização e saídas ao checkout oficial por canal, campanha e produto.
              Não são pedidos, receitas nem taxas de conversão de compradores. As contagens podem incluir eventos repetidos na mesma sessão.
            </p>
          </div>
          <Button type="button" size="sm" variant="outline" disabled={organicPerformance.isFetching} onClick={() => void organicPerformance.refetch()}>
            {organicPerformance.isFetching ? "Atualizando..." : "Atualizar campanhas"}
          </Button>
        </div>
        {organicPerformance.isLoading && <p role="status" className="text-sm">Carregando desempenho das campanhas...</p>}
        {organicPerformance.isError && <p role="alert" className="text-sm text-destructive">
          Não foi possível consultar o relatório. Confirme se a migração de métricas foi aplicada; nenhum valor será estimado.
        </p>}
        {organicPerformance.data && (organicPerformance.data.rows.length === 0
          ? <p className="rounded-xl border p-4 text-sm text-muted-foreground">Nenhum evento orgânico de produto encontrado neste período. Os dados surgirão após o aplicativo receber campanhas e visitas reais.</p>
          : <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3">Produto</th>
                    <th className="p-3">Canal</th>
                    <th className="p-3">Campanha</th>
                    <th className="p-3 text-right">Visualizações</th>
                    <th className="p-3 text-right">Sessões com visita</th>
                    <th className="p-3 text-right">Saídas ao checkout</th>
                  </tr>
                </thead>
                <tbody>
                  {organicPerformance.data.rows.map((row) => <tr key={row.productId + ":" + row.channel + ":" + row.campaign} className="border-t">
                    <td className="max-w-[250px] break-words p-3 font-semibold">{row.productTitle}</td>
                    <td className="p-3">{row.channel}</td>
                    <td className="max-w-[200px] break-all p-3">{row.campaign}</td>
                    <td className="p-3 text-right tabular-nums">{row.viewEvents.toLocaleString("pt-BR")}</td>
                    <td className="p-3 text-right tabular-nums">{row.viewSessions.toLocaleString("pt-BR")}</td>
                    <td className="p-3 text-right tabular-nums">{row.checkoutIntents.toLocaleString("pt-BR")}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
        )}
        {organicPerformance.data && <p className="text-xs text-muted-foreground">
          Consultado em {new Date(organicPerformance.data.asOf).toLocaleString("pt-BR")}. Exibindo até {organicPerformance.data.cappedAt} combinações de campanha/produto ordenadas por visualizações. Não equivale a relatório de pagamentos Kairos, comissões ou visitantes únicos.
        </p>}
      </section>

      <section aria-label="RUBI 11× · Plano de crescimento integrado" className="space-y-5 rounded-3xl border border-primary/25 bg-card/80 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary">RUBI 11× · Planejamento operacional</p>
            <h2 className="mt-2 text-2xl font-black">35 estratégias conectadas aos cinco pilares</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Matriz auditável de iniciativas, destinos e métricas. Presença de código não significa funcionamento testado nem resultado comercial. Metas 11× são alvos, não dados reais.</p>
          </div>
          <span className="rounded-full border border-primary/30 px-3 py-2 text-xs font-semibold">{GROWTH_STRATEGIES.length} iniciativas mapeadas</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Metas condicionais do mês 12">
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Parceiros que vendem</p><p className="text-2xl font-black">{GROWTH_11X_TARGETS.partnersSelling.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">{GROWTH_11X_TARGETS.monthlyOrdersPerSeller} vendas/mês cada</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Lojistas compradores</p><p className="text-2xl font-black">{GROWTH_11X_TARGETS.buyingMerchants.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">{GROWTH_11X_TARGETS.unitsPerMerchant} unidades/mês cada</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Pedidos diretos Store</p><p className="text-2xl font-black">{GROWTH_11X_TARGETS.directStoreOrders.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Meta, não pedidos confirmados</p></div>
          <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Conversões marketplaces</p><p className="text-2xl font-black">{GROWTH_11X_TARGETS.marketplaceConversions.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Depende de atribuição externa</p></div>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {GROWTH_PILLARS.map(pillar => <div key={pillar.id} className="rounded-xl border p-3"><p className="font-semibold">{pillar.label}</p><p className="mt-2 text-xs text-muted-foreground">{pillar.objective}</p></div>)}
        </div>
        <label className="flex flex-wrap items-center gap-3 text-sm font-semibold">Filtrar pilar
          <select aria-label="Filtrar estratégias por pilar" value={strategyPillar} onChange={event => setStrategyPillar(event.target.value as GrowthPillar | "all")} className="rounded-lg border bg-background px-3 py-2">
            <option value="all">Todos os pilares</option>
            {GROWTH_PILLARS.map(pillar => <option key={pillar.id} value={pillar.id}>{pillar.label}</option>)}
          </select>
        </label>
        <div className="max-h-[450px] space-y-2 overflow-y-auto pr-1" aria-live="polite">
          {filteredStrategies.map(item => <article key={item.id} className="grid gap-2 rounded-xl border p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]">
            <div><p className="text-xs text-muted-foreground">Estratégia {String(item.id).padStart(2,"0")}</p><p className="font-semibold">{item.title}</p><p className="text-xs text-muted-foreground">Público: {item.audience}</p></div>
            <div><p className="text-sm">{item.objective}</p><p className="mt-1 text-xs text-muted-foreground">Medir: {item.metric}</p></div>
            <div><p className="text-xs font-semibold">{item.evidence === "code-observed" ? "Código identificado · não testado" : item.evidence === "external-blocker" ? "Depende de integração externa" : "Planejado · execução não comprovada"}</p><p className="mt-2 break-all text-xs text-muted-foreground">Jornada: {item.route}</p></div>
          </article>)}
        </div>
        <p className="text-xs text-muted-foreground">O painel não ativa automaticamente redes sociais, parceiros, algoritmos, pagamentos ou integrações. Valide cada etapa com tráfego, pedidos pagos e margens confirmadas antes de contabilizar resultados.</p>
      </section>
      <RubiBusinessRetentionAdmin />
      <RubiBusinessFollowupsAdmin />
      <RubiConnectedCommercialFlowAdmin />
      <div id="rubi-team-entry" className="scroll-mt-24"><RubiCreatorTeamsAdmin /></div>
        <div id="rubi-team-members-entry" className="scroll-mt-24"><RubiCreatorTeamMembersAdmin /></div>
        <RubiCreatorTeamPerformanceAdmin />
        <div id="rubi-team-campaign-entry" className="scroll-mt-24"><RubiTeamCampaignAssignmentsAdmin /></div>
        <RubiTeamOfferKitAdmin />
        <RubiCreativeLibraryAdmin />
        <div id="rubi-team-publications-entry" className="scroll-mt-24"><RubiTeamPublicationsAdmin /></div>
        <div id="rubi-team-publication-audit-entry" className="scroll-mt-24"><RubiCreatorPublicationAuditAdmin />
        <RubiCreatorTaggedVisitsAdmin />
        <RubiReferralTrafficQualityAdmin /></div>
        <RubiBusinessQuotesAdmin />
      <section aria-label="RUBI 11× · Indicadores comerciais reais" className="space-y-4 rounded-3xl border border-primary/25 bg-card/80 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary">Dados observados · Admin Master</p>
            <h2 className="mt-1 text-2xl font-black">RUBI 11× · Operação nos três logins</h2>
            <p className="mt-2 text-sm text-muted-foreground">Indicadores extraídos do banco, separados das metas 11×. Perfis não são necessariamente pessoas únicas, links não são parceiros vendedores e pedidos confirmados não significam repasses liquidados.</p>
          </div>
          <Button type="button" size="sm" variant="outline" disabled={commercialPulse.isFetching} onClick={() => void commercialPulse.refetch()}>Atualizar dados</Button>
        </div>
        {commercialPulse.isLoading && <p role="status">Buscando indicadores comerciais...</p>}
        {commercialPulse.isError && <p role="alert" className="text-sm text-destructive">Falha ao consultar dados comerciais. Nenhum zero foi presumido; tente atualizar.</p>}
        {commercialPulse.data && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { title: "Consumidor", items: [
                ["Perfis cadastrados", commercialPulse.data.consumer.profiles],
                ["Novos perfis (30 dias)", commercialPulse.data.consumer.newProfiles30d],
              ] },
              { title: "Business · Lojistas", items: [
                ["Perfis registrados", commercialPulse.data.merchant.profiles],
                ["Aguardando aprovação", commercialPulse.data.merchant.pending],
                ["Aprovados", commercialPulse.data.merchant.approved],
                ["Novos perfis (30 dias)", commercialPulse.data.merchant.newProfiles30d],
                ["Produtos B2B configurados", commercialPulse.data.merchant.b2bCatalogConfigured],
              ] },
              { title: "Partners", items: [
                ["Perfis registrados", commercialPulse.data.partner.profiles],
                ["Aguardando aprovação", commercialPulse.data.partner.pending],
                ["Aprovados", commercialPulse.data.partner.approved],
                ["Novos perfis (30 dias)", commercialPulse.data.partner.newProfiles30d],
                ["Links ativos", commercialPulse.data.partner.activeLinks],
                ["Visitas de indicação (30 dias)", commercialPulse.data.partner.visits30d],
                ["Pedidos de parceiro confirmados (30 dias)", commercialPulse.data.partner.confirmedSales30d],
              ] },
              { title: "RUBI Store", items: [
                ["Produtos cadastrados", commercialPulse.data.store.catalogProducts],
                ["Ofertas com checkout marcado como verificado", commercialPulse.data.store.retailCheckoutApproved],
              ] },
            ].map(group => <div key={group.title} className="space-y-3 rounded-2xl border p-4">
              <h3 className="font-bold">{group.title}</h3>
              {group.items.map(([label, value]) => <div key={String(label)} className="flex items-start justify-between gap-3 border-t pt-2 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <strong className="tabular-nums">{Number(value).toLocaleString("pt-BR")}</strong>
              </div>)}
            </div>)}
          </div>
        )}
        {commercialPulse.data && <p className="text-xs text-muted-foreground">
          Consultado em {new Date(commercialPulse.data.asOf).toLocaleString("pt-BR")} · Fluxos de compra/recorrência ainda não podem ser inferidos de simulações de preço ou cliques. A confirmação de checkout externo da Kairos e o recebimento de repasses serão validados separadamente.
        </p>}
      </section>
      <section aria-label="RUBI 11× · Funil de cadastro e instalação" className="space-y-4 rounded-3xl border border-primary/25 bg-card/80 p-6">
        <h2 className="text-2xl font-black">RUBI 11× · Sinais de ativação (últimos 30 dias)</h2>
        <p className="text-sm text-muted-foreground">Contagem de eventos observados, não de pessoas únicas, cadastros concluídos, notificações entregues, instalações verificadas ou pedidos pagos. O painel não inclui vendas como conversão.</p>
        {funnel.isLoading && <p role="status">Carregando métricas de ativação...</p>}
        {funnel.isError && <div role="alert" className="space-y-2"><p>Não foi possível carregar as métricas.</p><Button size="sm" type="button" variant="outline" onClick={() => void funnel.refetch()}>Tentar novamente</Button></div>}
        {funnel.data && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Produtos visualizados", value: funnel.data.events.RUBI_STORE_PRODUCT_VIEW },
            { label: "Convites exibidos", value: funnel.data.events.RUBI_SIGNUP_INVITE_SHOWN },
            { label: "Cliques em entrar/criar conta", value: funnel.data.signupActions.continue_to_auth },
            { label: "Guias pós-cadastro exibidos", value: funnel.data.activationActions.guide_shown },
            { label: "Cliques no sininho", value: funnel.data.activationActions.push_cta_clicked },
            { label: "Cliques para instalar", value: funnel.data.activationActions.install_cta_clicked },
            { label: "Instalações sinalizadas pelo navegador", value: funnel.data.activationActions.appinstalled_browser_event },
            { label: "Saídas para checkout externo", value: funnel.data.events.RUBI_PRECHECKOUT_CONTINUE },
          ].map(item => <div key={item.label} className="rounded-xl border p-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-black tabular-nums">{item.value.toLocaleString("pt-BR")}</p>
          </div>)}
        </div>}
        {funnel.data && <div className="space-y-3 rounded-xl border p-4">
          <h3 className="font-semibold">Visitas orgânicas por canal (últimos 30 dias)</h3>
          <p className="text-xs text-muted-foreground">Contagem de visualizações dos produtos próprios com UTM orgânica válida. São eventos, não pessoas únicas, vendas ou receita.</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {funnel.data.organicChannels.map(channel => <div key={channel.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <span>{channel.label}</span><strong className="tabular-nums">{channel.productViews.toLocaleString("pt-BR")}</strong>
            </div>)}
          </div>
        </div>}
        <p className="text-xs text-muted-foreground">As informações começam a aparecer quando as páginas atualizadas estiverem publicadas e recebendo tráfego real. Antes disso, zero não significa ausência de interesse. Para medir conversão real, ainda será necessária a conciliação do cadastro e dos pedidos confirmados.</p>
      </section>
      {query.isLoading && <p role="status">Carregando catálogo...</p>}
      {query.isError && <div role="alert" className="space-y-3"><p>Não foi possível carregar o catálogo.</p><Button variant="outline" onClick={() => void query.refetch()}>Tentar novamente</Button></div>}
      {!query.isError && (
        <>
          <section id="rubi-catalog-entry" className="scroll-mt-24 space-y-4 rounded-3xl border border-white/10 bg-card/80 p-6">
            <h2 className="text-xl font-bold">Fornecedores ({suppliers.length})</h2>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={event => { event.preventDefault(); supplierMutation.mutate(); }}>
              <label className="space-y-2 text-sm font-medium">
                <span className="block">Nome do fornecedor</span>
                <Input required minLength={2} maxLength={160} value={supplierName} onChange={event => setSupplierName(event.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span className="block">Responsável pelo envio</span>
                <select className="flex h-10 w-full rounded-md border bg-background px-3" value={supplierMode} onChange={event => setSupplierMode(event.target.value as "supplier" | "hub")}>
                  <option value="supplier">Fornecedor</option>
                  <option value="hub">Hub</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span className="block">Domínio exato de checkout autorizado (sem https://)</span>
                <Input placeholder="dominio-do-fornecedor.com.br" value={supplierCheckoutHost} onChange={event => setSupplierCheckoutHost(event.target.value)} />
              </label>
                            <Button type="submit" disabled={supplierMutation.isPending || supplierName.trim().length < 2}>
                {supplierMutation.isPending ? "Salvando..." : supplierId ? "Salvar fornecedor" : "Cadastrar fornecedor"}
              </Button>
            </form>
            {suppliers.length === 0 && <p className="text-sm text-muted-foreground">Nenhum fornecedor cadastrado.</p>}
            <ul className="space-y-2 text-sm">
              {suppliers.map(supplier => <li key={supplier.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-3"><span>{supplier.name} · <span className="text-xs text-muted-foreground">{supplier.checkout_host ?? "Sem domínio aprovado"}</span></span><Button size="sm" variant="outline" onClick={() => { setSupplierId(supplier.id); setSupplierName(supplier.name); setSupplierCheckoutHost(supplier.checkout_host ?? ""); setSupplierMode(supplier.fulfillment_mode); }}>Configurar checkout</Button></li>)}
            </ul>
          </section>
          <form onSubmit={event => { event.preventDefault(); mutation.mutate(); }} className="grid gap-5 rounded-3xl border border-white/10 bg-card/80 p-6 md:grid-cols-2">
            <h2 className="md:col-span-2 text-xl font-bold">{form.id ? "Editar produto" : "Cadastrar produto"}</h2>
            <label className="space-y-2 text-sm font-medium">
              <span className="block">Fornecedor</span>
              <select required className="flex h-10 w-full rounded-md border bg-background px-3" value={form.supplier_id} onChange={event => setForm(previous => ({ ...previous, supplier_id: event.target.value }))}>
                <option value="">Selecione</option>
                {suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </select>
            </label>
            {field("title", "Nome do produto")}
            {field("sku", "SKU")}
            {field("category", "Categoria")}
            {field("image_url", "URL da imagem", "url")}
            {field("retail_price", "Preço consumidor (R$)", "number")}
            {field("supplier_cost", "Custo fornecedor (R$)", "number")}
            {field("b2b_base_price", "Preço lojista (R$)", "number")}
            {field("min_b2b_quantity", "Quantidade mínima B2B", "number")}
            {field("description", "Descrição")}
            <div className="md:col-span-2 space-y-3 rounded-2xl border border-primary/30 bg-card p-4">
              <h3 className="font-bold">Checkout principal do fornecedor · RUBI 11×</h3>
              <p className="text-xs text-muted-foreground">
                Cole a URL oficial do checkout do produto enviada pela Kairos ou outro fornecedor.
                O domínio precisa estar cadastrado e aprovado no fornecedor abaixo. Não utilize links genéricos de afiliados.
              </p>
              {field("checkout_url", "URL HTTPS do checkout oficial", "url")}
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" checked={form.checkout_verified} onChange={event => setForm(previous => ({ ...previous, checkout_verified: event.target.checked }))} />
                <span>Confirmei manualmente que este link pertence ao fornecedor, é deste produto e corresponde à oferta cadastrada. A aprovação será revalidada ao salvar.</span>
              </label>
              <p className="text-xs text-muted-foreground">Sem URL, domínio verificado e aprovação manual, o produto permanece como rascunho e não entra na vitrine pública.</p>
            </div>
            <aside aria-label="Simulação de margens RUBI 11×" className="md:col-span-2 space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <h3 className="text-lg font-bold">RUBI 11× · Margem por canal</h3>
              <p className="text-sm text-muted-foreground">Simulação baseada nos preços e no custo que você cadastrou. Não é previsão de vendas nem lucro líquido.</p>
              {!previewReady ? <p className="text-sm">Preencha o preço de varejo e o custo do fornecedor para simular.</p> : <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border bg-card p-3"><p className="text-xs text-muted-foreground">Venda própria direta · diferença/unidade</p><p className="text-xl font-black">{brl(previewRetailMargin)}</p></div>
                  <div className="rounded-xl border bg-card p-3"><p className="text-xs text-muted-foreground">Parceiro · RUBI retém 50% da diferença</p><p className="text-xl font-black">{brl(previewPartnerMargin)}</p></div>
                  <div className="rounded-xl border bg-card p-3"><p className="text-xs text-muted-foreground">Parceiro recebe 50% da diferença</p><p className="text-xl font-black">{brl(previewPartnerMargin)}</p></div>
                  <div className="rounded-xl border bg-card p-3"><p className="text-xs text-muted-foreground">Atacado · diferença/unidade</p><p className="text-xl font-black">{previewWholesaleMargin === null ? "Não configurado" : brl(previewWholesaleMargin)}</p></div>
                </div>
                {previewWholesaleMargin !== null && Number.isSafeInteger(previewMinimum) && previewMinimum > 0 && <p className="text-sm">Pedido mínimo de {previewMinimum.toLocaleString("pt-BR")} unidades: diferença bruta total de <strong>{brl(previewWholesaleMargin * previewMinimum)}</strong>.</p>}
                {(previewRetailMargin <= 0 || (previewWholesaleMargin !== null && previewWholesaleMargin <= 0)) && <p role="alert" className="text-sm font-semibold text-destructive">Atenção: um dos preços cadastrados não supera o custo do fornecedor. Revise a precificação antes de divulgar.</p>}
              </>}
              <p className="text-xs text-muted-foreground">A divisão 50/50 é apenas um exemplo do Plano 11×. Comissões reais dependem do acordo ativo de cada parceiro. Impostos, tarifas, devoluções e despesas não incluídas no custo do fornecedor reduzem os valores.</p>
            </aside>
            <p className="md:col-span-2 text-xs text-muted-foreground">
              Status da oferta: {form.active && form.checkout_verified && !!form.checkout_url.trim() ? "Publicação solicitada — sujeita à validação no servidor" : "Rascunho / aguardando checkout confirmado"}. 
              A oferta ativa levará clientes à página RUBI de pré-compra, que então encaminhará ao checkout principal aprovado.
            </p>
            <div className="md:col-span-2 space-y-2 rounded-2xl border border-dashed border-primary/30 p-4">
              <h3 className="font-semibold">Pré-visualização do produto antes da publicação</h3>
              <p className="text-xs text-muted-foreground">Confira a capa RUBI, o convite de cadastro e recomendações sem precisar de checkout Kairos. A prévia é privada, não publica nem registra venda.</p>
              <RubiAdminOfferPreview
                offer={{
                  title: form.title,
                  description: form.description || null,
                  image_url: form.image_url || null,
                  category: form.category || null,
                  retail_price: Number(form.retail_price),
                }}
                related={products
                  .filter(product => product.id !== form.id && product.active && product.checkout_verified && !!product.checkout_url && product.category === form.category)
                  .slice(0, 4)
                  .map(product => ({
                    title: product.title,
                    description: product.description,
                    image_url: product.image_url,
                    category: product.category,
                    retail_price: Number(product.retail_price),
                  }))}
              />
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={form.active} onChange={event => setForm(previous => ({ ...previous, active: event.target.checked }))} />
              Publicar produto (exige checkout oficial validado)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={mutation.isPending || !form.supplier_id || query.isLoading}>
                {mutation.isPending ? "Salvando..." : form.id ? "Salvar alterações" : "Cadastrar produto"}
              </Button>
              {form.id && <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => setForm(emptyForm())}>Cancelar edição</Button>}
            </div>
          </form>
          <section className="space-y-4 rounded-3xl border border-white/10 bg-card/80 p-6">
            <h2 className="text-xl font-bold">Preços progressivos para lojistas</h2>
            <p className="text-sm text-muted-foreground">Um único produto pode ter várias faixas para lojistas aprovados (ex.: 10, 20 ou 50 unidades). A mesma quantidade atualiza a faixa existente. Os preços de atacado não aparecem no catálogo de consumidores. Confirme as condições com o fornecedor.</p>
            <form className="grid gap-4 md:grid-cols-3" onSubmit={event => { event.preventDefault(); tierMutation.mutate(); }}>
              <label className="space-y-2 text-sm font-medium">
                <span className="block">Produto com preço B2B</span>
                <select required className="flex h-10 w-full rounded-md border bg-background px-3" value={tierProductId} onChange={event => setTierProductId(event.target.value)}>
                  <option value="">Selecione</option>
                  {products.filter(product => Number(product.b2b_base_price) > 0).map(product => <option key={product.id} value={product.id}>{product.title}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span className="block">Quantidade a partir de</span>
                <Input type="number" required min={1} step={1} value={tierQuantity} onChange={event => setTierQuantity(event.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                <span className="block">Preço unitário (R$)</span>
                <Input type="number" required min="0.01" step="0.01" value={tierPrice} onChange={event => setTierPrice(event.target.value)} />
              </label>
              <Button type="submit" disabled={tierMutation.isPending || !tierProductId}>
                {tierMutation.isPending ? "Salvando..." : "Salvar faixa de preço"}
              </Button>
            </form>
            {tiers.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma faixa de preço cadastrada.</p>}
            <ul className="space-y-2 text-sm">
              {tiers.map(tier => <li key={tier.id} className="flex flex-wrap justify-between gap-2 rounded-xl border border-white/10 p-3">
                <span>{products.find(product => product.id === tier.product_id)?.title ?? "Produto não encontrado"} · a partir de {tier.min_quantity} un.</span>
                <strong>{brl(Number(tier.unit_price))}/un.</strong>
              </li>)}
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-bold">Produtos cadastrados ({products.length})</h2>
            {products.length === 0 && <p className="text-sm text-muted-foreground">Nenhum produto cadastrado ainda.</p>}
            {products.map(product => (
              <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4">
                <div>
                  <p className="font-medium">{product.title}</p>
                  <p className="text-sm text-muted-foreground">Varejo: {brl(Number(product.retail_price))} · {product.active ? "Publicado" : "Rascunho"}</p>
                  <p className="text-sm text-muted-foreground">Atacado: {product.b2b_base_price === null ? "Não habilitado" : `${brl(Number(product.b2b_base_price))}/un. · mínimo ${product.min_b2b_quantity} un.`}</p>
                  {tiers.filter(tier => tier.product_id === product.id).length > 0 && <p className="text-xs text-muted-foreground">Faixas B2B: {tiers.filter(tier => tier.product_id === product.id).sort((a,b) => a.min_quantity - b.min_quantity).map(tier => `${tier.min_quantity}+ un.: ${brl(Number(tier.unit_price))}`).join(" · ")}</p>}
                </div>
                <Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => edit(product)}>Editar</Button>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

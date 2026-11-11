import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getMerchantHubCatalog } from "@/lib/hub-catalog.functions";
import { Button } from "@/components/ui/button";
import { Store, ShieldCheck, Package } from "lucide-react";
import { RubiBusinessQuotePanel } from "@/components/business/RubiBusinessQuotePanel";
import { RubiStorefrontEntry } from "@/components/store/RubiStorefrontEntry";
import { RubiConversionGuide } from "@/components/growth/RubiConversionGuide";

export const Route = createFileRoute("/wholesale")({ component: Catalog });

type Tier = { min_quantity: number; unit_price: number };
type HubProduct = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  b2b_base_price: number;
  min_b2b_quantity: number;
  hub_b2b_tiers: Tier[] | null;
};

const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Catalog() {
  const load = useServerFn(getMerchantHubCatalog);
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["hub-catalog", "b2b"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Entre na sua conta para consultar preços de atacado.");
      return load({ data: { accessToken: session.access_token } });
    },
  });
  const products = data as HubProduct[];
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const categories = [...new Set(products.map(product => product.category).filter((value): value is string => !!value))].sort((a,b) => a.localeCompare(b,"pt-BR"));
  const visibleProducts = products.filter(product => (!category || product.category === category) && (!search.trim() || [product.title, product.description ?? "", product.category ?? ""].some(value => value.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR")))));
  const calculateUnitPrice = (product: HubProduct, quantity: number) => {
    const tiers = (product.hub_b2b_tiers ?? []).filter(tier => Number.isSafeInteger(tier.min_quantity) && Number.isFinite(tier.unit_price) && tier.unit_price > 0 && tier.min_quantity <= quantity && tier.min_quantity >= product.min_b2b_quantity).sort((a,b) => b.min_quantity - a.min_quantity);
    return Number(tiers[0]?.unit_price ?? product.b2b_base_price);
  };

  const quoteLines = products.filter(product => selectedProductIds.includes(product.id)).map(product => {
    const quantity = quantities[product.id] ?? product.min_b2b_quantity;
    const valid = Number.isSafeInteger(quantity) && quantity >= product.min_b2b_quantity && quantity <= 10000000;
    const unitPrice = valid ? calculateUnitPrice(product, quantity) : 0;
    return { id: product.id, title: product.title, quantity, unitPrice, total: unitPrice * quantity, valid };
  });
  const quoteValid = quoteLines.length > 0 && quoteLines.every(line => line.valid && Number.isFinite(line.total) && line.total > 0) && Number.isFinite(quoteLines.reduce((sum, line) => sum + line.total, 0));
  const quoteTotal = quoteValid ? quoteLines.reduce((sum, line) => sum + line.total, 0) : 0;

  return (
    <main className="min-h-screen px-4 pb-24 pt-32">
      <div className="mx-auto max-w-7xl space-y-10">
        <RubiStorefrontEntry audience="merchant" />
        <RubiConversionGuide audience="merchant" />
        <header className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-blue-500/10 p-8 md:p-12">
          <div className="mb-5 flex items-center gap-3 text-primary">
            <Store className="h-8 w-8" />
            <span className="text-xs font-black uppercase tracking-widest">RUBI · Negócios</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">Abasteça seu negócio.</h1>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            Condições comerciais exclusivas para lojistas aprovados. Consulte os pedidos mínimos
            e os preços por volume de cada produto.
          </p>
        </header>

        {isLoading && <p role="status">Carregando catálogo...</p>}

        {error && (
          <div role="alert" className="rounded-2xl border border-primary/20 p-6">
            <p>{error instanceof Error && !error.message.startsWith("Unauthorized:") ? error.message : "Entre na sua conta e solicite aprovação como lojista para consultar os preços de atacado."}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => void refetch()}>Tentar novamente</Button>
              <Button variant="outline" asChild>
                <Link to="/onboarding" search={{ audience: "merchant", returnTo: "/wholesale" }}>
                  Solicitar acesso
                </Link>
              </Button>
            </div>
          </div>
        )}

        {!isLoading && !error && products.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-card/70 p-12 text-center">
            <ShieldCheck className="mx-auto mb-5 h-10 w-10 text-primary" />
            <h2 className="text-2xl font-bold">Catálogo em preparação</h2>
            <p className="mt-3 text-muted-foreground">
              Estamos cadastrando produtos e validando condições com os fornecedores.
              Nenhum preço foi inventado.
            </p>
          </div>
        )}

        {!isLoading && !error && products.length > 0 && (
          <section aria-label="Produtos para lojistas">
            <aside aria-label="Resumo da pré-cotação" className="mb-6 space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <h2 className="text-xl font-bold">Simulador de atacado</h2>
              {quoteLines.length === 0 ? <p className="text-sm text-muted-foreground">Selecione produtos abaixo para reunir uma simulação de compra por atacado.</p> :
                <ul className="space-y-2 text-sm">{quoteLines.map(line => <li key={line.id} className="flex flex-wrap justify-between gap-2 border-b pb-2"><span>{line.title} · {line.quantity} un.</span><strong>{line.valid ? brl(line.total) : "Quantidade inválida"}</strong></li>)}</ul>}
              <p className="text-lg font-black">Total estimado: {quoteValid ? brl(quoteTotal) : "—"}</p>
              {quoteLines.length > 0 && !quoteValid && <p role="alert" className="text-sm text-destructive">Corrija as quantidades selecionadas para calcular o total.</p>}
              {quoteLines.length > 0 && <Button variant="outline" size="sm" onClick={() => setSelectedProductIds([])}>Limpar pré-cotação</Button>}
              <p className="text-xs text-muted-foreground">Simulação informativa calculada pelas faixas de atacado cadastradas no Shadow Master. Não registra pedido, não reserva estoque, não fixa preços nem envia dados ao fornecedor.</p>
            </aside>
            <div className="mb-6">
              <RubiBusinessQuotePanel lines={quoteLines} valid={quoteValid}
                onRepeat={(previousLines, _sourceQuoteId) => {
                  const available = previousLines.filter(line => products.some(product => product.id === line.productId));
                  if (available.length === 0) return;
                  setSelectedProductIds(available.map(line => line.productId));
                  setQuantities(current => ({
                    ...current,
                    ...Object.fromEntries(available.map(line => [line.productId, line.quantity])),
                  }));
                }}
              />
            </div>
            <div className="mb-6 grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold"><span>Buscar no atacado</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Produto ou categoria" className="block w-full rounded-lg border bg-background p-2.5" /></label>
              <label className="space-y-2 text-sm font-semibold"><span>Categoria</span><select value={category} onChange={event => setCategory(event.target.value)} className="block w-full rounded-lg border bg-background p-2.5"><option value="">Todas</option>{categories.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              {visibleProducts.length} {visibleProducts.length === 1 ? "produto disponível" : "produtos disponíveis"} para consulta
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => {
                const tiers = [...(product.hub_b2b_tiers ?? [])]
                  .filter((tier) => Number.isSafeInteger(tier.min_quantity) && tier.min_quantity >= product.min_b2b_quantity && tier.min_quantity <= 10000000 && Number.isFinite(tier.unit_price) && tier.unit_price > 0)
                  .sort((a, b) => a.min_quantity - b.min_quantity);
                const quantity = quantities[product.id] ?? product.min_b2b_quantity;
                const validQuantity = Number.isSafeInteger(quantity) && quantity >= product.min_b2b_quantity && quantity <= 10000000;
                const unitPrice = validQuantity ? calculateUnitPrice(product, quantity) : 0;
                return (
                  <article key={product.id} className="overflow-hidden rounded-3xl border border-white/10 bg-card/70">
                    <div className="flex aspect-[4/3] items-center justify-center bg-muted/30">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.title} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                      )}
                    </div>
                    <div className="space-y-3 p-6">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">
                        {product.category || "Seleção RUBI"}
                      </p>
                      <h2 className="text-xl font-bold">{product.title}</h2>
                      {product.description && <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>}
                      <div className="rounded-xl bg-primary/5 p-4">
                        <p className="text-xs text-muted-foreground">Preço base por unidade</p>
                        <p className="text-2xl font-black">{brl(Number(product.b2b_base_price))}</p>
                        <p className="mt-2 text-sm font-medium">Pedido mínimo: {product.min_b2b_quantity} unidades</p>
                        <p className="text-xs text-muted-foreground">
                          Valor base estimado do pedido mínimo: {brl(Number(product.b2b_base_price) * product.min_b2b_quantity)}
                        </p>
                      </div>
                      {tiers.length > 0 && (
                        <div>
                          <h3 className="mb-2 text-sm font-semibold">Preços por quantidade</h3>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            {tiers.map((tier) => (
                              <li key={tier.min_quantity} className="flex justify-between gap-3 border-b border-white/10 pb-2">
                                <span>A partir de {tier.min_quantity} un.</span>
                                <strong className="text-foreground">{brl(Number(tier.unit_price))}/un.</strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <label className="flex items-center gap-2 rounded-lg border p-3 text-sm font-semibold"><input type="checkbox" checked={selectedProductIds.includes(product.id)} onChange={event => setSelectedProductIds(current => event.target.checked ? [...current, product.id] : current.filter(id => id !== product.id))} /> Incluir na pré-cotação</label>
                      <div className="space-y-3 rounded-xl border p-4">
                        <h3 className="text-sm font-semibold">Simular valor por quantidade</h3>
                        <label className="block space-y-1 text-sm"><span>Quantidade de unidades</span><input type="number" min={product.min_b2b_quantity} max={10000000} step={1} value={quantity} onChange={event => setQuantities(current => ({ ...current, [product.id]: event.target.value === "" ? 0 : Number(event.target.value) }))} className="block w-full rounded-lg border bg-background p-2" /></label>
                        {!validQuantity ? <p role="alert" className="text-sm text-destructive">Informe no mínimo {product.min_b2b_quantity} unidades inteiras.</p> : <div className="space-y-1 text-sm"><p>Preço unitário aplicável: <strong>{brl(unitPrice)}</strong></p><p>Total estimado: <strong>{brl(unitPrice * quantity)}</strong></p></div>}
                        <p className="text-xs text-muted-foreground">Simulação informativa; não reserva estoque, cria pedido nem garante condições de pagamento.</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Consulta de preços somente. Pedidos, pagamento e logística serão disponibilizados após a integração do fornecedor.
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

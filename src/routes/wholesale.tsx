import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { getMerchantHubCatalog } from "@/lib/hub-catalog.functions";
import { Button } from "@/components/ui/button";
import { Store, ShieldCheck, Package } from "lucide-react";

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

  return (
    <main className="min-h-screen px-4 pb-24 pt-32">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-blue-500/10 p-8 md:p-12">
          <div className="mb-5 flex items-center gap-3 text-primary">
            <Store className="h-8 w-8" />
            <span className="text-xs font-black uppercase tracking-widest">Hub Eagles · Negócios</span>
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
            <p className="mb-5 text-sm text-muted-foreground">
              {products.length} {products.length === 1 ? "produto disponível" : "produtos disponíveis"} para consulta
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const tiers = [...(product.hub_b2b_tiers ?? [])]
                  .filter((tier) => Number.isFinite(tier.min_quantity) && Number.isFinite(tier.unit_price))
                  .sort((a, b) => a.min_quantity - b.min_quantity);
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
                        {product.category || "Seleção Hub Eagles"}
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

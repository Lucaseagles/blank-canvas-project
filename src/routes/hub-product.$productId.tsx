import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getRetailHubProduct } from "@/lib/hub-catalog.functions";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { RubiPreCheckout } from "@/components/store/RubiPreCheckout";
import { RubiMovementLanding } from "@/components/store/RubiMovementLanding";
import { RubiComplementarySuggestions } from "@/components/store/RubiComplementarySuggestions";
import { currentRubiOrganicAttribution } from "@/lib/rubi-organic-campaigns";

export const Route = createFileRoute("/hub-product/$productId")({
  component: HubProductDetail,
});

const money = (price: number): string =>
  Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function HubProductDetail() {
  const { productId } = Route.useParams();
  const getProduct = useServerFn(getRetailHubProduct);
  const query = useQuery({
    queryKey: ["rubi-store-product", productId],
    queryFn: () => getProduct({ data: { productId } }),
    retry: false,
  });
  const product = query.data;

  useEffect(() => {
    if (!product?.id) return;
    // Only validated editorial UTMs are eligible for campaign reporting.
    // They are not affiliate attribution or evidence of a paid purchase.
    const attribution = currentRubiOrganicAttribution(product.id);
    const source = attribution?.source ?? "rubi_store";
    const campaign = attribution?.campaign ?? null;
    void trackEvent("RUBI_STORE_PRODUCT_VIEW", {
      product_id: product.id,
      source,
      utm_medium: attribution ? "organic_social" : null,
      utm_campaign: campaign,
      sales_status: "view_only",
    }, { productId: product.id, source });
  }, [product?.id]);

  return (
    <main className="min-h-screen px-4 pb-24 pt-32">
      <div className="mx-auto max-w-5xl space-y-6">
        <Button asChild variant="outline">
          <Link to="/hub-shop"><ArrowLeft className="mr-2 h-4 w-4" />Voltar à RUBI Store</Link>
        </Button>
        {query.isLoading && <p role="status">Carregando o produto...</p>}
        {query.isError && (
          <div role="alert" className="space-y-3 rounded-3xl border bg-card p-8">
            <h1 className="text-2xl font-bold">Produto indisponível</h1>
            <p className="text-muted-foreground">Não foi possível verificar os dados deste produto. Confira o link ou tente novamente.</p>
            <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
          </div>
        )}
        {!query.isLoading && !query.isError && !product && (
          <div role="status" className="rounded-3xl border bg-card p-8">
            <h1 className="text-2xl font-bold">Oferta não disponível</h1>
            <p className="mt-2 text-muted-foreground">A oferta pode ter sido retirada ou o fornecedor está indisponível. Confira as outras opções na RUBI Store.</p>
          </div>
        )}
        {product && (
          <>
            <RubiMovementLanding productId={product.id} />
            <div id="rubi-purchase"><RubiPreCheckout product={product} returnTo={`/hub-product/${product.id}`} origin="store" /></div>
            <RubiComplementarySuggestions productId={product.id} />
          </>
        )}
      </div>
    </main>
  );
}

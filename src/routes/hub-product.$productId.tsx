import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getRetailHubProduct } from "@/lib/hub-catalog.functions";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag, ShieldCheck } from "lucide-react";

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
    const params = new URLSearchParams(window.location.search);
    const source = (params.get("utm_source") || "rubi_store").slice(0, 80);
    const campaign = (params.get("utm_campaign") || "").slice(0, 100);
    void trackEvent("RUBI_STORE_PRODUCT_VIEW", {
      product_id: product.id,
      source,
      utm_campaign: campaign || null,
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
          <article className="grid overflow-hidden rounded-3xl border bg-card lg:grid-cols-2">
            <div className="flex min-h-64 items-center justify-center bg-muted/30">
              {product.image_url ? (
                <img src={product.image_url} alt={product.title} className="h-full w-full object-contain" />
              ) : (
                <ShoppingBag aria-hidden="true" className="h-16 w-16 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-5 p-6 md:p-10">
              <p className="text-xs font-black uppercase tracking-widest text-primary">RUBI Store · {product.category || "Seleção oficial"}</p>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">{product.title}</h1>
              {product.description && <p className="whitespace-pre-line text-muted-foreground">{product.description}</p>}
              <p className="text-3xl font-black">{money(product.retail_price)}</p>
              <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-center gap-2 font-semibold">
                  <ShieldCheck aria-hidden="true" className="h-5 w-5 text-primary" />
                  Oferta da seleção RUBI
                </div>
                <p className="text-sm text-muted-foreground">
                  Produto exibido com o preço cadastrado. Compra, condições de frete e entrega serão disponibilizadas
                  somente após a integração e validação do checkout do fornecedor.
                </p>
                <Button asChild>
                  <Link to="/auth" search={{ returnTo: `/hub-product/${product.id}`, audience: undefined, ref: undefined, campaign_id: undefined }}>
                    Entrar ou criar conta (opcional)
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground">Cadastro não representa pedido, reserva ou pagamento.</p>
              </div>
            </div>
          </article>
        )}
      </div>
    </main>
  );
}

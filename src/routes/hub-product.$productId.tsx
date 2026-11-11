import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getRetailHubProduct } from "@/lib/hub-catalog.functions";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { ArrowLeft,ArrowRight,PlayCircle,ShieldCheck,ShoppingBag } from "lucide-react";
import { RubiPreCheckout } from "@/components/store/RubiPreCheckout";
import { RubiMovementLanding } from "@/components/store/RubiMovementLanding";
import { RubiComplementarySuggestions } from "@/components/store/RubiComplementarySuggestions";
import { RubiProductStories } from "@/components/store/RubiProductStories";
import { RubiStoreActivityProof } from "@/components/store/RubiStoreActivityProof";
import { currentRubiOrganicAttribution } from "@/lib/rubi-organic-campaigns";
import { getRubiEditorialSection } from "@/lib/rubi-editorial-context";

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
      editorial_section_id: getRubiEditorialSection(product.id),
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
            <section aria-label="Apresentação do produto" className="overflow-hidden rounded-[2rem] border bg-card shadow-sm">
              <div className="grid gap-0 md:grid-cols-2">
                <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/20">
                  {product.image_url ? <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><ShoppingBag className="h-24 w-24 text-muted-foreground/30" /></div>}
                  <span className="absolute left-5 top-5 rounded-full border bg-background/90 px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-sm backdrop-blur">RUBI Eagles · Store</span>
                </div>
                <div className="flex flex-col justify-center gap-5 p-6 sm:p-8 lg:p-10">
                  <p className="text-[11px] font-black uppercase tracking-[.2em] text-primary">{product.category || "Nossa seleção"}</p>
                  <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">{product.title}</h1>
                  {product.description && <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{product.description}</p>}
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="text-xs font-semibold text-muted-foreground">Preço de varejo cadastrado</p>
                    <p className="mt-1 text-3xl font-black">{money(product.retail_price)}</p>
                    <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Condições finais no checkout oficial do fornecedor.</p>
                  </div>
                  <a href="#rubi-purchase" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90">Consultar compra e disponibilidade <ArrowRight className="ml-2 h-4 w-4"/></a>
                  <Link to="/videos" className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"><PlayCircle className="h-4 w-4"/> Explorar o feed de vídeos da RUBI</Link>
                </div>
              </div>
            </section>
            <RubiStoreActivityProof productId={product.id} />
            <RubiProductStories productId={product.id} />
            <RubiMovementLanding productId={product.id} />
            <div id="rubi-purchase"><RubiPreCheckout product={product} returnTo={`/hub-product/${product.id}`} origin="store" /></div>
            <RubiComplementarySuggestions productId={product.id} />
          </>
        )}
      </div>
    </main>
  );
}

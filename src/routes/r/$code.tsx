import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { resolvePartnerReferral } from "@/lib/partner-referral-visit.functions";
import { Button } from "@/components/ui/button";
import { RubiPreCheckout } from "@/components/store/RubiPreCheckout";

export const Route = createFileRoute("/r/$code")({
  validateSearch: (search: Record<string, unknown>) => ({
    pub: typeof search["pub"] === "string" ? search["pub"] : undefined,
  }),
  component: ReferralLanding,
});
function ReferralLanding() {
  const { code } = Route.useParams();
  const { pub } = Route.useSearch();
  const resolve = useServerFn(resolvePartnerReferral);
  const query = useQuery({ queryKey: ["partner-referral", code, pub], queryFn: () => resolve({ data: { code, ...(pub ? { publicationId: pub } : {}) } }), retry: false });
  const product = query.data;
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-28">
    <h1 className="text-3xl font-black">RUBI · Produto indicado</h1>
    {query.isLoading && <p>Carregando indicação...</p>}
    {query.isError && <div role="alert" className="space-y-3"><p>Este link não está disponível no momento.</p><Button asChild variant="outline"><a href="/hub-shop">Ver catálogo</a></Button></div>}
    {!query.isLoading && !query.isError && !product && (
      <div role="status" className="space-y-3 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-bold">Indicação indisponível</h2>
        <p className="text-sm text-muted-foreground">Este link pode ter expirado, ter sido revogado ou o produto não está disponível. Explore outras ofertas da RUBI.</p>
        <Button asChild variant="outline"><a href="/hub-shop">Explorar RUBI Store</a></Button>
      </div>
    )}
    {product && (
      <RubiPreCheckout product={product} returnTo={`/r/${code}${pub ? `?pub=${encodeURIComponent(pub)}` : ""}`} partnerCode={code} origin="partner" />
    )}
  </main>;
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { resolvePartnerReferral } from "@/lib/partner-referral-visit.functions";
import { Button } from "@/components/ui/button";
import { RubiPreCheckout } from "@/components/store/RubiPreCheckout";

export const Route = createFileRoute("/r/$code")({ component: ReferralLanding });
function ReferralLanding() {
  const { code } = Route.useParams();
  const resolve = useServerFn(resolvePartnerReferral);
  const query = useQuery({ queryKey: ["partner-referral", code], queryFn: () => resolve({ data: { code } }), retry: false });
  const product = query.data;
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-28">
    <h1 className="text-3xl font-black">RUBI · Produto indicado</h1>
    {query.isLoading && <p>Carregando indicação...</p>}
    {query.isError && <div role="alert" className="space-y-3"><p>Este link não está disponível no momento.</p><Button asChild variant="outline"><a href="/hub-shop">Ver catálogo</a></Button></div>}
    {product && (
      <RubiPreCheckout product={product} returnTo={`/r/${code}`} partnerCode={code} origin="partner" />
    )}
  </main>;
}

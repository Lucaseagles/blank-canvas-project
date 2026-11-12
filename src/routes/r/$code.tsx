import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  const [visitToken, setVisitToken] = useState<string | null>(null);
  useEffect(() => {
    // An ephemeral 30-minute token scoped to this referral+publication.
    // It is neither a fingerprint nor a persistent visitor identity.
    const key = `rubi-visit:${code}:${pub ?? ""}`;
    const create = () => crypto.randomUUID();
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const record = JSON.parse(stored) as { token?: string; expires?: number };
        if (typeof record.token === "string" && /^[0-9a-f-]{36}$/i.test(record.token) &&
            typeof record.expires === "number" && record.expires > Date.now()) {
          setVisitToken(record.token);
          return;
        }
      }
      const token = create();
      sessionStorage.setItem(key, JSON.stringify({ token, expires: Date.now() + 30 * 60_000 }));
      setVisitToken(token);
    } catch {
      // Storage may be disabled; in-memory fallback works for this mounted page.
      setVisitToken(create());
    }
  }, [code, pub]);
  const resolve = useServerFn(resolvePartnerReferral);
  const query = useQuery({
    queryKey: ["partner-referral", code, pub, visitToken],
    queryFn: () => resolve({ data: { code, ...(pub ? { publicationId: pub } : {}), ...(visitToken ? { visitToken } : {}) } }),
    enabled: visitToken !== null,
    retry: false,
  });
  const product = query.data;
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-28">
    <h1 className="text-3xl font-black">RUBI · Produto indicado</h1>
    {(!visitToken || query.isLoading) && <p>Carregando indicação...</p>}
    {query.isError && <div role="alert" className="space-y-3"><p>Este link não está disponível no momento.</p><Button asChild variant="outline"><a href="/hub-shop">Ver catálogo</a></Button></div>}
    {visitToken && !query.isLoading && !query.isError && !product && (
      <div role="status" className="space-y-3 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-bold">Indicação indisponível</h2>
        <p className="text-sm text-muted-foreground">Este link pode ter expirado, ter sido revogado ou o produto não está disponível. Explore outras ofertas da RUBI.</p>
        <Button asChild variant="outline"><a href="/hub-shop">Explorar RUBI Store</a></Button>
      </div>
    )}
    {product && (
      <RubiPreCheckout product={product} returnTo={`/r/${code}${pub ? `?pub=${encodeURIComponent(pub)}` : ""}`} partnerCode={code} {...(visitToken ? {visitToken} : {})} {...(pub ? {publicationId:pub} : {})} origin="partner" />
    )}
  </main>;
}

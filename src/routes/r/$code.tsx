import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { resolvePartnerReferral } from "@/lib/partner-referral-visit.functions";
import { Button } from "@/components/ui/button";

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
    {product && <article className="space-y-4 rounded-3xl border p-6">
      {product.image_url && <img src={product.image_url} alt={product.title} className="aspect-video w-full rounded-2xl object-cover" />}
      <h2 className="text-2xl font-bold">{product.title}</h2>
      {product.description && <p className="text-muted-foreground">{product.description}</p>}
      <p className="text-2xl font-black">{Number(product.retail_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
        <h3 className="font-semibold">Conheça também a RUBI</h3>
        <p className="text-sm text-muted-foreground">Crie sua conta gratuitamente para descobrir ofertas e produtos da sua preferência. O cadastro é opcional e não conclui nem reserva uma compra.</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild><Link to="/auth" search={{ returnTo: `/r/${code}`, ref: undefined, campaign_id: undefined, audience: undefined }}>Entrar ou criar conta</Link></Button>
          <Button asChild variant="outline"><Link to="/hub-shop">Explorar produtos RUBI</Link></Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Seu acesso pelo link de indicação foi registrado. A compra deste produto só estará disponível após validação e integração do checkout do fornecedor. Nenhum pedido ou comissão foi criado nesta página.</p>
    </article>}
  </main>;
}

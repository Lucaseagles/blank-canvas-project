import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyPartnerPortal } from "@/lib/partner-portal.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/partner/portal")({ component: PartnerPortal });

type Product = { id: string; title: string; description: string | null; image_url: string | null; category: string | null; retail_price: number };
function PartnerPortal() {
  const load = useServerFn(getMyPartnerPortal);
  const query = useQuery({
    queryKey: ["my-partner-portal"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Entre na sua conta para acessar o portal de parceiros.");
      return load({ data: { accessToken: session.access_token } });
    },
    retry: false,
  });
  const profile = query.data?.profile;
  const products = (query.data?.products ?? []) as Product[];
  return <main className="mx-auto max-w-6xl space-y-8 px-4 py-28">
    <header className="space-y-3">
      <p className="text-xs font-black uppercase tracking-widest text-primary">Hub Eagles · Parceiros</p>
      <h1 className="text-4xl font-black">Seu portal de parceiros</h1>
      <p className="text-muted-foreground">Produtos autorizados individualmente pelo Admin Master. Acesso exclusivo à sua conta.</p>
    </header>
    {query.isLoading && <p role="status">Carregando seu portal...</p>}
    {query.isError && <div role="alert" className="space-y-3 rounded-2xl border p-6">
      <p>{query.error instanceof Error ? query.error.message : "Não foi possível carregar o portal."}</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => void query.refetch()}>Tentar novamente</Button>
        <Button asChild variant="outline"><Link to="/auth" search={{ returnTo: "/partner/portal", audience: "partner", ref: undefined, campaign_id: undefined }}>Entrar na conta</Link></Button>
      </div>
    </div>}
    {!query.isLoading && !query.isError && !profile && <div className="rounded-2xl border p-6 space-y-3">
      <p>Você ainda não possui um cadastro de parceiro.</p>
      <Button asChild><Link to="/onboarding" search={{ audience: "partner", returnTo: "/partner/portal" }}>Solicitar cadastro</Link></Button>
    </div>}
    {profile && profile.status !== "approved" && <div className="rounded-2xl border p-6 space-y-2">
      <h2 className="text-xl font-bold">Cadastro {profile.status === "pending" ? "em análise" : "não aprovado"}</h2>
      <p className="text-muted-foreground">Os produtos só são liberados após aprovação comercial.</p>
    </div>}
    {profile?.status === "approved" && <>
      <p className="text-sm text-muted-foreground">Bem-vindo, {profile.display_name}. {products.length} produtos autorizados.</p>
      {products.length === 0 && <p className="rounded-2xl border p-6">Nenhum produto liberado para seu perfil no momento.</p>}
      <section aria-label="Produtos autorizados" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map(product => <article key={product.id} className="overflow-hidden rounded-2xl border bg-card">
          {product.image_url && <img src={product.image_url} alt={product.title} loading="lazy" className="aspect-video w-full object-cover" />}
          <div className="space-y-3 p-5">
            <p className="text-xs uppercase text-primary">{product.category ?? "Hub Eagles"}</p>
            <h2 className="text-xl font-bold">{product.title}</h2>
            {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
            <p className="text-lg font-semibold">{Number(product.retail_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            <p className="text-xs text-muted-foreground">Links individuais, comissões e confirmação de vendas serão habilitados após integração de rastreamento e checkout.</p>
          </div>
        </article>)}
      </section>
    </>}
  </main>;
}

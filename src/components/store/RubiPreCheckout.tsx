import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Gift, Heart, ShoppingBag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { getRubiRelatedProducts, getRubiCheckoutReadiness } from "@/lib/rubi-precheckout.functions";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { RubiPostSignupActivation } from "@/components/store/RubiPostSignupActivation";
import { currentRubiOrganicAttribution } from "@/lib/rubi-organic-campaigns";

type Product = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  retail_price: number;
};

type Props = {
  product: Product;
  returnTo: string;
  partnerCode?: string;
  origin: "store" | "partner";
};

const brl = (value: number) => Number(value).toLocaleString("pt-BR", {
  style: "currency", currency: "BRL",
});

export function RubiPreCheckout({ product, returnTo, partnerCode, origin }: Props) {
  const getRelated = useServerFn(getRubiRelatedProducts);
  const getReadiness = useServerFn(getRubiCheckoutReadiness);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [inviteEligible, setInviteEligible] = useState(false);

  const related = useQuery({
    queryKey: ["rubi-precheckout-related", product.id],
    queryFn: () => getRelated({ data: { productId: product.id } }),
    retry: false,
  });
  const readiness = useQuery({
    queryKey: ["rubi-precheckout-readiness", product.id, partnerCode || ""],
    queryFn: () => getReadiness({ data: { productId: product.id, ...(partnerCode ? { partnerCode } : {}) } }),
    retry: false,
    staleTime: 15_000,
  });

  useEffect(() => {
    let canceled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (canceled || error || data.user) return;
      setInviteEligible(true);
      try {
        if (window.sessionStorage.getItem("rubi_precheckout_invite_seen") === "1") return;
        window.sessionStorage.setItem("rubi_precheckout_invite_seen", "1");
      } catch {
        // Browser storage may be unavailable; the invitation must remain optional.
      }
      timer = setTimeout(() => {
        if (!canceled) {
          setInviteOpen(true);
          void trackEvent("RUBI_SIGNUP_INVITE_SHOWN", {
            product_id: product.id,
            origin,
            triggered_by: "anonymous_precheckout",
          }, { productId: product.id, source: origin === "partner" ? "rubi_partner" : "rubi_store" });
        }
      }, 3500);
    }).catch(() => undefined);
    return () => {
      canceled = true;
      if (timer) clearTimeout(timer);
    };
  }, [product.id, origin]);

  const trackInviteAction = (action: string) => {
    void trackEvent("RUBI_SIGNUP_INVITE_ACTION", {
      product_id: product.id, origin, action,
    }, { productId: product.id, source: origin === "partner" ? "rubi_partner" : "rubi_store" });
  };

  const checkout = readiness.data;
  const ready = checkout?.ready === true;
  const continueToSupplier = async () => {
    if (!checkout?.ready || redirecting) return;
    setRedirecting(true);
    try {
      // Never trust the cached availability: an owner can disable a product,
      // revoke a supplier or replace an approved URL while this page is open.
      const latest = await getReadiness({
        data: { productId: product.id, ...(partnerCode ? { partnerCode } : {}) },
      });
      if (!latest.ready) {
        setRedirecting(false);
        void readiness.refetch();
        return;
      }
      const url = new URL(latest.destination);
      if (url.protocol !== "https:") throw new Error("Destino inseguro.");
      // Editorial campaign context applies only to a direct Store visit.
      // Partner referral attribution always stays with its verified code.
      const organic = origin === "store" ? currentRubiOrganicAttribution(product.id) : null;
      await trackEvent("RUBI_PRECHECKOUT_CONTINUE", {
        product_id: product.id, origin, has_partner_referral: !!partnerCode,
        action: "external_checkout_intent",
        utm_medium: organic ? "organic_social" : null,
        utm_campaign: organic?.campaign ?? null,
      }, { productId: product.id, source: origin === "partner" ? "rubi_partner" : organic?.source ?? "rubi_store" });
      window.location.assign(url.toString());
    } catch {
      setRedirecting(false);
    }
  };

  return (
    <div className="space-y-8">
      <RubiPostSignupActivation returnTo={returnTo} />
      <article aria-label="Revisão do produto selecionado" className="overflow-hidden rounded-3xl border bg-card lg:grid lg:grid-cols-2">
        <div className="flex min-h-72 items-center justify-center bg-muted/30">
          {product.image_url ? (
            <img src={product.image_url} alt={product.title} className="h-full max-h-[520px] w-full object-contain" />
          ) : (
            <ShoppingBag aria-hidden="true" className="h-20 w-20 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col justify-between gap-6 p-6 md:p-9">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {origin === "partner" ? "Indicação RUBI Partners" : "Seleção oficial RUBI Store"}
            </p>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">{product.title}</h1>
            <p className="text-sm text-muted-foreground">
              Confira os detalhes do produto antes de prosseguir. Você também pode explorar opções relacionadas da nossa loja.
            </p>
            {product.description && <p className="whitespace-pre-line text-sm leading-relaxed">{product.description}</p>}
            <p className="text-3xl font-black">{brl(product.retail_price)}</p>
          </div>
          <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck aria-hidden="true" className="h-5 w-5 text-primary" />
              Pré-compra RUBI · Pagamento no fornecedor
            </div>
            <p className="text-sm text-muted-foreground">
              Esta é uma vitrine anterior ao checkout. A RUBI não coleta dados do cartão nesta página.
              Frete, entrega e pagamento são informados no checkout principal do fornecedor.
            </p>
            {readiness.isLoading && <p role="status" className="text-xs text-muted-foreground">Verificando disponibilidade do checkout...</p>}
            {readiness.isError && <p role="alert" className="text-xs text-destructive">Não foi possível verificar o checkout. Tente novamente.</p>}
            <Button className="h-12 w-full" disabled={!ready || redirecting} onClick={() => void continueToSupplier()}>
              {redirecting ? "Abrindo checkout..." : ready ? "Continuar para pagamento no fornecedor" : "Pagamento ainda não disponível"}
              {ready && !redirecting && <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />}
            </Button>
            {!ready && !readiness.isLoading && !readiness.isError && (
              <p className="text-xs text-muted-foreground">{checkout?.ready === false ? checkout.reason : "Compra indisponível no momento."}</p>
            )}
            {readiness.isError && <Button variant="outline" size="sm" onClick={() => void readiness.refetch()}>Tentar verificar novamente</Button>}
            <p className="text-xs text-muted-foreground">
              Visualizar este produto ou abrir o checkout não confirma pedido, pagamento ou comissão.
            </p>
          </div>
        </div>
      </article>

      <section aria-label="Descubra a RUBI" className="grid gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <Heart aria-hidden="true" className="h-8 w-8 text-primary" />
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Gostou desta seleção? Descubra mais na RUBI</h2>
          <p className="text-sm text-muted-foreground">
            Um cadastro gratuito pode ajudar você a acompanhar ofertas e encontrar produtos do seu interesse.
            Ele é opcional e não é necessário para ver os produtos.
          </p>
          <div className="flex flex-wrap gap-2">
            {inviteEligible && <Button type="button" variant="outline" size="sm" onClick={() => { trackInviteAction("open_from_store_block"); setInviteOpen(true); }}>Conhecer vantagens da conta</Button>}
            <Button asChild variant="outline" size="sm"><Link to="/hub-shop">Explorar RUBI Store</Link></Button>
          </div>
        </div>
      </section>

      <section aria-label="Produtos relacionados da RUBI Store" className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-2xl font-bold">Outras opções que podem interessar</h2>
          <p className="text-sm text-muted-foreground">Produtos publicados da nossa loja, selecionados por categoria quando disponível. Cada produto tem preço próprio.</p>
        </header>
        {related.isLoading && <p role="status">Buscando mais produtos...</p>}
        {related.isError && <p role="alert">Não foi possível carregar outras sugestões.</p>}
        {related.data && related.data.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há produtos relacionados disponíveis.</p>}
        {related.data && related.data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.data.map(item => (
              <article key={item.id} className="flex flex-col overflow-hidden rounded-2xl border bg-card">
                <div className="flex aspect-[4/3] items-center justify-center bg-muted/30">
                  {item.image_url ? <img src={item.image_url} alt={item.title} loading="lazy" className="h-full w-full object-contain" /> : <Gift aria-hidden="true" className="h-10 w-10 text-muted-foreground" />}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="text-xs text-primary">{item.category || "Seleção RUBI"}</p>
                  <h3 className="flex-1 font-semibold">{item.title}</h3>
                  <p className="font-black">{brl(item.retail_price)}</p>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/hub-product/$productId" params={{ productId: item.id }}>Conhecer este produto</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
        {partnerCode && (
          <p className="text-xs text-muted-foreground">
            Seu link de parceiro se refere ao produto principal. Outros produtos têm jornadas próprias; comissões dependem de indicação autorizada e venda confirmada.
          </p>
        )}
      </section>

      <Dialog open={inviteOpen} onOpenChange={(open) => { if (!open && inviteOpen) trackInviteAction("dismiss"); setInviteOpen(open); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart aria-hidden="true" className="h-5 w-5 text-primary" /> Faça parte da RUBI
            </DialogTitle>
            <DialogDescription>
              Encontre outras opções para o que você procura, acompanhe ofertas da RUBI e descubra produtos de acordo com seus interesses.
              Criar sua conta é gratuito e opcional: você pode continuar explorando sem cadastro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-xl border p-4 text-sm">
            <p>Encontre alternativas e produtos relacionados ao que você veio buscar.</p>
            <p>Salve seus interesses e consulte recursos disponíveis no seu perfil, como favoritos e recomendações.</p>
            <p>Volte à oferta atual após entrar ou se cadastrar.</p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button asChild className="w-full">
              <Link to="/auth" onClick={() => trackInviteAction("continue_to_auth")} search={{ returnTo, audience: undefined, ref: undefined, campaign_id: undefined }}>
                Entrar ou criar minha conta
              </Link>
            </Button>
            <Button className="w-full" variant="outline" onClick={() => setInviteOpen(false)}>Agora não, continuar vendo o produto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

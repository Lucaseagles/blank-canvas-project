import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicRubiPartnerStorefront } from "@/lib/partner-storefront.functions";

export const Route = createFileRoute("/loja/$storeCode")({ component: PartnerPublicStorefront });

function PartnerPublicStorefront() {
  const { storeCode } = Route.useParams();
  const load = useServerFn(getPublicRubiPartnerStorefront);
  const query = useQuery({
    queryKey: ["public-rubi-partner-storefront", storeCode],
    queryFn: () => load({ data: { storeCode } }),
    retry: false,
  });
  const store = query.data;

  if (query.isLoading) return <main className="mx-auto max-w-6xl px-4 py-28"><p role="status">Carregando vitrine...</p></main>;
  if (query.isError || !store) return <main className="mx-auto max-w-3xl space-y-4 px-4 py-28 text-center">
    <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">RUBI Partners</p>
    <h1 className="text-3xl font-black">Esta vitrine não está disponível</h1>
    <p className="text-sm text-muted-foreground">O parceiro pode estar em análise, a vitrine pode ter sido suspensa ou os produtos não estão mais autorizados.</p>
    <a href="/hub-shop" className="inline-flex rounded-full border px-5 py-3 text-sm font-bold">Explorar RUBI Store</a>
  </main>;

  return <main className="min-h-screen bg-background pb-20 pt-28">
    <div className="mx-auto max-w-6xl space-y-10 px-4">
      <header className="overflow-hidden rounded-[2rem] border bg-gradient-to-br from-primary/15 via-card to-background p-7 sm:p-12">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">RUBI Partners · Vitrine oficial</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">{store.displayName}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Uma seleção de produtos indicada por este parceiro. Escolha um produto para conhecer a oferta e continuar para o checkout responsável pela cobrança e entrega.</p>
        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border bg-background/70 px-3 py-2">Vitrine de parceiro RUBI</span>
          <span className="rounded-full border bg-background/70 px-3 py-2">{store.products.length} produtos disponíveis</span>
        </div>
      </header>

      <section className="space-y-5" aria-label="Produtos da vitrine">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-widest text-primary">Seleção do parceiro</p><h2 className="mt-1 text-2xl font-black">Produtos em destaque</h2></div>
          <a href="/hub-shop" className="text-sm font-semibold text-primary underline underline-offset-4">Conhecer loja RUBI</a>
        </div>
        {store.products.length === 0 ? <div className="rounded-2xl border p-8 text-center">
          <h3 className="font-bold">Novas ofertas em breve</h3>
          <p className="mt-2 text-sm text-muted-foreground">Este parceiro ainda não possui produtos liberados para divulgação.</p>
        </div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {store.products.map((product) => <article key={product.id} className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              {product.imageUrl ? <img src={product.imageUrl} alt={product.title} loading="lazy" className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">RUBI Store</div>}
            </div>
            <div className="space-y-3 p-5">
              {product.category && <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{product.category}</p>}
              <h3 className="text-lg font-black">{product.title}</h3>
              {product.description && <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{product.description}</p>}
              <p className="text-xl font-black">{product.retailPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
              <a href={`/r/${product.referralCode}`} className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90">Ver oferta e continuar</a>
            </div>
          </article>)}
        </div>}
      </section>
      <footer className="rounded-2xl border p-5 text-xs leading-5 text-muted-foreground">
        A RUBI apresenta a vitrine e registra a origem da indicação. Pagamento, aprovação do pedido, entrega, cancelamento e reembolso são processados pelo checkout ou fornecedor responsável. A indicação não representa confirmação de compra.
      </footer>
    </div>
  </main>;
}

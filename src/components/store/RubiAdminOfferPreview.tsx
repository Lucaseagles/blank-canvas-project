import { useState } from "react";
import { Gift, Heart, ShoppingBag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

type Offer = {
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  retail_price: number;
};

type Props = {
  offer: Offer;
  related: Offer[];
};

/**
 * Private administrative mockup. It never fetches checkout links, records
 * analytics, creates accounts or publishes the offer. Existing public products
 * are merely presented as possible editorial recommendations.
 */
export function RubiAdminOfferPreview({ offer, related }: Props) {
  const [open, setOpen] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);
  const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}
        disabled={!offer.title.trim() || !Number.isFinite(offer.retail_price) || offer.retail_price <= 0}>
        Pré-visualizar pré-compra RUBI
      </Button>
      <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) setInviteVisible(false); }}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pré-visualização privada · RUBI Store</DialogTitle>
            <DialogDescription>
              Simulação visual para o Admin Master. Não publica, não abre a Kairos, não cria cadastros,
              não conta visitas e não confirma pedidos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <section aria-label="Capa do produto em revisão" className="grid overflow-hidden rounded-2xl border bg-card md:grid-cols-2">
              <div className="flex min-h-52 items-center justify-center bg-muted/30">
                {offer.image_url
                  ? <img src={offer.image_url} alt={offer.title} className="max-h-72 w-full object-contain" />
                  : <ShoppingBag aria-hidden="true" className="h-14 w-14 text-muted-foreground" />}
              </div>
              <div className="space-y-3 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">RUBI Store · {offer.category || "Seleção oficial"}</p>
                <h3 className="text-2xl font-bold">{offer.title}</h3>
                {offer.description && <p className="whitespace-pre-line text-sm text-muted-foreground">{offer.description}</p>}
                <p className="text-2xl font-black">{money(offer.retail_price)}</p>
                <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4" />Pré-compra RUBI · Pagamento na Kairos</p>
                  <Button type="button" className="w-full" disabled>Checkout não habilitado nesta prévia</Button>
                  <p className="text-xs text-muted-foreground">O checkout real só funciona após cadastro e aprovação do link oficial do fornecedor.</p>
                </div>
              </div>
            </section>
            <section aria-label="Exemplo do convite de cadastro" className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <h3 className="flex items-center gap-2 font-semibold"><Heart className="h-5 w-5 text-primary" />Convite para entrar na RUBI</h3>
              <p className="text-sm text-muted-foreground">No aplicativo, o visitante sem conta pode receber um convite opcional para criar perfil e descobrir mais ofertas.</p>
              <Button type="button" size="sm" variant="outline" onClick={() => setInviteVisible(value => !value)}>
                {inviteVisible ? "Ocultar exemplo do convite" : "Simular o pop-up de convite"}
              </Button>
              {inviteVisible && <div className="space-y-2 rounded-xl border bg-background p-4" role="status">
                <p className="font-bold">Faça parte da RUBI</p>
                <p className="text-sm text-muted-foreground">Descubra ofertas, acompanhe produtos e personalize sua experiência. Cadastro opcional.</p>
                <Button type="button" disabled>Criar conta (desabilitado nesta prévia)</Button>
                <Button type="button" variant="outline" onClick={() => setInviteVisible(false)}>Agora não</Button>
              </div>}
            </section>
            <section aria-label="Exemplos de ofertas relacionadas" className="space-y-3">
              <h3 className="text-xl font-bold">Outras opções que podem interessar</h3>
              {related.length === 0
                ? <p className="text-sm text-muted-foreground">As recomendações aparecerão aqui quando houver outros produtos da mesma categoria ativos e aprovados.</p>
                : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {related.slice(0, 4).map((item, index) => (
                      <article key={index} className="space-y-2 rounded-xl border p-3">
                        {item.image_url
                          ? <img src={item.image_url} alt={item.title} className="aspect-video w-full object-contain" loading="lazy" />
                          : <Gift className="h-10 w-10 text-muted-foreground" />}
                        <h4 className="text-sm font-semibold">{item.title}</h4>
                        <p className="text-sm font-bold">{money(item.retail_price)}</p>
                        <Button type="button" variant="outline" size="sm" disabled>Ver oferta (prévia)</Button>
                      </article>
                    ))}
                  </div>}
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

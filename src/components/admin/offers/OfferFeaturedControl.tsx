import { useEffect, useState } from 'react';
import { Calendar, Star, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Offer = {
  id: string;
  canonical_title: string;
  is_featured_on_hub: boolean;
  featured_priority: number;
  featured_starts_at: string | null;
  featured_ends_at: string | null;
};

export function OfferFeaturedControl() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const client = supabase as any;

  const loadOffers = async () => {
    setLoading(true);
    const { data, error } = await client
      .from('offer_groups')
      .select('id, canonical_title, is_featured_on_hub, featured_priority, featured_starts_at, featured_ends_at')
      .order('canonical_title');
    if (error) toast.error(`Erro ao carregar destaques: ${error.message}`);
    else setOffers((data ?? []) as Offer[]);
    setLoading(false);
  };

  useEffect(() => { void loadOffers(); }, []);

  const updateOffer = async (id: string, patch: Record<string, unknown>, successMessage: string) => {
    setSavingId(id);
    const { error } = await client.from('offer_groups').update(patch).eq('id', id);
    if (error) toast.error(`Erro: ${error.message}`);
    else {
      toast.success(successMessage);
      await loadOffers();
    }
    setSavingId(null);
  };

  const toggleFeatured = (offer: Offer) => updateOffer(
    offer.id,
    {
      is_featured_on_hub: !offer.is_featured_on_hub,
      featured_starts_at: !offer.is_featured_on_hub ? new Date().toISOString() : null,
      featured_ends_at: !offer.is_featured_on_hub ? new Date(Date.now() + 7 * 86400000).toISOString() : null,
    },
    !offer.is_featured_on_hub ? 'Destaque ativado.' : 'Destaque desativado.',
  );

  if (loading) return <div className="h-32 animate-pulse rounded-3xl bg-muted/30" />;

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <Star className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-2xl font-black uppercase italic">Destaques do Hub</h2>
          <p className="text-sm text-muted-foreground">Controle quais grupos aparecem no topo de /offers.</p>
        </div>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-3xl border border-glass-border bg-glass p-8 text-center text-muted-foreground">Nenhum grupo de oferta cadastrado.</div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => {
            const active = offer.is_featured_on_hub;
            const outsideWindow = active && Boolean(offer.featured_starts_at && offer.featured_ends_at) && (
              Date.now() < new Date(offer.featured_starts_at!).getTime() || Date.now() > new Date(offer.featured_ends_at!).getTime()
            );
            return (
              <div key={offer.id} className="rounded-3xl border border-glass-border bg-glass p-5 backdrop-blur-xl">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black uppercase italic">{offer.canonical_title}</span>
                      <Badge variant={active ? 'default' : 'outline'}>{active ? 'Em destaque' : 'Sem destaque'}</Badge>
                      {outsideWindow && <Badge variant="outline">Fora da janela</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Menor prioridade = aparece primeiro.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {active && (
                      <>
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Prioridade
                          <Input type="number" min={0} max={100} value={offer.featured_priority ?? 0} disabled={savingId === offer.id} onChange={(event) => void updateOffer(offer.id, { featured_priority: Number(event.target.value) || 0 }, 'Prioridade atualizada.')} className="h-10 w-20 rounded-xl" />
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          <Calendar className="h-4 w-4" /> Início
                          <Input type="datetime-local" value={offer.featured_starts_at?.slice(0, 16) ?? ''} disabled={savingId === offer.id} onChange={(event) => void updateOffer(offer.id, { featured_starts_at: event.target.value ? new Date(event.target.value).toISOString() : null }, 'Data de início atualizada.')} className="h-10 w-52 rounded-xl" />
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          <Calendar className="h-4 w-4" /> Fim
                          <Input type="datetime-local" value={offer.featured_ends_at?.slice(0, 16) ?? ''} disabled={savingId === offer.id} onChange={(event) => void updateOffer(offer.id, { featured_ends_at: event.target.value ? new Date(event.target.value).toISOString() : null }, 'Data final atualizada.')} className="h-10 w-52 rounded-xl" />
                        </label>
                      </>
                    )}
                    <Button type="button" variant={active ? 'outline' : 'default'} disabled={savingId === offer.id} onClick={() => toggleFeatured(offer)} className="gap-2 rounded-xl font-black uppercase"><Zap className="h-4 w-4" /> {active ? 'Desativar' : 'Ativar'}</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

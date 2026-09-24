import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getAdminMarketplace, saveAdminMarketplace } from "@/lib/marketplace.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function MarketplaceForm({ marketplaceId }: { marketplaceId?: string }) {
  const navigate = useNavigate();
  const getFn = useServerFn(getAdminMarketplace);
  const saveFn = useServerFn(saveAdminMarketplace);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [affiliateStructure, setAffiliateStructure] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(marketplaceId));

  useEffect(() => {
    if (!marketplaceId) return;
    let mounted = true;
    getFn({ data: { id: marketplaceId } }).then((data) => {
      if (!mounted) return;
      setName(data.name ?? "");
      setSlug(data.slug ?? "");
      setStatus(data.status ?? "active");
      setAffiliateStructure(data.affiliate_link_structure ?? "");
      setLoading(false);
    }).catch((error) => {
      if (mounted) {
        toast.error(error instanceof Error ? error.message : "Não foi possível carregar o marketplace.");
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [getFn, marketplaceId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (name.trim().length < 2 || normalizedSlug.length < 2) {
      toast.error("Informe um nome e um slug válidos.");
      return;
    }
    setSaving(true);
    try {
      await saveFn({
        data: {
          ...(marketplaceId ? { id: marketplaceId } : {}),
          name: name.trim(),
          slug: normalizedSlug,
          status: status as "active" | "pending" | "disabled",
          affiliate_link_structure: affiliateStructure.trim() || null,
        },
      });
      toast.success(marketplaceId ? "Marketplace atualizado." : "Marketplace criado.");
      navigate({ to: "/admin/marketplaces" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o marketplace.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="container mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">Carregando marketplace...</main>;
  return <main className="container mx-auto max-w-3xl px-4 py-10"><Card className="rounded-[2rem] border-glass-border bg-glass backdrop-blur-xl"><CardHeader><CardTitle className="text-3xl font-black uppercase italic">{marketplaceId ? "Editar marketplace" : "Novo marketplace"}</CardTitle></CardHeader><CardContent><form onSubmit={save} className="space-y-5"><div className="space-y-2"><Label>Nome *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Amazon, Shopee, Mercado Livre..." required /></div><div className="space-y-2"><Label>Slug *</Label><Input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"))} placeholder="amazon" required /></div><div className="space-y-2"><Label>Status</Label><select value={status} onChange={e => setStatus(e.target.value)} className="h-11 w-full rounded-xl border border-glass-border bg-background px-3"><option value="active">Ativo</option><option value="pending">Pendente</option><option value="disabled">Desativado</option></select></div><div className="space-y-2"><Label>Estrutura do link de afiliado</Label><Input value={affiliateStructure} onChange={e => setAffiliateStructure(e.target.value)} placeholder="https://.../{id}?tag=..." /></div><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/marketplaces" })}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar marketplace"}</Button></div></form></CardContent></Card></main>;
}

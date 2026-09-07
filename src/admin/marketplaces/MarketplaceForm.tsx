import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function MarketplaceForm({ marketplaceId }: { marketplaceId?: string }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [affiliateStructure, setAffiliateStructure] = useState("");
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return toast.error("Nome e slug são obrigatórios.");
    setSaving(true);
    try {
      const payload = { name: name.trim(), slug: slug.trim().toLowerCase().replace(/\s+/g, "-"), status, affiliate_link_structure: affiliateStructure.trim() || null };
      const result = marketplaceId
        ? await (supabase as any).from("marketplaces").update(payload).eq("id", marketplaceId)
        : await (supabase as any).from("marketplaces").insert(payload);
      if (result.error) throw result.error;
      toast.success(marketplaceId ? "Marketplace atualizado." : "Marketplace criado.");
      navigate({ to: "/admin/marketplaces" });
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível salvar o marketplace.");
    } finally {
      setSaving(false);
    }
  };

  return <main className="container mx-auto max-w-3xl px-4 py-10">
    <Card className="rounded-[2rem] border-glass-border bg-glass backdrop-blur-xl">
      <CardHeader><CardTitle className="text-3xl font-black uppercase italic">{marketplaceId ? "Editar marketplace" : "Novo marketplace"}</CardTitle></CardHeader>
      <CardContent><form onSubmit={save} className="space-y-5">
        <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Amazon, Shopee, Mercado Livre..." required /></div>
        <div className="space-y-2"><Label>Slug</Label><Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="amazon" required /></div>
        <div className="space-y-2"><Label>Status</Label><select value={status} onChange={e => setStatus(e.target.value)} className="h-11 w-full rounded-xl border border-glass-border bg-background px-3"><option value="active">Ativo</option><option value="pending">Pendente</option><option value="disabled">Desativado</option></select></div>
        <div className="space-y-2"><Label>Estrutura do link de afiliado</Label><Input value={affiliateStructure} onChange={e => setAffiliateStructure(e.target.value)} placeholder="https://.../{id}?tag=..." /></div>
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/marketplaces" })}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar marketplace"}</Button></div>
      </form></CardContent>
    </Card>
  </main>;
}

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { saveOfferGroup } from "@/lib/admin_intel.functions";

export function OfferGroupForm() {
  const navigate = useNavigate();
  const saveOffer = useServerFn(saveOfferGroup);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) { toast.error("Informe o nome da oferta."); return; }
    setSaving(true);
    try {
      const result = await saveOffer({ data: { canonical_title: value } });
      if (!result.success || !result.id) throw new Error("A oferta não retornou um ID válido.");
      toast.success("Oferta criada.");
      navigate({ to: "/admin/offers" });
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível criar a oferta.");
    } finally {
      setSaving(false);
    }
  };
  return <main className="container mx-auto max-w-2xl px-4 py-10"><Card className="rounded-[2rem] border-glass-border bg-glass backdrop-blur-xl"><CardHeader><CardTitle className="text-3xl font-black uppercase italic">Nova oferta</CardTitle></CardHeader><CardContent><form onSubmit={save} className="space-y-5"><div className="space-y-2"><Label htmlFor="offer-name">Nome da oferta</Label><Input id="offer-name" value={name} onChange={e => setName(e.target.value)} placeholder="Oferta principal" required disabled={saving} /></div><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/offers" })} disabled={saving}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Criar oferta"}</Button></div></form></CardContent></Card></main>;
}

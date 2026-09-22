import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Layers3, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  return <main className="relative min-h-[75vh] overflow-hidden px-4 py-8 sm:py-12">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary/[0.09] via-primary/[0.03] to-transparent" />
    <div className="relative mx-auto max-w-3xl">
      <Button variant="ghost" className="mb-6 rounded-xl font-bold" onClick={() => navigate({ to: "/admin/offers" })} disabled={saving}><ArrowLeft className="mr-2 h-4 w-4" />Voltar para ofertas</Button>
      <div className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary"><Sparkles className="h-3.5 w-3.5" />Offer Intelligence · Novo grupo</div>
      <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-card/75 shadow-elevation-1 backdrop-blur-xl">
        <div className="border-b border-border/60 bg-gradient-to-r from-primary/[0.08] via-transparent to-transparent p-6 sm:p-8">
          <div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><Layers3 className="h-7 w-7" /></div><div><Badge variant="outline" className="mb-2 rounded-full border-primary/20 bg-primary/5 text-primary">Catálogo de ofertas</Badge><h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">Nova oferta</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Crie um grupo para organizar produtos e controlar quais ofertas podem ganhar destaque no Hub.</p></div></div>
        </div>
        <CardContent className="p-6 sm:p-8"><form onSubmit={save} className="space-y-6"><div className="rounded-2xl border border-border/60 bg-background/50 p-5 sm:p-6"><div className="mb-4 flex items-center gap-3"><div className="rounded-xl bg-muted p-2"><Tag className="h-4 w-4" /></div><div><p className="font-black">Identidade da oferta</p><p className="text-xs text-muted-foreground">Use um nome claro para reconhecer este grupo no Admin e na loja.</p></div></div><div className="space-y-2"><Label htmlFor="offer-name">Nome da oferta *</Label><Input id="offer-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Ofertas de Eletrônicos" required disabled={saving} maxLength={200} className="h-12 rounded-xl text-base" /><div className="flex justify-between text-xs text-muted-foreground"><span>Esse nome será usado como título do grupo.</span><span>{name.length}/200</span></div></div></div><div className="flex flex-col-reverse gap-3 border-t border-border/60 pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => navigate({ to: "/admin/offers" })} disabled={saving}>Cancelar</Button><Button type="submit" className="h-11 rounded-xl px-6 font-black" disabled={saving}>{saving ? "Criando oferta..." : "Criar oferta"}</Button></div></form></CardContent>
      </Card>
    </div>
  </main>;
}

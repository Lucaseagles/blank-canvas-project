import { FormEvent, useEffect, useState } from "react";
import { listProducts } from "@/lib/supabase/products";
import { saveBridgeVideo } from "@/lib/bridge-video.functions";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const platformLabels = { tiktok: "TikTok", shopee: "Shopee Video", ml: "Mercado Livre", youtube: "YouTube" } as const;
type Platform = keyof typeof platformLabels;

export function BridgeVideoForm({ onBack }: { onBack: () => void }) {
  const saveFn = useServerFn(saveBridgeVideo);
  const [products, setProducts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ product_id: "", title: "", subtitle: "", thumbnail: "", platform: "tiktok" as Platform, link: "", is_active: true });

  useEffect(() => {
    listProducts({ limit: 200 }).then(r => setProducts(r.data ?? [])).catch(e => toast.error(e instanceof Error ? e.message : "Não foi possível carregar produtos."));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.product_id || !form.title.trim() || !form.link.trim()) {
      toast.error("Produto, título e link são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      await saveFn({ data: { ...form, subtitle: form.subtitle || null, thumbnail: form.thumbnail || null } });
      toast.success("Vídeo ponte salvo com sucesso.");
      onBack();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o vídeo ponte.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-xl">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Novo vídeo ponte</h1>
        <p className="mt-2 text-muted-foreground">Cole uma URL pública real do TikTok, Shopee Video, Mercado Livre ou YouTube e associe ao produto.</p>
      </div>
      <div className="relative grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2"><Label>Produto *</Label><Select value={form.product_id} onValueChange={v => setForm(f => ({ ...f, product_id: v }))}><SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger><SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Plataforma *</Label><Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v as Platform }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(platformLabels).map(([value,label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>URL pública do vídeo *</Label><Input type="url" required value={form.link} placeholder="https://www.tiktok.com/..." onChange={e => setForm(f => ({ ...f, link: e.target.value }))} /></div>
        <div className="space-y-2 md:col-span-2"><Label>Título *</Label><Input required maxLength={200} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
        <div className="space-y-2 md:col-span-2"><Label>Subtítulo/legenda</Label><Textarea maxLength={500} value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} /></div>
        <div className="space-y-2 md:col-span-2"><Label>Thumbnail (opcional)</Label><Input type="url" value={form.thumbnail} placeholder="https://..." onChange={e => setForm(f => ({ ...f, thumbnail: e.target.value }))} /></div>
        <div className="flex items-center justify-between rounded-xl border p-4 md:col-span-2"><Label>Ativo na loja</Label><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /></div>
      </div>
      <Button type="submit" disabled={saving} className="h-12 w-full rounded-xl font-black shadow-lg shadow-primary/10 transition-all hover:-translate-y-0.5 hover:shadow-xl">{saving ? "Salvando..." : "Salvar vídeo ponte"}</Button>
    </form>
  );
}

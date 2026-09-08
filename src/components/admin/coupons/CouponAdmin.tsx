import { useEffect, useState } from "react";
import { Check, Edit, Plus, Save, Tag, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Option = { id: string; name: string; icon?: string | null };
type Coupon = { id: string; code: string; description: string | null; discount_type: string; discount_value: number; valid_from: string; valid_until: string | null; marketplace_id: string; product_id: string | null; category_id: string | null; is_active: boolean; is_real: boolean; max_uses: number | null; used_count: number; marketplaces?: { name?: string; icon?: string | null } | null };

const emptyForm = { code: "", description: "", discount_type: "percentage", discount_value: 0, valid_from: "", valid_until: "", marketplace_id: "", product_id: "", category_id: "", is_active: true, max_uses: null as number | null };

function localDateTime(value: string | null | undefined) { return value ? new Date(value).toISOString().slice(0, 16) : ""; }
function toIso(value: string) { return value ? new Date(value).toISOString() : null; }

export function CouponAdmin() {
  const [coupons, setCoupons] = useState<Coupon[]>([]); const [marketplaces, setMarketplaces] = useState<Option[]>([]); const [products, setProducts] = useState<Option[]>([]); const [categories, setCategories] = useState<Option[]>([]);
  const [form, setForm] = useState(emptyForm); const [creating, setCreating] = useState(false); const [editingId, setEditingId] = useState<string | null>(null); const [confirmReal, setConfirmReal] = useState(false); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const client = supabase as any;

  async function loadData() {
    setLoading(true);
    const [c, m, p, cat] = await Promise.all([
      client.from("customer_coupons").select("*, marketplaces:marketplace_id(name, icon)").order("created_at", { ascending: false }),
      client.from("marketplaces").select("id, name, icon").eq("status", "active").order("name"),
      client.from("products").select("id, title").eq("status", "active").order("title").limit(200),
      client.from("categories").select("id, name").eq("is_active", true).order("name"),
    ]);
    if (c.error) toast.error(c.error.message); setCoupons(c.data ?? []); setMarketplaces(m.data ?? []); setProducts((p.data ?? []).map((x: any) => ({ id: x.id, name: x.title }))); setCategories(cat.data ?? []); setLoading(false);
  }
  useEffect(() => { void loadData(); }, []);

  function startCreate() { setCreating(true); setEditingId(null); setConfirmReal(false); setForm({ ...emptyForm, valid_from: localDateTime(new Date().toISOString()), valid_until: localDateTime(new Date(Date.now() + 30 * 86400000).toISOString()) }); }
  function startEdit(c: Coupon) { setCreating(false); setEditingId(c.id); setConfirmReal(c.is_real); setForm({ code: c.code, description: c.description ?? "", discount_type: c.discount_type, discount_value: Number(c.discount_value), valid_from: localDateTime(c.valid_from), valid_until: localDateTime(c.valid_until), marketplace_id: c.marketplace_id, product_id: c.product_id ?? "", category_id: c.category_id ?? "", is_active: c.is_active, max_uses: c.max_uses }); }
  function closeForm() { setCreating(false); setEditingId(null); setConfirmReal(false); }

  async function save() {
    if (!form.code.trim() || !form.marketplace_id) return toast.error("Código e marketplace são obrigatórios.");
    if (!confirmReal) return toast.error("Confirme que o cupom é REAL e oficial do marketplace.");
    if (form.discount_value <= 0) return toast.error("O desconto deve ser maior que zero.");
    if (form.discount_type === "percentage" && form.discount_value > 100) return toast.error("Percentual não pode ser maior que 100%.");
    const validFrom = toIso(form.valid_from) ?? new Date().toISOString(); const validUntil = toIso(form.valid_until);
    if (validUntil && new Date(validUntil) < new Date(validFrom)) return toast.error("A expiração deve ser posterior ao início.");
    setSaving(true);
    const payload = { code: form.code.trim().toUpperCase(), description: form.description.trim() || null, discount_type: form.discount_type, discount_value: form.discount_value, valid_from: validFrom, valid_until: validUntil, marketplace_id: form.marketplace_id, product_id: form.product_id || null, category_id: form.category_id || null, is_active: form.is_active, max_uses: form.max_uses, is_real: true };
    const result = editingId ? await client.from("customer_coupons").update(payload).eq("id", editingId) : await client.from("customer_coupons").insert(payload);
    setSaving(false); if (result.error) return toast.error(result.error.message); toast.success(editingId ? "Cupom atualizado." : "Cupom criado."); closeForm(); void loadData();
  }
  async function remove(id: string) { if (!window.confirm("Excluir este cupom?")) return; const { error } = await client.from("customer_coupons").delete().eq("id", id); if (error) toast.error(error.message); else { toast.success("Cupom excluído."); void loadData(); } }
  async function toggle(c: Coupon) { const { error } = await client.from("customer_coupons").update({ is_active: !c.is_active }).eq("id", c.id); if (error) toast.error(error.message); else void loadData(); }

  return <Card className="rounded-[2rem] border-glass-border bg-glass backdrop-blur-xl"><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-2xl font-black"><Tag className="h-5 w-5 text-primary" /> Gestão de Cupons</CardTitle><p className="mt-1 text-sm text-muted-foreground">Cadastre somente cupons reais e confirmados.</p></div><Button onClick={startCreate}><Plus className="mr-2 h-4 w-4" />Novo cupom</Button></div></CardHeader><CardContent className="space-y-6">
    {(creating || editingId) && <div className="rounded-2xl border border-border bg-background/60 p-5"><div className="mb-5 flex items-center justify-between"><h3 className="font-black">{creating ? "Novo cupom" : "Editar cupom"}</h3><Button variant="ghost" size="icon" onClick={closeForm}><X /></Button></div><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Código *</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="PROMO10" /></div><div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="10% OFF em eletrônicos" /></div><div className="space-y-2"><Label>Tipo</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })}><option value="percentage">Porcentagem</option><option value="fixed">Valor fixo</option></select></div><div className="space-y-2"><Label>Desconto *</Label><Input type="number" min="0.01" step="0.01" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: Number(e.target.value) || 0 })} /></div><div className="space-y-2"><Label>Marketplace *</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.marketplace_id} onChange={e => setForm({ ...form, marketplace_id: e.target.value })}><option value="">Selecione...</option>{marketplaces.map(m => <option key={m.id} value={m.id}>{m.icon ?? "🛍️"} {m.name}</option>)}</select></div><div className="space-y-2"><Label>Produto (opcional)</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}><option value="">Nenhum</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="space-y-2"><Label>Categoria (opcional)</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}><option value="">Nenhuma</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="space-y-2"><Label>Uso máximo</Label><Input type="number" min="1" placeholder="Ilimitado" value={form.max_uses ?? ""} onChange={e => setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : null })} /></div><div className="space-y-2"><Label>Início</Label><Input type="datetime-local" value={form.valid_from} onChange={e => setForm({ ...form, valid_from: e.target.value })} /></div><div className="space-y-2"><Label>Expiração</Label><Input type="datetime-local" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} /></div><label className="md:col-span-2 flex cursor-pointer items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"><input type="checkbox" checked={confirmReal} onChange={e => setConfirmReal(e.target.checked)} className="mt-1" /><span><strong>Confirmo que este cupom é REAL e oficial.</strong><span className="block mt-1 text-xs text-muted-foreground">A confirmação é obrigatória e também é validada no banco.</span></span></label></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={closeForm}>Cancelar</Button><Button onClick={() => void save()} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Salvando..." : creating ? "Criar cupom" : "Salvar"}</Button></div></div>}
    {loading ? <div className="py-10 text-center text-sm text-muted-foreground">Carregando cupons...</div> : coupons.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center"><Tag className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-3 font-bold">Nenhum cupom cadastrado</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground"><th className="p-3">Código</th><th className="p-3">Marketplace</th><th className="p-3">Desconto</th><th className="p-3">Validade</th><th className="p-3">Status</th><th className="p-3">Ações</th></tr></thead><tbody>{coupons.map(c => <tr key={c.id} className="border-b border-border/50"><td className="p-3 font-black tracking-wider">{c.code}</td><td className="p-3">{c.marketplaces?.icon} {c.marketplaces?.name ?? "—"}</td><td className="p-3">{c.discount_type === "percentage" ? `${c.discount_value}%` : `R$ ${Number(c.discount_value).toFixed(2).replace(".", ",")}`}</td><td className="p-3">{c.valid_until ? new Date(c.valid_until).toLocaleDateString("pt-BR") : "Sem data"}</td><td className="p-3"><button onClick={() => void toggle(c)} className="rounded-full px-2.5 py-1 text-xs font-bold">{c.is_active ? "🟢 Ativo" : "🔴 Inativo"}</button></td><td className="p-3"><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => startEdit(c)} title="Editar"><Edit /></Button><Button variant="ghost" size="icon" onClick={() => void remove(c.id)} title="Excluir"><Trash2 /></Button></div></td></tr>)}</tbody></table></div>}
    <div className="flex items-start gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Trava de confiança ativa: o frontend exige confirmação e o banco impede publicação de cupons marcados como não reais.</div>
  </CardContent></Card>;
}

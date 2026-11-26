import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { createAdminReferralTier, deactivateAdminReferralTier, getAdminReferralTiers, updateAdminReferralTier } from "@/lib/referral-tiers-admin.functions";
import type { ReferralTier } from "@/lib/supabase/tiers";

interface TierForm {
  tier_name: string;
  tier_key: string;
  min_referrals: number;
  reward_description: string;
  icon: string;
  color: string;
  is_active: boolean;
  display_order: number;
}

const emptyForm: TierForm = { tier_name: "", tier_key: "", min_referrals: 0, reward_description: "", icon: "🏅", color: "#6B7280", is_active: true, display_order: 1 };

export function ReferralTiersAdmin() {
  const client = useQueryClient();
  const [editing, setEditing] = useState<ReferralTier | null>(null);
  const [form, setForm] = useState<TierForm>(emptyForm);
  const [creating, setCreating] = useState(false);

  const query = useQuery({
    queryKey: ["admin-referral-tiers"],
    queryFn: getAdminReferralTiers,
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload: TierForm = {
        ...form,
        tier_name: form.tier_name.trim(),
        tier_key: form.tier_key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_"),
        reward_description: form.reward_description.trim(),
      };
      if (creating) return createAdminReferralTier({ data: payload });
      if (!editing) throw new Error("Selecione um nível para editar.");
      return updateAdminReferralTier({ data: { id: editing.id, expectedUpdatedAt: editing.updated_at ?? null, patch: payload } });
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-referral-tiers"] });
      client.invalidateQueries({ queryKey: ["referral-tiers"] });
      setEditing(null);
      setCreating(false);
      setForm(emptyForm);
    },
  });

  const remove = useMutation({
    mutationFn: async (tier: ReferralTier) => deactivateAdminReferralTier({ data: { id: tier.id, expectedUpdatedAt: tier.updated_at ?? null } }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-referral-tiers"] });
      client.invalidateQueries({ queryKey: ["referral-tiers"] });
    },
  });

  const startEdit = (tier: ReferralTier) => {
    setEditing(tier);
    setCreating(false);
    setForm({
      tier_name: tier.tier_name,
      tier_key: tier.tier_key,
      min_referrals: tier.min_referrals,
      reward_description: tier.reward_description,
      icon: tier.icon,
      color: tier.color,
      is_active: tier.is_active,
      display_order: tier.display_order,
    });
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ ...emptyForm, display_order: (query.data?.length ?? 0) + 1 });
  };

  return <section className="space-y-5 rounded-[2rem] border border-glass-border bg-glass p-5 sm:p-6 backdrop-blur-xl"><header className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-black uppercase italic">Níveis de recompensa</h2><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CRUD administrativo · alterações auditadas</p></div><div className="flex gap-2"><button type="button" onClick={startCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-[9px] font-black uppercase text-primary-foreground"><Plus className="h-4 w-4" /> Novo</button><button type="button" onClick={() => query.refetch()} className="grid h-9 w-9 place-items-center rounded-xl border border-glass-border"><RefreshCw className="h-4 w-4" /></button></div></header>
    {(creating || editing) && <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3"><div className="flex justify-between"><p className="text-xs font-black uppercase">{creating ? "Novo nível" : "Editar nível"}</p><button type="button" onClick={() => { setCreating(false); setEditing(null); }}><X className="h-4 w-4" /></button></div><div className="grid gap-3 sm:grid-cols-2"><input className="rounded-xl border border-glass-border bg-background p-3 text-xs" placeholder="Nome" value={form.tier_name} onChange={e => setForm({ ...form, tier_name: e.target.value })} /><input className="rounded-xl border border-glass-border bg-background p-3 text-xs" placeholder="Chave" value={form.tier_key} onChange={e => setForm({ ...form, tier_key: e.target.value })} /><input type="number" min="0" className="rounded-xl border border-glass-border bg-background p-3 text-xs" placeholder="Mínimo" value={form.min_referrals} onChange={e => setForm({ ...form, min_referrals: Number(e.target.value) })} /><input className="rounded-xl border border-glass-border bg-background p-3 text-xs" placeholder="Ícone" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} /><textarea className="sm:col-span-2 rounded-xl border border-glass-border bg-background p-3 text-xs" placeholder="Descrição da recompensa" value={form.reward_description} onChange={e => setForm({ ...form, reward_description: e.target.value })} /><input type="color" className="h-11 w-full rounded-xl border border-glass-border bg-background" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Ativo</label><input type="number" min="0" className="rounded-xl border border-glass-border bg-background p-3 text-xs" placeholder="Ordem" value={form.display_order} onChange={e => setForm({ ...form, display_order: Number(e.target.value) })} /></div><button type="button" onClick={() => save.mutate()} disabled={save.isPending} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-[9px] font-black uppercase text-primary-foreground"><Save className="h-4 w-4" /> {save.isPending ? "Salvando..." : "Salvar"}</button>{save.isError && <p role="alert" className="text-xs text-destructive">{save.error.message}</p>}</div>}
    {query.isError && <p role="alert" className="text-xs text-destructive">{query.error.message}</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{query.data?.map(tier => <article key={tier.id} className="rounded-2xl border border-glass-border p-4"><div className="flex items-start justify-between"><span className="text-2xl">{tier.icon}</span><span className="text-[9px] font-black uppercase" style={{ color: tier.color }}>{tier.is_active ? "Ativo" : "Inativo"}</span></div><h3 className="mt-3 font-black uppercase">{tier.tier_name}</h3><p className="text-[10px] text-muted-foreground">A partir de {tier.min_referrals} indicações</p><p className="mt-3 min-h-12 text-xs text-muted-foreground">{tier.reward_description}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => startEdit(tier)} className="inline-flex items-center gap-1 rounded-lg border border-glass-border px-3 py-2 text-[9px] font-black uppercase"><Pencil className="h-3 w-3" /> Editar</button>{tier.is_active && <button type="button" onClick={() => remove.mutate(tier)} disabled={remove.isPending} className="inline-flex items-center gap-1 rounded-lg border border-destructive/20 px-3 py-2 text-[9px] font-black uppercase text-destructive"><Trash2 className="h-3 w-3" /> Desativar</button>}</div>{remove.isError && <p role="alert" className="mt-2 text-xs text-destructive">{remove.error.message}</p>}</article>)}</div></section>;
}

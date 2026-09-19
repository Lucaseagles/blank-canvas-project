import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Activity, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getExperiencePopupAdmin, updateExperiencePopup } from "@/lib/experience-popup.functions";

export const Route = createFileRoute("/admin/experience-popup")({ component: ExperiencePopupPage });

function ExperiencePopupPage() {
  const queryClient = useQueryClient();
  const getData = useServerFn(getExperiencePopupAdmin);
  const update = useServerFn(updateExperiencePopup);
  const query = useQuery({ queryKey: ["experience-popup-admin"], queryFn: () => getData({ data: undefined }) });
  const mutation = useMutation({ mutationFn: (data: Parameters<typeof update>[0]) => update(data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["experience-popup-admin"] }); toast.success("Regra de experiência atualizada"); }, onError: (error) => toast.error(error.message) });

  if (query.isLoading) return <div className="container mx-auto px-4 py-12 text-sm text-muted-foreground">Carregando Experience Engine…</div>;
  if (query.isError) return <div className="container mx-auto px-4 py-12 text-sm text-destructive">Falha ao carregar Experience Engine: {query.error.message}</div>;

  const rules = (query.data ?? []) as any[];
  return <div className="container mx-auto space-y-8 px-4 py-8 lg:px-8 lg:py-12">
    <header><Badge className="mb-3 gap-2"><ShieldCheck className="h-3 w-3" /> Owner Only</Badge><h1 className="text-4xl font-black uppercase italic tracking-tighter lg:text-6xl">Experience <span className="text-primary">Engine</span></h1><p className="mt-3 max-w-3xl text-sm text-muted-foreground">Controle das experiências contextuais já existentes. A seleção continua server-side e usa popup_rules, popup_events, personalização, relacionamento de produtos e benefícios reais.</p></header>
    <div className="grid gap-4 md:grid-cols-4"><Metric title="Regras" value={rules.length} /><Metric title="Views 30d" value={rules.reduce((n, r) => n + r.views, 0)} /><Metric title="Cliques 30d" value={rules.reduce((n, r) => n + r.clicks, 0)} /><Metric title="CTR global" value={`${globalCtr(rules)}%`} /></div>
    <div className="space-y-4">{rules.length === 0 ? <Card className="rounded-3xl"><CardContent className="py-16 text-center text-sm text-muted-foreground">Nenhuma regra real cadastrada.</CardContent></Card> : rules.map((rule) => <PopupRuleCard key={rule.id} rule={rule} onSave={(patch) => mutation.mutate({ data: { id: rule.id, patch } })} pending={mutation.isPending} />)}</div>
  </div>;
}

function globalCtr(rules: Array<{ views: number; clicks: number }>) { const views = rules.reduce((n, r) => n + r.views, 0); const clicks = rules.reduce((n, r) => n + r.clicks, 0); return views ? ((clicks / views) * 100).toFixed(1) : "0.0"; }
function Metric({ title, value }: { title: string; value: string | number }) { return <Card className="rounded-3xl"><CardContent className="p-5"><div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{title}</div><div className="mt-2 text-3xl font-black">{value}</div></CardContent></Card>; }

type Rule = { id: string; name: string; trigger_type: string; audience_segment: string | null; priority: number; cooldown_minutes: number; frequency_cap_per_day: number; starts_at: string | null; ends_at: string | null; cta_label: string | null; cta_target: string | null; is_active: boolean; views: number; clicks: number; dismisses: number; ctr: number };
type Patch = { priority: number; cooldown_minutes: number; frequency_cap_per_day: number; starts_at: string | null; ends_at: string | null; cta_label: string | null; cta_target: string | null; is_active: boolean };
function PopupRuleCard({ rule, onSave, pending }: { rule: Rule; onSave: (patch: Patch) => void; pending: boolean }) {
  const [draft, setDraft] = useState<Patch>({ priority: rule.priority, cooldown_minutes: rule.cooldown_minutes, frequency_cap_per_day: rule.frequency_cap_per_day, starts_at: rule.starts_at, ends_at: rule.ends_at, cta_label: rule.cta_label, cta_target: rule.cta_target, is_active: rule.is_active });
  return <Card className="rounded-3xl border-glass-border bg-glass-fallback backdrop-blur-xl"><CardHeader><CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="text-lg font-black">{rule.name}</div><div className="mt-1 font-mono text-[10px] text-muted-foreground">{rule.trigger_type} · {rule.id}</div></div><div className="flex items-center gap-3 text-xs"><Activity className="h-4 w-4 text-primary" /> {rule.views} views · {rule.clicks} clicks · CTR {rule.ctr}%</div></CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><Field label="Prioridade" value={draft.priority} onChange={(v) => setDraft({ ...draft, priority: Number(v) })} /><Field label="Cooldown (min)" value={draft.cooldown_minutes} onChange={(v) => setDraft({ ...draft, cooldown_minutes: Number(v) })} /><Field label="Limite/dia" value={draft.frequency_cap_per_day} onChange={(v) => setDraft({ ...draft, frequency_cap_per_day: Number(v) })} /><label className="flex items-center justify-between rounded-xl border p-3"><span className="text-xs font-bold">Ativo</span><Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} /></label><Field label="Início ISO" value={draft.starts_at ?? ""} onChange={(v) => setDraft({ ...draft, starts_at: v || null })} /><Field label="Fim ISO" value={draft.ends_at ?? ""} onChange={(v) => setDraft({ ...draft, ends_at: v || null })} /><Field label="CTA" value={draft.cta_label ?? ""} onChange={(v) => setDraft({ ...draft, cta_label: v || null })} /><Field label="Destino" value={draft.cta_target ?? ""} onChange={(v) => setDraft({ ...draft, cta_target: v || null })} /><div className="flex justify-end md:col-span-2 lg:col-span-4"><Button disabled={pending} onClick={() => onSave(draft)} className="gap-2 rounded-xl"><Save className="h-4 w-4" /> Salvar regra</Button></div></CardContent></Card>;
}
function Field({ label, value, onChange }: { label: string; value: string | number; onChange: (value: string) => void }) { return <label className="space-y-1"><span className="text-[10px] font-bold uppercase text-muted-foreground">{label}</span><Input value={value} onChange={(e) => onChange(e.target.value)} /></label>; }

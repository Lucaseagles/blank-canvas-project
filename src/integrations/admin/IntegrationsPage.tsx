import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Filter, Loader2, PlugZap, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getIntegrationStatuses, testIntegration } from "@/lib/integrations.functions";
import { PLATFORM_LIST } from "../config/platforms";
import type { PlatformConfig } from "../core/types";
import { IntegrationCard } from "../components/IntegrationCard";
import { CredentialForm } from "../components/CredentialForm";
import { AFFILIATE_STRATEGIES } from "../strategies/affiliate-strategies";

type Status = { platform_id: string; status: string; last_checked_at: string | null; last_error: string | null };
type CategoryFilter = "all" | PlatformConfig["category"];
type TestResult = { success: boolean; message?: string; error?: string };

const categories: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "Todas" }, { id: "marketplace", label: "Marketplaces" }, { id: "video", label: "Vídeo Commerce" },
  { id: "affiliate", label: "Redes de Afiliados" }, { id: "communication", label: "Comunicação" }, { id: "compliance", label: "Compliance" },
];

const TRENDING_PLATFORMS = new Set(["tiktok_shop", "youtube_shopping", "instagram_shopping", "kwai", "temu", "shein"]);

export function IntegrationsPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [showTrending, setShowTrending] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setStatuses(await getIntegrationStatuses({ data: undefined }) as Status[]); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao carregar integrações."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const test = async (platformId: string) => {
    setTesting(platformId);
    try {
      const result = await testIntegration({ data: { platformId } }) as TestResult;
      toast[result.success ? "success" : "error"](result.message ?? result.error ?? "Teste concluído");
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Falha no teste."); }
    finally { setTesting(null); }
  };

  const stats = useMemo(() => ({
    total: PLATFORM_LIST.length,
    available: PLATFORM_LIST.filter((p) => p.status === "available" || p.status === "external_traffic").length,
    pending: PLATFORM_LIST.filter((p) => p.status === "pending").length,
    connected: statuses.filter((s) => s.status === "active").length,
    errors: statuses.filter((s) => s.status === "error").length,
  }), [statuses]);

  const platforms = useMemo(() => {
    let result = category === "all" ? PLATFORM_LIST : PLATFORM_LIST.filter((p) => p.category === category);
    if (onlyAvailable) result = result.filter((p) => p.status === "available" || p.status === "external_traffic");
    if (showTrending) result = result.filter((p) => TRENDING_PLATFORMS.has(p.id));
    return result;
  }, [category, onlyAvailable, showTrending]);

  if (selected) return <div className="container mx-auto max-w-3xl px-4 py-8 lg:px-8"><button className="mb-5 text-sm text-muted-foreground hover:text-foreground" onClick={() => { setSelected(null); void load(); }}>← Voltar para integrações</button><CredentialForm platformId={selected} onSuccess={() => { setSelected(null); void load(); }} onCancel={() => setSelected(null)} /></div>;

  return <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-8 lg:py-12">
    <header className="space-y-5"><div className="flex flex-wrap items-start justify-between gap-5"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><PlugZap /></div><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Owner / Secure Hub</p><h1 className="text-4xl font-black uppercase italic tracking-tighter">Centro de Integrações</h1></div></div><div className="flex flex-wrap gap-2 text-xs"><Stat label="Total" value={stats.total} /><Stat label="Disponíveis" value={stats.available} /><Stat label="Em análise" value={stats.pending} /><Stat label="Conectadas" value={stats.connected} /></div></div><p className="max-w-4xl text-sm text-muted-foreground">Centro de comando para marketplaces, afiliados, vídeo commerce e comunicação. Plataformas em análise permanecem sem automação ao vivo até validação oficial; credenciais continuam protegidas no Vault.</p></header>

    <section className="grid gap-3 md:grid-cols-3"><div className="rounded-2xl border border-glass-border bg-glass-fallback p-4"><div className="flex items-center gap-2 text-sm font-bold"><TrendingUp className="h-4 w-4 text-primary" /> Tendências 2025/2026</div><p className="mt-1 text-xs text-muted-foreground">{TRENDING_PLATFORMS.size} plataformas em destaque no radar.</p><button type="button" onClick={() => setShowTrending((v) => !v)} className="mt-3 text-xs font-bold text-primary">{showTrending ? "Ver todas" : "Ver tendências"}</button></div><div className="rounded-2xl border border-glass-border bg-glass-fallback p-4"><div className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Conexões ativas</div><p className="mt-1 text-xs text-muted-foreground">{stats.connected} conexão(ões) confirmada(s) pelos testes.</p></div><div className="rounded-2xl border border-glass-border bg-glass-fallback p-4"><div className="flex items-center gap-2 text-sm font-bold"><AlertTriangle className="h-4 w-4 text-amber-500" /> Atenção</div><p className="mt-1 text-xs text-muted-foreground">{stats.errors} integração(ões) com erro no último teste.</p></div></section>

    <div className="flex flex-wrap items-center gap-2">{categories.map((item) => <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={`rounded-xl border px-4 py-2 text-xs font-bold transition-colors ${category === item.id ? "border-primary bg-primary/10 text-primary" : "border-glass-border text-muted-foreground hover:text-foreground"}`}>{item.label}</button>)}<button type="button" onClick={() => setOnlyAvailable((v) => !v)} className={`ml-auto inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold ${onlyAvailable ? "border-primary bg-primary/10 text-primary" : "border-glass-border text-muted-foreground"}`}><Filter className="h-3.5 w-3.5" /> Apenas disponíveis</button><span className="text-xs text-muted-foreground">{platforms.length} plataformas</span></div>

    {loading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div> : platforms.length === 0 ? <div className="rounded-3xl border border-dashed border-glass-border p-10 text-center text-sm text-muted-foreground">Nenhuma plataforma corresponde aos filtros atuais.</div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{platforms.map((platform) => { const status = statuses.find((item) => item.platform_id === platform.id); return <div key={platform.id} className="relative">{TRENDING_PLATFORMS.has(platform.id) && <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[9px] font-black text-primary-foreground"><Sparkles className="h-3 w-3" /> Tendência</span>}<IntegrationCard platform={platform} status={status} onConfigure={() => setSelected(platform.id)} onTest={platform.connectorId ? () => test(platform.id) : undefined} /></div>; })}</div>}
    {testing && <p className="text-center text-xs text-muted-foreground">Testando {testing}…</p>}

    {category !== "communication" && <section className="space-y-4"><div><h2 className="text-2xl font-black tracking-tight">Estratégias de divulgação</h2><p className="text-sm text-muted-foreground">Regras e boas práticas registradas por plataforma. Itens em análise ficam explicitamente bloqueados para automação ao vivo.</p></div><div className="grid gap-4 lg:grid-cols-2">{Object.values(AFFILIATE_STRATEGIES).map((item) => <article key={item.platformId} className="rounded-[1.75rem] border border-glass-border bg-glass-fallback p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-black">{item.name}</h3><span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary">{item.method}</span></div><p className="mt-2 text-sm text-muted-foreground">{item.description}</p><div className="mt-4 grid gap-4 text-xs md:grid-cols-3"><div><p className="font-bold">Canais</p><ul className="mt-1 space-y-1 text-muted-foreground">{item.allowedChannels.map((v) => <li key={v}>• {v}</li>)}</ul></div><div><p className="font-bold">Boas práticas</p><ul className="mt-1 space-y-1 text-muted-foreground">{item.bestPractices.map((v) => <li key={v}>• {v}</li>)}</ul></div><div><p className="font-bold">Restrições</p><ul className="mt-1 space-y-1 text-muted-foreground">{item.restrictions.map((v) => <li key={v}>• {v}</li>)}</ul></div></div><p className="mt-4 rounded-xl bg-muted/40 p-3 text-xs"><strong>Exemplo:</strong> {item.example}</p></article>)}</div></section>}

    <section className="space-y-4"><div><h2 className="text-2xl font-black tracking-tight">Roadmap de integrações</h2><p className="text-sm text-muted-foreground">O hub diferencia o que já está conectado do que está apenas registrado para futura implementação.</p></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{["telegram", "whatsapp", "tiktok_shop", "youtube_shopping", "instagram_shopping", "kwai"].map((id) => { const platform = PLATFORM_LIST.find((p) => p.id === id); if (!platform) return null; const status = statuses.find((s) => s.platform_id === id); const label = status?.status === "active" ? "Concluído" : platform.status === "pending" ? "Em análise" : platform.status === "external_traffic" ? "Em integração" : "Disponível"; return <div key={id} className="flex items-center gap-3 rounded-2xl border border-glass-border bg-glass-fallback p-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl text-sm" style={{ backgroundColor: platform.color, color: "white" }}>{platform.icon}</div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{platform.name}</p><p className="text-[10px] text-muted-foreground">{label}</p></div></div>; })}</div></section>
  </div>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-glass-border bg-glass-fallback px-3 py-2 text-center"><div className="text-lg font-black">{value}</div><div className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div></div>; }

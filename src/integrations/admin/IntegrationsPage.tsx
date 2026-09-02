import { useEffect, useMemo, useState } from "react";
import { Loader2, PlugZap } from "lucide-react";
import { toast } from "sonner";
import { getIntegrationStatuses, testIntegration } from "@/lib/integrations.functions";
import { PLATFORM_LIST } from "../config/platforms";
import type { PlatformConfig } from "../core/types";
import { IntegrationCard } from "../components/IntegrationCard";
import { CredentialForm } from "../components/CredentialForm";
import { AFFILIATE_STRATEGIES } from "../strategies/affiliate-strategies";

type Status = { platform_id: string; status: string; last_checked_at: string | null; last_error: string | null };
type CategoryFilter = "all" | PlatformConfig["category"];

const categories: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "marketplace", label: "Marketplaces" },
  { id: "video", label: "Vídeo Commerce" },
  { id: "affiliate", label: "Redes de Afiliados" },
  { id: "communication", label: "Comunicação" },
  { id: "compliance", label: "Compliance" },
];

export function IntegrationsPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try { setStatuses(await getIntegrationStatuses({ data: undefined }) as Status[]); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao carregar integrações."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const test = async (platformId: string) => {
    setTesting(platformId);
    try { const result = await testIntegration({ data: { platformId } }); toast[result.success ? "success" : "error"](result.message ?? result.error ?? "Teste concluído"); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Falha no teste."); }
    finally { setTesting(null); }
  };

  const platforms = useMemo(() => category === "all" ? PLATFORM_LIST : PLATFORM_LIST.filter((platform) => platform.category === category), [category]);

  if (selected) return <div className="container mx-auto max-w-3xl px-4 py-8 lg:px-8"><button className="mb-5 text-sm text-muted-foreground hover:text-foreground" onClick={() => { setSelected(null); void load(); }}>← Voltar para integrações</button><CredentialForm platformId={selected} onSuccess={() => { setSelected(null); void load(); }} onCancel={() => setSelected(null)} /></div>;

  return <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-8 lg:py-12">
    <header className="space-y-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><PlugZap /></div><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Owner / Secure Hub</p><h1 className="text-4xl font-black uppercase italic tracking-tighter">Centro de Integrações</h1></div></div><p className="max-w-3xl text-sm text-muted-foreground">Core extensível para marketplaces, afiliados, vídeo commerce e comunicação. Cada plataforma declara suas próprias capacidades e regras; credenciais permanecem protegidas no Vault.</p></header>

    <div className="flex flex-wrap gap-2">{categories.map((item) => <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={`rounded-xl border px-4 py-2 text-xs font-bold transition-colors ${category === item.id ? "border-primary bg-primary/10 text-primary" : "border-glass-border text-muted-foreground hover:text-foreground"}`}>{item.label}</button>)}</div>

    {loading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{platforms.map((platform) => { const status = statuses.find((item) => item.platform_id === platform.id); return <IntegrationCard key={platform.id} platform={platform} status={status} onConfigure={() => setSelected(platform.id)} onTest={platform.connectorId ? () => test(platform.id) : undefined} />; })}</div>}
    {testing && <p className="text-center text-xs text-muted-foreground">Testando {testing}…</p>}

    {category !== "communication" && <section className="space-y-4"><div><h2 className="text-2xl font-black tracking-tight">Estratégias de divulgação</h2><p className="text-sm text-muted-foreground">Regras e boas práticas registradas por plataforma. Itens ainda não validados ficam explicitamente como em análise.</p></div><div className="grid gap-4 lg:grid-cols-2">{Object.values(AFFILIATE_STRATEGIES).map((strategy) => <article key={strategy.platformId} className="rounded-[1.75rem] border border-glass-border bg-glass-fallback p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-black">{strategy.name}</h3><BadgeLike value={strategy.method} /></div><p className="mt-2 text-sm text-muted-foreground">{strategy.description}</p><div className="mt-4 grid gap-4 text-xs md:grid-cols-3"><div><p className="font-bold">Canais</p><ul className="mt-1 space-y-1 text-muted-foreground">{strategy.allowedChannels.map((item) => <li key={item}>• {item}</li>)}</ul></div><div><p className="font-bold">Boas práticas</p><ul className="mt-1 space-y-1 text-muted-foreground">{strategy.bestPractices.map((item) => <li key={item}>• {item}</li>)}</ul></div><div><p className="font-bold">Restrições</p><ul className="mt-1 space-y-1 text-muted-foreground">{strategy.restrictions.map((item) => <li key={item}>• {item}</li>)}</ul></div></div><p className="mt-4 rounded-xl bg-muted/40 p-3 text-xs"><strong>Exemplo:</strong> {strategy.example}</p></article>)}</div></section>}
  </div>;
}

function BadgeLike({ value }: { value: string }) {
  const labels: Record<string, string> = { external_traffic: "Tráfego externo", direct_link: "Link direto", tracking_link: "Rastreável", embed: "Embed", referral: "Referral" };
  return <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary">{labels[value] ?? value}</span>;
}

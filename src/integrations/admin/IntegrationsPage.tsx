import { useEffect, useState } from "react";
import { Loader2, PlugZap } from "lucide-react";
import { toast } from "sonner";
import { getIntegrationStatuses, testIntegration } from "@/lib/integrations.functions";
import { PLATFORM_LIST } from "../config/platforms";
import { IntegrationCard } from "../components/IntegrationCard";
import { CredentialForm } from "../components/CredentialForm";

type Status = { platform_id: string; status: string; last_checked_at: string | null; last_error: string | null };

export function IntegrationsPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
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

  if (selected) return <div className="container mx-auto max-w-3xl px-4 py-8 lg:px-8"><button className="mb-5 text-sm text-muted-foreground hover:text-foreground" onClick={() => { setSelected(null); void load(); }}>← Voltar para integrações</button><CredentialForm platformId={selected} onSuccess={() => { setSelected(null); void load(); }} onCancel={() => setSelected(null)} /></div>;

  return <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 lg:px-8 lg:py-12">
    <header className="flex flex-col gap-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><PlugZap /></div><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Owner / Secure Hub</p><h1 className="text-4xl font-black uppercase italic tracking-tighter">Integrações</h1></div></div><p className="max-w-2xl text-sm text-muted-foreground">Credenciais ficam no Supabase Vault. O navegador recebe apenas metadados de status; valores secretos são acessados somente por funções server-side protegidas pelo Owner.</p></header>
    {loading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{PLATFORM_LIST.map((platform) => { const status = statuses.find((item) => item.platform_id === platform.id); return <IntegrationCard key={platform.id} platform={platform} status={status} onConfigure={() => setSelected(platform.id)} onTest={() => test(platform.id)} />; })}</div>}
    {testing && <p className="text-center text-xs text-muted-foreground">Testando {testing}…</p>}
  </div>;
}

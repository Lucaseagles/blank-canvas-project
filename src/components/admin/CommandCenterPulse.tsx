import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCommandCenterPulse, setCommandCenterFeatureFlag } from "@/lib/command-center.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Activity, FlaskConical, MousePointerClick, Sparkles, Target, Zap } from "lucide-react";

type Flag = { id: string; key: string; is_enabled: boolean };
type EventRow = { event_name: string; campaign_id: string | null; created_at: string; metadata: Record<string, unknown> | null };

const FLAG_LABELS: Record<string, string> = {
  personalization: "Personalization",
  recommendations: "Recommendations",
  popups: "Popups",
  smart_banners: "Smart Banners",
  behavioral_marketing: "Behavioral Marketing",
  notifications: "Notifications",
  ab_testing: "A/B Testing",
};

export function CommandCenterPulse() {
  const getPulse = useServerFn(getCommandCenterPulse);
  const setFeatureFlag = useServerFn(setCommandCenterFeatureFlag);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [experiments, setExperiments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPulse();
      setFlags(data.flags as Flag[]);
      setEvents(data.events as EventRow[]);
      setExperiments(data.activeExperiments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o Command Center.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const metrics = useMemo(() => {
    const count = (names: string[]) => events.filter(e => names.includes(e.event_name)).length;
    const recViews = count(["recommendation_view"]);
    const recClicks = count(["recommendation_click"]);
    const popupViews = count(["popup_view"]);
    const popupClicks = count(["popup_click"]);
    const promotionViews = count(["promotion_view"]);
    return {
      recViews, recClicks, recCtr: recViews ? (recClicks / recViews) * 100 : null,
      popupViews, popupClicks, popupCtr: popupViews ? (popupClicks / popupViews) * 100 : null,
      promotionViews,
    };
  }, [events]);

  const toggleFlag = async (flag: Flag, enabled: boolean) => {
    const previous = flags;
    setError(null);
    setFlags(flags.map(f => f.id === flag.id ? { ...f, is_enabled: enabled } : f));
    try {
      await setFeatureFlag({ data: { id: flag.id, is_enabled: enabled } });
    } catch (err) {
      setFlags(previous);
      setError(err instanceof Error ? err.message : "Não foi possível atualizar a feature flag.");
    }
  };

  return (
    <section className="space-y-6" aria-label="Command Center operacional">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /><Badge variant="outline">LIVE COMMERCE PULSE</Badge></div>
          <h2 className="mt-2 text-xl font-black uppercase tracking-tight">Control Plane</h2>
          <p className="text-xs text-muted-foreground">Somente dados reais dos últimos 7 dias. Ausência de dados é exibida como insuficiência.</p>
        </div>
        <Badge variant="secondary" className="w-fit">{experiments} experimento(s) ativo(s)</Badge>
      </div>

      {error && <Card className="border-destructive/30"><CardContent className="p-4 text-sm text-destructive">{error}</CardContent></Card>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric icon={Sparkles} label="Recomendações" value={metrics.recViews} detail={metrics.recCtr == null ? "Dados insuficientes" : `CTR ${metrics.recCtr.toFixed(2)}%`} />
        <Metric icon={MousePointerClick} label="Cliques de recomendação" value={metrics.recClicks} detail="Eventos reais" />
        <Metric icon={Zap} label="Pop-ups" value={metrics.popupViews} detail={metrics.popupCtr == null ? "Dados insuficientes" : `CTR ${metrics.popupCtr.toFixed(2)}%`} />
        <Metric icon={Target} label="Promoções" value={metrics.promotionViews} detail="Impressões reais" />
      </div>

      <Card className="rounded-3xl border-glass-border bg-glass-fallback">
        <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest">Feature Flags operacionais</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {loading ? <p className="text-sm text-muted-foreground">Carregando estado real…</p> : flags.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma feature flag cadastrada.</p> : flags.map(flag => (
            <div key={flag.id} className="flex items-center justify-between gap-3 rounded-2xl border border-glass-border p-4">
              <div><p className="text-xs font-black uppercase">{FLAG_LABELS[flag.key] ?? flag.key}</p><p className="text-[10px] text-muted-foreground">{flag.is_enabled ? "Ativo" : "Desligado"}</p></div>
              <Switch checked={flag.is_enabled} onCheckedChange={value => void toggleFlag(flag, value)} aria-label={`Alternar ${flag.key}`} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-glass-border bg-glass-fallback">
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest"><FlaskConical className="h-4 w-4" /> A/B Testing</CardTitle></CardHeader>
        <CardContent className="text-xs text-muted-foreground">Atribuições são persistentes por usuário/experimento. Nenhuma otimização automática é executada pelo Command Center.</CardContent>
      </Card>
    </section>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Activity; label: string; value: number; detail: string }) {
  return <Card className="rounded-3xl border-glass-border bg-glass-fallback"><CardContent className="p-5"><Icon className="h-4 w-4 text-primary" /><p className="mt-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-black tracking-tight">{value.toLocaleString()}</p><p className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">{detail}</p></CardContent></Card>;
}

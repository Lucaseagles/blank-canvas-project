import { useState } from "react";
import { CheckCircle2, CircleAlert, KeyRound, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PlatformConfig } from "../core/types";

interface IntegrationCardProps {
  platform: PlatformConfig;
  status?: { status?: string; last_checked_at?: string | null; last_error?: string | null };
  onConfigure: () => void;
  onTest?: () => Promise<void>;
}

const categoryLabel: Record<PlatformConfig["category"], string> = {
  marketplace: "Marketplace",
  affiliate: "Afiliados",
  video: "Vídeo Commerce",
  communication: "Comunicação",
  compliance: "Compliance",
};

export function IntegrationCard({ platform, status, onConfigure, onTest }: IntegrationCardProps) {
  const [testing, setTesting] = useState(false);
  const active = status?.status === "active";
  const error = status?.status === "error";
  const connectorReady = Boolean(platform.connectorId && onTest);
  const handleTest = async () => {
    if (!onTest) return;
    setTesting(true);
    try { await onTest(); } finally { setTesting(false); }
  };

  return (
    <div className="group rounded-[2rem] border border-glass-border bg-glass-fallback p-5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:elevation-2">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white shadow-lg" style={{ backgroundColor: platform.color }}>{platform.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2"><h3 className="font-black tracking-tight">{platform.name}</h3>{active ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : error ? <CircleAlert className="h-5 w-5 text-destructive" /> : <CircleAlert className="h-5 w-5 text-amber-500" />}</div>
          <div className="mt-1 flex flex-wrap gap-1.5"><Badge variant="secondary" className="text-[9px] uppercase tracking-wide">{categoryLabel[platform.category]}</Badge>{platform.status === "external_traffic" && <Badge variant="outline" className="border-primary/40 text-primary text-[9px]">Tráfego externo</Badge>}</div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{platform.description}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
        <span>{platform.capabilities.hasProductCatalog ? "✓ Produtos" : "— Produtos"}</span>
        <span>{platform.capabilities.hasAffiliateProgram ? "✓ Afiliado" : "— Afiliado"}</span>
        <span>{platform.capabilities.hasVideoContent ? "✓ Vídeo" : "— Vídeo"}</span>
        <span>{platform.capabilities.allowsExternalLinks ? "✓ Link externo" : "— Link externo"}</span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3"><Badge variant="outline" className={active ? "border-emerald-500/40 text-emerald-500" : error ? "border-destructive/40 text-destructive" : "border-amber-500/40 text-amber-500"}>{active ? "Conectado" : error ? "Erro" : platform.status === "pending" ? "Em validação" : "Pendente"}</Badge><span className="text-[10px] text-muted-foreground">{status?.last_checked_at ? new Date(status.last_checked_at).toLocaleString("pt-BR") : "Nunca testado"}</span></div>
      {status?.last_error && <p className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">{status.last_error}</p>}

      <div className="mt-5 grid grid-cols-2 gap-2"><Button variant="outline" className="rounded-xl" onClick={onConfigure}><KeyRound className="mr-2 h-4 w-4" />Configurar</Button><Button variant="secondary" className="rounded-xl" disabled={!connectorReady || testing} onClick={handleTest}>{testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}{connectorReady ? "Testar" : "Em integração"}</Button></div>
    </div>
  );
}

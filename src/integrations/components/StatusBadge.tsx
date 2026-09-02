import { AlertCircle, CheckCircle2, Clock3, Loader2 } from "lucide-react";

export type IntegrationStatus = "active" | "error" | "pending" | "available";

export function StatusBadge({ status }: { status: IntegrationStatus }) {
  const config = {
    active: { label: "Ativa", icon: CheckCircle2, className: "secure-status secure-status-active" },
    error: { label: "Erro", icon: AlertCircle, className: "secure-status secure-status-error" },
    pending: { label: "Pendente", icon: Clock3, className: "secure-status secure-status-pending" },
    available: { label: "Disponível", icon: Loader2, className: "secure-status secure-status-available" },
  }[status];
  const Icon = config.icon;
  return <span className={config.className}><Icon className="h-3.5 w-3.5" />{config.label}</span>;
}

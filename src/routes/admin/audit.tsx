import { createFileRoute } from "@tanstack/react-router";
import { AuditDashboard } from "@/admin/audit/AuditDashboard";

// The generated route tree is refreshed by TanStack during Vite build; keep CI typecheck
// compatible with the checked-in tree when this newly-added route has not been regenerated yet.
export const Route = createFileRoute("/admin/audit")({
  component: AuditDashboard,
});

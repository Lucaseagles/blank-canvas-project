import { createFileRoute } from "@tanstack/react-router";
import { AuditDashboard } from "@/admin/audit/AuditDashboard";

export const Route = createFileRoute("/admin/audit")({
  component: AuditDashboard,
});

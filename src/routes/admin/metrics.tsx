import { createFileRoute } from "@tanstack/react-router";
import { ExternalMetrics } from "@/admin/metrics/ExternalMetrics";

export const Route = createFileRoute("/admin/metrics")({
  component: ExternalMetrics,
});

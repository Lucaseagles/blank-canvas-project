import { createFileRoute } from "@tanstack/react-router";
import { IntegrationsPage } from "@/integrations/admin/IntegrationsPage";

export const Route = createFileRoute("/admin/integrations")({
  component: IntegrationsPage,
});

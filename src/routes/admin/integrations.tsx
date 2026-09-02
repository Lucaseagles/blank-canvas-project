import { createFileRoute } from "@tanstack/react-router";
import { SecureHub } from "@/integrations/admin/SecureHub";
export const Route = createFileRoute("/admin/integrations")({ component: SecureHub });

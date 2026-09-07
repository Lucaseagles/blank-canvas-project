import { createFileRoute } from "@tanstack/react-router";
import { MarketplaceForm } from "@/admin/marketplaces/MarketplaceForm";

export const Route = createFileRoute("/admin/marketplaces/new")({
  component: () => <MarketplaceForm />,
});

import { createFileRoute } from "@tanstack/react-router";
import { MarketplaceForm } from "@/admin/marketplaces/MarketplaceForm";

export const Route = createFileRoute("/admin/marketplaces/$id")({
  component: () => <MarketplaceEditPage />,
});

function MarketplaceEditPage() {
  const { id } = Route.useParams();
  return <MarketplaceForm marketplaceId={id} />;
}

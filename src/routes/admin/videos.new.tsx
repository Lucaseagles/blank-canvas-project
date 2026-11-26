import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BridgeVideoForm } from "@/admin/videos/BridgeVideoForm";

function NewBridgeVideoPage() {
  const navigate = useNavigate();
  return <BridgeVideoForm onBack={() => navigate({ to: "/admin/videos" })} />;
}

export const Route = createFileRoute("/admin/videos/new")({
  component: NewBridgeVideoPage,
});

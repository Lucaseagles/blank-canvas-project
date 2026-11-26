import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy editor used direct client-side table writes. Keep the URL compatible,
// but route all video administration through the audited /admin/videos workspace.
export const Route = createFileRoute("/admin/videos/$id/edit")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/videos" });
  },
  component: () => null,
});

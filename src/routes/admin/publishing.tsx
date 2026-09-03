import { createFileRoute } from "@tanstack/react-router";
import { PublishingScheduler } from "@/admin/publishing/PublishingScheduler";

export const Route = createFileRoute("/admin/publishing" as any)({
  component: PublishingScheduler,
});

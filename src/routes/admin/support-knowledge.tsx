import { createFileRoute } from "@tanstack/react-router";
import { SupportKnowledgeBase } from "@/support/SupportKnowledgeBase";

export const Route = createFileRoute("/admin/support-knowledge")({
  component: SupportKnowledgeBase,
});

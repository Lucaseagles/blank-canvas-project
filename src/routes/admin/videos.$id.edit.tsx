import { createFileRoute } from "@tanstack/react-router";
import { VideoForm } from "@/admin/videos/VideoForm";
export const Route = createFileRoute("/admin/videos/$id/edit")({ component: () => <VideoForm mode="edit" /> });

import { createFileRoute } from "@tanstack/react-router";
import { VideoForm } from "@/admin/videos/VideoForm";
export const Route = createFileRoute("/admin/videos/new")({ component: () => <VideoForm mode="create" /> });

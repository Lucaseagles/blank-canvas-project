import { createFileRoute } from "@tanstack/react-router";
import { NotificationTemplates } from "@/admin/notifications/NotificationTemplates";
import { NotificationHistory } from "@/admin/notifications/NotificationHistory";

export const Route = createFileRoute("/admin/notifications")({
  component: () => <div className="container mx-auto py-10 px-4 max-w-7xl space-y-8">
    <header><h1 className="text-4xl font-black tracking-tight">🔔 Notificações</h1><p className="text-muted-foreground mt-2">Gerencie templates e acompanhe os envios.</p></header>
    <section className="space-y-4"><h2 className="text-xl font-bold">Templates</h2><NotificationTemplates /></section>
    <section className="space-y-4"><h2 className="text-xl font-bold">Histórico</h2><NotificationHistory /></section>
  </div>
});

import { createFileRoute } from "@tanstack/react-router";
import { HomeModulesConfig } from "@/admin/modules/HomeModulesConfig";
import { BadgeConfig } from "@/admin/modules/BadgeConfig";

export const Route = createFileRoute("/admin/modules")({ component: AdminModules });

function AdminModules() {
  return <main className="min-h-screen space-y-8 p-6 md:p-10"><header><p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Store Control</p><h1 className="mt-2 text-4xl font-black uppercase italic tracking-tight">Controle da Loja</h1><p className="mt-2 max-w-2xl text-muted-foreground">Gerencie a estrutura pública da Home e os selos disponíveis para os produtos.</p></header><section><HomeModulesConfig /></section><section><BadgeConfig /></section></main>;
}

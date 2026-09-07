import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/offers")({ component: AdminOffersPage });

function AdminOffersPage() {
  const navigate = useNavigate();
  return <div className="container mx-auto py-12 px-8 min-h-[80vh] space-y-8">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3">Offer Intelligence</Badge><h1 className="mt-3 text-5xl font-black tracking-tighter uppercase italic">Direct Offers</h1><p className="mt-2 max-w-2xl text-muted-foreground">Crie grupos de ofertas e depois associe produtos pelo fluxo de produtos.</p></div><Button onClick={() => navigate({ to: "/admin/offers/new" })} className="h-12 rounded-2xl px-6 font-black uppercase italic gap-2"><Plus className="h-4 w-4" />New Offer</Button></div>
    <div className="rounded-[2rem] border border-glass-border bg-glass p-8 text-center"><ArrowRight className="mx-auto mb-4 h-8 w-8 text-primary" /><p className="text-sm font-bold text-muted-foreground">O cadastro inicial cria o grupo de oferta. Produtos podem ser vinculados no gerenciamento de produtos.</p></div>
  </div>;
}

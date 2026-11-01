import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShoppingBag, Store, Megaphone, ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/onboarding")({ validateSearch: (search: Record<string, unknown>) => ({ audience: search['audience'] === "merchant" || search['audience'] === "partner" || search['audience'] === "consumer" ? search['audience'] : undefined, returnTo: typeof search['returnTo'] === "string" ? search['returnTo'] : undefined }), component: CommercialOnboarding });

type Audience = "consumer" | "merchant" | "partner";
type PartnerType = "micro_influencer" | "influencer" | "affiliate" | "expert";
const audiences = [
  { id: "consumer" as const, icon: ShoppingBag, title: "Quero comprar para mim", detail: "Ofertas, cupons, vídeos e recomendações pessoais." },
  { id: "merchant" as const, icon: Store, title: "Tenho uma loja ou comércio", detail: "Solicite acesso ao catálogo para revenda e preços de fornecedor." },
  { id: "partner" as const, icon: Megaphone, title: "Quero divulgar e ganhar comissões", detail: "Campanhas e produtos elegíveis da Hub Eagles." },
];
const partnerTypes: { id: PartnerType; title: string }[] = [
  { id: "micro_influencer", title: "Microinfluenciador" }, { id: "influencer", title: "Influenciador" },
  { id: "affiliate", title: "Afiliado" }, { id: "expert", title: "Expert" },
];

function CommercialOnboarding() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/onboarding" });
  const [audience, setAudience] = useState<Audience>((search['audience'] as Audience | undefined) ?? "consumer");
  const [partnerType, setPartnerType] = useState<PartnerType>("micro_influencer");
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [document, setDocument] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => { if (!data.user) navigate({ to: "/auth", search: { returnTo: search.returnTo ?? "/onboarding", ref: undefined, campaign_id: undefined } }); }); }, [navigate]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error("Entre na sua conta para continuar.");
      const { error } = await (supabase as any).from("commercial_profiles").insert({
        user_id: auth.user.id, audience, partner_type: audience === "partner" ? partnerType : null,
        display_name: displayName.trim(), business_name: audience === "merchant" ? businessName.trim() : null,
        instagram_handle: audience === "partner" ? instagram.trim() || null : null,
        business_document: audience === "merchant" ? document.trim() || null : null,
        notes: notes.trim() || null,
      });
      if (error) throw error;
      toast.success(audience === "consumer" ? "Perfil registrado!" : "Solicitação recebida! Aguardando aprovação.");
      const safeReturn = search.returnTo && /^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(search.returnTo) && !["/auth", "/register", "/onboarding"].includes(search.returnTo) ? search.returnTo : null;
      navigate({ to: safeReturn ?? "/profile" });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível concluir o cadastro."); }
    finally { setBusy(false); }
  };
  return <div className="min-h-screen bg-background px-4 py-28">
    <div className="mx-auto max-w-5xl space-y-10">
      <header className="text-center space-y-4"><div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-primary"><ShieldCheck size={15}/> Hub Eagles · Sua experiência</div>
      <h1 className="text-4xl md:text-6xl font-black tracking-tight">O seu próximo passo começa <span className="text-primary">aqui.</span></h1>
      <p className="text-muted-foreground">Escolha como deseja participar do nosso ecossistema. Cada experiência é personalizada para você.</p></header>
      <form onSubmit={submit} className="space-y-7">
        <div className="grid gap-4 md:grid-cols-3">{audiences.map(item => <button type="button" key={item.id} onClick={() => setAudience(item.id)} aria-pressed={audience === item.id} className={`rounded-3xl border p-6 text-left transition-all hover:-translate-y-1 hover:shadow-xl ${audience === item.id ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" : "border-white/10 bg-card/70"}`}><item.icon className="mb-6 h-9 w-9 text-primary"/><h2 className="text-xl font-bold">{item.title}</h2><p className="mt-3 text-sm text-muted-foreground">{item.detail}</p></button>)}</div>
        <div className="rounded-3xl border border-white/10 bg-card/70 p-6 md:p-8 space-y-5">
          <h2 className="text-xl font-bold">Conte um pouco sobre você</h2>
          <label className="block space-y-2 text-sm font-medium">Seu nome ou nome profissional <Input required minLength={2} maxLength={120} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Como podemos chamar você?"/></label>
          {audience === "merchant" && <><label className="block space-y-2 text-sm font-medium">Nome do comércio <Input required maxLength={120} value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Nome da loja"/></label><label className="block space-y-2 text-sm font-medium">CNPJ ou documento comercial (opcional) <Input maxLength={30} value={document} onChange={e => setDocument(e.target.value)}/></label></>}
          {audience === "partner" && <><div className="space-y-2"><p className="text-sm font-medium">Como você divulga?</p><div className="flex flex-wrap gap-2">{partnerTypes.map(type => <button type="button" key={type.id} onClick={() => setPartnerType(type.id)} className={`rounded-full border px-4 py-2 text-sm ${partnerType === type.id ? "border-primary bg-primary/15 text-primary" : "border-white/15"}`}>{type.title}</button>)}</div></div><label className="block space-y-2 text-sm font-medium">Seu @ do Instagram (opcional) <Input maxLength={100} value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@seuperfil"/></label></>}
          {audience !== "consumer" && <label className="block space-y-2 text-sm font-medium">Conte sobre sua atuação (opcional) <Input maxLength={500} value={notes} onChange={e => setNotes(e.target.value)} placeholder={audience === "merchant" ? "Segmento, cidade, volume de compra..." : "Nichos, público, canais e experiência..."}/></label>}
          <p className="text-xs text-muted-foreground">O cadastro não libera automaticamente preços exclusivos, campanhas ou comissões. O acesso depende de aprovação comercial.</p>
          <Button type="submit" size="lg" disabled={busy} className="w-full rounded-2xl font-bold">{busy ? "Salvando..." : "Continuar com meu perfil"}<ArrowRight className="ml-2 h-4 w-4"/></Button>
        </div>
      </form>
    </div>
  </div>;
}

import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { completeRubiOnboarding } from "@/lib/rubi-onboarding-quiz.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ShoppingBag, Store, Megaphone, ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/onboarding")({ validateSearch: (search: Record<string, unknown>) => ({ audience: search['audience'] === "merchant" || search['audience'] === "partner" || search['audience'] === "consumer" ? search['audience'] : undefined, returnTo: typeof search['returnTo'] === "string" ? search['returnTo'] : undefined, ...(search["partnerType"] === "affiliate" ? { partnerType: "affiliate" as const } : {}) }), component: CommercialOnboarding });

type Audience = "consumer" | "merchant" | "partner";
type PartnerType = "micro_influencer" | "influencer" | "affiliate" | "expert";
const audiences = [
  { id: "consumer" as const, icon: ShoppingBag, title: "Quero comprar para mim", detail: "Ofertas, cupons, vídeos e recomendações pessoais." },
  { id: "merchant" as const, icon: Store, title: "Tenho uma loja ou comércio", detail: "Solicite acesso ao catálogo para revenda e preços de fornecedor." },
  { id: "partner" as const, icon: Megaphone, title: "Quero divulgar e ganhar comissões", detail: "Campanhas e produtos elegíveis da Hub Eagles." },
];
const partnerTypes: { id: PartnerType; title: string; detail: string; promise: string; dashboard: string }[] = [
  { id: "affiliate", title: "Afiliado", detail: "Recomende produtos, compartilhe links e construa sua audiência por conteúdo, comunidades e indicações.", promise: "Você não precisa ter muitos seguidores nem comprar produtos. O foco é divulgação responsável e vendas confirmadas.", dashboard: "Links e vitrines, campanhas elegíveis, materiais de divulgação, metas e comissões conciliadas." },
  { id: "micro_influencer", title: "Nano ou microcriador", detail: "Transforme a confiança da sua comunidade e seus conteúdos em recomendações úteis.", promise: "O programa considera relevância, consistência e aderência ao nicho — não apenas o tamanho do perfil.", dashboard: "Estúdio de vídeos, vitrine própria, campanhas por nicho, calendário e resultados por conteúdo." },
  { id: "influencer", title: "Influenciador", detail: "Ative campanhas estruturadas para sua audiência em diferentes canais e formatos.", promise: "Parcerias, formatos e condições são avaliados de acordo com audiência, conteúdo, direitos e resultado.", dashboard: "Campanhas aprovadas, kits de lançamento, links, conteúdo e relatórios por canal." },
  { id: "expert", title: "Expert / especialista", detail: "Use sua experiência e autoridade em um nicho para educar, recomendar e criar campanhas.", promise: "Sua especialidade e a qualidade da orientação importam. Não é necessário prometer resultados ao público.", dashboard: "Campanhas de autoridade, materiais educativos, briefings, vitrine temática e desempenho." },
];

function CommercialOnboarding() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/onboarding" });
  const [audience, setAudience] = useState<Audience>((search['audience'] as Audience | undefined) ?? "consumer");
  const [partnerType, setPartnerType] = useState<PartnerType>(search.partnerType === "affiliate" ? "affiliate" : "micro_influencer");
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [creatorNiche, setCreatorNiche] = useState("");
  const [creatorTier, setCreatorTier] = useState<"nano" | "micro">("nano");
  const [creatorBackground, setCreatorBackground] = useState<"professional" | "creator" | "both" | "unspecified">("unspecified");
  const [audienceRange, setAudienceRange] = useState<"under_1000" | "1000_10000" | "10000_100000" | "over_100000" | "unspecified">("unspecified");
  const [document, setDocument] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const completeQuiz=useServerFn(completeRubiOnboarding);
  const [categories,setCategories]=useState<Array<{id:string;name:string}>>([]);
  const [preferredCategories,setPreferredCategories]=useState<string[]>([]);
  const [merchantSegment,setMerchantSegment]=useState("other");
  const [restockFrequency,setRestockFrequency]=useState("unsure");
  const [batchSize,setBatchSize]=useState("unsure");
  const [creatorChannel,setCreatorChannel]=useState("");
  useEffect(()=>{let active=true;void supabase.from("categories").select("id,name").eq("is_active",true).order("name").then(({data})=>{
   if(active)setCategories((data??[]).filter(c=>typeof c.name==="string") as Array<{id:string;name:string}>);
  });return()=>{active=false;};},[]);
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => { if (!data.user) navigate({ to: "/auth", search: { returnTo: search.returnTo, audience: (search.audience ?? audience) as Audience, ref: undefined, campaign_id: undefined } }); }); }, [navigate, search.returnTo, search.audience, audience]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const {data:{session}}=await supabase.auth.getSession();
      if(!session?.access_token)throw new Error("Entre na sua conta para continuar.");
      const answers=audience==="consumer"?{}:audience==="merchant"?{
       merchant_segment:merchantSegment,restock_frequency:restockFrequency,batch_size:batchSize
      }:{
       niche:creatorNiche.trim(),creator_background:creatorBackground,
       audience_range:audienceRange,channel:creatorChannel,
       ...(partnerType==="micro_influencer"?{creator_tier:creatorTier}:{})
      };
      await completeQuiz({data:{
       accessToken:session.access_token,audience,partnerType:audience==="partner"?partnerType:null,
       displayName:displayName.trim(),businessName:audience==="merchant"?businessName.trim():"",
       instagram:audience==="partner"?instagram.trim():"",
       document:audience==="merchant"?document.trim():"",
       notes:notes.trim(),answers,categoryIds:audience==="consumer"?preferredCategories:[]
      }});
      toast.success(audience === "consumer" ? "Perfil registrado!" : "Solicitação recebida! Aguardando aprovação.");
      const safeReturn = search.returnTo && /^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(search.returnTo) && !["/auth", "/register", "/onboarding"].includes(search.returnTo) ? search.returnTo : null;
      // Commercial profiles remain pending until approved; never imply catalog access.
      navigate({ to: audience === "consumer" ? (safeReturn ?? "/profile") : "/profile" });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível concluir o cadastro."); }
    finally { setBusy(false); }
  };
  return <main className="hub-onboarding-shell min-h-screen bg-background px-4 py-20 sm:py-24">
    <div className="mx-auto max-w-5xl space-y-8 sm:space-y-10">
      <header className="mx-auto max-w-3xl space-y-4 text-center"><div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-primary"><ShieldCheck size={15}/> Hub Eagles · Sua experiência</div>
      <h1 className="text-4xl md:text-6xl font-black tracking-tight">{audience === "consumer" ? <>Descubra mais. Encontre melhor. <span className="text-primary">Do seu jeito.</span></> : <>O seu próximo passo começa <span className="text-primary">aqui.</span></>}</h1>
      <p className="text-muted-foreground">{audience === "consumer" ? "Crie seu espaço gratuito para salvar favoritos, escolher seus interesses e organizar sua descoberta de ofertas. Você continua no controle da sua compra." : "Escolha como deseja participar do nosso ecossistema. Cada experiência é personalizada para você."}</p></header>
      <form onSubmit={submit} className="space-y-6 sm:space-y-7">
        <div className="grid gap-4 md:grid-cols-3">{audiences.map(item => <button type="button" key={item.id} onClick={() => setAudience(item.id)} aria-pressed={audience === item.id} className={`hub-premium-surface hub-interactive min-h-[156px] rounded-3xl p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:p-6 ${audience === item.id ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/10" : "hover:border-primary/35 hover:shadow-lg"}`}><item.icon className="mb-6 h-9 w-9 text-primary"/><h2 className="text-xl font-bold">{item.title}</h2><p className="mt-3 text-sm text-muted-foreground">{item.detail}</p></button>)}</div>
        <section className="hub-premium-surface rounded-3xl p-5 sm:p-7 md:p-8 space-y-5">
          <h2 className="text-xl font-bold">Conte um pouco sobre você</h2>
          <label className="block space-y-2 text-sm font-medium">Seu nome ou nome profissional <Input required minLength={2} maxLength={120} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Como podemos chamar você?"/></label>
          {audience === "consumer" && <div className="space-y-3 rounded-2xl border border-primary/20 p-4">
            <h3 className="text-sm font-bold">Quais categorias mais interessam a você?</h3>
            <p className="text-xs text-muted-foreground">Opcional. Suas escolhas alimentam as recomendações do feed e da Store. Você pode alterar depois no perfil.</p>
            <div className="flex flex-wrap gap-2">{categories.map(item=><label key={item.id} className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
              <input type="checkbox" checked={preferredCategories.includes(item.id)} onChange={e=>setPreferredCategories(prev=>e.target.checked?[...prev,item.id]:prev.filter(id=>id!==item.id))}/>
              {item.name}
            </label>)}</div>
          </div>}
          {audience === "merchant" && <><label className="block space-y-2 text-sm font-medium">Nome do comércio <Input required maxLength={120} value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Nome da loja"/></label><label className="block space-y-2 text-sm font-medium">CNPJ ou documento comercial (opcional) <Input maxLength={30} value={document} onChange={e => setDocument(e.target.value)}/></label></>}
          {audience === "merchant" && <div className="grid gap-3 rounded-2xl border border-primary/20 p-4 sm:grid-cols-3">
            <label className="space-y-2 text-sm font-medium">Segmento do comércio
              <select value={merchantSegment} onChange={e=>setMerchantSegment(e.target.value)} className="w-full rounded-xl border bg-background p-3 text-sm">
                <option value="fashion">Moda</option><option value="beauty">Beleza</option>
                <option value="home">Casa</option><option value="electronics">Eletrônicos</option><option value="other">Outros</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">Com que frequência você repõe?
              <select value={restockFrequency} onChange={e=>setRestockFrequency(e.target.value)} className="w-full rounded-xl border bg-background p-3 text-sm">
                <option value="unsure">Ainda não sei</option><option value="weekly">Semanalmente</option>
                <option value="monthly">Mensalmente</option><option value="quarterly">A cada 3 meses</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">Quantidade típica por produto
              <select value={batchSize} onChange={e=>setBatchSize(e.target.value)} className="w-full rounded-xl border bg-background p-3 text-sm">
                <option value="unsure">Ainda não sei</option><option value="1_4">1 a 4 unidades</option>
                <option value="5_9">5 a 9 unidades</option><option value="10_29">10 a 29 unidades</option>
                <option value="30_plus">30 ou mais unidades</option>
              </select>
            </label>
            <p className="sm:col-span-3 text-xs text-muted-foreground">O quiz orienta futuras cotações e reposições. Não confirma estoque, margem nem capacidade financeira.</p>
          </div>}
          {audience === "partner" && <>
            <div className="space-y-3">
              <div><p className="text-xs font-black uppercase tracking-widest text-primary">Escolha sua jornada</p><h3 className="mt-1 text-xl font-black">Qual parceria combina com você?</h3><p className="mt-1 text-sm text-muted-foreground">Cada modalidade recebe uma apresentação, critérios de análise e uma área de trabalho adequada.</p></div>
              <div className="grid gap-3 sm:grid-cols-2">{partnerTypes.map(type => <button type="button" key={type.id} onClick={() => setPartnerType(type.id)} aria-pressed={partnerType === type.id} className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${partnerType === type.id ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" : "border-white/10 bg-background/60"}`}><span className="text-sm font-black">{type.title}</span><p className="mt-2 text-xs leading-5 text-muted-foreground">{type.detail}</p></button>)}</div>
              {partnerTypes.filter(type=>type.id===partnerType).map(type=><div key={type.id} className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-5 space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-primary">Sua experiência Hub Eagles</p><h4 className="text-lg font-black">{type.title}: uma parceria com propósito</h4><p className="text-sm leading-6">{type.promise}</p>
                <div className="rounded-xl border bg-background/70 p-3"><p className="text-xs font-bold">O que você encontrará na sua dashboard</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{type.dashboard}</p></div>
              </div>)}
              {partnerType==="micro_influencer"&&<div className="space-y-2 rounded-2xl border p-4"><p className="text-sm font-bold">Como você se identifica?</p><div className="grid grid-cols-2 gap-2">{([{id:"nano",title:"Nano criador",detail:"Comunidade próxima e nichada"},{id:"micro",title:"Microcriador",detail:"Audiência em crescimento"}] as const).map(item=><button type="button" key={item.id} aria-pressed={creatorTier===item.id} onClick={()=>setCreatorTier(item.id)} className={`rounded-xl border p-3 text-left ${creatorTier===item.id?"border-primary bg-primary/10":"border-border"}`}><strong className="text-sm">{item.title}</strong><span className="mt-1 block text-xs text-muted-foreground">{item.detail}</span></button>)}</div><p className="text-xs text-muted-foreground">Essa classificação organiza sua jornada; não é uma exigência mínima de seguidores.</p></div>}
            </div>
            <label className="block space-y-2 text-sm font-medium">Seu @ principal ou perfil público (opcional) <Input maxLength={100} value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@seuperfil ou link do perfil"/></label>
          </>}
          {audience === "partner" && <div className="space-y-4 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
            <h3 className="text-sm font-bold">Vamos conhecer sua atuação</h3>
            <p className="text-xs text-muted-foreground">{partnerType==="affiliate"?"Conte como pretende recomendar produtos e criar relacionamento com pessoas, grupos ou comunidades. Você não precisa ter uma audiência grande.":partnerType==="expert"?"Conte sua especialidade e como costuma orientar pessoas nesse assunto.":"Conte sobre seu conteúdo, nicho e canais para encontrarmos campanhas adequadas."}</p>
            <label className="block space-y-2 text-sm font-medium">Qual é seu nicho, tema ou especialidade? <span className="text-destructive">*</span>
              <Input required minLength={2} maxLength={80} value={creatorNiche} onChange={e=>setCreatorNiche(e.target.value)} placeholder="Ex.: beleza, ofertas, casa, treino, tecnologia"/>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium">Como você atua hoje?
                <select value={creatorBackground} onChange={e=>setCreatorBackground(e.target.value as typeof creatorBackground)} className="block w-full rounded-xl border bg-background p-3 text-sm">
                  <option value="unspecified">Prefiro não informar</option>
                  <option value="professional">Profissional do meu nicho</option>
                  <option value="creator">Criador de conteúdo</option>
                  <option value="both">Profissional e criador</option>
                </select>
              </label>
              <label className="block space-y-2 text-sm font-medium">Tamanho aproximado da sua audiência
                <select value={audienceRange} onChange={e=>setAudienceRange(e.target.value as typeof audienceRange)} className="block w-full rounded-xl border bg-background p-3 text-sm">
                  <option value="unspecified">Prefiro não informar</option>
                  <option value="under_1000">Até 999 seguidores</option>
                  <option value="1000_10000">1 mil a 10 mil</option>
                  <option value="10000_100000">10 mil a 100 mil</option>
                  <option value="over_100000">Acima de 100 mil</option>
                </select>
              </label>
            </div>
            <label className="block space-y-2 text-sm font-medium">Onde pretende divulgar principalmente? <span className="text-destructive">*</span>
              <select required value={creatorChannel} onChange={e=>setCreatorChannel(e.target.value)} className="w-full rounded-xl border bg-background p-3 text-sm">
                <option value="" disabled>Selecione seu principal canal</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option><option value="youtube">YouTube</option>
                <option value="whatsapp">WhatsApp</option><option value="other">Outro</option>
              </select>
            </label>
            <p className="text-xs text-muted-foreground">Essas informações ajudam a equipe a apresentar campanhas e ferramentas compatíveis. O tamanho da audiência é apenas contextual: não há mínimo de seguidores para se candidatar. A aprovação e as condições comerciais são avaliadas separadamente.</p>
          </div>}
          {audience !== "consumer" && <label className="block space-y-2 text-sm font-medium">Conte sobre sua atuação (opcional) <Input maxLength={500} value={notes} onChange={e => setNotes(e.target.value)} placeholder={audience === "merchant" ? "Segmento, cidade, volume de compra..." : "Nichos, público, canais e experiência..."}/></label>}
          <p className="text-xs text-muted-foreground">O cadastro não libera automaticamente preços exclusivos, campanhas ou comissões. O acesso depende de aprovação comercial.</p>
          <Button type="submit" size="lg" disabled={busy} className="w-full rounded-2xl font-bold">{busy ? "Salvando..." : "Continuar com meu perfil"}<ArrowRight className="ml-2 h-4 w-4"/></Button>
        </section>
      </form>
    </div>
  </main>;
}

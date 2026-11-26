import {createFileRoute,Link} from "@tanstack/react-router";
import {useQuery} from "@tanstack/react-query";
import {useServerFn} from "@tanstack/react-start";
import {useMemo,useState} from "react";
import {Input} from "@/components/ui/input";
import {getPublicRubiCreatorDirectory} from "@/lib/rubi-public-creator-directory.functions";
import {ArrowRight,BadgeCheck,BookOpen,Clapperboard,Handshake,ShieldCheck,Users} from "lucide-react";
import {Button} from "@/components/ui/button";

export const Route=createFileRoute("/creators")({component:RubiCreatorsLanding});

const niches=[
 {name:"Beleza e autocuidado",detail:"Profissionais de salão, unhas e estética"},
 {name:"Casa e organização",detail:"Criadores de rotinas e soluções domésticas"},
 {name:"Esporte e bem-estar",detail:"Treinadores e comunicadores da área"},
 {name:"Tecnologia e utilidades",detail:"Pessoas que demonstram produtos no dia a dia"},
];

function RubiCreatorsLanding(){
 const loadDirectory=useServerFn(getPublicRubiCreatorDirectory);
 const [search,setSearch]=useState("");
 const directory=useQuery({queryKey:["public-rubi-creator-directory"],queryFn:()=>loadDirectory(),retry:false});
 const creators=useMemo(()=>{
  const query=search.trim().toLocaleLowerCase("pt-BR");
  return (directory.data??[]).filter((creator:any)=>!query||creator.displayName.toLocaleLowerCase("pt-BR").includes(query)||(creator.partnerType??"").toLocaleLowerCase("pt-BR").includes(query));
 },[directory.data,search]);
 return <main className="min-h-screen bg-background px-4 pb-24 pt-28">
  <div className="mx-auto max-w-6xl space-y-14">
   <header className="mx-auto max-w-4xl space-y-6 text-center">
    <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary"><Users className="h-4 w-4"/> RUBI Partners · Rede de Criadores</p>
    <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Você entende do seu nicho. <span className="text-primary">A RUBI prepara o caminho comercial.</span></h1>
    <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground">Se você é nano ou microinfluenciador, criador de conteúdo ou profissional com uma audiência própria, conheça a possibilidade de divulgar produtos alinhados ao seu trabalho. Também avaliamos criadores de maior porte.</p>
    <div className="flex flex-wrap justify-center gap-3">
     <Button size="lg" className="rounded-2xl font-bold" asChild><Link to="/onboarding" search={{audience:"partner",returnTo:"/partner/portal"}}>Quero solicitar parceria <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
     <Button size="lg" variant="outline" className="rounded-2xl" asChild><Link to="/partner/portal">Conhecer o portal</Link></Button>
    </div>
    <p className="text-xs text-muted-foreground">Cadastro sujeito a análise e aprovação. Não há promessa de ganhos, patrocínio ou acesso automático a produtos.</p>
   </header>

   <section aria-label="Como funciona a colaboração" className="space-y-5">
    <div className="space-y-2 text-center"><p className="text-xs font-black uppercase tracking-widest text-primary">Como funciona</p><h2 className="text-3xl font-black">Sua especialidade + nossa estrutura</h2></div>
    <div className="grid gap-4 md:grid-cols-3">
     {[
      {icon:BookOpen,title:"Conte seu nicho",text:"Apresente sua área de atuação, público e canais. Você não precisa ter experiência prévia em e-commerce."},
      {icon:Clapperboard,title:"Receba ferramentas aprovadas",text:"Após a aprovação, veja os produtos liberados e use páginas, materiais e abordagens de divulgação adequados à audiência."},
      {icon:Handshake,title:"Divulgue com seu link",text:"Compartilhe conteúdo identificado como publicidade e acompanhe visitas, pedidos confirmados e comissões quando houver atribuição válida."}
     ].map((step,i)=><article key={step.title} className="space-y-4 rounded-3xl border bg-card p-6">
      <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><step.icon className="h-5 w-5"/></span><span className="text-xs font-black text-muted-foreground">0{i+1}</span></div>
      <h3 className="text-xl font-black">{step.title}</h3><p className="text-sm leading-6 text-muted-foreground">{step.text}</p>
     </article>)}
    </div>
   </section>

   <section aria-label="Nichos de criadores" className="space-y-5">
    <div className="space-y-2"><h2 className="text-3xl font-black">Times especializados por categoria</h2><p className="text-sm text-muted-foreground">A proposta é reunir criadores com públicos compatíveis com cada produto, não selecionar pessoas apenas pelo número de seguidores.</p></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
     {niches.map(niche=><div key={niche.name} className="rounded-2xl border bg-card p-5"><p className="font-black">{niche.name}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{niche.detail}</p></div>)}
    </div>
    <p className="text-xs leading-5 text-muted-foreground">Produtos e alegações de saúde exigem revisão específica e respeito às regras profissionais. Os times ainda estão em fase de formação.</p>
   </section>

   <section aria-label="Descubra criadores RUBI" className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
     <div className="space-y-1"><p className="text-xs font-black uppercase tracking-widest text-primary">Creator Discovery</p><h2 className="text-3xl font-black">Descubra criadores e suas vitrines</h2><p className="max-w-2xl text-sm leading-6 text-muted-foreground">Explore perfis públicos de parceiros aprovados, veja conteúdos publicados e encontre produtos selecionados por cada criador.</p></div>
     <div className="w-full sm:max-w-xs"><Input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Buscar criador ou tipo de parceria" aria-label="Buscar criador"/></div>
    </div>
    {directory.isLoading&&<p role="status" className="text-sm text-muted-foreground">Carregando criadores...</p>}
    {directory.isError&&<div role="alert" className="rounded-2xl border p-4 text-sm">Não foi possível carregar os perfis agora.</div>}
    {!directory.isLoading&&!directory.isError&&creators.length===0&&<p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">{search?"Nenhum criador corresponde à busca.":"Novos criadores serão apresentados aqui quando seus perfis estiverem disponíveis."}</p>}
    {!!creators.length&&<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
     {creators.map((creator:any)=><article key={creator.storeCode} className="space-y-4 rounded-3xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-primary">Parceiro Hub Eagles</p><h3 className="mt-2 text-xl font-black">{creator.displayName}</h3>{creator.partnerType&&<p className="mt-1 text-xs text-muted-foreground">{creator.partnerType}</p>}</div><span className="rounded-full border px-2.5 py-1 text-xs font-semibold">{creator.publishedVideoCount} vídeos</span></div>
      <div className="flex flex-wrap gap-2"><Button asChild size="sm"><Link to="/creator/$storeCode" params={{storeCode:creator.storeCode}}>Ver perfil</Link></Button><Button asChild size="sm" variant="outline"><Link to="/loja/$storeCode" params={{storeCode:creator.storeCode}}>Ver vitrine</Link></Button></div>
     </article>)}
    </div>}
   </section>

   <section aria-label="O que você pode encontrar no programa" className="grid gap-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card p-6 md:grid-cols-[1.3fr_1fr] md:p-9">
    <div className="space-y-4"><p className="text-xs font-black uppercase tracking-widest text-primary">Parceria transparente</p>
     <h2 className="text-3xl font-black">Comissão por resultado, patrocínio ou propostas híbridas</h2>
     <p className="text-sm leading-7 text-muted-foreground">A modalidade depende do produto, da margem disponível, da audiência, das entregas e de um acordo individual. Nenhum percentual é garantido pelo simples cadastro.</p>
     <Button asChild className="rounded-xl"><Link to="/onboarding" search={{audience:"partner",returnTo:"/partner/portal"}}>Solicitar avaliação <ArrowRight className="ml-2 h-4 w-4"/></Link></Button>
    </div>
    <div className="space-y-3">
     {["Produtos liberados individualmente","Materiais e links rastreáveis","Métricas separadas de vendas e visitas","Condições e contratos antes de qualquer divulgação"].map(item=><div key={item} className="flex items-start gap-3 rounded-xl border bg-background/60 p-3"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary"/><span className="text-sm">{item}</span></div>)}
    </div>
   </section>
   <p className="flex items-start justify-center gap-2 text-center text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0"/> A RUBI não cobra para analisar uma solicitação por esta página. O cadastro não cria comissão, contrato ou patrocínio automaticamente.</p>
  </div>
 </main>;
}

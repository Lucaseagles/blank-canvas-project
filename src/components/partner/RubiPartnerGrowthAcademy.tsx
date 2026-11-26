import { BookOpen, CheckCircle2, Circle, Compass, GraduationCap, Handshake, Target, TrendingUp } from "lucide-react";
import { Link } from "@tanstack/react-router";

type PartnerType = "affiliate" | "micro_influencer" | "influencer" | "expert" | string;

type Props = {
  partnerType: PartnerType;
  links: number;
  visits: number;
  confirmedSales: number;
};

type Lesson = {
  title: string;
  objective: string;
  content: string[];
  exercise: string;
};

const commonLessons: Lesson[] = [
  {
    title: "Comece pela base: como a Hub Eagles funciona",
    objective: "Entender os ambientes, as regras comerciais e o papel de cada parceiro.",
    content: [
      "Conheça o catálogo autorizado, o seu perfil, os canais oficiais e os limites do seu acesso.",
      "A aprovação do cadastro não garante comissão, produto específico ou campanha: cada condição depende da autorização vigente.",
      "Nunca prometa renda, desconto, resultado ou prazo que não esteja confirmado na oferta oficial."
    ],
    exercise: "Revise seu perfil, identifique seu público e escolha um nicho principal para começar."
  },
  {
    title: "Produto, oferta e confiança",
    objective: "Aprender a divulgar uma oferta completa, sem distorcer informações.",
    content: [
      "Criativo conquista atenção; página explica e dá contexto; movimento mantém a distribuição e a aprendizagem.",
      "Confira preço, disponibilidade, condições, entrega, política de troca e validade antes de divulgar.",
      "Use somente imagens, vídeos, depoimentos e materiais com licença ou autorização compatível com o canal."
    ],
    exercise: "Escolha um produto autorizado e escreva três benefícios comprováveis e uma limitação importante."
  },
  {
    title: "Conteúdo que ajuda a decidir",
    objective: "Construir mensagens claras e úteis para o público certo.",
    content: [
      "Estruture o conteúdo em contexto, problema real, demonstração honesta, benefício verificável e chamada para ação.",
      "Identifique publicidade, parceria ou link de afiliado de forma clara e respeite as regras da plataforma.",
      "Não use avaliações falsas, escassez inventada, antes/depois enganoso ou alegações sem comprovação."
    ],
    exercise: "Crie um roteiro curto de 20 a 40 segundos com gancho, demonstração e CTA transparente."
  },
  {
    title: "Distribuição, atribuição e métricas",
    objective: "Saber de onde vem o resultado e o que cada indicador realmente significa.",
    content: [
      "Use o link individual da Hub Eagles e os materiais/campanhas liberados para sua conta.",
      "Visita não é comprador; clique não é pedido; pedido não é venda liquidada; comissão registrada não é repasse bancário.",
      "Compare canais e campanhas com períodos equivalentes e priorize vendas líquidas, qualidade, retenção e margem."
    ],
    exercise: "Publique uma peça autorizada, use seu link individual e acompanhe visitas e vendas confirmadas no portal."
  },
  {
    title: "Backstage: campanhas, materiais e operação",
    objective: "Usar as ferramentas internas sem perder controle de autorização e direitos.",
    content: [
      "Consulte oportunidades atribuídas ao seu perfil, confira canal permitido, licença, produto e prazo.",
      "O Creator Studio recebe conteúdo para revisão; enviar ou copiar um material não significa publicação automática.",
      "Se uma campanha, licença ou autorização expirar, pare de usar o material e solicite orientação pelo canal oficial."
    ],
    exercise: "Abra as oportunidades liberadas no portal e confira a validade e as regras do próximo material."
  },
  {
    title: "Indicação e desenvolvimento de parceiros",
    objective: "Construir uma rede saudável, sem confundir convite com remuneração.",
    content: [
      "Você pode apresentar a Hub Eagles a profissionais e criadores que tenham aderência real ao ecossistema.",
      "Convites, cadastro ou tamanho de equipe, isoladamente, não geram comissão nem garantem aprovação.",
      "Desenvolvimento de equipe significa orientar, compartilhar boas práticas e acompanhar qualidade; qualquer bônus depende de regra publicada, margem e aprovação."
    ],
    exercise: "Identifique um profissional que agregaria valor à comunidade e faça uma apresentação honesta, sem promessa de ganhos."
  }
];

const specializations: Record<string, { label: string; focus: string; lessons: Lesson[] }> = {
  affiliate: {
    label: "Trilha Afiliado",
    focus: "Seleção de produtos, links individuais, conteúdo de conversão e leitura de vendas confirmadas.",
    lessons: [{
      title: "Afiliado na prática: do catálogo à venda confirmada",
      objective: "Escolher ofertas relevantes e acompanhar a atribuição corretamente.",
      content: [
        "Comece com poucos produtos que combinem com o público; não divulgue todo o catálogo de uma vez.",
        "Confira se o link está ativo e se o produto está autorizado para sua conta antes de cada campanha.",
        "Analise visitas, pedidos confirmados, estornos e comissão registrada separadamente."
      ],
      exercise: "Selecione até três produtos autorizados, gere seus links e compare a resposta do público."
    }]
  },
  micro_influencer: {
    label: "Trilha Nano e Microcriador",
    focus: "Confiança de comunidade, demonstração real, frequência sustentável e nicho bem definido.",
    lessons: [{
      title: "Cresça com comunidade, não com números vazios",
      objective: "Transformar proximidade e credibilidade em recomendações úteis.",
      content: [
        "A força do nano/microcriador está na relação com a comunidade e na consistência, não apenas no número de seguidores.",
        "Mostre uso real quando possível, responda dúvidas e explique para quem o produto faz ou não faz sentido.",
        "Prefira séries curtas e recorrentes a publicações em massa sem contexto."
      ],
      exercise: "Planeje três conteúdos para a mesma audiência: descoberta, demonstração e resposta a dúvidas."
    }]
  },
  influencer: {
    label: "Trilha Influenciador",
    focus: "Mídia kit, campanhas negociadas, entregáveis, direitos de uso e relatórios por canal.",
    lessons: [{
      title: "Campanhas profissionais e entregas negociadas",
      objective: "Organizar parcerias com briefing, escopo e comprovação.",
      content: [
        "Apresente dados reais de audiência, alcance e engajamento; não infle métricas.",
        "Confirme por escrito entregáveis, datas, canais, direitos de uso, exclusividade e remuneração antes de publicar.",
        "Envie evidências da campanha e diferencie alcance, cliques, conversões e vendas liquidadas."
      ],
      exercise: "Monte um mini mídia kit com nicho, canais, formatos, audiência e exemplos de conteúdo."
    }]
  },
  expert: {
    label: "Trilha Expert",
    focus: "Autoridade temática, educação, demonstração técnica e recomendações responsáveis.",
    lessons: [{
      title: "Autoridade que educa e gera confiança",
      objective: "Traduzir conhecimento especializado em orientação compreensível.",
      content: [
        "Explique critérios de escolha, limitações, adequação e cuidados relevantes do produto.",
        "Separe opinião, experiência pessoal e afirmação técnica; sustente afirmações com evidências.",
        "Evite aconselhamento fora da sua área e sinalize quando a pessoa deve buscar um profissional habilitado."
      ],
      exercise: "Crie um guia comparativo com critérios objetivos e indique para quem cada opção é adequada."
    }]
  }
};

function status(done: boolean) {
  return done
    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-label="Concluída" />
    : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Pendente" />;
}

export function RubiPartnerGrowthAcademy({ partnerType, links, visits, confirmedSales }: Props) {
  const track = specializations[partnerType] ?? specializations.affiliate;
  const milestones = [
    { label: "Primeiro link individual ativo", done: links > 0 },
    { label: "Primeira visita rastreada", done: visits > 0 },
    { label: "Primeira venda confirmada", done: confirmedSales > 0 },
    { label: "Cinco vendas confirmadas", done: confirmedSales >= 5 }
  ];
  const completed = milestones.filter(item => item.done).length;
  const progress = Math.round((completed / milestones.length) * 100);

  return <section aria-label="Academia e crescimento de parceiros" className="hub-premium-surface space-y-6 rounded-3xl p-5 sm:p-7">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><GraduationCap className="h-4 w-4" /> HUB EAGLES · ACADEMIA DE PARCEIROS</p>
        <h2 className="text-2xl font-black sm:text-3xl">Aprenda, execute e evolua</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">Uma trilha comum para todos os parceiros, com especialização conforme seu perfil. O conteúdo é liberado para afiliados, nano/microcriadores, influenciadores e experts aprovados.</p>
      </div>
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary"><Compass className="h-3.5 w-3.5" /> {track.label}</span>
    </header>

    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border bg-background/70 p-4"><BookOpen className="mb-2 h-5 w-5 text-primary" /><p className="text-sm font-bold">Formação comum</p><p className="mt-1 text-xs text-muted-foreground">Fundamentos, oferta, conteúdo, distribuição, backstage e rede.</p></div>
      <div className="rounded-2xl border bg-background/70 p-4"><Target className="mb-2 h-5 w-5 text-primary" /><p className="text-sm font-bold">Metas verificáveis</p><p className="mt-1 text-xs text-muted-foreground">Links, visitas e vendas confirmadas, sem confundir atividade com comissão.</p></div>
      <div className="rounded-2xl border bg-background/70 p-4"><Handshake className="mb-2 h-5 w-5 text-primary" /><p className="text-sm font-bold">Backstage integrado</p><p className="mt-1 text-xs text-muted-foreground">Campanhas, materiais autorizados, Creator Studio e extrato no próprio portal.</p></div>
    </div>

    <div className="space-y-3 rounded-2xl border bg-background/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div><p className="text-xs font-bold uppercase tracking-wider text-primary">Missões de execução</p><h3 className="text-lg font-black">Seu progresso comercial</h3></div>
        <p className="text-2xl font-black tabular-nums">{progress}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Progresso das missões comerciais verificadas" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: progress + "%" }} /></div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {milestones.map(item => <li key={item.label} className="flex items-start gap-2 text-sm">{status(item.done)}<span>{item.label}</span></li>)}
      </ul>
      <p className="text-xs leading-5 text-muted-foreground">Progresso calculado somente com dados disponíveis no portal. Não representa conclusão de curso, aprovação de bônus, mudança automática de comissão ou promessa de renda.</p>
    </div>

    <div className="space-y-3">
      <div><p className="text-xs font-bold uppercase tracking-wider text-primary">Trilha de aprendizagem</p><h3 className="text-xl font-black">Formação para todos os parceiros</h3></div>
      <div className="grid gap-3 lg:grid-cols-2">
        {commonLessons.map((lesson, index) => <details key={lesson.title} className="hub-interactive rounded-2xl border bg-background/70 p-4 open:border-primary/40">
          <summary className="cursor-pointer list-none font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
            <span className="mr-2 text-xs font-black text-primary">AULA {String(index + 1).padStart(2, "0")}</span>{lesson.title}
            <span className="mt-2 block text-xs font-normal leading-5 text-muted-foreground">{lesson.objective}</span>
          </summary>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">{lesson.content.map(point => <li key={point}>{point}</li>)}</ul>
          <p className="mt-4 rounded-xl bg-primary/5 p-3 text-sm"><strong>Missão prática:</strong> {lesson.exercise}</p>
        </details>)}
      </div>
    </div>

    <div className="space-y-3 rounded-2xl border border-primary/25 bg-primary/[0.04] p-4 sm:p-5">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><TrendingUp className="h-4 w-4" /> Especialização do seu perfil</p>
      <h3 className="text-xl font-black">{track.label}</h3>
      <p className="text-sm text-muted-foreground">{track.focus}</p>
      {track.lessons.map(lesson => <details key={lesson.title} className="rounded-xl border bg-background/80 p-4">
        <summary className="cursor-pointer font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{lesson.title}<span className="mt-1 block text-xs font-normal text-muted-foreground">{lesson.objective}</span></summary>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">{lesson.content.map(point => <li key={point}>{point}</li>)}</ul>
        <p className="mt-3 text-sm"><strong>Missão prática:</strong> {lesson.exercise}</p>
      </details>)}
    </div>

    <footer className="flex flex-wrap gap-3 border-t pt-4">
      <Link to="/partner/statement" className="hub-interactive inline-flex min-h-11 items-center rounded-xl border px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Consultar extrato</Link>
      <Link to="/creators" className="hub-interactive inline-flex min-h-11 items-center rounded-xl border px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Conhecer a rede de criadores</Link>
    </footer>
  </section>;
}

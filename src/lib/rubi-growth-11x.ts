/** RUBI 11×: plano operacional, não relatório de estratégias já validadas. */
export type GrowthPillar = "eclipse" | "store" | "achadinhos" | "partners" | "business";
export type GrowthAudience = "consumer" | "merchant" | "partner" | "cross";
export type GrowthEvidence = "code-observed" | "execution-plan" | "external-blocker";
export type GrowthStrategy = {
  id: number; pillar: GrowthPillar; audience: GrowthAudience; title: string;
  objective: string; metric: string; route: string; evidence: GrowthEvidence;
};

export const GROWTH_PILLARS: { id: GrowthPillar; label: string; objective: string }[] = [
  { id: "eclipse", label: "RUBI Eclipse · Base", objective: "Adquirir, ativar e reter uma base qualificada." },
  { id: "store", label: "RUBI Store · Margem", objective: "Priorizar produtos próprios com custos e demanda comprovados." },
  { id: "achadinhos", label: "RUBI Achadinhos · Aquisição", objective: "Distribuir vídeos e captar tráfego sem confundir GMV externo com receita." },
  { id: "partners", label: "RUBI Partners · Distribuição", objective: "Ativar criadores que vendem produtos autorizados com atribuição verificável." },
  { id: "business", label: "RUBI Business · Recorrência", objective: "Transformar lojistas aprovados em compradores recorrentes por volume." },
];

export const GROWTH_STRATEGIES: GrowthStrategy[] = [
  {id:1,pillar:"eclipse",audience:"cross",title:"Três entradas comerciais",objective:"Encaminhar consumidor, lojista e parceiro ao público correto.",metric:"cadastros por login",route:"/",evidence:"code-observed"},
  {id:2,pillar:"eclipse",audience:"consumer",title:"Cadastro do consumidor",objective:"Conquistar base com conta opcional na descoberta e ofertas.",metric:"cadastros qualificados",route:"/onboarding",evidence:"code-observed"},
  {id:3,pillar:"eclipse",audience:"consumer",title:"Preferências e nichos",objective:"Aprender categorias desejadas sem prometer personalização perfeita.",metric:"usuários com preferências",route:"/profile",evidence:"code-observed"},
  {id:4,pillar:"eclipse",audience:"consumer",title:"Feed de descoberta",objective:"Levar achadinhos e Store à base conforme interesse.",metric:"visualizações e cliques de oferta",route:"/feed",evidence:"code-observed"},
  {id:5,pillar:"eclipse",audience:"consumer",title:"Comunidades opt-in",objective:"Distribuir ofertas por WhatsApp/Telegram com consentimento.",metric:"inscritos ativos com consentimento",route:"/profile",evidence:"execution-plan"},
  {id:6,pillar:"eclipse",audience:"consumer",title:"Indicação entre consumidores",objective:"Converter compradores satisfeitos em novas visitas e cadastros.",metric:"cadastros atribuídos únicos",route:"/profile",evidence:"code-observed"},
  {id:7,pillar:"eclipse",audience:"consumer",title:"Reativação e LTV",objective:"Ofertar itens relevantes em coortes de recompra.",metric:"compradores recorrentes 30/60/90d",route:"/profile",evidence:"execution-plan"},
  {id:8,pillar:"store",audience:"consumer",title:"Catálogo de marca própria",objective:"Apresentar produtos de fornecedores autorizados com preço verdadeiro.",metric:"produtos próprios elegíveis",route:"/hub-shop",evidence:"code-observed"},
  {id:9,pillar:"store",audience:"cross",title:"Precificação por fornecedor",objective:"Comparar varejo, custo, parceiro e atacado sem fingir lucro líquido.",metric:"margem efetiva por SKU",route:"/admin/hub-catalog",evidence:"code-observed"},
  {id:10,pillar:"store",audience:"consumer",title:"Destaques oficiais RUBI",objective:"Expor produtos próprios nas frentes de aquisição sem perder relevância.",metric:"visitas à Store e pedidos",route:"/",evidence:"code-observed"},
  {id:11,pillar:"store",audience:"consumer",title:"Lançamentos sazonais",objective:"Criar campanhas editoriais por datas e necessidades reais.",metric:"pedidos por campanha",route:"/hub-shop",evidence:"execution-plan"},
  {id:12,pillar:"store",audience:"consumer",title:"Kits e produtos complementares",objective:"Aumentar quantidade por pedido sem reduzir margem.",metric:"itens por pedido e margem",route:"/hub-shop",evidence:"execution-plan"},
  {id:13,pillar:"store",audience:"consumer",title:"Vídeos de demonstração própria",objective:"Demonstrar benefícios concretos dos produtos aprovados.",metric:"pedidos por mil views",route:"/videos",evidence:"execution-plan"},
  {id:14,pillar:"store",audience:"consumer",title:"Compra com confirmação Kairos",objective:"Confirmar pagamento e comissão apenas após retorno confiável do fornecedor.",metric:"pedidos pagos conciliados",route:"/r/00000000-0000-0000-0000-000000000000",evidence:"external-blocker"},
  {id:15,pillar:"achadinhos",audience:"consumer",title:"Vídeos de achadinhos",objective:"Captar interesse em ofertas e solução de problemas.",metric:"visitas qualificadas por vídeo",route:"/videos",evidence:"code-observed"},
  {id:16,pillar:"achadinhos",audience:"consumer",title:"Afiliados TikTok Shop",objective:"Enviar compra ao link oficial elegível e medir comissão atribuída.",metric:"comissões confirmadas",route:"/videos",evidence:"external-blocker"},
  {id:17,pillar:"achadinhos",audience:"consumer",title:"Ofertas Shopee e outros",objective:"Usar links afiliados de marketplaces autorizados.",metric:"pedidos externos atribuídos",route:"/deals",evidence:"execution-plan"},
  {id:18,pillar:"achadinhos",audience:"consumer",title:"Páginas orgânicas de nicho",objective:"Segmentar Casa, Beleza e ofertas sem duplicar vídeos idênticos.",metric:"visitas únicas por perfil",route:"/categories",evidence:"execution-plan"},
  {id:19,pillar:"achadinhos",audience:"consumer",title:"Reels e TikTok original",objective:"Testar criativos originais, retenção e CTA por produto.",metric:"margem por mil views",route:"/videos",evidence:"execution-plan"},
  {id:20,pillar:"achadinhos",audience:"consumer",title:"Shorts e Pinterest",objective:"Reaproveitar gravações originais em versões por canal.",metric:"visitas incrementais por rede",route:"/videos",evidence:"execution-plan"},
  {id:21,pillar:"achadinhos",audience:"consumer",title:"SEO de categorias e produtos",objective:"Captar intenção de busca com páginas indexáveis elegíveis.",metric:"visitas orgânicas de busca",route:"/categories",evidence:"execution-plan"},
  {id:22,pillar:"partners",audience:"partner",title:"Captação de experts",objective:"Selecionar experts por nicho, credibilidade e público comprador.",metric:"experts com pedidos pagos",route:"/onboarding",evidence:"execution-plan"},
  {id:23,pillar:"partners",audience:"partner",title:"Captação microinfluenciadores",objective:"Prospectar criadores com audiência alinhada aos produtos.",metric:"microcriadores vendedores",route:"/onboarding",evidence:"execution-plan"},
  {id:24,pillar:"partners",audience:"partner",title:"Consumidor vira afiliado",objective:"Oferecer candidatura sem duplicar conta nem liberar produto automaticamente.",metric:"candidatos aprovados e ativos",route:"/onboarding",evidence:"execution-plan"},
  {id:25,pillar:"partners",audience:"partner",title:"Aprovação e grants",objective:"Permitir produtos somente a parceiros aprovados individualmente.",metric:"parceiros com oferta autorizada",route:"/partner/portal",evidence:"code-observed"},
  {id:26,pillar:"partners",audience:"partner",title:"Kit de storytelling",objective:"Entregar cópias honestas, vídeos e orientações por produto/nicho.",metric:"criativos publicados por vendedor",route:"/partner/portal",evidence:"execution-plan"},
  {id:27,pillar:"partners",audience:"partner",title:"Link e pré-checkout",objective:"Preservar origem; cadastro opcional; checkout confiável pendente.",metric:"visitas / compras confirmadas",route:"/partner/portal",evidence:"external-blocker"},
  {id:28,pillar:"partners",audience:"partner",title:"Comissões conciliadas",objective:"Separar visitas, vendas confirmadas, comissão calculada e paga.",metric:"comissões pagas e pendentes",route:"/partner/statement",evidence:"code-observed"},
  {id:29,pillar:"business",audience:"merchant",title:"Onboarding de lojistas",objective:"Qualificar comerciantes para acesso ao atacado.",metric:"lojistas aprovados",route:"/onboarding",evidence:"code-observed"},
  {id:30,pillar:"business",audience:"merchant",title:"Catálogo e mínimo B2B",objective:"Mostrar somente preços autorizados a comerciantes aprovados.",metric:"cotações e unidades elegíveis",route:"/wholesale",evidence:"code-observed"},
  {id:31,pillar:"business",audience:"merchant",title:"Preços progressivos",objective:"Aumentar pedidos com faixas comerciais viáveis por SKU.",metric:"unidades por pedido e margem",route:"/wholesale",evidence:"code-observed"},
  {id:32,pillar:"business",audience:"merchant",title:"Kits de abastecimento",objective:"Agrupar categorias úteis e acelerar decisão do lojista.",metric:"ticket por cotação",route:"/wholesale",evidence:"execution-plan"},
  {id:33,pillar:"business",audience:"merchant",title:"Reposição recorrente",objective:"Lembrar comerciantes de recomprar, somente com opt-in.",metric:"lojas que recompram por coorte",route:"/wholesale",evidence:"execution-plan"},
  {id:34,pillar:"business",audience:"merchant",title:"Conteúdo B2B demonstrativo",objective:"Exibir giro, utilidade e condições por volume verificadas.",metric:"leads B2B por campanha",route:"/wholesale",evidence:"execution-plan"},
  {id:35,pillar:"business",audience:"merchant",title:"Consultoria comercial WhatsApp",objective:"Ajudar lojistas com cotação e disponibilidade sob consentimento.",metric:"cotações convertidas em pedidos",route:"/wholesale",evidence:"execution-plan"},
];

/** Indicadores-alvo do mês 12; metas não são dados reais nem previsões. */
export const GROWTH_11X_TARGETS = {
  partnersSelling: 800,
  monthlyOrdersPerSeller: 110,
  buyingMerchants: 1200,
  unitsPerMerchant: 100,
  directStoreOrders: 2000,
  marketplaceConversions: 3600,
  grossUnitMargins: { partnerRubi: 24.5, wholesale: 10, direct: 49, affiliate: 10 },
} as const;

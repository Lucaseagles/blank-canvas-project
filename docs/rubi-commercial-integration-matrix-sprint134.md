# RUBI 11× — Matriz de interligações comerciais (Sprint 134)

## Objetivo
Uma oferta completa por SKU deve ser reutilizável entre três jornadas (consumidor, lojista, parceiros) e três modelos de aquisição (venda direta/orgânica, rede de influenciadores, mídia paga/IA), **sem misturar preços, permissões ou atribuição financeira**. Shadow Master é a autoridade sobre publicação e distribuição.

## Contrato do kit Store → Time (implementado no PR da Sprint 134)
- **SKU único** em `hub_products` e fornecedor de checkout validado: a oferta nunca pode apontar para SKU distinto do movimento.
- **Oferta oficial** em `rubi_offer_playbooks`, audiência `consumer`: promessa, evidências, roteiro, objeções, landing page e canais; checklist não substitui aprovação editorial.
- **Movimento e variante** em `rubi_movements` e `rubi_movement_variants`: público, problema, resultado, criativo e página de campanha; revisão e direitos de mídia são obrigatórios antes da associação ficar pronta.
- **Plano** `rubi_master_campaign_plans` (modo `creator_team`) ligado à variante e ao time por `rubi_creator_team_campaign_assignments`.
- **Nicho** `rubi_creator_teams.niche`, categoria `hub_products.category` e histórico de integrantes: relação de afinidade precisa ser **confirmada pelo Master**, não deduzida como fato só porque palavras coincidem.
- **Autorização comercial individual:** `commercial_profiles` aprovado + `hub_partner_product_grants` ativo + `hub_partner_referral_links` ativo. O kit conta os integrantes que satisfazem os três pré-requisitos; **não concede grants nem calcula percentuais**.
- **Publicação e visitas**: prova editorial `rubi_creator_team_publication_evidence` → link /r/:code?pub → `hub_partner_referral_visits` com token e etapas de pré-checkout observadas. Visita ou exibição não é compra.

## Organização dos times
Criar **times por afinidade de nicho e categoria**, como beleza, bem-estar, casa, tecnologia e comércio, sem impor limite fixo de seguidores. Um criador pode participar de mais de um time se autorizado; crescimento nano → micro → grande é um objetivo de expansão comercial, **não uma promoção automática**. O Master avalia reputação, qualidade de audiência, direitos de conteúdo, clareza da proposta e resultados observados. Um expert profissional pode receber roteiro, página e criativos prontos para reduzir o esforço operacional, com conteúdo adequado à sua especialidade e sem alegações não verificadas.

## Outras conexões prioritárias ainda não homologadas
| Conexão | Situação | Gate para operar |
| --- | --- | --- |
| Store → Offer Engine → Movement → plano de time → variante | Conectada para revisão no Master | produto comercial + revisão humana |
| Time → integrante → grant → link → publicação → visita → pré-checkout | Conectada tecnicamente | teste real de domínio/consentimento e perfis |
| Oferta Store → página/VSL → criativo disponibilizado ao criador | Kit de consulta Master; distribuição automática não implementada | revisão de direitos e publicação com rastreio |
| Modelo percentual de parceiro → checkout externo → venda confirmada → comissão | Incompleta | contrato de repasse, margem e atribuição oficial Kairos/fornecedor |
| Feed/algoritmo consumidor → oferta por interesse → eventos → otimização | Parcial | pertinência, consentimento, controle de frequência, testes E2E |
| Marketplace → conteúdo útil → aquisição → comunidade RUBI → Store | Parcial | links válidos, consentimento, medição incremental |
| Lojista → atacado → cotação → reposição → CRM → SaaS | Parcial | pedidos e recorrência confirmados |
| Paid AI → briefing → criativos → orçamento aprovado → mídia → dados | Planejamento/parcial | conta de anúncios autorizada, limites de gastos e relatórios reais |
| Social proof → pedidos/avaliações consentidos → Store/checkout | Parcial | dados reais, anonimização e revisão; sem compradores fictícios |
| Shadow Master → diagnóstico comercial → decisão de distribuição | Parcial e em evolução | dados suficientes, custos, vendas e atribuição |

## Princípios de isolamento
1. **Três logins e Shadow Master** reutilizam um mesmo SKU, mas não compartilham dados privados indevidamente; cada oferta ou faixa de preço deve respeitar o público e suas permissões.
2. O link de parceiro não vira URL de pagamento direta: a atribuição externa precisa ser provada antes de habilitar o checkout com comissão.
3. Não usar visitas de link, renderizações de pré-checkout ou depoimentos não verificados como prova de pagamento, lucro ou conversão.
4. Cada integração nova precisa de gates de autorização, testes TS/lint/build, regressão e QA do fluxo completo. Uma alteração que apenas conecta telas não ganha ponto automaticamente na matriz de cobertura.
5. Materiais do criador devem explicitar eventual publicidade/patrocínio e respeitar direitos de mídia, políticas da plataforma e regras aplicáveis a alegações de saúde.

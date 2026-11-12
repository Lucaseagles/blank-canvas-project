# RUBI 11× — Reauditoria técnica da matriz v1 (Sprint 122)

**Data:** 2026-11-12. Base: `main` após PR #121, commit `4d2b99259afab504a9668a51d10f6927e2fa0fbd`.

## Resultado da reavaliação

**31,5/48 = 65,6% de cobertura técnica estática v1 (antes: 31/48 = 64,6%).** Este índice NÃO mede funcionamento em produção, receita, aquisição real, pagamentos Kairos ou qualidade de E2E. A única alteração é o critério 07.3, de variantes criativas persistidas e comparáveis: **0,5 → 1,0**.

**Limitação histórica:** a pontuação anterior 31/48 foi divulgada por módulo, sem um mapa individual de 48 avaliações. Os valores anteriores abaixo reconstroem conservadoramente esses totais, em linha com a matriz de novembro. Caso seja localizado um registro anterior diferente por critério, reconciliar antes de substituir o histórico. Não interpretar o mapa reconstruído como auditoria assinada em data passada.

Pontuação v1: **1** = código/contrato técnico implementado e testes de unidade/regressão observados; **0,5** = parcial; **0** = ausente/bloqueado. O 1 não prova uso com compradores em produção.

## 48 critérios revisados

### Eclipse / Consumidor

| Critério | Antes | Revisado | Evidência |
|---|---:|---:|---|
| 01.1 Cadastro dos três públicos | 1.0 | 1.0 | `src/routes/onboarding.tsx` |
| 01.2 Feed de descoberta | 1.0 | 1.0 | `src/routes/feed.tsx` |
| 01.3 Personalização por audiência | 0.5 | 0.5 | `src/lib/rubi-unified-interest-ranking.ts` |
| 01.4 Coortes e recompra pagas | 0.0 | 0.0 | `src/lib/rubi-growth-11x.ts` |
| **Total** | **2.5/4** | **2.5/4** | |

### Story / Marca própria

| Critério | Antes | Revisado | Evidência |
|---|---:|---:|---|
| 02.1 Histórico de produtos e vídeos | 1.0 | 1.0 | `src/routes/history.tsx` |
| 02.2 Narrativa e vídeos da marca | 1.0 | 1.0 | `src/components/store/RubiProductStories.tsx` |
| 02.3 Movimentos Story versionados | 0.5 | 0.5 | `src/lib/rubi-movement-variants.functions.ts` |
| 02.4 Jornada Story E2E | 0.0 | 0.0 | `src/routes/videos.tsx` |
| **Total** | **2.5/4** | **2.5/4** | |

### Achadinhos Orgânico

| Critério | Antes | Revisado | Evidência |
|---|---:|---:|---|
| 03.1 Vitrine e vídeos | 1.0 | 1.0 | `src/routes/videos.tsx` |
| 03.2 UTM e roteamento | 1.0 | 1.0 | `src/lib/rubi-organic-campaigns.ts` |
| 03.3 Distribuição multicanal confirmada | 0.5 | 0.5 | `src/lib/rubi-movement-distribution.functions.ts` |
| 03.4 Comissões externas conciliadas | 0.0 | 0.0 | `src/lib/rubi-organic-performance.functions.ts` |
| **Total** | **2.5/4** | **2.5/4** | |

### Store / Kairos

| Critério | Antes | Revisado | Evidência |
|---|---:|---:|---|
| 04.1 Catálogo de produtos e fornecedores | 1.0 | 1.0 | `src/lib/hub-catalog.functions.ts` |
| 04.2 Pré-checkout validado | 1.0 | 1.0 | `src/lib/rubi-precheckout.functions.ts` |
| 04.3 Landing editorial aprovada | 1.0 | 1.0 | `src/lib/rubi-offer-playbook.functions.ts` |
| 04.4 Checkout/host externo preparado e conciliado | 0.5 | 0.5 | `src/lib/rubi-launch-readiness.functions.ts` |
| **Total** | **3.5/4** | **3.5/4** | |

### Business / Lojistas

| Critério | Antes | Revisado | Evidência |
|---|---:|---:|---|
| 05.1 Preços/quantidades no atacado | 1.0 | 1.0 | `src/routes/wholesale.tsx` |
| 05.2 Cotações e respostas | 1.0 | 1.0 | `src/lib/hub-business-quotes.functions.ts` |
| 05.3 Requisição de reposição | 1.0 | 1.0 | `src/lib/rubi-business-retention.functions.ts` |
| 05.4 Pedido B2B pago e frete auditado | 0.0 | 0.0 | `src/lib/hub-business-quotes.functions.ts` |
| **Total** | **3.0/4** | **3.0/4** | |

### Partners / Afiliados

| Critério | Antes | Revisado | Evidência |
|---|---:|---:|---|
| 06.1 Grants aprovados | 1.0 | 1.0 | `src/lib/partner-product-grants.functions.ts` |
| 06.2 Links e visitas individuais | 1.0 | 1.0 | `src/lib/partner-referrals.functions.ts` |
| 06.3 Comissões e relatórios | 1.0 | 1.0 | `src/lib/partner-commission-status.functions.ts` |
| 06.4 Compra externa atribuída e conciliada | 0.0 | 0.0 | `src/lib/rubi-precheckout.functions.ts` |
| **Total** | **3.0/4** | **3.0/4** | |

### Offer Engine

| Critério | Antes | Revisado | Evidência |
|---|---:|---:|---|
| 07.1 Playbook de ofertas | 1.0 | 1.0 | `src/lib/rubi-offer-playbook.functions.ts` |
| 07.2 Publicação e revogação segura | 1.0 | 1.0 | `src/lib/rubi-offer-playbook.functions.ts` |
| 07.3 Variantes persistidas e comparáveis | 0.5 | 1.0 | `src/lib/rubi-movement-variants.functions.ts; src/lib/rubi-movement-performance.ts; src/lib/rubi-movement-performance.test.mjs` |
| 07.4 Biblioteca de ativos reutilizáveis e licenciados | 0.0 | 0.0 | `src/lib/rubi-movement-variants.ts` |
| **Total** | **2.5/4** | **3.0/4** | |

### Movement Engine

| Critério | Antes | Revisado | Evidência |
|---|---:|---:|---|
| 08.1 Múltiplos movimentos por SKU | 1.0 | 1.0 | `src/lib/rubi-movements.functions.ts` |
| 08.2 Público/ângulo validado | 0.5 | 0.5 | `src/lib/rubi-movements.ts` |
| 08.3 Criativos/páginas e experimento A/B | 0.5 | 0.5 | `src/components/store/RubiMovementVariantsAdmin.tsx` |
| 08.4 Desempenho por público e movimento | 0.5 | 0.5 | `src/lib/rubi-movement-performance.functions.ts` |
| **Total** | **2.5/4** | **2.5/4** | |

### Complementary Offers

| Critério | Antes | Revisado | Evidência |
|---|---:|---:|---|
| 09.1 Admin tipos de ofertas complementares | 1.0 | 1.0 | `src/components/store/RubiComplementaryOffersAdmin.tsx` |
| 09.2 Cross-sell e downsell separados | 1.0 | 1.0 | `src/lib/rubi-complementary-offers.functions.ts` |
| 09.3 Bump cobrado no checkout Kairos | 0.0 | 0.0 | `src/lib/rubi-complementary-offers.ts` |
| 09.4 Upsell pós-compra confirmado | 0.0 | 0.0 | `src/lib/rubi-complementary-offers.ts` |
| **Total** | **2.0/4** | **2.0/4** | |

### Intelligence / Métricas

| Critério | Antes | Revisado | Evidência |
|---|---:|---:|---|
| 10.1 Eventos de aquisição e pré-checkout | 1.0 | 1.0 | `src/lib/rubi-growth-funnel.functions.ts` |
| 10.2 Painel orgânico canal/campanha | 1.0 | 1.0 | `src/lib/rubi-organic-performance.functions.ts` |
| 10.3 Comparação e retenção por variante | 0.5 | 0.5 | `src/lib/rubi-movement-performance.ts` |
| 10.4 Compra paga e LTV reais | 0.0 | 0.0 | `src/lib/rubi-three-funnel-pulse.functions.ts` |
| **Total** | **2.5/4** | **2.5/4** | |

### Shadow Master / Segurança

| Critério | Antes | Revisado | Evidência |
|---|---:|---:|---|
| 11.1 Proteção server-side do Master | 1.0 | 1.0 | `src/lib/auth-guards.server.ts` |
| 11.2 Gestão administrativa de catálogo | 1.0 | 1.0 | `src/routes/admin/hub-catalog.tsx` |
| 11.3 Auditoria administrativa completa | 0.5 | 0.5 | `src/lib/rubi-master-campaign-plans.functions.ts` |
| 11.4 Múltiplos masters sem hardcode | 0.0 | 0.0 | `src/routes/admin.tsx` |
| **Total** | **2.5/4** | **2.5/4** | |

### Qualidade / Operação

| Critério | Antes | Revisado | Evidência |
|---|---:|---:|---|
| 12.1 CI TypeScript lint build testes | 1.0 | 1.0 | `.github/workflows/sprint-33-qa.yml` |
| 12.2 Migrações e RLS protegidas | 1.0 | 1.0 | `supabase/migrations/20261112033000_rubi_creator_team_members.sql` |
| 12.3 E2E mobile/desktop dos quatro perfis | 0.0 | 0.0 | `src/routes/admin.tsx` |
| 12.4 Pedido real, repasse e estorno | 0.0 | 0.0 | `src/lib/rubi-precheckout.functions.ts` |
| **Total** | **2.0/4** | **2.0/4** | |

## Evidência adicional do ganho de 0,5 ponto

- **07.3:** `rubi_movement_variants` possui CRUD persistido por movimento, trava de revisão otimista, direitos de mídia e checklist para revisão (`src/lib/rubi-movement-variants.functions.ts`).
- Comparação observacional por variante disponível em `src/lib/rubi-movement-performance.ts`, excluindo atribuição ambígua, campanhas sem visitas e divisões com denominador zero. Testes concretos em `src/lib/rubi-movement-performance.test.mjs` e `src/lib/rubi-movement-variants.test.mjs`.
- Supabase `heartful-helper-box` consultado em 12/11: `rubi_movements`, `rubi_movement_variants` e `rubi_movement_distribution` têm **RLS=true**, sem leitura direta para `anon` e `authenticated`. PR #121 passou pelos dois fluxos CI no commit de correção `e2aca885...` antes de integrar à main.
- Não pontuar duas vezes no Movement Engine e Intelligence: não existe teste A/B causal homologado nem retenção de vídeo confiável. Este ganho se restringe à existência de variantes persistidas e **comparação descritiva**.

## Escada de crescimento (v1, 48 pontos fixos)

| Marca | Total | Falta desde agora |
|---|---:|---:|
| **Atual reavaliada** | **31,5/48 = 65,6%** | — |
| Próxima | 32/48 = 66,7% | +0,5 ponto |
| Intermediária | 33/48 = 68,8% | +1,5 pontos |
| **Meta 70%+** | **34/48 = 70,8%** | **+2,5 pontos** |
| Meta 80%+ | 38,5/48 = 80,2% | +7 pontos |

## Sprints futuras e dependências

- **Sprint 123:** histórico de entrada e saída dos criadores nos times, vínculo campanha→produto→integrante e revogações sem reatribuição retroativa; pode ajudar Partners/Intelligence, mas a integração de Kairos ainda limita aceite v1.
- **Sprint 124:** ampliar distribuição rastreável, denominadores por criativo, comparação controlada de campanhas e sinais consentidos; candidato mais próximo para completar Movement/Intelligence.
- **Sprint 125:** avaliações reais e moderadas, relacionamento e prova social; requisito ampliado da matriz v2.
- **Sprint 126:** HTTPS RUBI publicado, SKU verdadeiro, QA de consumidor/lojista/parceiro/Master em desktop e mobile.
- **Sprint 127:** Kairos com atribuição de parceiro e conciliação de pedido, estorno e comissão; requisito externo prioritário.
- **Sprint 128:** IA criativa e plataformas de anúncios autorizadas, limites de mídia e medição de custo real.
- **Sprint 129:** revisão final v1/v2, controle de P0 e decisão comercial de lançamento.

**Cautela:** a nova matriz v2 de IA + Ads + times + comentários pode ter denominador maior e porcentagem inicial menor. Manter v1 para comparação e v2 para escopo completo; não somar documentação/PR isolados como produção real.

**Bloqueios externos:** domínio RUBI HTTPS, primeiro SKU e host de checkout Kairos, pagamento de teste oficialmente verificado, origem de vendas e estornos, gastos de mídia, IA real e licenciamentos. Nenhuma compra fictícia.

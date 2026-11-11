# RUBI 11× — Auditoria de Cobertura por Módulo (baseline v1)

Data: 2026-11-10. Repositório: `Lucaseagles/blank-canvas-project`, branch principal após PR #72 (commit `7328871`). Backend observado: Supabase `heartful-helper-box` (`akfvkjarpgocdsieuvvq`).

## Conclusão
**Não está completo.** A arquitetura e várias telas/serviços existem, mas a operação Kairos ainda não foi validada, faltam Movement Engine funcional, biblioteca de variantes/criativos, testes E2E reais e pagamentos atribuídos.

## Método reproduzível e limitações
- Matriz de **48 critérios explícitos**, divididos em **12 módulos com 4 critérios cada**. Não é censo de todos os requisitos possíveis do produto; cada critério pesa igualmente na primeira baseline.
- Pontuação: **1** = evidência estática concreta no `main` de código/rota/serviço apropriado; **0,5** = implementação genérica/parcial, sem aceite pleno; **0** = ausente, somente planejamento ou bloqueado externamente. Status 1 **NÃO** comprova teste end-to-end ou uso em produção.
- Fórmula: `100 × soma dos pontos / total de critérios`; porcentagem por módulo usa soma de 4. Uma sprint que expanda o escopo precisa atualizar o denominador de modo transparente, não esconder requisitos para elevar o índice.
- Esta baseline é **cobertura de requisitos selecionados na implementação**, não '% do app funcionando', nem '% de vendas', nem probabilidade de conversão. Progresso operacional permanece sem percentual auditável até execução de E2E e confirmação financeira.
- Revisão de código + migrações, CI recente, e consultas de contagem/RLS no Supabase. Sem interação de navegador com hospedagem, sem usuário comprador/lojista/parceiro ativo de teste, sem checkout real Kairos.

## Resultado principal
**26/48 pontos = 54.2% de cobertura ponderada da matriz v1.** Isso substitui o antigo '65%' **apenas como indicador de escopo avaliado**, não como certificação operacional.

| Módulo | Pontos / 4 | Cobertura técnica da matriz | Situação |
|---|---:|---:|---|
| Eclipse / Consumidor | 2.5 | 62.5% | Parcial |
| Story / Marca própria | 1.5 | 37.5% | Parcial |
| Achadinhos Orgânico | 2.5 | 62.5% | Parcial |
| Store / Kairos | 3.0 | 75.0% | Parcial |
| Business / Lojistas | 3.0 | 75.0% | Parcial |
| Partners / Afiliados | 3.0 | 75.0% | Parcial |
| Offer Engine | 2.0 | 50.0% | Parcial |
| Movement Engine | 0.0 | 0.0% | Não implementado |
| Complementary Offers | 2.0 | 50.0% | Parcial |
| Intelligence / Métricas | 2.0 | 50.0% | Parcial |
| Shadow Master / Segurança | 2.5 | 62.5% | Parcial |
| Qualidade / Operação | 2.0 | 50.0% | Parcial |

## Itens de aceite auditados

### Eclipse / Consumidor

| Pontos | Critério | Evidência e ressalva |
|---:|---|---|
| 1 | Onboarding com 3 públicos | `src/routes/onboarding.tsx` |
| 1 | Feed de descoberta | `src/routes/feed.tsx` |
| 0.5 | Personalização por público com jornada comercial comprovada | `src/lib/personalization.functions.ts` |
| 0 | Retenção e recompra medidas em coortes pagas | `src/lib/rubi-growth-11x.ts` |

### Story / Marca própria

| Pontos | Critério | Evidência e ressalva |
|---:|---|---|
| 1 | Histórico de produtos e vídeos | `src/routes/history.tsx` |
| 0.5 | Vídeos e narrativa disponíveis genericamente | `src/routes/videos.tsx` |
| 0 | Movimentos de história de marca por produto com versões | `docs/rubi-movement-engine-design.md (PR #71 em rascunho)` |
| 0 | Jornada Story de marca própria validada de ponta a ponta | `não evidenciada` |

### Achadinhos Orgânico

| Pontos | Critério | Evidência e ressalva |
|---:|---|---|
| 1 | Vitrine e vídeos de descoberta | `src/routes/videos.tsx; src/routes/admin/collections.tsx` |
| 1 | Links UTM e testes automatizados | `src/lib/rubi-organic-campaigns.ts; src/lib/rubi-organic-campaigns.test.mjs` |
| 0.5 | Publicação/distribuição multicanal integrada e testada | `src/routes/admin/collections.tsx; src/components/store/RubiOrganicLinkBuilder.tsx` |
| 0 | Conversões afiliadas externas conciliadas | `não evidenciada` |

### Store / Kairos

| Pontos | Critério | Evidência e ressalva |
|---:|---|---|
| 1 | Catálogo oficial de produtos e fornecedores | `src/routes/hub-shop.tsx; src/lib/hub-catalog.functions.ts` |
| 1 | Pré-checkout com URL oficial conferida pelo servidor | `src/lib/rubi-precheckout.functions.ts; src/lib/rubi-checkout-validation.test.mjs` |
| 1 | Página editorial aprovada por produto | `src/components/store/RubiPublishedOffer.tsx; src/lib/rubi-offer-playbook.functions.ts` |
| 0 | Pedidos pagos, atribuição e estornos Kairos validados | `não evidenciada` |

### Business / Lojistas

| Pontos | Critério | Evidência e ressalva |
|---:|---|---|
| 1 | Preços mínimos e escalas de atacado | `src/routes/wholesale.tsx; src/lib/rubi-business-quote-pricing.test.mjs` |
| 1 | Cotações e resposta comercial Master | `src/lib/hub-business-quotes.functions.ts` |
| 1 | Reposição por solicitação e follow-up com consentimento | `src/lib/rubi-business-retention.functions.ts; src/lib/rubi-business-followup.test.mjs` |
| 0 | Pedidos B2B pagos, frete e reposição real conciliados | `não evidenciada` |

### Partners / Afiliados

| Pontos | Critério | Evidência e ressalva |
|---:|---|---|
| 1 | Aprovação e autorização individual de produtos | `src/lib/partner-product-grants.functions.ts; src/routes/partner/portal.tsx` |
| 1 | Links e acompanhamento de visitas por parceiro | `src/lib/partner-referrals.functions.ts; src/lib/partner-visit-stats.functions.ts` |
| 1 | Estrutura de comissões, pagamentos e paginação de relatórios | `src/lib/partner-commission-status.functions.ts; src/lib/financial-pagination.server.ts` |
| 0 | Checkout do parceiro atribuível e pagamento externo Kairos confirmado | `src/lib/rubi-precheckout.functions.ts (explicitamente bloqueado)` |

### Offer Engine

| Pontos | Critério | Evidência e ressalva |
|---:|---|---|
| 1 | Playbook por produto com campos de oferta, criativo, página e canais | `src/components/store/RubiOfferEngineAdmin.tsx` |
| 1 | Publicação editorial restrita ao Master com revogação | `src/lib/rubi-offer-playbook.functions.ts` |
| 0 | Várias variantes criativas por produto persistidas e comparáveis | `não evidenciada` |
| 0 | Biblioteca de materiais reutilizáveis com aprovação de direitos | `não evidenciada` |

### Movement Engine

| Pontos | Critério | Evidência e ressalva |
|---:|---|---|
| 0 | N movimentos independentes por produto no banco | `somente docs/rubi-movement-engine-design.md em PR #71` |
| 0 | Gerador de públicos e ângulos com validação factual | `somente planejamento` |
| 0 | Editor de criativos/páginas por movimento e teste A/B | `somente planejamento` |
| 0 | Painel de performance por movimento e público | `somente planejamento` |

### Complementary Offers

| Pontos | Critério | Evidência e ressalva |
|---:|---|---|
| 1 | Admin Master gerencia sugestão de bump/upsell/cross-sell/downsell | `src/components/store/RubiComplementaryOffersAdmin.tsx` |
| 1 | Cross-sell e downsell como compras separadas e preços reais | `src/lib/rubi-complementary-offers.functions.ts; src/components/store/RubiComplementarySuggestions.tsx` |
| 0 | Order bump adicionado e cobrado dentro do checkout Kairos | `explicitamente não implementado` |
| 0 | Upsell após compra confirmada na Kairos | `explicitamente não implementado` |

### Intelligence / Métricas

| Pontos | Critério | Evidência e ressalva |
|---:|---|---|
| 1 | Funil de eventos de aquisição e pré-checkout | `src/lib/rubi-growth-funnel.functions.ts` |
| 1 | Painel orgânico por produto, canal, campanha | `src/lib/rubi-organic-performance.functions.ts` |
| 0 | CTR, retenção de vídeo e comparação A/B por variante | `não evidenciada` |
| 0 | Taxa de compra e LTV calculados a partir de pagamentos externos verificados | `não evidenciada` |

### Shadow Master / Segurança

| Pontos | Critério | Evidência e ressalva |
|---:|---|---|
| 1 | Acesso owner e rotas administrativas disponíveis | `src/routes/admin.tsx; src/lib/auth-guards.server.ts` |
| 1 | Gestão de produto, oferta e complementar sem mudar código | `src/routes/admin/hub-catalog.tsx` |
| 0.5 | Auditoria e visões administrativas existentes, sem cobertura integral por requisito | `src/routes/admin/audit.tsx; docs/RUBI_AUDITORIA_PLANEJAMENTO_2026-11-07.md` |
| 0 | Gestão futura de múltiplos Masters sem e-mail hardcoded na UI | `src/routes/admin.tsx (OWNER_EMAIL fixo)` |

### Qualidade / Operação

| Pontos | Critério | Evidência e ressalva |
|---:|---|---|
| 1 | Pipelines automatizados build, tsc, lint e testes de módulo | ` .github/workflows/hub-v1-integration-qa.yml; .github/workflows/sprint-33-qa.yml` |
| 1 | Migrações recentes presentes e aplicadas no Supabase correto | `supabase/migrations/202611*.sql; heartful-helper-box` |
| 0 | E2E hospedado desktop/mobile para os três perfis e owner | `não evidenciado` |
| 0 | Primeiro ciclo de pedido real, pagamento, conciliação, estorno e retorno | `não evidenciado` |

## Verificações do Supabase (consulta realizada)
- `hub_products`: **0**; produtos com link considerado pronto no filtro de contagem: **0**.
- `rubi_offer_playbooks`: **0** (publicados: **0**).
- `rubi_complementary_offers`: **0** (ativos: **0**).
- `hub_b2b_quote_requests`: **0**; `hub_partner_referral_links`: **0**; `hub_partner_confirmed_sales`: **0**.
- Em `hub_products`, `hub_b2b_quote_requests`, `hub_partner_confirmed_sales`, `rubi_offer_playbooks` e `rubi_complementary_offers`: RLS=true, SELECT direto de `anon` e `authenticated`=false. Isso não substitui testes negativos e de isolamento em funções de servidor.
- Migrações recentes aplicadas até `rubi_complementary_offers` confirmadas no histórico.
- Registro `src/lib/rubi-growth-11x.ts`: 35 estratégias, 14 identificadas como `code-observed`, 18 `execution-plan`, 3 `external-blocker`. Essa classificação é planejamento e não validação de produção.
- CI do PR #72 após correção: fluxo Hub V1 e Sprint 33 QA concluídos com sucesso. Teste E2E de navegador não demonstrado.

## Principais lacunas e sprints seguintes (gates rígidos)

### Sprint 73 — Movement Engine operacional (P0)
- Implementar múltiplos movimentos **por produto** no Admin Master, cada um com público, problema legítimo, promessa comprovável, narrativa, diferenciais e evidências; CRUD, versionamento, rascunho e aprovação.
- Criar tabelas e funções seguras com RLS, autorização owner-only, índices e testes; sem ativar automaticamente, nem mudar checkout.
- Aceite: 2 movimentos por SKU com dados isolados e edição/revogação seguras; testes de acesso indevido e de persistência.

### Sprint 74 — Variantes criativas, páginas e material reutilizável (P0)
- Várias variantes de criativo por movimento, formato/mídia/CTA, direitos de uso; prévia de página correspondente, publicação controlada e fallback.
- Aceite: 2 variantes apontam para a versão correta, sem editar SKU/preço, e sem publicação antes da aprovação.

### Sprint 75 — Distribuição e medição de movimento (P1)
- Calendário por canal, links UTM com prioridade à referência do parceiro, histórico de publicação verificável, testes de CTR calculados com denominador, retenção de vídeo somente se fonte permitir, comparações com amostra.
- Aceite: canais e variantes rastreáveis; eventos nunca equiparados a vendas.

### Sprint 76 — Integração oficial de ofertas complementares com Kairos (P0 externo)
- Documentar capacidades oficiais Kairos (order bump, upsell pós-compra, downsell), contratos/URLs e forma de preservar atribuição; se integração não existir, manter apenas preparo no RUBI e execução manual autorizada na Kairos.
- Aceite: teste de checkout autorizado, produtos/comissões corretos, cancelamento/estorno e dados reconciliados. **Não simular compras reais.**

### Sprint 77 — End-to-end e segurança de perfis (P0)
- E2E hospedado de consumidor, lojista, parceiro e owner no desktop/mobile, revogação, isolamento, estados vazios, navegação, disponibilidade de fornecedor, regressão de /r/$code.
- Corrigir `OWNER_EMAIL` fixo em `src/routes/admin.tsx` com solução owner configurável segura, preservando proteção server-side; não expor botões master a usuário comum.
- Aceite: matriz de testes assinada com evidências de execução real.

### Sprint 78 — Operação comercial/piloto e atualização de cobertura (P0 externo)
- Cadastrar produtos Kairos e URLs oficiais aprovadas (hoje catálogo vazio); criar 1–3 ofertas reais com comprovação de benefícios, vídeos licenciados, movimentos, material e preços; validar pagamento real e repasse somente com autorização/documentação do fornecedor.
- Medir compras e margem confirmadas, atendimento, taxa de recompra (se houver), sem confundir cliques e intenções com receita.
- Recalcular a matriz com critérios e links de execução e adicionar campo separado de % efetivamente testado/ativo.

## Observações de risco
- O documento de Movement Engine está apenas em PR #71 **draft**; não deve ser contado como implementação.
- O checkout do parceiro em `src/lib/rubi-precheckout.functions.ts` retorna bloqueio explícito até existir atribuição oficial; isso é proteção de comissões, não erro a ser contornado com URL direta.
- O Order Bump e o Upsell no editor são propostas; a página RUBI somente mostra cross-sell e downsell como produtos separados.
- A função de paginação financeira agora usa `financial-pagination.server.ts`; isso melhora truncamento, mas não é validação com volume/transações reais.
- Não elevar artificialmente o percentual com sprints de documentação, CI ou migrações vazias. Todo marco deve reportar matriz de implementação, validação e operação em separado.

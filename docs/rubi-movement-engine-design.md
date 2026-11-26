# RUBI Movement Engine — Especificação por ângulo e público
Data: 2026-11-10
Estado: especificação em revisão; implementação parcial existe na main, mas o engine completo e a publicação automatizada não estão concluídos.

## Distinção fundamental
Produto é um item de catálogo. Oferta é uma proposta específica. **Movimento** é um posicionamento narrativo organizado em torno de uma situação, necessidade, desejo legítimo ou identidade de público, capaz de sustentar criativos, página, canais e sequência de conteúdo. Não confundir com nome publicitário isolado, retenção de vídeo ou automação de mensagens.

O mesmo produto pode ter N movimentos e cada movimento pode ter variantes de gancho, roteiro e página. O movimento não altera checkout, preço, comissão, estoque ou termos oficiais da Kairos.

## Modelo de dados proposto
- `rubi_movements`: id, product_id, name, positioning, audience, user_problem, desired_outcome, truthful_promise, emotional_angle, differentiator, evidence_refs, forbidden_claims, state [draft/review/approved/archived], created_by, updated_at. Owner-only.
- `rubi_movement_creatives`: id, movement_id, format [short_video/story/carousel/post], hook, script, CTA, media_url or asset_ref, permission_status, variant, state.
- `rubi_movement_pages`: id, movement_id, headline, subheadline, sections JSON, CTA label, offer_playbook_ref, published_version, approval_log.
- `rubi_movement_distribution`: id, movement_id, channel, audience/segment, approved_link, campaign_utm, planned_at, published_at if evidenced, manual/automatic eligibility, consent.
- `rubi_movement_metrics`: aggregate by movement/creative/page/channel: measurable impressions, clicks, video watch-time and retention when accessible, page views, outbound checkout intent, purchases only when independently verified. Include sample size and timeframe.
- `rubi_movement_evidence`: truthfulness review metadata. Exclude private/sensitive evidence and copyrighted assets without permission.

## Proposed operator workflow
1. Select catalog product. Read only approved/known product facts.
2. Suggest 3–5 distinct lawful audience/motivation hypotheses, without pretending consumer research has been done.
3. For each choose buyer persona, situation, pain, desired outcome, distinct angle, emotional framing and alternative objections.
4. Generate 2–4 hook variants and short video script; create matching landing-page outline and movement editorial calendar.
5. Validate against product facts, supplier agreements, proof, rights to media, ad policies and actual checkout readiness.
6. Owner approves each movement and each published version. Generate links with UTM, preserving official checkout and partner attribution.
7. Track actual creative-level CTR (clicks/impressions), video retention (watchers/completions or watch time from provider when available), page-to-checkout intent rate and verified sales when supplier reporting exists. Do not equate CTR with retention or purchase conversion.
8. Iterate; no claims of guaranteed high CTR or conversion.

## Example (mini camera, security/consensual use)
Product: compact indoor camera, only if stated verified capabilities exist.
- Movement A: "Sua Casa, Seu Olhar" — monitoramento autorizado da própria residência, when away.
- Movement B: "De Olho nos Pets" — checking pets where lawful and consistent with capabilities.
- Movement C: "Pequeno Negócio, Mais Visibilidade" — monitoring a shop with clear notification/consent and lawful placement.
NEVER position as secret partner monitoring, coercive surveillance or privacy invasion. No videos from TikTok without rights or licensing. No fabricated social proof, countdowns or unsupported claims.

## Guardrails
- Avoid manipulation exploiting suspicion, private life or mental distress; use curiosity without deceptive or invasive framing.
- Product benefits/claims must be verified before publication.
- All new public pages must retain current server-side verified checkout destination.
- Admin-only creation/approval, RLS, structured validation, audit trail. Consumer/merchant/partner isolated.
- Marketplace partners keep tracked codes and individual product grants; campaign UTM cannot override referral.
- No contact, promotion or messaging without consent and channel integration.
- `70/80/100` are editorial goals, not estimated conversion probabilities or weight of a sale.
- Record variants, traffic source, sample size, period and UTM; avoid counting the same session as paid order.

## MVP acceptance
- Master can create multiple movements per product, save/review and select one for a variant test; each has a coherent angle and audience.
- Copy creative and landing-page outline, and prepare distribution tasks per movement.
- Existing published store page and Kairos precheckout work unchanged unless an approved movement is enabled.
- TypeScript, lint, build, unit/integration tests, RLS/negative access tests and manual mobile UX approved before merge.
- Metrics drawn from actual observations; no fake click-through, video retention, revenue or orders.

## Roadmap
Sprint 71: schema and admin CRUD for movements per product (no public exposure).
Sprint 72: variant creative/page preview + manual publish guardrails.
Sprint 73: channel distribution planning, UTM and partner-aware links.
Sprint 74: attribution dashboard and experiment reporting; video retention only when channel exposes reliable data.


## Estado da implementação na main — 2026-11-26

Esta seção prevalece sobre a descrição histórica de 10/11. Parte do modelo já foi implementada; **não criar tabelas duplicadas** nem tratar o engine como totalmente pronto.

### Componentes já existentes

- `rubi_movements`: movimentos privados por produto, com público/posicionamento, evidência textual, estado e revisão.
- `rubi_movement_variants`: variantes de criativo e página; já contém hook, roteiro, headline, body, CTA, notas de mídia/prova, confirmação de direitos, status e revisão.
- `rubi_movement_distribution`: planos por variante/canal/campanha, estado planejado ou registro de publicação manual e referência informada.
- CRUD/servidor: `src/lib/rubi-movements.functions.ts`, `rubi-movement-variants.functions.ts` e `rubi-movement-distribution.functions.ts`.
- Escrita de variantes: RPC `rubi_mutate_variant_audited`, Owner verificado por `p_actor`, revisão otimista/row lock e auditoria transacional.
- Performance: `src/lib/rubi-movement-performance.ts` e testes associados oferecem comparação descritiva por variante com limites para dados ambíguos.

### Segurança e limites já verificados no código/migrations

- As três tabelas existentes têm RLS habilitada e grants diretos revogados para `public`, `anon` e `authenticated`; as operações confiáveis passam por funções server-side/Owner.
- A aprovação de Story exige movimento vinculado, produto correspondente e estado/revisão elegíveis.
- Direitos de mídia e revisão são gates explícitos antes de promover variante.
- `manually_published` e `published_reference` registram uma declaração de publicação manual com referência; não provam independentemente que a rede publicou ou entregou alcance.
- Os registros de distribuição não alteram preço, checkout, comissão, estoque ou pedidos.

### Lacunas reais — não declarar concluídas

- Não foi localizada uma tabela independente `rubi_movement_metrics`; a medição atual é observacional/descritiva e depende dos eventos/fontes disponíveis.
- Não há evidência de experimento A/B causal homologado nem de retenção de vídeo confiável de todos os provedores.
- Não criar `rubi_movement_pages` apenas por seguir o desenho antigo: headline/body/CTA já vivem na variante. Uma separação futura exige justificar versionamento/rollback e migração.
- Agendamento/publicação automática, disparos em redes ou mensagens, consentimento por canal e prova externa dependem de integrações e contratos específicos.
- Compra confirmada e comissão só podem ser contabilizadas por retorno confiável do provedor ou reconciliação autorizada.

### Próxima evolução segura

1. Reauditar CRUD, RPC, RLS, grants e trilha de auditoria das três tabelas existentes.
2. Fechar inventário de canais e consentimento antes de automação/disparos.
3. Definir esquema de métricas com fonte, amostra, período e idempotência, sem inventar eventos.
4. Validar publicação manual com referências verificáveis e manter separada da publicação confirmada pelo provedor.
5. Só propor nova tabela/DDL quando a lacuna não puder ser coberta pelo modelo atual e houver teste de migração/rollback.

**Classificação:** atualização de arquitetura e governança / upgrade-only. Nenhum ponto V1 novo é reivindicado nesta especificação.

# Sprint 306 — Story → oferta oficial: readiness para E2E autenticado

Date: 2026-11-23
Base: `main` at `b928afd65bf554c61e3e6c090e3bdee741c06d40` (Sprint 305 merged)
Target criterion: **02.4 — Story journey E2E**
Classification: **upgrade-only / evidence readiness**. No V1 point is awarded by this document.

## Current implementation verified on main

- `RubiProductStories` loads only approved public Stories and offers an internal CTA to `#rubi-purchase`.
- `listRubiApprovedProductStories` requires an active product, positive retail price, verified official checkout, active supplier, approved Story, confirmed rights, linked movement and current approved movement revision.
- `getRubiCheckoutReadiness` returns a direct checkout destination only for the validated product path. Partner checkout remains closed until a verified supplier attribution URL exists; it does not silently fall back to a direct URL.
- Existing `rubi-story-offer-journey.test.mjs` checks source contracts and fail/recovery conditions. Existing browser E2E covers public storefront/feed and anonymous access boundaries, but does not execute a real Story-to-offer journey with persisted Story data.

## Integration baseline

Sprint 305 PR #305 has been merged into `main` at `b928afd65bf554c61e3e6c090e3bdee741c06d40`. Its isolated four-profile authenticated E2E passed 10/10 tests. This proves the shared local authentication harness, but does not replace the Story-to-offer journey evidence below.

## Evidence already available

- Static/source contract tests for Story → same-product precheckout.
- Approval, rights, supplier and movement-version gates in server code.
- Story approval and audit are routed through the atomic audited RPC.
- Browser test harness already supports mobile (390×844) and desktop (1366×768).

## Missing acceptance gates

| Gate | Required evidence | Status |
|---|---|---|
| G0 — implementation | Confirm current main path and product/story data contract | Passed by source review |
| G1 — behavior | Success, no Story, stale movement, missing rights, unavailable product/checkout, retry and failure cases | Partial: source tests exist; browser behavior incomplete |
| G2 — persistence/security | Disposable DB migrations, RLS/grants, owner approval, public read filters and negative authorization | Partial: isolated local Supabase bootstrap and full migration chain passed; Story-specific persisted fixtures and negative authorization assertions remain unproven |
| G3 — real journey | HTTPS staging browser journey with isolated consumer identity, real approved Story fixture, mobile and desktop | Partial: four authenticated profiles passed local mobile/desktop E2E; Story-to-offer with persisted approved Story remains unexecuted; staging origin/identities not confirmed |
| G4 — external proof | Official checkout redirect/round-trip and provider-confirmed attribution where applicable | Blocked on provider-owned test checkout; no purchase or commission may be inferred |
| G5 — evidence bundle | Run IDs, sanitized event/story/product references, screenshots and reviewer sign-off | Pending |

## Safety and integrity constraints

- Do not create or publish fake commercial Stories or fabricate product, checkout, payment or commission evidence.
- Use only an isolated staging project and explicitly disposable identities/data.
- Never point this test at production or a hosted customer database.
- Preserve rights confirmation, supplier approval, official checkout validation and current movement revision checks.
- Do not loosen RLS, grants or authorization to make a test pass.
- A click or `RUBI_STORY_OFFER_INTEREST` event is interest only, not a sale or settled payment.
- Do not substitute the Sprint 305 local four-profile E2E for this distinct Story-to-offer journey.

## Acceptance plan

1. Confirm an authorized HTTPS staging origin and isolated test identities.
2. Seed a disposable, owner-approved product + supplier + consumer-audience movement + rights-confirmed Story with a verified official checkout test destination.
3. Run the same Story-to-offer journey at 390×844 and 1366×768.
4. Assert Story content is visible only while all approval/version/rights/checkout gates hold.
5. Click the Story CTA and assert it lands on the same product's official precheckout section.
6. Assert the interest event is emitted as `interest_only`; do not treat it as an order or payment.
7. Verify negative cases: no rights, stale movement revision, inactive supplier/product, unverified checkout and unrelated product/movement.
8. Attach run IDs, screenshots, sanitized records and review the result before any scoring decision.

## Score decision

- Carried V1 baseline: **36.5/48 = 76.0%**.
- This readiness audit adds **0 points**.
- Criterion 02.4 remains a revalidation target; the historical Sprint 160 document proposed partial credit only after the applicable CI/merge/re-audit gates, while the current Sprint 301 register requires authenticated staging evidence for browser closure.
- No new-point-ready claim is made until the full required evidence bundle passes.

## Next dependency

The next executable step is to obtain/confirm the authorized staging URL and isolated staging test identity/data. Until then, work is limited to local disposable tests and source review; do not claim the staging gate passed.

## Sprint 306 CI evidence update

Validated on head commit `ae4881c5c6e0dbb8b7804616832cf26c4f535bb3`:

- `RUBI Local Authenticated E2E — Four Profiles`, run `45286495595`: **success**. Ten browser tests passed (consumer, merchant, partner and Master on mobile and desktop, plus non-owner Master access denial on both viewports). Isolated Supabase migrations and disposable identities succeeded; local Supabase was stopped/discarded.
- `Hub V1 integration QA`, run `45286495870`: **success**. Includes the dedicated Story-to-offer contract command: `npm run test:rubi-story-offer-journey`, with **10/10 passing**.
- `Sprint 33 QA`, run `45286495557`: **success**, including TypeScript, ESLint and production build.

These results strengthen CI confidence but do not prove a persisted Story-to-offer browser journey, staging checkout round-trip, provider attribution, or Story-specific runtime authorization. The score remains unchanged until those acceptance gates are satisfied.


## CI evidence update — 2026-11-24

Validated on Sprint 306 head commit `214f05fe8fdb8987e2567b1c9c24055cad3b950b`:

- `Hub V1 integration QA`, run `45301766933`: **success**. Dedicated `npm run test:rubi-story-offer-journey` passed **14/14** tests, including the public response minimization and product/movement binding assertions. Browser E2E configuration safety passed 3/3; TypeScript and ESLint passed.
- `Sprint 33 QA`, run `45301766782`: **success**, including route generation, TypeScript, ESLint and production build.
- `RUBI Local Authenticated E2E — Four Profiles`, run `45301766985`: **success**. The isolated local Supabase flow and all four authenticated profiles passed on mobile and desktop; disposable database was stopped/discarded.
- No failed steps were reported in the three completed workflow jobs.

This green CI confirms the corrected test suite and current code contracts. It does **not** close G2/G3/G4: the persisted Story fixture, Story-specific browser navigation on staging, and provider-owned checkout round-trip remain unexecuted. V1 remains **36.5/48 (76.0%)**; this update awards **0 additional points**.

## Persisted local Story negative-path evidence — 2026-11-24

Validated on PR head commit `fbe9c944a218e65593850ed3809a8ebd09fe93af`:

- `RUBI Local Authenticated E2E — Four Profiles`, run `45304701540`: **success**.
- The isolated local Supabase bootstrap applied migrations, seeded disposable consumer/merchant/partner/Master identities, and created a disposable supplier, unpublished product without verified checkout, reviewed consumer movement and private Story draft.
- The Playwright suite executed **12/12 passing tests**: ten authenticated profile/access tests (four profiles plus non-owner Master denial, mobile and desktop) and two persisted Story negative-path tests.
- The Story negative-path tests ran at mobile (390×844) and desktop (1366×768). In both, the Master attempted publication of the persisted private Story; the server rejected publication because the product had no verified official checkout and active supplier, the Story remained a private draft, and it did not become publicly approved.
- The local Supabase instance was stopped and discarded after the run.
- `Hub V1 integration QA`, run `45304701494`: **success**.
- `Sprint 33 QA`, run `45304701471`: **success**.

This closes the local persisted-fixture and negative publication-blocking proof for the missing-checkout scenario. It does **not** prove the positive approved-Story browser journey, public Story discovery, click-through to the same product's offer, HTTPS staging behavior, or provider-owned checkout round-trip. The local fixture intentionally has no verified checkout and cannot be published. No screenshot bundle or provider confirmation was produced by this run.

V1 remains **36.5/48 (76.0%)** and this evidence update awards **0 additional points** pending the complete positive-path and staging/provider acceptance gates.


## Persisted Story positive-path and four-profile browser evidence — 2026-11-24

Validated on PR head commit `ac532a2b459a7b56e0625d7ebe6f921a820ecd3c`:

- `RUBI Local Authenticated E2E — Four Profiles`, run `45307420453`: **success**.
- The isolated local Supabase instance started successfully, applied the migration chain, seeded disposable Master/consumer/merchant/partner identities and Story fixtures, and was stopped/discarded after the run.
- Playwright executed **14/14 passing tests** in 35.6 seconds:
  - 10 authenticated profile and Master non-owner access tests across mobile (390×844) and desktop (1366×768).
  - 2 persisted Story negative-path tests across mobile and desktop: publication remains blocked when the product lacks a verified official checkout and active supplier.
  - 2 persisted Story positive-path tests across mobile and desktop: Master publishes the disposable Story; the consumer finds that same Story on its matching product page and reaches the internal pre-checkout section.
- The positive-path fixture uses a synthetic local-only checkout host `checkout.example.test`. The browser test verifies navigation to the pre-checkout section; it does not execute an external checkout, payment, order, or provider attribution.
- `Hub V1 Integration QA`, run `45307420476`: **success**, including route generation/build, the dedicated RUBI regression suite, TypeScript and ESLint.
- The workflow completed its non-secret test summary step and stopped/discarded local Supabase. The workflow run exposed no downloadable artifacts.

## Updated acceptance status and score decision

| Gate | Current status |
|---|---|
| G0 — implementation | Passed by source review and CI contracts |
| G1 — local behavior | Improved: positive and negative persisted Story paths pass in mobile and desktop; broader stale-version, missing-rights and retry/failure browser cases remain outstanding |
| G2 — persistence/security | Local migration bootstrap, disposable fixtures, four-profile authentication and Master non-owner denial passed; full staging/RLS acceptance evidence remains outstanding |
| G3 — real journey | Local persisted Story → same-product pre-checkout journey passed in both viewports; authorized HTTPS staging journey remains outstanding |
| G4 — external proof | Blocked: no provider-owned sandbox checkout round-trip or provider-confirmed attribution |
| G5 — evidence bundle | CI run IDs and sanitized test summary are available in workflow logs; downloadable screenshot/artifact bundle and reviewer sign-off remain outstanding |

The latest local browser run closes an important local positive-path gap, but does not satisfy the staging and provider-owned external acceptance gates. Do not infer a sale, payment, commission, or production checkout from this test.

V1 remains **36.5/48 (76.0%)** and this update awards **0 additional points**. Classification: **upgrade**. PR #307 remains Draft and must not be merged until the remaining acceptance gates are satisfied and reviewed.

## Sanitized evidence validation after workflow hardening — 2026-11-24

Validated on PR head commit `7806b0b84cbeff740b6396cf0a28814fcf8e2aeb`:

- `RUBI Local Authenticated E2E — Four Profiles`, run `45312370327`: **success**. The isolated Supabase migration/bootstrap, disposable Master/consumer/merchant/partner identities, Story fixtures, app startup, browser tests and teardown all completed successfully.
- Playwright executed **14/14 passing tests** in 43.8 seconds across mobile (390×844) and desktop (1366×768), including authenticated profile boundaries, non-owner Master denial, persisted Story publication blocking without valid checkout/supplier, and the positive persisted Story → matching product → internal pre-checkout path.
- The workflow generated the sanitized JSON summary, parsed it again successfully before upload, and uploaded artifact `rubi-local-e2e-sanitized-evidence` (artifact ID `14883354186`, run `45312370327`). This validates the evidence-export correction; the artifact excludes the raw report and runtime details.
- `Hub V1 integration QA`, run `45312370330`: **success**.
- `Sprint 33 QA`, run `45312370293`: **success**.
- All three workflows for this head completed successfully.

The local browser evidence and downloadable sanitized summary are now repeatable. It still uses disposable local data and a synthetic checkout host; it is not HTTPS staging, provider-owned sandbox round-trip, payment, order, or provider-confirmed attribution evidence. Staging and external-provider gates remain open. Broader Story-specific browser negatives for missing rights and stale movement revision also remain outstanding.

**Score decision:** V1 remains **36.5/48 (76.0%)**, with **0 additional points**. Classification: **upgrade**. PR #307 remains Draft and unmerged pending staging/provider evidence and remaining negative-path acceptance.


## Direitos de uso: bloqueio negativo persistido — 2026-11-24

Validado no head `f8a5935022c9205cd0260286762b3e7758acf1c3`:

- Execução `RUBI Local Authenticated E2E — Four Profiles`, run `45315500598`: **success**.
- Playwright executou **16/16 testes aprovados** em 41,5 segundos, sem falhas: quatro perfis autenticados (consumidor, lojista, parceiro e Master) em mobile e desktop; negação de acesso Master para não proprietário nos dois viewports; bloqueio de publicação sem checkout oficial/fornecedor ativo; bloqueio de publicação quando os direitos não estão confirmados apesar de produto/checkout elegíveis; e jornada positiva Story persistido → mesmo produto → pré-checkout local, em mobile e desktop.
- O teste de direitos confirma que o botão de publicação permanece indisponível e que o Story não é publicado. O teste não depende de clique impossível em botão desabilitado nem de mensagem de erro do servidor.
- Supabase local descartável iniciou, aplicou migrações, criou fixtures isoladas, e foi parado/descartado com sucesso.
- Evidência sanitizada gerada, validada por parse e enviada como artifact `rubi-local-e2e-sanitized-evidence`, ID `14884044672`, com retenção de sete dias.
- Verificações no mesmo head: `Install, build, TypeScript and lint` — **success**; `Hub V1 Integration QA` — **success**; E2E autenticado — **success**.

Esta execução fecha os cenários locais de direitos não confirmados e confirma novamente os caminhos positivos/negativos persistidos nos dois viewports. Ela continua sendo validação local com dados descartáveis e checkout sintético: não comprova staging HTTPS, transação no sandbox do provedor, pedido pago, nem atribuição externa de parceiro.

**Decisão de cobertura:** permanece **36,5/48 (76,0%)**, sem pontos adicionais. Classificação: **upgrade**. G2/G3 ainda exigem evidência de staging/RLS aplicável; G4 continua bloqueado pela validação externa do provedor. PR #307 permanece Draft e não deve ser integrada até concluir as dependências restantes e revisar todos os gates.


## Revisão obsoleta do movimento e evidência sanitizada — 2026-11-24

Validado no head `22a956c7e50f5957f1ba792aa4947f35490ff5ee`:

- `RUBI Local Authenticated E2E — Four Profiles`, run `45318777770`: **success**.
- Playwright executou **18/18 testes aprovados**, com **0 unexpected, 0 skipped e 0 flaky**.
- Além dos quatro perfis e dos cenários de direitos/checkout/jornada positiva, os testes de mobile e desktop confirmaram que uma Story cuja revisão aprovada do movimento ficou obsoleta não é exibida ao consumidor; a Story válida vinculada ao mesmo produto continua visível.
- Supabase local descartável iniciou, aplicou a cadeia de migrações, criou as identidades e fixtures isoladas, executou os testes autenticados e foi parado/descartado com sucesso.
- Evidência JSON sanitizada foi validada e enviada como artifact `rubi-local-e2e-sanitized-evidence`, ID `14886308735`, com retenção até 2026-12-01.
- No mesmo head: `Hub V1 integration QA`, run `45318777768`: **success**; `Sprint 33 QA`, run `45318777815`: **success**. Os três workflows concluíram com sucesso.

### Status atualizado dos gates

| Gate | Status |
|---|---|
| G0 — implementação | Passou na revisão de código e nos contratos de CI executados |
| G1 — comportamento local | Positivo e negativos de checkout, direitos e revisão obsoleta passaram em mobile/desktop; cenários adicionais de falha/retry ainda exigem revisão |
| G2 — persistência/segurança | Migrações e fixtures locais descartáveis passaram; isso não substitui a revisão completa de RLS/grants em staging |
| G3 — jornada real | Story persistida → mesmo produto → pré-checkout interno passou localmente nos dois viewports; staging HTTPS ainda não validado |
| G4 — prova externa | Pendente: checkout sandbox de propriedade do provedor e confirmação de round-trip/atribuição quando aplicável |
| G5 — evidências | Relatório sanitizado anexado; revisão independente/sign-off ainda pendente |

O checkout `checkout.example.test` é intencionalmente sintético e local. Não houve pagamento, pedido, venda, comissão ou atribuição real. Não tratar este teste como prova de integração externa.

**Decisão de cobertura:** V1 permanece **36,5/48 (76,0%)**, sem pontos adicionais. Classificação: **upgrade**. PR #307 continua Draft e não está pronta para integrar à main enquanto os gates de staging/provedor e a revisão final não forem concluídos.

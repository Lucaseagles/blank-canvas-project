# Sprint 362 — fechamento transversal da auditoria administrativa

**Status:** em execução — sprint de integração, ainda não elegível para pontuação.  
**Branch de integração:** `sprint/362-admin-audit-closure`  
**Base:** `main` após PR #361, merge `3188e3b5a11607f94c62a707ada2c9a8430b234f`.  
**Critério-alvo:** 11.3 — auditoria administrativa completa.  
**Score de referência do projeto:** 38.0/48 = 79.2%, conforme o addendum formal da Sprint 359. A distribuição das outras linhas permanece em reconciliação.  
**Pontuação desta sprint até o aceite final:** +0.

## Regra nova de integração por sprint

Esta sprint agrupa PRs independentes por finalidade. As PRs filhas apontam para esta branch de integração, não diretamente para `main`. Cada PR pode entregar upgrade, correção ou cobertura parcial, mas nenhuma dessas etapas altera o placar oficial.

A sprint só será promovida à `main` por uma PR final de release quando:
1. o inventário transversal estiver revisado;
2. todos os bypasses identificados estiverem corrigidos ou formalmente excluídos com justificativa;
3. as famílias de mutação sensível tiverem autorização Owner e negação dos demais perfis;
4. rollback, concorrência/idempotência e redação tiverem evidência PostgreSQL descartável;
5. o E2E autenticado e os workflows obrigatórios passarem no mesmo HEAD candidato;
6. o pacote de evidências for revisado contra o aceite do critério 11.3.

A matriz V1 só será atualizada no fechamento da sprint final, depois do merge da release e da revisão formal. PR filha, merge na branch de integração e melhoria isolada valem +0 até a decisão de cobertura da sprint.

## PRs já integradas em main e reaproveitadas como evidência

- #352 — transições administrativas de oportunidades.
- #354 — atualização em lote de oportunidades.
- #355 — cupons administrativos.
- #357 — galeria de produtos.
- #358 — Base de Conhecimento.
- #361 — execução manual de retenção, autorização Owner, lock transacional e auditoria atômica.

Essas famílias não devem ser reimplementadas. Permanecem sujeitas a revisão de abrangência, testes negativos e prova real. A existência de uma PR dedicada não prova que o inventário global esteja completo.

## Pacotes planejados da sprint

| Pacote | Tipo | Resultado exigido | Estado |
|---|---|---|---|
| A — Inventário de mutações | auditoria/upgrade | mapa rota/tela → server function → middleware → RPC/DML → tabela → GRANT/RLS → audit → testes | pendente |
| B — Detecção de bypass | cobertura | busca automatizada e revisão manual de escritas sensíveis fora dos caminhos protegidos | pendente |
| C — Matriz de papéis | cobertura | Owner permitido; anon, consumer, merchant, partner e authenticated non-Owner negados | pendente |
| D — Prova transacional | cobertura | rollback real, concorrência, idempotência e proteção contra estado obsoleto | pendente |
| E — Redação e evidência | cobertura | segredos ausentes do audit log; evidências sanitizadas e rastreáveis | pendente |
| F — E2E e release | fechamento | jornadas administrativas, três workflows verdes no HEAD de release e relatório final | pendente |

## Política de pontuação

- Não assumir que 11.3 vale +1.0 sem confirmar a pontuação atual dessa linha na reconciliação.
- Não prometer ganho parcial antes de confrontar os gates com a rubrica.
- Se a sprint concluir somente uma fração verificável, documentar o resultado, mas não alterar a matriz sem aceite explícito da rubrica.
- Não duplicar o +0.5 de 02.4 (Sprint 359) nem o +1.0 de 12.3.
- Upgrade visual, refatoração ou endurecimento sem aceite de critério: +0.
- A atualização de score será um único evento no fechamento da sprint/release, com evidências e commit final.

## Limites de segurança

- Não executar migrações nem mutações no Supabase remoto de produção.
- Usar somente Supabase/PostgreSQL descartável nos smokes.
- Preservar o Shadow Master único e privado.
- Não alterar autenticação global, RLS ou grants fora do escopo necessário e comprovado.
- Manter UX premium, responsividade, estados de erro/carregamento/vazio e isolamento dos quatro perfis.

## Próxima ação

Concluir o inventário real sobre a `main`, comparar as famílias já protegidas e selecionar apenas os gaps restantes para PRs filhas desta branch. A release final será aberta para `main) somente após todos os gates estarem verdes.

## Primeiros achados do inventário (27/11)

| Superfície | Evidência na main | Classificação atual | Próxima ação |
|---|---|---|---|
| Status de usuário banido | `setUserBanned` → `admin_set_profile_banned`; migration `20260909001332_bfe38b06-238c-4983-91b5-08671bc4b254.sql` atualiza `profiles` e insere `USER_BAN_STATUS_CHANGED` em `admin_audit_log` na mesma função SQL | Mutação auditada; ainda revisar bloqueio concorrente e matriz negativa no smoke | Não reimplementar; adicionar/confirmar prova de concorrência e não-Owner |
| Configurações administrativas | `updateAdminSetting` → `rubi_update_admin_setting_audited`; `createBanner`/delete → RPCs auditadas | Caminhos server protegidos por `requireOwnerRole`; RPCs específicas | Reutilizar testes/migrations; revisar cobertura de todas as fontes do registry |
| Execução manual de tendências | `recalculateTrendingManual` → `refresh_demand_and_trend_scores`; registra apenas `automation_logs` via `log_automation_activity`, sem evento explícito em `admin_audit_log` no handler | **Gap candidato confirmado no código da main** | Localizar/recuperar a definição SQL real antes de criar wrapper transacional; a busca do repositório encontrou a chamada no handler e o tipo gerado, mas não uma migration que defina a função |
| Lançamento manual de vídeos agendados | `processVideoLaunches` → `rubi_process_due_video_launch_audited` por vídeo; migration `20261118010100_rubi_video_launch_atomic_audit.sql` | Mutação por vídeo já auditada atomicamente | Confirmar no smoke o comportamento de lote e manter sem duplicar a auditoria de cada vídeo |
| Integridade do log administrativo | `getRubiMasterAuditIntegrityAdmin` percorre registros e declara explicitamente que não garante cobertura de todas as mutações | Leitura/diagnóstico, não prova de inventário | Usar como verificação complementar, nunca como certificado global |

**Limite:** o achado de tendências ainda não é uma implementação pronta. A função SQL subjacente não aparece na árvore versionada consultada; não vou inventar sua lógica nem fazer uma migration que dependa de um objeto ausente no banco descartável. O pacote A continua aberto até o inventário de todas as server functions e migrations ser concluído.

## Progresso das PRs filhas

| PR | Escopo | Destino | Estado | Pontos V1 |
|---|---|---|---|---:|
| #362 | User-ban: Owner verificado também sob `service_role`, lock da linha, rollback atômico e retry idempotente | `sprint/362-admin-audit-closure` | Integrada à branch de sprint em `67e5f03a3d245022bcd2f5970f236a162e2eebc5` | +0 |

A PR #362 foi integrada somente à branch da Sprint 362, não à `main`. Seus testes de contrato e smoke foram conectados aos workflows que serão executados no candidato final da sprint. A validação completa ainda está pendente; não declarar a mutação fechada antes dos workflows e da revisão transversal.


## Revisão transversal adicional — 27/11

### Mapa de server functions revisadas

| Arquivo/superfície | Caminho de escrita observado | Classificação | Evidência / decisão |
|---|---|---|---|
| `admin-users.functions.ts` | `setUserBanned` → `admin_set_profile_banned` | RPC auditada | Reutiliza #362; a #363 acrescenta teste concorrente de duas requisições com mesmo estado desejado. |
| `admin-settings.functions.ts` | `rubi_update_admin_setting_audited`, `rubi_create_banner_audited`, `rubi_delete_banner_audited` | RPCs auditadas | Sem DML direto nos handlers revisados. |
| `admin-publishing.functions.ts` | criação/decisão de publicação e fila de orquestração via RPCs `*_audited` | RPCs auditadas | O lançamento de vídeo também usa `rubi_process_due_video_launch_audited`; manter prova SQL por vídeo e evitar log duplicado de mutação. |
| `admin-product-operations.functions.ts` | atualização inline e status em lote via RPCs `*_audited` | RPCs auditadas | Verificar os respectivos testes e grants no fechamento; não reimplementar. |
| `admin-modules.functions.ts` | habilitar/reordenar módulos e badges via RPCs `*_audited` | RPCs auditadas | Sem DML direto nos handlers revisados. |
| `admin_intel.functions.ts` | categorias e grupos de ofertas via RPCs `*_audited` | RPCs auditadas | Sem DML direto nos handlers revisados. |
| `commercial-admin.functions.ts` | decisão de perfil comercial via `rubi_decide_commercial_profile_audited` | RPC auditada | Reutilizar a migração comercial existente. |
| `partner-agreements-admin.functions.ts` | contrato/comissão via `rubi_set_partner_agreement_audited` | RPC auditada | Reutilizar a migração e teste de contrato existentes. |
| `admin-audit.functions.ts` | execução do diagnóstico registra `ADMIN_AUDIT_RUN` no histórico | Escrita de trilha de diagnóstico | Não altera entidade de negócio; falha de persistência interrompe resposta de sucesso. Não confundir com prova de cobertura de todas as mutações. |
| `automation.functions.ts` — tendências | `refresh_demand_and_trend_scores` e depois `log_automation_activity` | **Gap candidato permanece aberto** | O código executa a atualização e grava `automation_logs` em chamada separada. A definição SQL não foi localizada em migrations versionadas; nenhuma wrapper/migration será criada até recuperar e testar a implementação real. |
| `automation.functions.ts` — retenção | `rubi_run_automation_action_audited` | RPC auditada | Migração #361 faz Owner check, lock transacional, execução e evento em `admin_audit_log` na mesma transação. |

### Evidência nova da PR #363

A PR #363 adiciona um smoke PostgreSQL descartável com duas transações simultâneas que solicitam a mesma transição de bloqueio. O aceite exige exatamente um evento de auditoria e estado final bloqueado. O workflow autenticado está em execução no HEAD `5e86f761289143465e9a61c50691bd5ea1fc4ed8`; não marcar a evidência como aprovada antes da conclusão verde do job.

### Limites desta revisão

- Este mapa é uma revisão dirigida dos handlers administrativos listados, não um certificado de inventário exaustivo.
- Leitura protegida por `requireOwnerRole` não substitui teste de GRANT/RLS no PostgreSQL.
- Uma RPC com sufixo `_audited` só é considerada comprovada quando migration, autorização, transação, rollback e smoke correspondente forem verificados.
- A definição SQL real do recálculo de tendências foi recuperada por inspeção read-only; o wrapper atômico, os grants e o smoke local ainda precisam ser versionados e aprovados. A reconciliação de schema também identificou drift entre o banco conectado (entity_id UUID) e a migration-base versionada (entity_id text); o CI local deve seguir a migration versionada até haver plano formal de reconciliação do ambiente remoto.
- A PR #363 e esta documentação são filhas da Sprint 362: pontuação permanece +0 até release final, validação integral e aceite do critério.


## Recuperação da definição real do recálculo de tendências — 27/11

A investigação read-only do projeto Supabase conectado `heartful-helper-box` (`akfvkjarpgocdsieuvvq`) confirmou que `public.refresh_demand_and_trend_scores()` existe no banco ativo, embora sua definição não esteja presente na árvore de migrations versionadas consultada.

### Definição observada no banco

- Assinatura: `public.refresh_demand_and_trend_scores()`, retorno `void`.
- Segurança: `SECURITY DEFINER`, `search_path = public`.
- Comportamento: percorre os IDs de `public.products` e atualiza `demand_score` e `trend_velocity` usando `public.calculate_product_demand(id)` e `public.calculate_product_trend_velocity(id)`.
- A função atual não grava `admin_audit_log` e não recebe ator.
- `public.log_automation_activity(uuid,jsonb,text,text)` grava apenas em `automation_logs`; também é `SECURITY DEFINER`.

### Decisão técnica

O bloqueio de descoberta foi resolvido, mas o gate de auditoria continua aberto. A próxima implementação candidata é uma RPC Owner-only, com ator explícito, lock/controle de execução, chamada da função existente, registro em `automation_logs` e `admin_audit_log` na mesma transação. Se qualquer gravação de auditoria falhar, o recálculo inteiro deve sofrer rollback.

A inspeção foi estritamente de leitura. Nenhum dado, função, migration, grant ou configuração do Supabase remoto foi alterado.

### Verificação pendente

- Recuperar/representar a função existente de modo reprodutível em migrations versionadas, sem substituir sua lógica por uma aproximação.
- Validar grants efetivos e a identidade Owner dentro da RPC.
- Smoke PostgreSQL descartável: negar não-Owner, provar atomicidade com falha forçada de auditoria e provar serialização de duas execuções concorrentes.
- Só então remover a chamada direta mais o log separado do handler e migrar para a RPC atômica.


## Revalidação da PR #366 — 27/11

O workflow E2E no HEAD `9f1e9b92b0b354d8fe0d3dba08a5ebb96c6fbacb` falhou novamente no smoke de bloqueio, agora com erro de tipo: `operator does not exist: text = uuid`. A inspeção da migration-base `20260901000000_sprint32_admin_audit.sql` confirmou que a coluna `admin_audit_log.entity_id` é `text` nos ambientes reconstruídos a partir do repositório. A consulta read-only no Supabase conectado mostrou UUID, caracterizando drift entre ambiente remoto e baseline versionado.

### Decisão corretiva
- Não alterar migration histórica para acomodar silenciosamente o drift remoto.
- Manter a RPC e o smoke compatíveis com a árvore de migrations: `p_user_id::text` e `v_user::text`.
- Adicionar teste de contrato que fixa esse tipo no CI.
- Tratar a divergência do projeto conectado em trilha de reconciliação de schema, sem executar DDL remoto nesta sprint.

A PR #367 contém o teste de contrato para o schema versionado. A PR #366, que tentou a direção UUID, é obsoleta e não deve ser integrada.

### Estado de validação
- Hub QA no HEAD anterior `9f1e9b9`: sucesso.
- E2E no mesmo HEAD: falhou apenas no smoke de bloqueio por comparação text/UUID.
- Novo E2E e Hub QA no HEAD da PR #367: em execução; não marcar como aprovados antes da conclusão.

### Pontuação
Nenhuma alteração: 38.0/48 (79,2%) permanece a referência formal. A PR #367 é evidência de contrato e vale +0 isoladamente. O critério 11.3 continua sem aceite integral.


## Sprint 362 — pacote de recálculo manual de tendências preparado (PR #368)

A PR #368 implementa o fechamento do gap do recálculo manual de tendências, mantendo a lógica de pontuação delegada às funções `calculate_product_demand` e `calculate_product_trend_velocity` existentes.

### Arquitetura da entrega
- Reproduz o entrypoint `refresh_demand_and_trend_scores()` observado no banco conectado: percorre produtos e atualiza os dois scores chamando as funções de cálculo existentes. As fórmulas dos helpers não são redefinidas.
- O handler `recalculateTrendingManual` passa a chamar exclusivamente `rubi_recalculate_trending_audited(p_actor)`.
- A RPC verifica Owner dentro do banco mesmo sob `service_role`, serializa chamadas por advisory transaction lock e bloqueia a linha da regra.
- Atualização dos produtos, `automation_logs` e `admin_audit_log` são transacionais.
- Falha na atualização ou na auditoria de sucesso reverte o sub-bloco; registra tentativa malsucedida em ambos os logs. O erro armazenado usa somente SQLSTATE, sem persistir SQLERRM bruto que poderia conter valores sensíveis.
- Execução pública, anon e authenticated é revogada; apenas service_role recebe EXECUTE.

### Evidência planejada no CI
- Smoke de autorização/grants, sucesso e atribuição do ator.
- Trigger de falha forçada no evento de sucesso para provar rollback das alterações em produtos e ausência de log de sucesso adicional.
- Duas chamadas simultâneas para provar serialização e dois eventos auditados independentes.
- Teste de contrato do handler e da migration.
- E2E local e Hub QA executados no mesmo HEAD; Sprint 33 QA deve também ser confirmado no candidato final.

### Estado
PR #368 aberta e workflows E2E/Hub QA em execução no HEAD `9d30ef670d39e33acf1b4aac91bfee06a2f36c7a`. Não marcar como aprovada até execução dos novos smokes e conclusão verde. Nenhum SQL foi aplicado ao Supabase remoto.

### Pontuação
+0 nesta etapa. É candidata de cobertura para o gap de tendências no critério 11.3, mas a pontuação depende da aprovação integral da Sprint 362 e do aceite formal da rubrica.


## Atualização de integração e compatibilidade de schema — 27/11

### PR #367 — contrato de user-ban
- PR #367 integrada à branch Sprint 362 após E2E autenticado e Hub QA aprovados no mesmo HEAD da PR.
- PR #366 encerrada como obsoleta; sua tentativa de forçar UUID no smoke local foi rejeitada pela migration-base text.
- A PR #369 amplia a migration de user-ban para detectar o tipo de `admin_audit_log.entity_id` em runtime e suportar tanto `text` quanto `uuid`, sem DDL remoto. Smoke compara o identificador por `entity_id::text`.

### PR #368 — recálculo manual de tendências
- RPC Owner-only, lock advisory, log de automação e trilha Master na mesma transação.
- Entry point de refresh versionado com o loop observado no banco ativo, sem redefinir as fórmulas dos helpers de scoring.
- Entry point interno passa a SECURITY INVOKER, search_path vazio e EXECUTE exclusivo de `service_role`.
- Auditoria suporta ambos os tipos observados de `entity_id` via leitura do catálogo; nenhum schema é alterado.
- Falha no refresh/auditoria de sucesso reverte as atualizações; erro persistido registra apenas SQLSTATE, não SQLERRM bruto.
- Smokes incluídos no E2E: Owner/non-Owner, grants, sucesso, rollback com falha forçada e concorrência.

### Validação corrente
- PR #367: E2E autenticado e Hub QA aprovados.
- PR #368: novos workflows E2E e Hub QA executando no HEAD `fa0d2380057d84c6280a9d881e1b43382a1e25bf`; ainda não aprovados.
- PR #369: workflows E2E e Hub QA executando no HEAD `7967dd4d7575199656ea837956803056e76a8896`; ainda não aprovados.
- Nenhuma migration foi aplicada ao Supabase remoto.

### Placar e critério 11.3
A matriz V1 revisada confirma 11.3 = 0.5/1.0. O baseline formal permanece 38.0/48 = 79.2%. O fechamento integral de 11.3 pode adicionar +0.5, levando a 38.5/48 = 80.2%, mas somente depois de todos os gates e aceite final. Até lá, +0 nesta sprint.

### Próxima ordem
1. Fechar os workflows das PRs #368 e #369; corrigir qualquer falha real antes de integrar.
2. Integrar PRs filhas validadas à branch da Sprint 362.
3. Concluir inventário exaustivo de mutações e bypasses, não apenas os handlers já listados.
4. Provar matriz Owner/non-Owner nos caminhos administrativos sensíveis.
5. Completar rollback, concorrência/idempotência e redação em cada família aplicável.
6. Executar E2E, Hub QA e Sprint 33 QA no mesmo HEAD de release.
7. Só então abrir release para main e revisar o ponto 11.3 na matriz.


## Evidências incrementais confirmadas — 27/11

### PR #368 — checks parciais aprovados
No HEAD `fa0d2380057d84c6280a9d881e1b43382a1e25bf`:
- Hub V1 Integration QA: sucesso (TypeScript e ESLint também passaram).
- E2E autenticado: os smokes de tendências e bloqueio de usuários passaram no PostgreSQL descartável.
- Passaram explicitamente: Owner/non-Owner e grants do trending RPC; execução bem-sucedida e ator atribuído; falha forçada da auditoria com rollback dos scores; concorrência de duas execuções com dois eventos; smoke de bloqueio de usuário; concorrência/idempotência do user-ban.
- E2E ainda estava na etapa Playwright de jornadas autenticadas desktop/mobile; portanto, o workflow completo ainda não está aprovado.

### PR #369 — compatibilidade do user-ban
- Hub QA: TypeScript aprovado; ESLint em execução na última leitura.
- E2E: instalação de dependências em andamento.
- Não promover até os dois workflows terminarem no mesmo HEAD.

### Status de pontuação
Mesmo com os smokes locais aprovados, a sprint segue em +0 até concluir o E2E, integrar as PRs validadas, terminar o inventário transversal e executar a validação final conjunta.


## PR #368 integrada à Sprint 362 — 27/11

A PR #368 foi integrada por squash à branch de integração da Sprint 362 no commit `f6264ea9dd79ebd8afb77539d189efd504d18276`, após:
- Hub V1 QA: SUCCESS no HEAD `937d4a80c51f80309d0fdd03d8a5189b1f1cf34c`.
- E2E autenticado: SUCCESS no mesmo HEAD.
- Smokes SQL de tendências e user-ban executados no PostgreSQL descartável; matriz negativa incluiu consumer, merchant e partner.
- TypeScript e ESLint aprovados.

A integração foi somente na branch `sprint/362-admin-audit-closure`; não houve merge para `main`.

PR #369 permanece aberta e aguarda o E2E completo da compatibilidade text/UUID do user-ban, além de sua revalidação no HEAD combinado com #368.

**Pontuação:** +0 ainda. A PR #368 fecha uma família específica de mutação; não substitui inventário exaustivo nem os gates restantes de 11.3.


## PR #369 integrada à Sprint 362 — 27/11

A PR #369 foi integrada por squash à branch de integração no commit `8af999e2c6712d3e943b306e1dbac97e40114991`, após:
- Hub V1 Integration QA: SUCCESS no HEAD validado.
- E2E autenticado: SUCCESS, incluindo smoke de user-ban.
- Owner autorizado; consumer, merchant e partner negados sob `service_role`.
- `anon` e `authenticated` sem EXECUTE nas RPCs sensíveis.
- Compatibilidade de `entity_id` com `text` e `uuid` por introspecção do catálogo.
- `search_path = ''` na RPC SECURITY DEFINER.

A PR #369, assim como a #368, foi integrada somente à branch `sprint/362-admin-audit-closure`; `main` permanece intocada.

### Próxima validação obrigatória
As PRs #368 e #369 passaram separadamente em seus HEADs. Antes da release, executar E2E e Hub QA no mesmo HEAD combinado da branch; depois, abrir PR final para `main` e exigir Hub V1, Sprint 33 QA e E2E verdes no mesmo candidato.

**Pontuação:** +0 por enquanto. As duas famílias administrativas estão cobertas, mas os gates 1–7 de 11.3 ainda exigem inventário transversal e fechamento dos writers remanescentes.


## Continuação — PRs #370 e #371 (27/11)

### PR #370 — Telegram send outbox
A PR #370 foi integrada por squash à branch da Sprint 362 no commit `2c90720655222f1c9f788fb5426c9d357cb86946`.
- Corrigiu o fixture do smoke para usar o catálogo legado `products` exigido por `telegram_messages`, sem misturar IDs de `hub_products`.
- Manteve os gates de autorização, rollback, idempotência e finalização da outbox.
- Hub V1 QA e E2E autenticado foram aprovados no candidato da PR.
- Integração somente na branch de sprint; não promoveu pontuação.

### PR #371 — hardening de DML direto em social_channels
A PR #371 foi integrada por squash à branch da Sprint 362 no commit `d0867525f7f40007fadd220665a210228a8c1001`.
- Removeu a policy Owner `FOR ALL`, preservando SELECT Owner-only.
- Revogou INSERT/UPDATE/DELETE direto de `public`, `anon` e `authenticated`; manteve escrita pela RPC auditada sob `service_role`.
- Adicionou teste de contrato, smoke PostgreSQL e execução nos workflows Hub V1 e E2E.
- Hub V1 Integration QA: SUCCESS, 104 etapas concluídas, incluindo TypeScript, ESLint e o novo teste de hardening.
- E2E autenticado: SUCCESS, 54 etapas concluídas; smoke social-channel DML, negação dos três perfis, rollback, lifecycle e redação de URL aprovados; jornadas autenticadas mobile/desktop também aprovadas.
- A migration permanece versionada na branch da sprint; não foi aplicada ao Supabase remoto.

### Reconciliação do estado atual
- Branch de integração atual: `d0867525f7f40007fadd220665a210228a8c1001`.
- PRs #370 e #371 integradas à branch de sprint, não à release/main.
- Os checks da #371 passaram no HEAD da PR; o candidato final ainda precisa executar Hub V1, E2E e Sprint 33 QA no mesmo HEAD após o inventário global.
- O placar oficial permanece **38.0/48 = 79.2%**; esta continuação soma **+0** até o aceite formal do critério 11.3.


## PR #372 integrada — varredura DML da camada de aplicação

A PR #372 foi integrada por squash à branch da Sprint 362 no commit `e411ef09b0924a3ce4ef58b04343c2471186980e`.

Documento: `docs/coverage/sprint-362-source-dml-sweep-2026-11-27.md`.

### Resultado da varredura
- Busca estática de `.insert()`, `.update()`, `.delete()` e `.upsert()` em `src/lib`, `src/routes/admin` e `src/components`, seguida de revisão manual dos resultados.
- Não foram encontrados writers diretos nas rotas administrativas consultadas.
- Os principais writers encontrados foram classificados entre RPCs auditadas (#370/#371 e superfícies anteriores), trigger auditado (status de produto), mutações do próprio usuário, eventos analíticos e logs.
- Nenhum novo bypass administrativo foi confirmado nesta varredura.

### Limite explícito
A PR #372 não fecha o inventário 11.3. Ainda falta a reconciliação de todas as funções SQL/RPC, tabelas, triggers, GRANT/RLS, ator e smokes. A varredura estática não é prova de ausência de DML dinâmico nem substitui revisão de migrations.

**Pontuação:** +0. Habilitador do gate 1, sem aumento de score.

### Estado de integração
- PR #370: integrada à branch.
- PR #371: integrada à branch, Hub V1 e E2E verdes no HEAD da PR.
- PR #372: integrada à branch, evidência documental.
- Branch de integração após #372: `e411ef09b0924a3ce4ef58b04343c2471186980e`.
- A release final continua bloqueada até completar a matriz SQL/RPC, os gates de papéis/rollback/concorrência/redação e a validação conjunta Hub V1 + Sprint 33 QA + E2E no mesmo HEAD.


## PR #373 integrada — hardening do Opportunity Engine

A PR #373 foi integrada por squash à branch da Sprint 362 no commit `08a0bfb34930471f8b75e0c963a8d9254c39847f`.

### Lacunas fechadas na implementação
- Removida a policy Owner `FOR ALL` de `opportunity_alerts`; Owner permanece com SELECT via RLS.
- Revogados privilégios de DML direto de `PUBLIC`, `anon` e `authenticated`; escrita preservada para `service_role`.
- RPC `get_opportunity_alerts(text)` (SECURITY DEFINER) restrita ao `service_role`; o server function aplica `requireOwnerRole`.
- Escritas continuam exclusivamente pelos server functions e RPCs atômicas auditadas de status/refresh; RPCs legadas já revogadas por migrations anteriores.
- Nenhuma migration foi aplicada ao Supabase remoto.

### Evidências no HEAD da PR #373
- Hub V1 Integration QA: SUCCESS, 105 etapas concluídas; TypeScript e ESLint aprovados; teste novo de hardening aprovado.
- E2E autenticado dos quatro perfis: SUCCESS, 54 etapas concluídas; smoke de status do Opportunity Engine passou com grants, DML direto negado, Owner read, non-Owner sem leitura, rollback e evento auditado; smoke de refresh passou.
- A PR foi integrada à branch de sprint após os dois workflows ficarem verdes.

### Pontuação e estado
- Score permanece **38.0/48 = 79.2%**; PR #373 soma **+0 isoladamente** até o fechamento completo do critério 11.3.
- Branch de integração após PR #373: `08a0bfb34930471f8b75e0c963a8d9254c39847f`.
- PRs filhas #370, #371, #372 e #373 estão integradas à branch da sprint, não à `main`.
- Ainda pendem a reconciliação integral de mutações SQL/RPC, validação global de concorrência/redação/autorização e o trio de workflows no mesmo HEAD final (Hub V1, E2E autenticado, Sprint 33 QA) antes da promoção única à `main`.

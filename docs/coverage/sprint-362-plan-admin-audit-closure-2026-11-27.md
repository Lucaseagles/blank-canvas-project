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

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

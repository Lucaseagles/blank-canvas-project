# RUBI Eagles 11× — Sprint 226: inventário e encerramento dos upgrades

**Data:** 2026-11-17  
**Base verificada:** `main` em `d851af67f766da923ffacd0aa65996fe6a80ee23`.  
**Matriz técnica V1:** 48 critérios, 12 módulos, 0 / 0,5 / 1 por critério.  
**Última pontuação formal documentada:** 36,5/48 = 76,0% (Sprint 207, reafirmada na Sprint 217).  
**Classificação desta sprint:** UPGRADE — inventário e diagnóstico; sem alteração de código ou pontuação.

## 1. Objetivo e regra de encerramento

Esta sprint inaugura um inventário finito dos upgrades necessários nos módulos já contabilizados. Não existe uma porcentagem de upgrades concluídos até que o conjunto de itens necessários seja enumerado. Portanto, não estimar esse percentual antes da classificação.

Um item só pode ser marcado como concluído quando houver: problema reproduzível ou risco concreto; correção integrada; testes específicos; os dois workflows obrigatórios verdes no SHA final; e evidência registrada. Melhorias opcionais sem risco ou critério associado ficam fora do escopo.

## 2. As oito frentes de upgrade

| ID | Frente | Prioridade inicial | Critério de encerramento |
|---|---|---|---|
| U1 | Integridade administrativa e trilha atômica | P0 | Mutação crítica e respectivo evento de auditoria na mesma transação; rollback testado; ator validado |
| U2 | Segurança, permissões e isolamento | P0 | Testes positivos/negativos por perfil e conta; grants/RLS/RPC revisados; revogação efetiva |
| U3 | Consistência, concorrência e idempotência | P0 | Duplicidade, concorrência, revisão otimista e rollback testados nos fluxos críticos |
| U4 | Financeiro, atribuição e reconciliação | P0 | Eventos separados por etapa; totais reconciliáveis; comissões, estornos e pagamentos rastreáveis |
| U5 | Ciclo de vida dos módulos | P1 | Fluxos completos de criar → revisar → publicar → pausar/revogar → refletir no consumidor |
| U6 | UX, estados e responsividade | P1 | Loading, erro, vazio, sucesso e jornadas prioritárias aprovados em desktop/mobile |
| U7 | Testes, observabilidade e CI | P1 | TSC, ESLint, build, regressões, E2E aplicável e dois workflows verdes no SHA final |
| U8 | Integrações e contratos externos | P1 / dependência externa | Contrato oficial, credencial autorizada, retentativa e reconciliação comprovados; sem simular integração |

## 3. Evidências já localizadas

### U1 — Integridade administrativa

A árvore da `main` contém uma série de RPCs e testes de auditoria atômica, incluindo Stories, movimentos, campanhas, variantes, distribuição, produtos, fornecedores/atacado, banners, configurações, módulos da home, categorias, grupos de ofertas, importações CSV, notificações, times, CRM, publicações, vídeos e estratégia social.

Referências representativas:
- `supabase/migrations/20261115170000_rubi_category_atomic_audit.sql` + `src/lib/rubi-category-atomic-audit.test.mjs`
- `supabase/migrations/20261115163000_rubi_offer_group_atomic_audit.sql` + `src/lib/rubi-offer-group-atomic-audit.test.mjs`
- `supabase/migrations/20261115200000_rubi_affiliate_csv_draft_atomic_audit.sql` + `src/lib/rubi-affiliate-csv-atomic-audit.test.mjs`
- `supabase/migrations/20261116200000_rubi_video_atomic_audit.sql` + `src/lib/rubi-video-atomic-audit.test.mjs`
- `src/lib/rubi-master-audit-integrity.functions.ts` e `src/admin/audit/RubiMasterAuditIntegrityPanel.tsx`

**Lacuna concreta encontrada na main:** `src/lib/marketplace.functions.ts` faz create/update/delete de `marketplaces` e insere `admin_audit_log` separadamente, sem verificar o erro do insert. Assim, uma alteração pode persistir sem seu registro de auditoria. A exclusão também verifica produtos vinculados antes da operação em uma chamada separada, sujeita a corrida.

**Outra lacuna concreta:** `src/lib/connectors.functions.ts` atualiza `marketplaces.api_config` diretamente ao salvar credenciais. A operação não grava auditoria atômica. A sincronização também altera `api_status` por DML direto em caminhos sem configuração ou sem conector implementado. Não registrar valores de credenciais em logs; auditar somente metadados seguros, como ação, ID e nomes dos campos.

**Outra lacuna concreta:** `src/lib/admin-metrics.functions.ts` salva a métrica do Telegram e depois tenta inserir auditoria separadamente. A falha do log é apenas avisada no console; a métrica permanece sem trilha.

**Ressalva:** `src/lib/admin-settings.functions.ts` e `20261113123000_rubi_admin_setting_atomic_audit.sql` já contemplam `marketplaces.status` e `api_status` no fluxo de configurações. Isso não cobre automaticamente CRUD, `api_config` nem as rotas independentes de sincronização.

### U2 — Segurança e isolamento

Os padrões de RPC encontrados usam `SECURITY INVOKER`, validação de Owner, `search_path=''`, revogação de EXECUTE de `public/anon/authenticated` e concessão a `service_role`. Isso é evidência de implementação, não prova de isolamento operacional de todos os perfis. Permanecem necessários testes negativos por consumidor, lojista, parceiro e Shadow Master.

### U3 — Consistência e concorrência

Há implementações com locks, revisão otimista, idempotência e rollback em módulos específicos. O inventário ainda não comprova que todos os caminhos de escrita do ecossistema usem esses padrões.

### U4 — Financeiro e atribuição

A documentação da matriz V1 mantém dependências externas em compra atribuída, pagamento, estorno e LTV. A paginação financeira possui proteção contra truncamento silencioso em `src/lib/financial-pagination.server.ts`, mas isso não substitui reconciliação de pedidos reais com o provedor.

### U5–U8 — Fluxos, UX, qualidade e integrações

A auditoria administrativa histórica registra pendências de E2E, responsividade, RLS, sincronização externa e jornadas completas em Products, Categories, Offers, Coupons, Videos, Video Bridge, Marketplaces, Collections e Banners. A sequência precisa ser revalidada contra o código atual antes de abrir tarefas, para não reimplementar itens já resolvidos.

## 4. Sequência de execução aprovada para o backlog

1. **U1 / Marketplaces:** consolidar CRUD, credenciais e status em mutações auditadas atômicas; preservar segredo fora do log; proteger exclusão contra corrida com produtos vinculados.
2. **U1 / Métricas Telegram:** decidir se a coleta é evento operacional que exige auditoria transacional; se sim, gravar métrica e auditoria na mesma transação. Não coletar métricas fictícias.
3. **U1 / Varredura global:** buscar todos os caminhos restantes de DML administrativo e comparar com RPCs/testes já existentes. Não reabrir rotas já protegidas.
4. **U2 + U3:** testes negativos por perfil, concorrência, rollback e idempotência nos caminhos críticos.
5. **U4:** reconciliação financeira e atribuição externa, condicionada a contratos e eventos reais.
6. **U5–U8:** ciclo de vida, UX, observabilidade, E2E e integrações, priorizando dependências que bloqueiam liberação real.

## 5. Como medir o encerramento

A partir desta sprint, cada item do inventário terá status `PENDENTE`, `EM EXECUÇÃO`, `VALIDAÇÃO`, `CONCLUÍDO` ou `BLOQUEADO EXTERNAMENTE`. O denominador de upgrades necessários será congelado após a varredura global inicial. Só então será calculado o percentual de upgrades encerrados.

**Não alterar a pontuação V1 nesta sprint.** A última base formal continua 36,5/48 = 76,0%, sujeita à reconciliação pós-Sprints 218–225. Upgrade de implementação não é ponto de cobertura por si só.

## 6. Gatilhos de integração

- Não integrar correção de banco sem migração revisada, testes de contrato e verificação de permissões.
- Não aplicar migração em produção antes de validar no ambiente apropriado e confirmar o projeto correto `heartful-helper-box` (`akfvkjarpgocdsieuvvq`).
- Exigir ambos workflows: `Hub V1 integration QA` e `Sprint 33 QA`.
- Se qualquer workflow falhar, inspecionar logs, corrigir e executar ambos novamente no SHA final.
- Nunca afirmar E2E, venda, comissão, pagamento ou integração externa sem evidência real.

## 7. Resultado da Sprint 226

**Resultado:** inventário inicial documentado; duas áreas de U1 com lacunas diretas de implementação identificadas (marketplace CRUD/credenciais/status e coleta de métricas Telegram); pontuação V1 inalterada; percentual de upgrades ainda não calculado até a varredura completa.

**Próxima entrega de código recomendada:** U1 — mutações auditadas de Marketplaces, começando por CRUD e incluindo as rotas de credenciais/status para não deixar um caminho alternativo desprotegido.

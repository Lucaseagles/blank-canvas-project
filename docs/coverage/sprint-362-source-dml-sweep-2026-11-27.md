# Sprint 362 — varredura de DML na camada de aplicação

**Data:** 27/11/2026  
**Branch:** `sprint/362-child-source-dml-inventory`  
**Classificação:** habilitador de cobertura 11.3; **+0 ponto isoladamente**.

## Escopo da varredura

Foi feita uma busca estática por chamadas diretas `.insert(`, `.update(`, `.delete(` e `.upsert(` em `src/lib`, `src/routes/admin` e `src/components`, seguida de leitura manual dos handlers encontrados.

Resultado observado:
- Nenhuma chamada direta de DML foi encontrada nas rotas administrativas em `src/routes/admin`.
- Nenhuma chamada direta de DML foi encontrada em `src/components/admin`.
- Os componentes com DML encontrados são fluxos de usuário: conversa de suporte vinculada ao usuário autenticado e ocultação de itens do histórico pessoal.
- A busca não é prova de ausência global: não substitui AST, revisão de migrations, RPCs SQL, triggers, grants/RLS ou busca por nomes de tabela dinâmicos.

## Candidatos revisados e classificação

| Superfície | Caminho de escrita observado | Classificação | Evidência / decisão |
|---|---|---|---|
| Telegram manual/teste | `sendTelegramManual` → `rubi_prepare_telegram_send_audited` e `rubi_finalize_telegram_send_audited` | RPC auditada | PR #370; outbox com idempotência e smoke PostgreSQL no E2E |
| Telegram config/Vault | `saveTelegramConfig` → `rubi_save_telegram_config_audited` | RPC auditada | Migration e smoke de rollback, Owner, Vault, grants e redação |
| Social channels | `social_channels` → `rubi_manage_social_channel_audited` | RPC auditada + DML direto revogado | PR #371; smoke PostgreSQL de grants, papéis, rollback e ciclo completo |
| Social proof config | `updateSocialProofConfig` → `rubi_update_admin_setting_audited` | RPC auditada | Ator `context.userId`; não há update direto de configuração |
| Social proof opt-out | `user_preferences` update filtrado por `context.userId` | Mutação de preferência do próprio usuário | Não é mutação administrativa |
| Status de produto | `setSellerProductStatus` usa cliente autenticado Owner e compare-and-set | Trigger auditado na mesma transação | Teste `seller-center-product-status-audit`; evitar inserir segundo evento manual |
| Cotações B2B | Owner atualiza status via `rubi_update_business_quote_admin_audited`; follow-up via `rubi_complete_business_followup_admin_audited` | RPCs auditadas | Inserção e revogação de follow-up do lojista são operações próprias do comerciante, limitadas ao perfil |
| Conteúdo de parceiros | Parceiro aprovado cria submissão; Owner revisa via `rubi_review_partner_creator_submission` | Escrita do parceiro + decisão Owner auditada | Não classificar a submissão do parceiro como bypass administrativo |
| Experimentos A/B | Atribuição de variante é criada pelo cliente autenticado para o próprio usuário | Mutação operacional de experimento, não configuração administrativa | Leitura do resultado Master é read-only |
| Referral | Criação de referral/evento vinculada ao usuário autenticado | Mutação de jornada do usuário | Estatísticas Master são read-only |
| Personalização | Eventos e interesses gravados para o usuário validado | Mutação de perfil comportamental | Não é configuração administrativa |
| Compliance | Inserção em `compliance_audit_log` ao detectar violação de link | Log de evento de validação | Não altera configuração ou estado administrativo; manter minimização de dados |
| Admin Audit | Inserção de `ADMIN_AUDIT_RUN` após executar diagnóstico | Log da execução do checklist | Não prova, por si só, cobertura de cada mutação de negócio |
| Suporte | Conversa criada/atualizada pelo componente com `user_id` autenticado | Mutação de conversa do próprio usuário | Não é tela administrativa |

## Achados e limites

1. A varredura não encontrou um novo bypass direto de DML em rota administrativa nos caminhos estáticos consultados.
2. Isso não fecha o gate 1: falta reconciliar a lista de mutações SQL/RPC com cada migration, tabela, trigger, GRANT/RLS, ator e teste.
3. Os handlers com `supabaseAdmin` não são automaticamente bypasses; é necessário distinguir mutação Master, mutação do próprio usuário, evento analítico, log de diagnóstico e decisão via RPC auditada.
4. O status de produto é uma exceção legítima de DML direto: cliente autenticado Owner + compare-and-set + trigger de auditoria transacional. A prova depende do teste e da migration do trigger.
5. Os caminhos de criação de submissão, referral, personalização, suporte e preferências devem permanecer limitados ao proprietário do registro; sua inclusão nesta varredura não os transforma em mutações administrativas.

## Próxima ação para fechar o inventário

- Construir a matriz SQL/RPC → tabela(s) → GRANT/RLS → verificação de ator → trigger/audit → smoke.
- Conferir todas as funções SECURITY DEFINER/INVOKER e os grants efetivos no PostgreSQL descartável.
- Para cada família Master, exigir Owner permitido e anon/consumer/merchant/partner/non-Owner negados.
- Marcar rollback, concorrência/idempotência e redação individualmente; não inferir cobertura de uma família a partir de outra.
- Repetir a busca após cada PR filha e reconciliar os resultados com a lista de mutações da branch de integração.

**Conclusão:** a varredura estática reduziu o conjunto de candidatos e não revelou um novo bypass de DML em rota administrativa. É evidência parcial do inventário, não certificado de exaustividade e não altera a matriz V1.

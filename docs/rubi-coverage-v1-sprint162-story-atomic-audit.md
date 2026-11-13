# RUBI Eagles 11× — Sprint 162: decisão e auditoria atômicas

## Plano híbrido: duas vias em uma entrega

**[UPGRADE]** Aprovar ou revogar um Story no Shadow Master deve persistir também o histórico administrativo. A escrita e o log pertencem à **mesma transação**. Se o registro no log falhar, a mudança de status não pode ficar registrada isoladamente.

**[COBERTURA]** Contribuição real para `11.3 — auditoria administrativa`. Esta sprint cobre uma decisão comercial sensível (aprovação/revogação de Story), mas **não encerra 11.3** enquanto não houver cobertura das demais mutações críticas, confirmação da migração, permissão e testes integrados.

## Código e testes
- Migração `supabase/migrations/20261113055000_rubi_story_atomic_audit.sql`: RPC invoker-only, execução exclusivamente por service role, valida o papel Owner, trava Story e movimento na transação, verifica versão e inclui registro sanitizado de antes/depois na tabela `admin_audit_log`.
- `src/lib/rubi-product-stories.functions.ts`: mantém revisão de fornecedor, checkout e mídia; após middleware Owner, chama RPC com ator vindo do contexto autenticado (nunca do cliente).
- `src/lib/rubi-story-atomic-audit.test.mjs`: verifica invariantes de privacidade, controle de acesso, inserção do log e ausência de dois writes independentes.

## Aceite e bloqueios
1. Ambos workflows CI verdes no commit head antes de merge.
2. Aplicar migração ao Supabase correto e conferir privilégios RPC de `anon`, `authenticated` e `service_role`.
3. Testar aprovação e revogação reais com Story próprio e licenciado. Validar falha de versão e rollback deliberado em transação de teste sem dados fictícios de produção.
4. Extender trilha transacional ao ciclo de vida de movimentos e outras mutações críticas antes de propor 11.3 de 0,5 para 1.

## Métrica
- Base técnica auditada: **34/48 = 70,8%**.
- Meta próxima: **36/48 = 75%**.
- Esta sprint por si só **não pontua**. Não confundir controle de auditoria de código com resultado comercial efetivo.

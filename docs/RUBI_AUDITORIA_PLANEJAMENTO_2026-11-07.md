# RUBI — Matriz de aderência ao planejamento (auditoria inicial #52)

Data: 2026-11-07. Escopo: inspeção estática de arquivos na branch main após PR #51. **Não é certificação de produção**, nem percentual de funcionalidades ativas. A especificação `docs/RUBI_E_RAGLES_MULTIPERFIL.md` registra o escopo original da fundação multicomercial; seu parágrafo "Estado real" descreve a **etapa inicial**, não o estado atual após os sprints.

## Critério
- **Código identificado**: rota e/ou função presente; requer teste de autenticação, RLS, dados e comportamento.
- **Parcial / bloqueado**: existe interface ou lógica, mas parte do fluxo depende de fornecedor, checkout ou confirmação operacional.
- **Não verificado**: ainda não houve inspeção suficiente para afirmar presença, ausência ou conclusão.

| Pilar | Evidência de código identificada | Estado desta auditoria | Próxima validação |
| --- | --- | --- | --- |
| Story / descoberta | `src/routes/history.tsx`; fluxos de vídeo e feed previstos na especificação | Não verificado integralmente | Auditar publicação, reprodução, segmentação e eventos |
| Business / atacado | `src/routes/wholesale.tsx`; `src/lib/hub-catalog.functions.ts` | Código identificado; operação parcial até testar pedidos/cotações | Login lojista aprovado, preços por faixa, cotação e fechamento |
| Partners | `src/routes/partner/portal.tsx`, `src/routes/partner/statement.tsx`, funções de concessão, indicação, visitas, vendas e pagamentos | Código identificado; atribuição externa e checkout não confirmados | Testar autorização, revogação, conciliação, estorno e pagamento parcial |
| Achadinhos | `src/routes/admin/collections.tsx` inclui tipo `achadinhos` | Código identificado no admin; publicação ao consumidor não verificada | Rastrear coleção publicada, feed e links externos |
| Store / varejo | `src/routes/hub-shop.tsx`, `src/routes/r/$code.tsx` | Catálogo e indicação identificados; **checkout do fornecedor explicitamente pendente na interface** | Validar caminho compra -> pedido -> confirmação real |
| Intelligence | `src/routes/admin/engagement-intelligence.tsx`, `src/routes/admin/notification-intelligence.tsx` | Código identificado; qualidade dos dados e segmentação não verificadas | Auditar métricas, origem dos dados e ranking por público |
| APP / identidade e perfis | `src/routes/onboarding.tsx`; TanStack Start; Supabase Auth | Código identificado; E2E mobile e RLS não verificados | Jornada consumidor/lojista/parceiro e acesso Shadow Master |

## Bloqueadores e riscos conhecidos
1. **Checkout Kairos**: `src/routes/r/$code.tsx` diz que a compra depende de integração do checkout; `src/routes/hub-shop.tsx` informa que compra e logística dependem de integração do fornecedor. Não inventar API, pedido confirmado ou receita.
2. **Conciliação financeira**: `src/lib/partner-sales-summary.functions.ts` consulta no máximo 200 links e 1.000 vendas; `src/lib/partner-commission-status.functions.ts` consulta até 500 links, 10.000 vendas e 10.000 itens. Limites distintos podem gerar divergência de indicadores para contas maiores. Auditar paginação e volume antes de declarar totais exatos.
3. **Identidade**: a especificação original usa Hub Eagles; páginas atuais alternam RUBI e Hub Eagles. Conferir marca configurável do owner antes de substituir textos indiscriminadamente.
4. **Segurança**: não concluir RLS, papéis e isolamento apenas com CI. Exigir testes negativos para usuário não aprovado e tentativas de acesso ao Shadow Master.
5. **Percentuais**: ainda não há denominador confiável de requisitos aceitos nem E2E de produção. Não atribuir porcentagens de conclusão ou ativação.

## Sequência de conclusão
1. Confirmar matriz requisito -> rota -> função -> tabela -> permissão -> teste; classificar cada requisito como entregue, parcial, ausente ou bloqueado.
2. Corrigir divergências verificadas (prioridade: resumos financeiros e dados de comissões).
3. Testar perfis e segurança (consumidor, lojista, parceiro, Shadow Master) e o ciclo de revogação.
4. Verificar requisitos e documentação oficiais do fornecedor para checkout; implementar somente com integração real disponível.
5. Executar TypeScript, lint, build, testes de integração, E2E desktop/mobile e testes de produção antes de declarar ativo.

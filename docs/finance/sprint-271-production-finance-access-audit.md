# Sprint 271 — auditoria de acesso do financeiro em produção

Data da verificação: 2026-11-18. Projeto Supabase: `heartful-helper-box` (`akfvkjarpgocdsieuvvq`). Escopo somente leitura.

## 1. Resultado executivo

- O domínio `rubi_finance_*` não está implantado em produção: consulta a `pg_proc` não encontrou funções `rubi_finance_%`, e a auditoria anterior confirmou ausência das tabelas.
- As três tabelas legadas consultadas (`hub_partner_confirmed_sales`, `hub_partner_commission_payouts`, `hub_partner_commission_payout_items`) têm RLS habilitado.
- As três tabelas legadas têm zero políticas RLS explícitas no catálogo consultado.
- Isso não representa exposição pública neste estado: `anon` e `authenticated` não possuem SELECT, INSERT, UPDATE ou DELETE nessas três tabelas. `service_role` e `postgres` possuem os privilégios esperados para os caminhos privilegiados.
- Portanto, a ausência de políticas não deve ser descrita isoladamente como vazamento. O bloqueio efetivo observado é a combinação de RLS habilitado e ausência de privilégios diretos para os papéis públicos/autenticados.

## 2. Evidência de RLS

| Tabela | RLS | FORCE RLS | Políticas explícitas |
|---|---:|---:|---:|
| `hub_partner_confirmed_sales` | habilitado | não | 0 |
| `hub_partner_commission_payouts` | habilitado | não | 0 |
| `hub_partner_commission_payout_items` | habilitado | não | 0 |

## 3. Evidência de privilégios efetivos

Consulta de `has_table_privilege` para papéis `anon`, `authenticated`, `service_role` e `postgres`:

| Tabela | Papel | SELECT | INSERT | UPDATE | DELETE |
|---|---|---:|---:|---:|---:|
| `hub_partner_confirmed_sales` | anon | não | não | não | não |
| `hub_partner_confirmed_sales` | authenticated | não | não | não | não |
| `hub_partner_confirmed_sales` | service_role | sim | sim | sim | sim |
| `hub_partner_confirmed_sales` | postgres | sim | sim | sim | sim |
| `hub_partner_commission_payouts` | anon | não | não | não | não |
| `hub_partner_commission_payouts` | authenticated | não | não | não | não |
| `hub_partner_commission_payouts` | service_role | sim | sim | sim | sim |
| `hub_partner_commission_payouts` | postgres | sim | sim | sim | sim |
| `hub_partner_commission_payout_items` | anon | não | não | não | não |
| `hub_partner_commission_payout_items` | authenticated | não | não | não | não |
| `hub_partner_commission_payout_items` | service_role | sim | sim | sim | sim |
| `hub_partner_commission_payout_items` | postgres | sim | sim | sim | sim |

## 4. Caminho de aplicação verificado no código

- `src/lib/rubi-finance-operations-admin.functions.ts` usa `createServerFn` e `requireOwnerRole` para as ações de alocação e reversão.
- As chamadas RPC usam o cliente `supabaseAdmin` apenas dentro do handler de servidor e passam `context.userId` como ator.
- O teste `src/lib/rubi-finance-operations-sprint253.test.mjs` cobre a proteção Owner no servidor e a restrição de execução das RPCs ao `service_role`.
- Não foi encontrado código de leitura do domínio `rubi_finance_*` em produção, o que é coerente com a ausência das tabelas e RPCs no banco.

## 5. Riscos e ações necessárias antes da ativação

1. Não conceder SELECT direto de tabelas financeiras a `authenticated` apenas para fazer o painel funcionar. Criar projeções/RPCs específicas com escopo e autorização.
2. Para parceiros, implementar uma camada de leitura limitada ao próprio `commercial_profile_id`, referral links e vendas elegíveis; nunca expor ledger global.
3. Para Shadow Master, preservar `requireOwnerRole` no servidor e a autorização Owner no banco. Não confiar somente em ocultação de rotas ou UI.
4. Revalidar políticas, grants, função `has_role`, proprietários, `search_path` e `EXECUTE` após aplicar migrations em ambiente de teste e novamente após deploy autorizado.
5. As tabelas legadas continuam sub-ledger especializado; não duplicar seu histórico no ledger canônico sem um adapter idempotente e referência de origem.

## 6. Limites da conclusão

- A consulta de privilégios cobriu somente as três tabelas nomeadas acima; não é uma auditoria integral de todos os objetos, views, funções ou Storage do projeto.
- `service_role` e `postgres` são papéis privilegiados; a segurança do caminho de servidor também depende da proteção de chaves, middleware e validação de identidade.
- Nenhuma alteração de schema, grant, policy, dado ou migration foi executada.

## 7. Scorecard

- Classificação: upgrade-only — auditoria de acesso e preparação da integração financeira.
- Cobertura V1: baseline preservado em 36,5/48 (76,0%).
- Upgrades globais: percentual não calculado sem inventário e denominador completos.
- Produção Supabase: somente leitura.
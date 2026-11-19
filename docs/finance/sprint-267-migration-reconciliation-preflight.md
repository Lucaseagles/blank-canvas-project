# Sprint 267 — preflight de reconciliação das migrations pós-Sprint 234

Status: inventário e revisão estática; nenhuma migration executada e nenhuma escrita no Supabase de produção.

## Resultado executivo

O projeto Supabase heartful-helper-box (akfvkjarpgocdsieuvvq) foi consultado em modo somente leitura. O histórico observado contém 219 migrations e termina em 20261118001747 (rubi_profile_privilege_hardening_sprint234).

A revisão do repositório encontrou sete migrations posteriores que precisam ser reconciliadas como uma única cadeia antes de qualquer deploy. A ordem abaixo é a ordem de versão/dependência encontrada nos arquivos, não a numeração dos sprints:

| Versão | Arquivo | Dependência/efeito principal |
|---|---|---|
| 20261118010100 | rubi_video_launch_atomic_audit | RPC de lançamento de vídeo, fila Telegram e auditoria atômica |
| 20261118020100 | rubi_editorial_session_journey_uuid_fix | Corrige regex UUID da agregação de jornada editorial |
| 20261118020200 | rubi_scheduled_post_worker_atomic_audit | RPCs service-role para claim/finish de publicação agendada |
| 20261118030000 | rubi_partner_payout_atomic_audit | RPC de liquidação com ator Owner e auditoria |
| 20261118040000 | rubi_partner_partial_payouts | Substitui liquidação total por alocações parciais; remove unique sale_id |
| 20261118050000 | rubi_financial_domain_core_sprint252 | Cria domínio financeiro multi-provedor, eventos, obrigações, lançamentos e conciliação |
| 20261118060000 | rubi_finance_atomic_operations_sprint253 | Adiciona alocações/reversões compensatórias e RPCs atômicas |

Os nomes físicos completos e seus checksums ainda devem ser extraídos no ambiente de release para produzir um manifesto imutável. Este documento não declara equivalência de conteúdo com objetos existentes apenas pelo nome.

## Revisão estática de dependências e riscos

### 1. Vídeo e fila de publicação
- Sprint 243 depende de videos, campaign_channels, scheduled_posts e admin_audit_log.
- O RPC bloqueia execução por papéis comuns e exige ator com papel Owner.
- A transação grava estado/auditoria e, quando aplicável, uma fila Telegram.
- A inserção na fila não prova entrega externa no Telegram.

### 2. Jornada editorial
- Sprint 240 substitui rubi_editorial_session_journey(integer).
- Corrige o padrão UUID canônico e mantém agregação por sessão/etapas.
- A função é SECURITY DEFINER, revoga execução de PUBLIC/anon/authenticated e concede apenas a service_role.
- O resultado é métrica de jornada; checkout intent não é venda confirmada.

### 3. Worker de publicações
- Sprint 246 cria RPCs de claim/finish, ambas SECURITY INVOKER, search_path vazio e grants restritos a service_role.
- Requer colunas e estados existentes em scheduled_posts, além de admin_audit_log.
- A entrega externa continua fora da transação do banco; retries podem exigir reconciliação de estado com o provedor.

### 4. Liquidação de comissões
- Sprint 247 cria versão Owner-auditada da RPC de liquidação, removendo o overload antigo de cinco argumentos.
- Sprint 250 depende da RPC e da tabela de itens de payout, remove a restrição única antiga por venda e substitui a assinatura por alocações JSON.
- A ordem 247 antes de 250 é obrigatória para a sequência esperada de overloads.
- O RPC de 250 bloqueia duplicidade de sale_id dentro da alocação e limita cada parcela ao saldo de comissão restante sob lock de linhas.
- O histórico de vendas de parceiro continua especializado; isso não transforma a operação em integração automática de pagamento externo.

### 5. Domínio financeiro
Sprint 252 cria nove tabelas:
- rubi_finance_providers
- rubi_finance_accounts
- rubi_finance_import_batches
- rubi_finance_documents
- rubi_finance_events
- rubi_finance_obligations
- rubi_finance_entries
- rubi_finance_allocations
- rubi_finance_reconciliation_matches

Controles identificados:
- RLS habilitado em cada tabela.
- Leitura autenticada com política Owner; sem grants de leitura/escrita para anon.
- Escritas reservadas a service_role, mediadas pelas funções de servidor.
- Índices únicos de deduplicação por provedor + ID externo ou hash.
- Lançamentos e alocações protegidos contra UPDATE/DELETE, com correções via movimentos compensatórios.

Sprint 253:
- Acrescenta tipo e referência de reversão às alocações.
- Trava lançamento e obrigação em ordem consistente, confere moeda/direção e limita ambos os saldos.
- Cria reversão contábil interna, não estorno no provedor.
- Exige service role e ator Owner, com auditoria transacional.

## Bloqueios que permanecem
1. Histórico de produção não reconciliado: não foi comprovado se os sete arquivos estão integralmente ausentes, parcialmente aplicados ou representados por objetos equivalentes com nomes diferentes.
2. Baseline descartável: não há evidência nesta execução de que a cadeia completa foi aplicada com sucesso num banco descartável iniciado a partir de baseline compatível com as 219 migrations reais.
3. Manifesto de conteúdo: falta inventário de checksums, versões, renames históricos e colisões de prefixo para todos os arquivos pendentes.
4. Advisors e autorização negativa: ainda precisam ser executados no ambiente de validação depois de aplicar a cadeia; também são necessários testes anon, authenticated não-Owner, Owner e service_role.
5. Backup e autorização: deploy em produção exige backup/restore validado e autorização explícita do responsável.

## Decisão de release
- Não executar db push, migration repair, SQL manual, renomeação em massa ou replay histórico na produção.
- Não aplicar apenas Sprint 252/253: elas dependem da cadeia anterior, especialmente das mudanças de payout.
- Não habilitar cart/order antes de resolver o histórico e testar o conjunto.
- O próximo artefato de release deve ser um manifesto com nome, versão, SHA-256, dependências, status em produção e status no banco descartável por migration.

## Evidência e limites desta sprint
- Leitura do histórico Supabase: 219 versões, última 20261118001747.
- Leitura do catálogo de tabelas e funções: nenhum objeto de carrinho/pedido/checkout/financeiro universal identificado na produção consultada.
- Revisão estática dos sete arquivos de migration e testes associados de payout/finance.
- Não houve execução SQL de escrita, migration, advisor pós-mudança ou teste em banco descartável.

## Classificação e scorecard
- Sprint 267: upgrade de governança de release e redução de risco operacional.
- Cobertura V1: permanece 36,5/48 = 76,0%; nenhum critério novo foi funcionalmente concluído nesta sprint.
- Upgrades globais: percentual não publicado até reconciliar o denominador completo.
- Produção: somente leitura; sem alteração de schema ou dados.
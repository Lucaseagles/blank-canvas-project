# Sprint 281 — manifesto de reconciliação do release de migrations

Status: inventário versionado; produção consultada somente em leitura. Este manifesto **não autoriza deploy**.

## Regra de interpretação

A comparação de prefixos entre arquivos e `supabase_migrations.schema_migrations` é apenas um primeiro filtro. Um prefixo ausente não prova que o DDL não foi aplicado sob outra versão; um nome semelhante não prova equivalência. Cada decisão de release exige comparação do conteúdo, proveniência Git, objetos/assinaturas no schema real e ensaio da cadeia em banco descartável.

Os identificadores abaixo são **Git blob SHA-1** retornados pelo GitHub para os arquivos atuais (não são SHA-256 de release). O SHA-256 do conteúdo deve ser calculado e registrado no ambiente de release antes de qualquer implantação.

## Manifesto dos arquivos recentes

| Versão | Arquivo | Git blob SHA-1 | Commit de origem | Evidência em produção | Decisão |
|---|---|---|---|---|---|
| 20261118010100 | `rubi_video_launch_atomic_audit.sql` | `9112cde0f23e9533d8474c0f5e0d078ee74efa8b` | `cb6f075d01f2678cb26cdaf6108917e0f6981b2e` | Sem versão idêntica; efeitos ainda precisam de inspeção específica | Inconclusiva |
| 20261118020100 | `rubi_editorial_session_journey_uuid_fix.sql` | `55424355ac076f6000698b51f44fe428ef06cec2` | `cb6f075d01f2678cb26cdaf6108917e0f6981b2e` | Sem versão idêntica; assinatura/definição precisa de comparação completa | Inconclusiva |
| 20261118020200 | `rubi_scheduled_post_worker_atomic_audit.sql` | `9889eb959a671934cdb388f0607b8bae506abea8` | `cb6f075d01f2678cb26cdaf6108917e0f6981b2e` | Sem versão idêntica; RPCs e grants precisam de comparação completa | Inconclusiva |
| 20261118030000 | `rubi_partner_payout_atomic_audit.sql` | `b2507e2edf8b17b72147b9a451b165f3a0d270cf` | `93bd26463a1e8a79ac156f76145bd60ef2946833` | Produção expõe assinatura legada de liquidação; assinatura auditada nova não foi comprovada | Bloqueada |
| 20261118040000 | `rubi_partner_partial_payouts.sql` | `dd8638420715077f669399a7ca1a342b61198f87` | `fcf46c5074e838910c6db522c16f81e7e620093d` | RPC JSONB de alocações não coincide com a assinatura legada observada | Bloqueada |
| 20261118050000 | `rubi_financial_domain_core_sprint252.sql` | `c6ea039aa22b23cbaaf374c1a47747af2861c49c` | `f79c30deb268abc694d5b338183166797b934646` | Tabelas `rubi_finance_*` não foram encontradas no schema consultado | Bloqueada |
| 20261118060000 | `rubi_finance_atomic_operations_sprint253.sql` | `600e721561cd3f39491590da195edf450b8cc469` | `3fee1f3b97c1ac2eb5fa699ab6f0956705d32ebf` | Depende do domínio Sprint 252, ausente no schema consultado | Bloqueada |
| 20261118070000 | `rubi_finance_source_idempotency_sprint273.sql` | `14047ffe201a74e4b86ac0dfdab24a549327866b` | `0173129599a6037b914270e5b07dda26f17b9179` | Índices dependem das tabelas Sprint 252, não encontradas | Bloqueada |
| 20261119000100 | `rubi_partner_public_storefront.sql` | `726be6dd94eb84ece7ba4065bc8fd7159beee94d` | `98d9c2bb4b9644615f273f16cb9025502c667d51` | Coluna `commercial_profiles.public_store_code` não foi encontrada | Bloqueada |

## Dependências e ordem mínima conhecida

1. `20261118010100`, `20261118020100` e `20261118020200` dependem de objetos editoriais/vídeo, publicação agendada e auditoria que devem ser comparados ao baseline real antes do ensaio.
2. `20261118030000` precede `20261118040000`: a segunda substitui a interface legada de liquidação por alocações parciais e assinatura JSONB.
3. `20261118050000` cria o domínio financeiro canônico; `20261118060000` acrescenta operações atômicas sobre esse domínio; `20261118070000` acrescenta idempotência sobre obrigações e lançamentos.
4. `20261119000100` adiciona identificador público opaco à tabela `commercial_profiles`; não deve ser liberada antes de validar a tabela, dados existentes, unicidade e trigger.

A ordenação por versão é necessária, mas não substitui o teste de dependências e compatibilidade.

## Gates obrigatórios antes de release

- [ ] Calcular SHA-256 de cada arquivo no checkout de release e congelar o manifesto.
- [ ] Mapear renames e commits introdutores no histórico Git; nunca inferir aplicação só por rename.
- [ ] Comparar tabelas, colunas, constraints, índices, triggers, funções, overloads, grants e RLS no projeto alvo.
- [ ] Reproduzir o baseline em banco descartável e aplicar a cadeia candidata integralmente.
- [ ] Executar regressões de payout total/parcial, duplicidade, overpayment, rollback, ledger e vitrine.
- [ ] Testar anon, authenticated não-Owner, Owner e service_role.
- [ ] Conferir advisors, backup/restore e plano de rollback.
- [ ] Obter autorização explícita do responsável antes de qualquer escrita em produção.

## Resultado desta sprint

Este manifesto melhora a rastreabilidade do release, mas não resolve a divergência histórica nem prova que a cadeia é implantável. Não executar `db push`, `migration repair`, SQL manual ou replay em produção com base apenas neste documento.

Classificação: upgrade-only de governança de release. Cobertura V1 permanece 36,5/48 (76,0%); nenhum critério funcional foi concluído aqui.

# Sprint 269 — reconciliação por versão entre GitHub e Supabase

Status: comparação somente leitura; nenhuma migration, repair ou alteração de produção executada.

## Escopo e método

Comparados os prefixos de 14 dígitos dos 217 arquivos SQL versionados em `supabase/migrations` na branch `main` com os 219 registros de `supabase_migrations.schema_migrations` do projeto `heartful-helper-box` (`akfvkjarpgocdsieuvvq`).

A comparação é estritamente por igualdade do identificador de versão. Ela NÃO prova equivalência semântica de migrations com nomes/timestamps diferentes e não autoriza classificar automaticamente um arquivo como pendente ou aplicado.

## Resultado quantitativo

| Indicador | Resultado |
|---|---:|
| Arquivos SQL versionados no GitHub | 217 |
| Prefixos únicos no GitHub | 209 |
| Grupos duplicados no GitHub | 8 |
| Registros no histórico Supabase | 219 |
| Versões idênticas presentes nos dois lados | 30 |
| Versões Supabase sem arquivo com prefixo idêntico | 189 |
| Versões GitHub sem registro Supabase com prefixo idêntico | 179 |

Os conjuntos não são uma cadeia sincronizada por igualdade de prefixo. O número de 179 não deve ser chamado de migrations pendentes; o número de 189 não deve ser chamado de migrations perdidas. Há evidência histórica de timestamps e nomes divergentes.

## Último trecho e release recente

O histórico de produção termina em `20261118001747` (219 registros no total). O repositório contém, depois desse prefixo, estes sete arquivos:

- `20261118010100_rubi_video_launch_atomic_audit.sql`
- `20261118020100_rubi_editorial_session_journey_uuid_fix.sql`
- `20261118020200_rubi_scheduled_post_worker_atomic_audit.sql`
- `20261118030000_rubi_partner_payout_atomic_audit.sql`
- `20261118040000_rubi_partner_partial_payouts.sql`
- `20261118050000_rubi_financial_domain_core_sprint252.sql`
- `20261118060000_rubi_finance_atomic_operations_sprint253.sql`

Esses sete prefixos não aparecem no histórico Supabase consultado. Ainda assim, não se deve aplicar automaticamente: é necessário provar que nenhum conteúdo equivalente já foi executado sob outra versão, nem que dependências foram aplicadas por outro caminho.

## Evidências e implicações

1. Os oito grupos duplicados de prefixo permanecem exatamente os que estão allowlisted pelo teste `rubi-migration-version-uniqueness` (PR #269).
2. Apenas 30 versões são idênticas entre os dois conjuntos. A igualdade por prefixo cobre uma parcela pequena do histórico.
3. A diferença é consistente com renames, versões históricas geradas em momentos distintos, migrations removidas/ausentes ou alterações de organização; esta consulta não discrimina qual hipótese vale para cada registro.
4. O relatório antigo que tratava apenas sete migrations pós-Sprint 234 como o conjunto inteiro de divergências era incompleto. A comparação integral demonstra que a reconciliação histórica é muito maior.

## Próxima ação segura

Construir um manifesto de reconciliação por migration com: versão Git, caminho, SHA-256 do conteúdo, commit introdutor, histórico de rename/cópia no Git, versão Supabase candidata, evidência de objeto/DDL correspondente, dependências e decisão revisada (aplicada, equivalente com versão diferente, realmente pendente, obsoleta ou inconclusiva).

Não usar `migration repair`, renomear arquivos ou executar `db push` até a revisão de cada correspondência e um ensaio completo em banco descartável.

## Scorecard

- Classificação: upgrade-only de governança e integridade de release.
- Cobertura V1: baseline mantido em 36,5/48 (76,0%); nenhum critério funcional concluído.
- Upgrades globais: percentual não publicado sem inventário e denominador completos.
- Produção: consultas somente leitura.
## Evidência nova — renomeações rastreadas no Git (commit cb6f075)

A inspeção do endpoint de histórico de commits do GitHub identificou cinco arquivos como renomeados, com additions: 0 e deletions: 0. Isso comprova renomeação sem mudança de conteúdo no diff do GitHub:

| Caminho anterior | Caminho atual | Situação no histórico remoto consultado |
|---|---|---|
| 20261118001500_rubi_partner_grants_server_only.sql | 20261117235530_rubi_partner_grants_server_only.sql | Prefixo atual coincide com a migration aplicada antes do Sprint 234 |
| 20261118010000_rubi_profile_privilege_hardening.sql | 20261118001747_rubi_profile_privilege_hardening_sprint234.sql | Prefixo atual coincide com o último registro de produção |
| 20261118010000_rubi_video_launch_atomic_audit.sql | 20261118010100_rubi_video_launch_atomic_audit.sql | Renomeada; prefixo atual posterior ao último registro de produção |
| 20261118020000_rubi_editorial_session_journey_uuid_fix.sql | 20261118020100_rubi_editorial_session_journey_uuid_fix.sql | Renomeada; prefixo atual posterior ao último registro de produção |
| 20261118020000_rubi_scheduled_post_worker_atomic_audit.sql | 20261118020200_rubi_scheduled_post_worker_atomic_audit.sql | Renomeada; prefixo atual posterior ao último registro de produção |

O commit cb6f075d01f2678cb26cdaf6108917e0f6981b2e também atualizou referências de testes para os novos caminhos e registrou o teste de sequência recente. As duas primeiras renomeações alinham os nomes aos identificadores já presentes no Supabase. As três últimas não estão no histórico de produção consultado: renomeação de arquivo não significa aplicação da migration.

## Proveniência Git das quatro migrations financeiras

O histórico por caminho do GitHub aponta os commits associados aos arquivos abaixo:

| Migration | Commit associado ao arquivo |
|---|---|
| Sprint 247 — payout audit | 93bd26463a1e8a79ac156f76145bd60ef2946833 |
| Sprint 250 — partial payouts | fcf46c5074e838910c6db522c16f81e7e620093d |
| Sprint 252 — financial core | f79c30deb268abc694d5b338183166797b934646 |
| Sprint 253 — atomic finance operations | 3fee1f3b97c1ac2eb5fa699ab6f0956705d32ebf |

Esses registros ajudam a rastrear a origem no Git, mas não comprovam aplicação no banco. A consulta remota de produção continuou mostrando apenas 20261118001747 no trecho de versões 20261118000000 em diante.

## Correção de interpretação

A comparação por prefixos continua válida como diagnóstico quantitativo, mas agora cinco divergências têm causa de rename comprovada. Duas delas explicam o alinhamento de versões aplicadas (Sprint 233/234); três são apenas renames de migrations posteriores e continuam sem registro de aplicação no Supabase.

Portanto:
- Não classificar rename como aplicação.
- Não classificar versão sem igualdade de prefixo como pendente sem analisar Git history e DDL.
- Manter as quatro migrations financeiras em estado inconclusivo para produção até comparar o conteúdo/efeitos com o schema real e reproduzir a cadeia em banco descartável.
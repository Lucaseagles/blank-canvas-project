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
# Sprint 363 — conversão de pontuação 08.3

**Data:** 27/11/2026  
**Release:** PR #390, squash merge  
**Merge commit:** `8b56f5c6e76eb20b3ceb5cd6eb65408adcd90ec3`

## Resultado

- Score carregado após Sprint 362: 38.5/48 (80.2%).
- Critério 08.3: 0.5 → 1.0, ganho +0.5.
- Novo agregado: **39.0/48 = 81.25% (81.3%)**.
- Gap agregado: 9.0/48 = 18.75% (18.8%).

## Evidência

- PR #391 ligada ao contrato A/B existente via script npm e step explícito no Hub V1 QA.
- Hub V1 QA, Sprint 33 QA e E2E autenticado de quatro perfis em mobile/desktop concluíram SUCCESS no HEAD final `f7b9c5a464d7eaf0a11743929735de597d0aba25` da branch de integração.
- O E2E reportou jornadas persistidas, smokes PostgreSQL e evidência sanitizada; Supabase descartável encerrado.
- Inspeção read-only do Supabase remoto confirmou tabela do experimento, RLS ativa, grants restritos e RPC SECURITY INVOKER.
- PR #390 integrada à `main` por squash merge em `8b56f5c6e76eb20b3ceb5cd6eb65408adcd90ec3`.

## Limites

Esta conversão cobre o contrato técnico de experimento A/B da rubrica V1, não prova lift, significância estatística, vendas, tráfego orgânico real nem pagamento.

08.2 e 08.4 permanecem parciais. Nenhuma pesquisa ou evento comercial foi fabricado.

O agregado de 39.0/48 está reconciliado com a conversão de 08.3, mas a distribuição histórica completa das 48 linhas ainda requer uma auditoria linha a linha contra todas as PRs pós-Sprint 207. Não atribuir outros deltas sem evidência autoritativa.

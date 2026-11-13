# RUBI Eagles 11× — Sprint 159 (híbrida): Stories versionados por movimento

**Base técnica v1:** 33/48 = 68,8% após Sprint 158.

## [UPGRADE]
- Master associa cada Story a um movimento comercial do mesmo produto com público consumidor, estado de revisão e revisão numérica.
- A aprovação de mídia exige checkout oficial já verificado, autorização declarada e revisão do movimento.
- A exibição pública só inclui Stories cuja revisão aprovada coincide com a revisão atual do movimento. Ao editar o Story, volta a rascunho e perde a revisão aprovada.
- Conteúdo legado sem vínculo não recebe exibição automática neste fluxo (fail closed).
- Testes de regressão verificam o bloqueio de versão obsoleta, movimento de outro produto, rascunho e público incorreto.

## [COBERTURA] 02.3 — candidato a 0,5 → 1,0
O critério da matriz é **movimentos Story versionados**. A entrega implementa o vínculo e protege a exibição contra alteração posterior de movimento. Após validação dos dois workflows de CI, revisão do código no main e reauditoria, o alvo técnico v1 é **33,5/48 = 69,8%**.

A implementação não constitui E2E em domínio publicado, não valida licença de mídia independente nem equivale a faturamento. O critério 02.4 Story E2E permanece 0. Não gerar dados fictícios para satisfazer E2E.

## Gates
1. Ambos workflows TypeScript/lint/build/testes aprovados no head e merge.
2. Migração `20261113040000_rubi_story_movement_revision.sql` aplicada no Supabase correto, com conferência de RLS.
3. QA de aprovação, revogação, troca de versão, erros e exibição pública, sem criar Story público sem direitos.
4. Registrar o meio ponto somente após aceite incremental.

**Meta seguinte:** 34/48 = 70,8%, faltando mais 0,5 ponto após 02.3.

# Sprint 363 — Movement Engine: validação de público e ângulo (critério 08.2)

**Base:** `main` após Sprint 362, score agregado formal de referência **38.5/48 = 80.2%**.  
**Branch:** `sprint/363-movement-audience-angle-coverage`  
**Classificação inicial:** habilitador + cobertura candidata. **+0 ponto nesta PR.**

## Objetivo de fechamento

Transformar o cadastro de movimentos por produto em um processo verificável de validação de público, situação, problema, resultado e ângulo — sem confundir preenchimento editorial com validação real de mercado.

O critério-alvo é **08.2 — Público/ângulo validado**. O valor atual desta linha não será presumido: a reconciliação histórica de 48 linhas não distribuiu de forma autoritativa todos os deltas pós-Sprint 122. O único número confirmado neste início é o agregado 38.5/48. A linha 08.2 será pontuada somente após reconciliar a rubrica e comprovar todos os gates.

## Estado conhecido na main

Já existem e devem ser reaproveitados:
- `rubi_movements` e CRUD server-side Owner-only;
- campos de público, persona, problema, resultado desejado, promessa verdadeira, diferenciação, narrativa e notas de evidência;
- checklist editorial e bloqueio de textos repetidos;
- revisão otimista e RPC auditada;
- variantes criativas e páginas ligadas ao movimento;
- testes de contrato para rascunho e envio à revisão.

Limites conhecidos:
- o checklist atual verifica completude editorial, não prova pesquisa/validação de público;
- notas de evidência em texto livre não equivalem a uma fonte verificável;
- aprovação do Master não prova resposta de mercado;
- métricas observacionais não demonstram causalidade nem intenção de compra paga;
- não existe autorização para inventar pesquisa, feedback, dados ou resultados.

## Sequência de PRs da Sprint 363

| Ordem | PR planejada | Escopo | Gate de aceite | Pontuação isolada |
|---:|---|---|---|---:|
| 1 | #384 — baseline e contrato de cobertura | Este plano, estado real da main, definição de evidências e critérios de não-invenção | Revisão do escopo e inventário dos componentes existentes | +0 |
| 2 | #385 — contrato estruturado de evidência | Definir evidência rastreável por público/ângulo, origem, data, responsável, escopo e limitações; compatibilidade com registros existentes | Validação server-side, dados inválidos rejeitados e nenhuma fonte fictícia | +0 |
| 3 | #386 — fluxo de validação e revisão | UX Master para avaliar hipótese, fonte, amostra/feedback quando houver, ressalvas e decisão versionada; isolamento dos demais perfis | Owner-only, revisão concorrente, histórico auditável e regressões mobile/desktop | +0 |
| 4 | #387 — prova integral e release da sprint | Testes de domínio, contratos, PostgreSQL descartável, RLS/grants, rollback, E2E e reconciliação da rubrica | Todos os gates no mesmo HEAD; inventário de evidências; score formal atualizado | Única PR elegível para conversão |

Os números são identificadores planejados, não PRs já criadas. Se o GitHub atribuir outros números, o fechamento registrará os números reais. A PR final poderá ser renumerada automaticamente; a ordem de dependência prevalece.

## Definição de cobertura completa proposta para revisão

O critério 08.2 só poderá ser considerado completo se a implementação e a evidência demonstrarem, no mínimo:

1. Cada movimento está ligado a um produto real do catálogo e a um segmento permitido.
2. Público-alvo, situação de uso, problema, resultado desejado e ângulo são campos distintos, coerentes e revisáveis.
3. Cada afirmação factual relevante aponta para uma fonte identificável e compatível com o produto; ausência de fonte bloqueia alegação não comprovada.
4. Hipótese editorial é rotulada como hipótese; não aparece como comportamento de consumidor já validado.
5. Quando houver pesquisa/feedback, registra-se origem, período, método, amostra e limitações; sem isso, o sistema não exibe selo de validação de mercado.
6. Aprovação do Master registra ator, versão, data e decisão; alterações posteriores invalidam a aprovação anterior.
7. Não há promessas garantidas, prova social fabricada, inferência sensível ou alegação incompatível com o fornecedor.
8. Consumer, merchant e partner não acessam nem alteram o espaço privado do Shadow Master.
9. Testes positivos e negativos, concorrência/stale revision, auditoria, persistência e jornada mobile/desktop passam no mesmo HEAD final.

**Distinção obrigatória:** validação editorial/factual e validação de mercado são estados diferentes. Se a rubrica 08.2 exigir evidência de mercado real, a ausência de participantes/dados reais impede o fechamento completo, mesmo que o código esteja pronto. Não converter ponto com fixtures.

## Gates da release final

- TypeScript, lint, build e testes de contrato.
- Testes de domínio para consistência de público/ângulo e fontes.
- PostgreSQL descartável: Owner autorizado, non-Owner negado, grants mínimos, RLS, rollback de auditoria e revisão concorrente.
- E2E autenticado de Shadow Master e negação dos outros perfis, mobile e desktop.
- Revisão manual de claims e direitos; nenhum dado comercial fictício.
- Mesmo SHA candidato para todos os workflows exigidos.
- PR final integrada à `main` somente depois de todos os gates SUCCESS.
- Atualização documental da matriz após merge, com fonte, score anterior, delta e novo agregado.

## Baseline e regra de pontuação

- Agregado confirmado no início: **38.5/48 = 80.2%**.
- Gap agregado aritmético: **9.5/48 = 19.8%**.
- Score individual atual de 08.2: **não reconciliado**; o 0.5 histórico da matriz Sprint 122 não será tratado como valor atual sem revalidação.
- PRs #384–#386: +0 isoladamente.
- Somente a PR final poderá propor novo score, após todos os gates e reconciliação formal.
- Nenhuma migration será aplicada ao Supabase remoto sem autorização explícita; smokes serão executados em PostgreSQL/Supabase descartável.

## Próximas decisões técnicas

1. Auditar migration, schema e todas as leituras/escritas atuais antes de propor novo campo ou tabela.
2. Reutilizar o modelo existente; não criar tabelas duplicadas nem alterar checkout, preço, comissão ou publicação.
3. Preferir metadados de fonte e revisão versionada; minimizar dados pessoais e não coletar dados sensíveis.
4. Manter o Shadow Master único e privado.
5. Não afirmar que um público converte melhor sem experimento válido ou evidência apropriada.

**Status:** sprint iniciada; nenhuma cobertura nova aceita e nenhum ponto convertido nesta etapa.

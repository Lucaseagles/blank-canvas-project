# Sprint 363 — Movement Engine: validação de público e ângulo (critério 08.2)

**Base:** `main` após Sprint 362, score agregado formal de referência **38.5/48 = 80.2%**.  
**Branch de integração:** `sprint/363-integration`  
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
| 1 | #384 — contrato e hardening de evidências | Validar estrutura, unicidade, limites e datas; preservar distinção entre declaração e validação de mercado | Contratos e regressões server-side | +0 |
| 2 | #385 — upgrade premium do painel Master | Card visual por estado, progresso editorial acessível, clareza de bloqueios e experiência responsiva | Build, TypeScript, lint e contrato visual acessível | +0 |
| 3 | #386 — cobertura operacional | Smoke PostgreSQL descartável para Owner/non-Owner, revisão obsoleta, auditoria atômica, rollback e histórico append-only | Jornada real em banco descartável e regressões de autorização | +0 |
| 4 | #388 — cobertura completa e release consolidada | Gates finais no mesmo HEAD, reconciliação da rubrica, matriz, score e release única | Todos os gates e evidências aceitos; merge da branch de integração à main | Única PR elegível para conversão |

Os números correspondem às PRs criadas no GitHub. As PRs intermediárias são empilhadas e entram somente na branch `sprint/363-integration`, após seus próprios gates. Nenhuma delas será integrada diretamente à `main`. A PR #388 será a única PR de `sprint/363-integration` para `main`, depois do fechamento completo.

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
- Somente a PR #388 poderá propor novo score, após todos os gates e reconciliação formal.
- Nenhuma migration será aplicada ao Supabase remoto sem autorização explícita; smokes serão executados em PostgreSQL/Supabase descartável.

## Próximas decisões técnicas

1. Auditar migration, schema e todas as leituras/escritas atuais antes de propor novo campo ou tabela.
2. Reutilizar o modelo existente; não criar tabelas duplicadas nem alterar checkout, preço, comissão ou publicação.
3. Preferir metadados de fonte e revisão versionada; minimizar dados pessoais e não coletar dados sensíveis.
4. Manter o Shadow Master único e privado.
5. Não afirmar que um público converte melhor sem experimento válido ou evidência apropriada.

**Método híbrido obrigatório:** cada etapa combina upgrade visual premium, evolução funcional, hardening, testes e evidências de cobertura. Uma PR pode ser upgrade-only ou cobertura parcial, mas não pontua isoladamente. A sprint só entra na `main` uma vez, pela PR final de cobertura completa.\n\n**Status:** sprint iniciada; nenhuma cobertura nova aceita e nenhum ponto convertido nesta etapa.

# Sprint 363 — Movement Engine: validação de público e ângulo (critério 08.2)

**Base:** `main` após Sprint 362, score agregado formal **38.5/48 = 80.2%**.  
**Integração da sprint:** `sprint/363-integration`  
**Classificação atual:** hardening concluído parcialmente + UX de revisão em execução. **Nenhum ponto convertido.**

## Objetivo de fechamento

Transformar o cadastro de movimentos por produto em um processo verificável de validação de público, situação, problema, resultado e ângulo — sem confundir preenchimento editorial com validação real de mercado.

O critério-alvo é **08.2 — Público/ângulo validado**. O valor atual desta linha não será presumido: a reconciliação histórica de 48 linhas não distribuiu de forma autoritativa todos os deltas pós-Sprint 122. O único número confirmado nesta sprint é o agregado 38.5/48.

## Estado conhecido e reaproveitado

Já existem e devem ser preservados:
- `rubi_movements` e CRUD server-side Owner-only;
- campos distintos de público, persona, problema, resultado desejado, promessa, diferenciação e narrativa;
- Builder de evidências com fonte, data, método, observação, contraevidência e hipótese;
- revisão Master-only imutável, versionada e auditada por RPC transacional;
- variantes criativas, páginas e métricas ligadas ao movimento.

Limites:
- checklist editorial verifica completude, não prova pesquisa;
- declaração documental não equivale a validação independente;
- revisão do Master não prova resposta do mercado;
- métricas observacionais não demonstram causalidade nem intenção de compra paga;
- não inventar pesquisa, feedback, participantes, amostras ou resultados.

## Sequência executada e planejada

| Ordem | PR | Escopo | Estado / gate | Pontuação isolada |
|---:|---|---|---|---:|
| 1 | #384 | Hardening do parser: campos únicos, mínimos, limite, data válida e não futura; reforço dos testes adulterados | **Mergeada em `sprint/363-integration`**; não foi para `main` | +0 |
| 2 | #385 | UX Master premium: status de integridade, decisões por versão, histórico vazio/parcial, retry e bloqueio de decisão duplicada na mesma versão | Esta PR; gates ainda precisam passar | +0 |
| 3 | #386 | Prova de domínio/contratos e smoke em PostgreSQL descartável: Owner/non-Owner, grants/RLS, auditoria, rollback e concorrência; E2E dos quatro perfis | Planejada; sem alteração remota | +0 |
| 4 | #387 | Consolidação integral, reconciliação da rubrica, evidências, todos os gates no mesmo SHA e release para `main` | Única PR elegível para propor conversão de ponto | A validar |

Os números #385–#387 são sequenciais planejados; o GitHub atribui os números efetivos ao abrir cada PR. A ordem de dependência prevalece.

## Definição de cobertura completa

O critério 08.2 só poderá ser considerado completo se implementação e evidências demonstrarem:
1. Cada movimento está ligado a produto real do catálogo e a um segmento permitido.
2. Público-alvo, situação, problema, resultado desejado e ângulo são campos distintos, coerentes e revisáveis.
3. Afirmações factuais relevantes apontam para fonte identificável e compatível com o produto.
4. Hipótese editorial permanece rotulada como hipótese; não aparece como comportamento de consumidor validado.
5. Quando houver pesquisa/feedback real, registra origem, período, método, amostra e limitações; sem isso, não há selo de validação de mercado.
6. Aprovação do Master registra ator, versão, data e decisão; alterações posteriores exigem nova revisão.
7. Não há promessa garantida, prova social fabricada, inferência sensível ou alegação incompatível com fornecedor.
8. Consumer, merchant e partner não acessam nem alteram o espaço privado do Shadow Master.
9. Testes positivos/negativos, stale revision, auditoria, persistência e jornadas mobile/desktop passam no mesmo HEAD final.

**Distinção obrigatória:** validação editorial/factual e validação de mercado são estados diferentes. Se a rubrica 08.2 exigir evidência de mercado real, a ausência de participantes/dados reais impede o fechamento completo, mesmo que o código esteja pronto. Fixtures não são prova de mercado.

## Gates da release final

- TypeScript, lint, build e testes de contrato.
- Testes de domínio para consistência de público/ângulo e fontes.
- PostgreSQL descartável: Owner autorizado, non-Owner negado, grants mínimos, RLS, rollback de auditoria e revisão concorrente.
- E2E autenticado do Shadow Master e negação dos demais perfis, mobile e desktop.
- Revisão de claims e direitos; nenhum dado comercial fictício.
- Mesmo SHA candidato para todos os workflows exigidos.
- PR final integrada à `main` somente após todos os gates SUCCESS.
- Atualização da matriz depois do merge, com fonte, score anterior, delta e novo agregado.

## Baseline e regra de pontuação

- Agregado formal confirmado: **38.5/48 = 80.2%**.
- Gap aritmético: **9.5/48 = 19.8%**.
- Score individual atual de 08.2: **não reconciliado**.
- PRs intermediárias: **+0 isoladamente**.
- Só a PR final poderá propor novo score, após reconciliação formal e todos os gates.
- Nenhuma migration será aplicada ao Supabase remoto sem autorização explícita; smokes serão executados em PostgreSQL/Supabase descartável.

## Segurança e escopo

- Reutilizar o modelo existente; não criar tabelas duplicadas.
- Não alterar checkout, preço, comissão ou publicação.
- Manter o Shadow Master único e privado.
- Minimizar dados pessoais; não coletar dados sensíveis.
- Nenhuma alteração de auth/RLS/grants no Supabase remoto nesta etapa.

**Status:** #384 mergeada apenas na branch de integração; #385 em revisão; score permanece **38.5/48 = 80.2%**.

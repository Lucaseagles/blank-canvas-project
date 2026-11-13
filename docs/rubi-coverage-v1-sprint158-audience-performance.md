# RUBI 11× — Sprint 158: incremento candidato para 08.4

## Objetivo híbrido, uma única entrega
**[UPGRADE]** comparar desempenho de campanhas orgânicas por **movimento e público editorial** dentro do mesmo produto, sem misturar consumidores individuais com categorias editoriais.

**[COBERTURA]** fechar, na matriz técnica estática v1, o critério `08.4 — Desempenho por público e movimento`, hoje `0,5/1`.

## Evidências técnicas
- `src/lib/rubi-audience-movement-summary.ts`: agregação isolada por SKU, movimento e público; exclui rótulos duplicados, eventos suspeitos e limita taxa em dados parciais.
- `src/lib/rubi-audience-movement-summary.functions.ts`: consulta privada Master, RPC orgânica do servidor, limites 100 movimentos/500 variantes/1000 planos/200 campanhas.
- `src/components/store/RubiAudienceMovementSummaryAdmin.tsx`: visão separada de consumidor, lojista e parceiro editorial, eventos e lacunas de atribuição; nenhum ranking automático de vencedores.
- `src/components/store/RubiMovementEngineAdmin.tsx`: módulo incorporado à gestão dos movimentos de cada SKU.
- `src/lib/rubi-audience-movement-summary.test.mjs`: isolamento por produto e público, duplicações entre movimentos, eventos implausíveis, dados incompletos e restrições Master.

## Escopo preciso da pontuação
Se ambos os workflows aprovarem e o PR for integrado à `main`, a implementação cobre tecnicamente **desempenho por público editorial e movimento** na v1. A comissão, o ROI, a intenção do checkout versus compra paga, o comportamento verdadeiro dos perfis de visitantes e um teste A/B causal **não** foram comprovados.

| Elemento | Antes | Candidato |
| --- | ---: | ---: |
| 08.4 | 0,5/1 | 1/1 |
| Total v1 | 32,5/48 = 67,7% | 33/48 = 68,8% |
| Restante até 70,8% | 1,5 ponto | 1 ponto |

## Aceite
1. Ambos workflows TypeScript/lint/build/testes do PR verdes;
2. Merge no main e verificação do código associado;
3. Registrar a reauditoria no main, sem reivindicar resultado comercial ou E2E publicado;
4. Em paralelo, cadastrar produto e movimentos reais aprovados e validar interface com dados reais antes de declarar prontidão em produção.

**Verificação externa anterior:** em 13/11/2026, banco `heartful-helper-box` sem vídeos, movimentos ou variantes. Portanto, esta pontuação seria de cobertura **técnica v1**, não de mercado.

## Atenção à integridade
O sistema não infere que usuários individuais são consumidores, lojistas ou parceiros: o agrupamento se baseia exclusivamente no público **declarado** de cada movimento. Campanhas ambíguas, inválidas ou com consulta parcial não recebem taxa confiável. Compras reais não são derivadas de cliques.

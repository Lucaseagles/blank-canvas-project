# RUBI Eagles 11× — Sprint 145: reauditoria direcionada de personalização

**Base auditada:** Sprint 135, `32/48 = 66,7%`. **Candidato:** critério `01.3` de `0,5 → 1,0`, somente após merge + dois workflows CI aprovados.

## [UPGRADE] O que foi reforçado
- A RUBI Store e o feed marketplace usam preferências **explicitamente selecionadas** em `user_preferences.preferred_categories`; não criam interesse de categoria com base em sinais comportamentais não consentidos.
- O feed garante distribuição limitada de relevância/relacionados/descoberta via `planRubiFeedMix`, abrindo capacidade de descoberta sem preferências.
- A prateleira da Store usa o ranking compartilhado, checa oferta/publicação/checkout autorizados, remove SKUs duplicados, encaminha à Store sem ofertas e atualiza recomendações ao voltar do perfil.
- Novas regressões verificam o caminho do perfil até os dois feeds, controle de sessão e aprovação do checkout; testes anteriores cobrem pesos, ordenação estável e capacidade do mix.

## [COBERTURA] Critério 01.3 — Personalização por audiência

| Item | Antes | Proposto após aceite | Evidência |
| --- | ---: | ---: | --- |
| 01.3 | 0,5 | 1,0 | `src/lib/personalization.functions.ts`, `src/lib/rubi-movement-feed.functions.ts`, `src/components/store/RubiApprovedMovementShelf.tsx`, `src/routes/profile.tsx`, `src/lib/rubi-feed-mix.test.mjs`, `src/lib/rubi-unified-interest-ranking.test.mjs`, `src/lib/rubi-flagship-storefront.test.mjs` |

**Fundamento de 1 ponto v1:** a matriz v1 considera a implementação técnica integrada com verificações automatizadas, não desempenho de personalização em produção. O critério 01.3 refere-se à personalização por audiência nos dois caminhos de descoberta. A escolha explícita de categoria é salva no perfil e consumida pelos dois feeds, com fallback sem preferências. Por isso, após os testes no código integrado, é candidato a completo **apenas no escopo técnico v1**.

**Limitações:** a avaliação é estática e automatizada, não é E2E em domínio HTTPS publicado; não comprova relevância comercial real, aumento de conversão, CTR, retenção ou vendas. `01.4` (coortes/recompra) permanece zero. Não pontuar `02.4` (Story E2E), `08.2` (validação real de ângulos), `08.3` (A/B causal), `10.3` (retenção). Não extrapolar esta pontuação para a matriz v2.

## Placar condicionado à integração

- Antes: `32/48 = 66,7%`.
- **Se PR #145 tiver ambos workflows CI verdes e integrar à main:** `32,5/48 = 67,7%`.
- Módulo 01 Eclipse/Consumidor: `3/4 = 75%` (antes `2,5/4=62,5%`).
- Restante dos 47 critérios sem mudança, incluindo `07.4=0,5`.
- Próximo marco: `34/48=70,8%`; ainda faltam **1,5 pontos** depois do aceite da Sprint 145.

## Protocolo de aceite
1. Verificar TypeScript, lint, build e regressões nos dois workflows no commit head do PR.
2. Integrar somente depois de ambos aprovados.
3. Confirmar no main as provas citadas. Registrar a reauditoria como *incremental*, não reescrever o registro histórico de 65,6/66,7%.
4. QA manual com preferências vazias e definidas, consumidor autenticado e anônimo, fluxo perfil → feed → Store e checkout apenas oficial antes de declarar prontidão de produção.

**Bloqueio comercial independente:** primeiro SKU real, host Kairos verificado, domínio publicado, pedido/estorno e atribuição externa continuam dependências externas. Nunca registrar venda fictícia.

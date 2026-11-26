# RUBI Eagles — mapa histórico e futuro de entregas até 100%

**Data de referência:** 2026-11-26  
**Repositório:** `Lucaseagles/blank-canvas-project`  
**Base confirmada:** PR #344 integrada à main em `7a542f98032ec4ae73c7f8fa707618f797154a84`.  
**Matriz V1:** 37.5/48 = 78.1%; gap aritmético de 10.5 pontos.  
**Natureza deste documento:** plano de execução e governança; não concede pontos nem transforma previsão em entrega concluída.

## 1. Legenda obrigatória

- **Upgrade (0 ponto):** melhoria de estabilidade, segurança, visual, acessibilidade, performance, clareza de métricas ou manutenção sem novo aceite de critério.
- **Habilitador de cobertura:** inventário, contrato, instrumentação, segurança ou preparação de ambiente que permite implementar/provar o critério. Ainda não pontua.
- **Cobertura parcial (+0.5):** somente após evidência revisada de metade do aceite mensurável do critério, conforme a rubrica.
- **Cobertura completa (+1.0):** todos os requisitos aplicáveis do critério comprovados em código, comportamento, persistência, segurança, jornada e evidência.
- **Híbrida:** separar os resultados. Um upgrade não vira ponto só por estar na mesma PR de uma cobertura.

A matriz V1 mantém denominador histórico de 48. Expansões além do escopo V1 ficam em V2, com denominador próprio. Não redistribuir os 37.5 pontos entre critérios sem reconciliação documental.

## 2. Histórico consolidado — até a main atual

| Entrega | Resultado conhecido | Classificação |
|---|---|---|
| PR #315 | Least privilege SQL | Upgrade |
| PR #329 | E2E autenticado dos quatro perfis, mobile/desktop | Cobertura +1.0 em 12.3; já dentro de 37.5/48 |
| PR #330 | Academia para categorias de parceiros | Upgrade |
| PR #331 | Onboarding premium de parceiros | Upgrade |
| PR #332 | Convite discreto para afiliados consumidores | Upgrade |
| PR #333 | Persistência do progresso na Academia | Upgrade |
| PR #335 | Arquitetura Growth Network | Upgrade |
| PR #336 | Auditoria fail-closed | Upgrade / habilitador 11.3 |
| PR #340 | Identidade da marca auditável | Habilitador 11.3 |
| PR #341 | Níveis de indicação com auditoria atômica | Habilitador 11.3 |
| PR #342 | Métrica correta do funil de convite | Upgrade |
| PR #344 | Auditoria V1 descobre rotas do route tree e diferencia RLS negada de falha real | Upgrade; integrada à main |

PR #343 é um roteiro documental anterior, baseado no commit anterior à PR #344. Este mapa passa a ser a versão de planejamento posterior à integração #344. Não contar #343 como cobertura.

## 3. Carteira futura — sequência ampla de entregas

As entregas abaixo são planejadas, não PRs já criadas. A ordem pode mudar se a reconciliação descobrir um bloqueio mais prioritário. Cada etapa deverá terminar com PR, CI, evidência e classificação explícita.

| Ordem | Entrega planejada | Tipo predominante | Critério / aceite pretendido | Resultado que libera a próxima |
|---:|---|---|---|---|
| 1 | Reconciliação de 48/48 critérios contra main e histórico pós-Sprint 207 | Upgrade de governança / habilitador | Score por linha, fonte, evidência, gates e dependências | Baseline por critério revisada sem inferência |
| 2 | Inventário automático de rotas → componentes → server functions → RPC/tabelas → RLS/GRANT → audit | Habilitador 11.3 | Inventário transversal, incluindo caminhos fora de /admin | Lista verificável de toda mutação sensível |
| 3 | Testes negativos/positivos por papel e mapa de bypass | Habilitador 11.3 | anon, consumidor, lojista, parceiro e não-Owner negados; Shadow Master/Owner autorizado | Matriz de autorização completa |
| 4 | Fechamento das mutações administrativas ainda sem prova atômica | Cobertura candidata 11.3 + upgrade | Auditoria na mesma transação, actor verificado, rollback, concorrência, idempotência | Cada mutação sensível tem evidência SQL e E2E |
| 5 | Execução POST explícita e persistência fail-closed da auditoria operacional | Cobertura candidata 11.3 + upgrade | GET sem efeitos; POST com execution ID, estados, timestamps e erro se auditoria falhar | Evidência de execução auditável |
| 6 | Story → produto: jornada autenticada ponta a ponta | Cobertura candidata 02.4 | Story elegível/aprovada, CTA correto, persistência, mobile/desktop, estados negativos | E2E persistido reproduzível |
| 7 | Story → oferta → pré-checkout em staging HTTPS | Cobertura candidata 02.4 | Redirect/retorno oficial em ambiente de teste autorizado | Prova externa de navegação; sem chamar intenção de compra de venda |
| 8 | Movement Engine: contrato de público, persona, ângulo e promessa | Híbrida; habilitador 08.2 | Dados estruturados, evidência factual, revisão e versionamento | Movimentos válidos ligados ao produto |
| 9 | Biblioteca de criativos por movimento e canal | Upgrade + cobertura candidata | Criativo, formato, copy, CTA, direitos, revisão e histórico | Conteúdo rastreável e aprovado |
| 10 | Experimentos A/B com alocação controlada | Cobertura candidata 08.3 | Unidade de randomização, variantes, exposição, deduplicação, amostra e parada | Experimento reproduzível, sem confundir clique com exposição |
| 11 | Métricas por movimento, público e variante | Cobertura candidata 08.4 / 10.3 | Denominadores, CTR, retenção, conversão, margem e qualidade dos eventos | Relatório reproduzível; causalidade só quando desenho permitir |
| 12 | Distribuição multicanal: outbox e estados por canal | Cobertura candidata 03.3 + upgrade | draft, queued, publishing, published, delivered quando comprovado, retry, failed, unknown | Idempotência e rastreio por conector |
| 13 | Conectores sociais oficiais e autorização por conta | Cobertura candidata 03.3 | Escopos, token seguro, publicação confirmada, limites e revogação | Um canal real validado por vez |
| 14 | Growth Network: elegibilidade progressiva do consumidor afiliado | Upgrade + cobertura candidata | Critérios transparentes, convite contextual, candidatura e aprovação | Jornada sem spam e sem autoaprovação indevida |
| 15 | Onboarding segmentado de afiliados, nano/micro, experts e parceiros comerciais | Upgrade | Questionários, contrato, nicho, catálogo/grants e treinamento por tipo | Parceiro habilitado e com permissões mínimas |
| 16 | Academia, campanhas e kit de divulgação | Upgrade + cobertura candidata | Criativos aprovados, copy, páginas, metas, tarefas e progresso persistido | Parceiro sabe o que promover e como |
| 17 | Atribuição de visitas, links, checkout e pedidos externos | Habilitador 03.4 / 06.4 | UTM/referral, deduplicação, janela e regra de atribuição | Fonte externa consegue confirmar a venda |
| 18 | Ledger de comissão por venda elegível | Cobertura candidata 03.4 / 06.4 | Evento de venda oficial, snapshot de regra, cancelamento, estorno, disputa e conciliação | Comissão auditável; clique e pedido pendente não pagam |
| 19 | Integração oficial Kairos/provedor — checkout round-trip | Cobertura candidata 04.4 | Contrato/sandbox oficial, criação, redirect, webhook assinado, retry e conciliação | Pagamento de teste confirmado pelo provedor |
| 20 | Order bump e upsell pós-compra | Cobertura candidata 09.3 / 09.4 | Itens e cobranças separados, vínculos, aceite, recusa, estorno e reconciliação | Evidência do provedor para cada transação |
| 21 | B2B atacado: cotação, pedido e preço por faixa | Upgrade + cobertura candidata 05.4 | Snapshot de preço, quantidade, estoque e aprovação | Pedido consistente por lojista |
| 22 | Pagamento B2B, frete e ciclo logístico | Cobertura candidata 05.4 / 12.4 | Provedor de pagamento/logística em sandbox, frete congelado, status e auditoria | Pedido pago e lifecycle reconciliado |
| 23 | Payout de parceiro, extrato e estorno | Cobertura candidata 12.4 | Ledger, saldo elegível, lote, comprovante, reversão e conciliação | Repasse verificável sem duplicidade |
| 24 | Recompra e coortes de LTV | Cobertura candidata 01.4 / 10.4 | Compras liquidadas, reembolsos, clientes únicos, janelas e fórmula reproduzível | LTV calculado apenas com eventos financeiros confirmados |
| 25 | Revisão formal de 11.4 e escopo de Masters | Governança | Preservar um único Shadow Master privado; versionar critério se rubrica estiver obsoleta | Escopo aprovado sem criar privilégios artificiais |
| 26 | Hardening final de segurança e privacidade | Upgrade / release gate | RLS, grants, secrets, rate limits, logs sanitizados, isolamento e acessibilidade | Nenhum bloqueio crítico aberto |
| 27 | QA visual premium dos quatro acessos | Upgrade / release gate | Consumidor, lojista, parceiro e Shadow Master em desktop/mobile; loading, empty, error, foco e reduced motion | Evidência visual e funcional por perfil |
| 28 | Regressão completa, staging e checklist de lançamento | Upgrade / release gate | TypeScript, lint, build, unit, SQL, E2E, smoke, observabilidade e rollback | Release candidate aprovado |
| 29 | Reavaliação final 48/48 e relatório de 100% | Cobertura completa somente se comprovada | Cada critério com aceite, evidência, PR/commit e aprovação | V1 100% verificável; itens V2 separados |

## 4. Como os tipos de entrega vão aparecer na prática

**Upgrade** aparece desde já e em todas as etapas: correções de UI, acessibilidade, desempenho, segurança adicional, clareza de métricas e estabilidade. É necessário, mas não soma pontos automaticamente.

**Habilitador** aparece antes de critérios complexos: reconciliação, inventário, instrumentação, contratos, dados de teste e conectores. Ele reduz incerteza e prepara a cobertura.

**Cobertura parcial (+0.5)** só será declarada quando uma parte definida do aceite do critério estiver concluída e comprovada. Não usar percentuais intuitivos por quantidade de arquivos ou PRs.

**Cobertura completa (+1.0)** vem quando todos os gates do critério passam. Em integrações externas, requer confirmação oficial. Em auditoria, requer inventário e prova de ausência de bypass, não apenas testes de algumas RPCs.

## 5. Gates de qualidade permanentes

- Visual premium consistente em todos os logins e módulos, não apenas no dashboard.
- Shadow Master único, privado e isolado.
- Consumidor, lojista e parceiro nunca herdam permissões administrativas.
- Testes desktop e mobile em cada jornada relevante.
- Estados loading/empty/error, acessibilidade, reduced motion e prevenção de double-submit.
- Nenhuma métrica comercial fictícia: separar fixtures, sandbox, staging e produção.
- Nenhuma comissão sem venda elegível confirmada; nenhum payout sem conciliação.
- Nenhuma publicação declarada sem retorno do conector.
- Nenhuma migration/RLS/grant aplicada em Supabase de produção sem autorização explícita.
- Testes automatizados em todas as PRs; a rodada final de quatro logins não substitui QA contínuo.

## 6. Formato obrigatório de cada prestação de contas

1. PRs abertas, integradas e aguardando CI.
2. Arquivos e comportamentos alterados.
3. Classificação: upgrade, habilitador, parcial, completa ou híbrida.
4. Critério exato e score anterior.
5. Testes executados e resultado de cada workflow.
6. Evidências e limitações.
7. Dependências externas e o que não foi comprovado.
8. Percentual antes/depois — ou declaração explícita de que não mudou.
9. Próxima sequência de entregas, incluindo pelo menos as próximas cinco etapas.

**Referência atual:** 37.5/48 = 78.1%. A próxima pontuação oficial só muda após reconciliação por linha e aceite de evidências. A meta é 100% com produto funcional, seguro, premium e comercialmente comprovável.

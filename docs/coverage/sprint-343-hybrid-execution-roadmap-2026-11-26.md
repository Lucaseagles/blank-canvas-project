# Sprint 343 — roteiro híbrido de execução até 100%

**Data:** 2026-11-26  
**Base:** `main` após PR #342, merge commit `6f7a8950849d4ea61fe70e589f9d32521f622dfc`  
**V1:** 37.5/48 = 78.1%; gap aritmético 10.5 pontos.  
**Classificação:** governança e planejamento; este documento não concede pontos.

## Regra de execução

Cada entrega recebe uma classificação explícita:

- **Cobertura (+0.5/+1.0):** somente quando um critério da matriz V1 tem aceite identificado e todos os gates aplicáveis passam (código, comportamento, persistência/segurança, jornada real, prova externa e pacote de evidências).
- **Upgrade (0 pontos):** estabilidade, segurança adicional, UX premium, acessibilidade, performance, clareza de métricas, documentação e refatoração que não fechem um aceite novo.
- **Híbrida:** uma mesma sprint pode conter um upgrade e uma frente de cobertura, mas cada resultado e cada pontuação são reportados separadamente.

Não redistribuir os 37.5 pontos entre critérios por inferência. A reconciliação integral das 48 linhas segue como trabalho próprio. A pontuação oficial só muda com evidência revisada.

## Histórico confirmado nesta etapa

| Entrega | Resultado | Classificação |
|---|---|---|
| PR #315 | Least privilege SQL | Upgrade |
| PR #336 | Auditoria fail-closed | Upgrade / habilitador 11.3 |
| PR #340 | Identidade de marca auditável | Habilitador 11.3 |
| PR #341 | Níveis de indicação com auditoria atômica | Habilitador 11.3 |
| PR #335 | Arquitetura Growth Network | Upgrade |
| PR #342 | Semântica correta de conversão do convite de afiliado | Upgrade |
| PR #329 | E2E dos quatro perfis mobile/desktop | Cobertura: +1.0 em 12.3, já incluído no total de 37.5/48 |

PRs habilitadoras de 11.3 não são, isoladamente, crédito de cobertura integral. A auditoria completa continua dependente do inventário transversal de mutações e da prova de ausência de bypass.

## Carteira priorizada

| Ordem | Frente e critérios | Tipo | Entrega/aceite | Bloqueio ou dependência |
|---:|---|---|---|---|
| 1 | Reconciliação 48/48 | Upgrade de governança | Score atual por linha, fonte de evidência, estado dos gates, dono e próximo bloqueio; não inventar distribuição | Comparar todo o histórico pós-Sprint 207 com a main atual |
| 2 | 11.3 — auditoria administrativa | Cobertura candidata + upgrade | Mapa rota → server function → RPC/tabela → RLS/GRANT → audit log → testes; cobrir cada mutação sensível; rollback e concorrência em DB descartável | Inventário completo de rotas/componentes e caminhos alternativos de escrita |
| 3 | 02.4 — Story → oferta | Cobertura candidata + upgrade | Jornada autenticada persistida, negativas, mobile/desktop, Story aprovada e CTA para o produto correto | Staging HTTPS autorizado e checkout oficial de teste; interesse não é venda |
| 4 | 08.2 / 08.3 / 08.4 / 10.3 — Movement Engine e experimentos | Cobertura candidata + upgrade | Validar audiência/ângulo, variantes, controle de experimento, amostra, denominadores, retenção e desempenho por movimento | Fontes de eventos válidas e tráfego de teste/real claramente identificado |
| 5 | 03.3 — distribuição multicanal | Cobertura candidata + upgrade | Diferenciar rascunho, fila, publicação, entrega confirmada, retry e falha por canal; idempotência | Conectores oficiais e permissões de cada rede |
| 6 | Afiliados e Growth Network | Upgrade + validação de critérios aplicáveis | Convite discreto e elegibilidade progressiva; onboarding por tipo; campanhas, links, metas, academia e relatórios; comissão somente após venda confirmada | Não converter cliques, convites ou pedidos pendentes em comissão |
| 7 | 03.4 / 06.4 — venda externa e comissão | Cobertura candidata | Venda atribuída por referência/UTM e confirmação oficial do marketplace/provedor; ledger idempotente e conciliação | Acesso/API/relatório oficial do parceiro externo |
| 8 | 04.4 / 09.3 / 09.4 — checkout, bump e upsell | Cobertura candidata | Round-trip oficial, confirmação de cobrança, bump/upsell separados, estorno e reconciliação | Contrato e sandbox oficiais do Kairos/provedor; sem inventar webhook |
| 9 | 05.4 / 12.4 — B2B, payout e refund | Cobertura candidata | Pedido pago, snapshot de frete, comissão/repasse, estorno e trilha de auditoria | Sandbox autorizado de pagamento/logística ou operação real aprovada |
| 10 | 01.4 / 10.4 — recompra e LTV | Cobertura candidata | Coortes de compras liquidadas, reversões, recompra e LTV reproduzível | Histórico financeiro confirmado e política de reembolso |
| 11 | 11.4 — múltiplos Masters | Governança de escopo | Revisar e versionar a rubrica para respeitar o produto aprovado: um Shadow Master privado | Não criar outro Master só para aumentar percentual |
| 12 | Quatro logins e testes finais | Upgrade/release gate | Contas isoladas de consumidor, lojista, parceiro e Master; inspeção visual e funcional desktop/mobile, estados vazios/erro/loading, permissões e regressões | Staging seguro, identidades descartáveis e pacote de QA independente |

## Princípios de produto e segurança

1. Consumidor, lojista, parceiro e Shadow Master têm jornadas, permissões e dashboards próprios.
2. O Shadow Master é privado e único na arquitetura aprovada; os perfis comuns não recebem privilégios administrativos.
3. Afiliados: separar elegibilidade, candidatura, aprovação, link, clique, pedido, venda confirmada, comissão, liquidação e payout.
4. Redes sociais: separar conteúdo preparado, agendado, publicado e entrega confirmada. Nunca afirmar publicação sem retorno do conector.
5. Receita, margem, LTV, comissões e payout usam eventos financeiros confirmados; fixtures são explicitamente de teste.
6. Toda interface premium precisa de estados loading/empty/error, responsividade, acessibilidade, reduced motion e proteção contra ações duplicadas.
7. Testes automatizados continuam em toda PR. O marco de 100% inicia a rodada consolidada de logins e inspeção manual, não substitui testes contínuos.
8. Não aplicar migrations, alterar RLS ou escrever dados no Supabase de produção sem autorização explícita.

## Reporte obrigatório por sprint

Cada sprint deve informar: PR/commit; classificação (upgrade, cobertura ou híbrida); critério exato; score anterior e potencial (se conhecido); gates executados; runs; evidência; dependências externas; merge status; e se o total oficial mudou. Enquanto o score por linha não estiver reconciliado, reportar somente o agregado 37.5/48 e não atribuir pontos a critérios por palpite.

**Meta de produto:** ecossistema completo, seguro, premium e operacional.  
**Meta de governança:** 100% da matriz V1 com evidência; itens de expansão V2 ficam em denominador separado.

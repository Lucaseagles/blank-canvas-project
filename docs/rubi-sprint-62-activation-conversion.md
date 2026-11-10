# RUBI 11× — Sprint 62 · Ativação e Conversão (após PR #61)

**Base integrada:** PR #61, merge `9f6c958b09024b1689b943d47f7f54c37be458f3` em `main`.

## Resultado esperado
Transformar as jornadas já implementadas em indicadores comerciais consistentes, sem repetir a auditoria concluída do PR #61 e sem bloquear desenvolvimento por checkout ainda não fornecido pela Kairos.

## Escopo fechado da próxima sprint
1. **Consumidor — aquisição e ativação:** validar lógica de retorno ao produto, convite opcional, sininho com consentimento e instalação PWA; relatórios devem diferenciar visita, CTA, cadastro realmente confirmado, push autorizado e instalação reportada pelo navegador.
2. **Store — venda própria em primeiro lugar:** confirmar que produtos entram na vitrine apenas com URL oficial e aprovação administrativa; recomendações devem vir de produtos ativos e relacionados; manter CTA de pagamento indisponível até haver link real.
3. **Partners — conversões auditáveis:** consolidar métricas de links, visitas e pedidos realmente confirmados, preservando a autorização por produto e evitando comissões em links não atribuídos.
4. **Business — recorrência:** preparar um quadro de KPIs de compradores aprovados, cotações, pedidos e reposição, distinguindo cálculos de atacado de pedidos pagos.
5. **Orgânico integrado:** conectar parâmetros de origem/campanha aos destinos da Store e aos três perfis; não contabilizar vendas externas de marketplace como faturamento próprio.

## Regras anti-retrabalho
- PR #61 está encerrado; novos requisitos ficam em sprints separadas e com escopo limitado.
- Não criar produtos, dados pessoais, links Kairos, pedidos ou comissões de teste na produção.
- Não exigir teste de compra real Kairos para aceitar mudanças estruturais independentes.
- Executar build, TypeScript e ESLint nos commits desta sprint; testar o fluxo funcional no navegador quando ambiente de implantação estiver disponível.
- Só declarar ativo/validado aquilo que uma evidência concreta sustenta.
- Encerrar a sprint e abrir outra ao completar os critérios, em vez de manter indefinidamente o mesmo PR.

## Bloqueios externos acompanhados, não impeditivos da sprint
- URLs oficiais, catálogo e checkout principal Kairos ainda não fornecidos.
- Teste de pagamento real, repasses, estornos e atribuição externa de parceiros.
- Testes de instalação e push em dispositivos finais no domínio publicado.

## Critérios de saída
- Diferença clara entre `visita`, `cadastro`, `autorização push`, `instalação`, `pedido confirmado` e `comissão liquidada`.
- Sem exposição de preços privados ou URLs internas nas consultas públicas.
- Jornada de compra nunca bloqueada por cadastro/instalação opcionais.
- CI verde e escopo documentado antes do merge seguinte.

# RUBI Eagles — Sprint 238: fechar a lacuna entre testes existentes e CI

**Classificação:** UPGRADE de qualidade/observabilidade de regressões.  
**Matriz V1:** sem aumento de pontuação nesta sprint.  
**Escopo:** Hub V1 integration QA.

## Descoberta

A revisão do inventário da Sprint 226 mostrou duas lacunas concretas de integridade administrativa: mutações de marketplaces e coleta de métricas Telegram. A implementação já está presente na `main`:

- Marketplaces: `rubi_manage_marketplace_audited`, RPC Owner-gated para CRUD, credenciais e status; auditoria na mesma transação; valores de credenciais não são copiados para a trilha; exclusão bloqueia produtos vinculados.
- Telegram: `rubi_record_telegram_metric_audited`, grava métrica e evento de auditoria atomicamente; exige um único canal Telegram ativo e não registra métrica se a coleta falhar.

Também existem três testes de regressão:
- `src/lib/rubi-marketplace-atomic-audit.test.mjs`
- `src/lib/rubi-marketplace-trigger-audit.test.mjs`
- `src/lib/rubi-telegram-metric-atomic-audit.test.mjs`

## Lacuna adicional fechada nesta sprint

Os três testes acima não estavam listados como etapas explícitas no workflow `Hub V1 integration QA`. Isso significava que a existência dos testes não garantia sua execução no gate principal. A Sprint 238 adiciona os três comandos `node --test` ao workflow.

## Critério de aceite

1. Os três testes aparecem como etapas independentes no workflow.
2. Ambos workflows obrigatórios concluem com sucesso no SHA final.
3. TypeScript, ESLint e build continuam verdes.
4. Nenhuma migração, credencial, tabela ou dado comercial de produção é alterado.

## Progresso do inventário de upgrades

O inventário da Sprint 226 identificou duas lacunas U1 concretas e agora ambas possuem implementação auditada e testes dedicados no repositório. A Sprint 238 torna esses testes parte do gate Hub V1. Isso fecha **2/2 achados concretos iniciais de U1 no inventário** quanto à existência de implementação e cobertura automatizada no CI, após aprovação do workflow. Não equivale a 100% das oito frentes U1–U8 nem ao inventário global de upgrades, cuja varredura ainda precisa ser consolidada.

## Pontuação e operação

- Cobertura V1 permanece **36,5/48 = 76,0%**, até reavaliação formal de critérios.
- Não há alteração em checkout Kairos, vendas, comissões, produtos, pagamentos ou dados de usuários.
- CI verde comprova execução dos testes automatizados, não E2E hospedado nem operação comercial real.

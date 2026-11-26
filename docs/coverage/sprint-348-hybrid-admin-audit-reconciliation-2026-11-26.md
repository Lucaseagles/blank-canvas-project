# Sprint 348 — reconciliação híbrida da auditoria administrativa

**Data:** 2026-11-26  
**Base:** `main` após PR #347, merge commit `4e9dcda0ce5e5ac61b5a8b1be41a4efd0d371df3`  
**Matriz V1 de referência:** 37.5/48 = 78.1%; gap aritmético 10.5 pontos.  
**Classificação desta entrega:** upgrade de governança + habilitador 11.3. **Não concede ponto V1.**

## 1. Entregas efetivamente integradas nesta continuação

| PR | Estado | Evidência | Classificação |
|---|---|---|---|
| #346 | Integrada | Merge `ff9994e212a0d6adfa079f5871ed3acb12fd1268`; Telegram config + Vault + audit atômicos | Habilitador / upgrade 11.3 |
| #347 | Integrada | Merge `4e9dcda0ce5e5ac61b5a8b1be41a4efd0d371df3`; auditoria operacional usa POST + mutation explícita | Upgrade 11.3 |

Na PR #347, os três workflows obrigatórios terminaram com sucesso no HEAD `c5f8b357bb18a849fbcbcae3b1ba6b9b50066b78`:
- Hub V1 Integration QA — success.
- Sprint 33 QA — success.
- RUBI Local Authenticated E2E — Four Profiles — success.

O merge foi realizado somente após confirmar os três resultados verdes e o HEAD esperado.

## 2. Correção do inventário histórico: não reabrir o que já foi resolvido

O inventário `docs/RUBI_COMPLETE_PRODUCT_INVENTORY_2026-11-24.md` contém achados históricos que precisam ser lidos junto às migrations, testes e PRs posteriores. A tabela abaixo reconcilia os principais achados de auditoria encontrados no bloco 22.2:

| Achado histórico | Evidência atual na main | Decisão de fila |
|---|---|---|
| CRUD de marketplaces, credenciais e status | `rubi_manage_marketplace_audited`, migrations 20261117120000 e 20261117160000, testes `rubi-marketplace-atomic-audit` e `rubi-marketplace-trigger-audit` | Resolvido na implementação; manter regressões |
| Métricas Telegram | `rubi_record_telegram_metric_audited`, migration 20261117143000 e teste dedicado | Resolvido na implementação; manter regressões |
| Referral Tiers | RPCs create/update/deactivate, migration 20261126100000, teste de contrato e smoke PostgreSQL local | Resolvido na implementação; smoke ligado ao workflow local |
| Brand Identity | `rubi_update_brand_identity_audited`, migration 20261126083000, teste e smoke PostgreSQL | Resolvido na implementação; smoke ligado ao workflow local |
| Compliance settings | Escrita legada `saveComplianceRule` removida; caminho central `rubi_update_admin_setting_audited` com allowlist `compliance_rules` | Resolvido na implementação; preservar teste de ausência do endpoint legado |
| Strategy Orchestration | create/generate/approve/pause usam RPCs auditadas; migrations 20261125143000, 20261125120000 e 20261125160000; smoke de rollback/Owner e teste de concorrência no workflow local | Resolvido na implementação observada; manter cobertura SQL/E2E |
| Telegram config + Vault | PR #346; migration 20261126113000; smoke de rollback, Owner, Vault, redaction e grants | Resolvido na implementação e integrado |
| Execução do checklist administrativo | PR #347; `runAdminAudit` agora POST, UI usa `useMutation`, retry automático desligado e erro fail-closed | Resolvido na semântica HTTP/UI; não equivale à cobertura de todas as mutações |

**Regra de governança:** esses itens saem da fila de implementação funcional já concluída. Não saem da suíte de regressão e não são automaticamente convertidos em pontos V1.

## 3. O que ainda impede declarar 11.3 completo

A evidência atual é forte em várias superfícies, mas não demonstra ainda o inventário transversal exaustivo de todas as mutações sensíveis do aplicativo.

Gates que continuam obrigatórios:

1. **Inventário completo:** rota/tela → server function → middleware → DML/RPC → tabela → RLS/GRANT → trigger/audit → testes.
2. **Busca de bypass:** localizar DML direto em server functions, componentes, scripts, RPCs antigas e funções SQL que ainda possam alterar estado administrativo sem trilha equivalente.
3. **Matriz de papéis:** Owner autorizado; anon, consumer, merchant, partner e usuário autenticado não-Owner negados em cada superfície sensível.
4. **Rollback real:** forçar falha do insert de auditoria e provar, em PostgreSQL descartável, que a mutação de negócio não sobrevive.
5. **Concorrência/idempotência:** provar que duas atualizações concorrentes não sobrescrevem silenciosamente o estado e não duplicam transições/eventos.
6. **Redação:** nenhuma credencial, token, segredo ou dado privado indevido no audit log.
7. **E2E administrativo:** validar jornadas reais no browser, com evidência sanitizada e sem usar o Supabase remoto de produção.

A auditoria operacional executada por `runAdminAudit` grava um evento `ADMIN_AUDIT_RUN` depois de ler as fontes. A alteração para POST corrige o contrato HTTP e a UI; o registro da execução não é, por si só, prova de que cada mutação administrativa do produto esteja auditada. Não confundir o histórico de execução do checklist com a cobertura de auditoria do sistema inteiro.

## 4. Carteira híbrida atualizada — priorização por conversão de ponto

| Ordem | Entrega | Tipo | Critério | Ganho potencial | Dependência / aceite |
|---:|---|---|---|---:|---|
| 1 | Inventário automático e revisado de mutações | Habilitador | 11.3 | 0 até aceite final | Mapa completo de caminhos e evidências |
| 2 | Testes negativos por papel em cada família de mutação | H + parcial candidata | 11.3 | até +0.5, somente se rubrica permitir | PostgreSQL descartável + identities isoladas |
| 3 | Rollback e concorrência para famílias ainda sem prova real | H + parcial candidata | 11.3 | até +0.5 adicional, sujeito à rubrica | Falha de audit forçada, lock e estado final verificado |
| 4 | Fechamento integral da auditoria administrativa | Cobertura completa candidata | 11.3 | até +1.0 no total do critério | Todos os gates 1–7 aprovados; sem somar duas vezes o mesmo critério |
| 5 | Story → oferta: revisão do aceite 02.4 com a evidência do Sprint 307 | H / parcial candidata | 02.4 | até +0.5 | Local E2E já existe; staging HTTPS e prova externa permanecem pendentes |
| 6 | Movement Engine: contrato de público, persona, ângulo e promessa | H + upgrade | 08.2 | até +0.5 candidato | Dados versionados e revisão factual |
| 7 | Experimentos A/B: exposição, alocação, deduplicação e parada | Parcial candidata | 08.3 | até +0.5 | Eventos e denominadores verificáveis |
| 8 | Métricas por movimento e público | Parcial candidata | 08.4 / 10.3 | até +0.5 | Relatórios reproduzíveis; sem alegar causalidade indevida |
| 9 | Outbox e reconciliação de envio Telegram | Upgrade + parcial candidata | 03.3 | até +0.5 | Idempotência local, estados unknown e prova do provedor |
| 10 | Distribuição multicanal com conector oficial | Parcial / completa candidata | 03.3 | até +1.0 no critério | Autorização de conta, publicação e retorno oficial |
| 11 | Atribuição externa e ledger de comissão | H + parcial candidata | 03.4 / 06.4 | até +1.0 por critério, conforme rubrica | Venda confirmada por provedor e conciliação |
| 12 | Checkout, bump e upsell | Parcial / completa candidata | 04.4 / 09.3 / 09.4 | até +1.0 por critério, conforme rubrica | Sandbox oficial e eventos assinados |
| 13 | B2B, frete, payout e estorno | Parcial / completa candidata | 05.4 / 12.4 | até +1.0 por critério, conforme rubrica | Provedor e conciliação |
| 14 | Recompra e LTV por coorte paga | Cobertura completa candidata | 01.4 / 10.4 | até +1.0 por critério, conforme rubrica | Eventos liquidados e reembolsos reconciliados |
| 15 | Reconciliar as 48 linhas e certificar 100% | Governança + cobertura final | V1 48/48 | até 10.5 restantes no agregado | Não atribuir pontos por previsão; cada linha precisa de prova |

Os ganhos são tetos condicionais por critério, não promessa de pontuação. Onde a rubrica definir um único ponto total, parcial e completa são estados sucessivos desse mesmo ponto, nunca pontos cumulativos acima de 1.0.

## 5. Decisão de foco

A ordem eficiente é:

- Primeiro fechar o que está sob controle do código: 11.3 e a revisão do 02.4.
- Em seguida converter o Movement Engine e a distribuição em experimentos mensuráveis.
- Em paralelo, preparar contratos e instrumentação comercial.
- Por último, concluir os gates que dependem de Kairos, redes afiliadas e eventos financeiros reais.

Não abrir outra PR cosmética enquanto houver um gate de cobertura verificável que possa ser fechado com menor custo e risco.

## 6. Score e prestação de contas

- Score carregado: **37.5/48 = 78.1%**.
- Gap aritmético: **10.5/48 = 21.9%**.
- PR #346 e #347: **+0 ponto V1** nesta atualização.
- O score permanece inalterado até a revisão formal linha a linha e aprovação dos gates correspondentes.
- A distribuição individual dos 48 critérios continua em reconciliação; não inferir os 10.5 pontos restantes por módulo.

## 7. Padrão permanente de qualidade

Toda entrega deve manter visual premium, responsividade mobile/desktop, acessibilidade, estados loading/empty/error, proteção contra duplo envio, isolamento dos quatro perfis e privacidade do Shadow Master único. Esses upgrades são contínuos e não são usados para inflar a pontuação.

**Conclusão:** a trilha de auditoria avançou de forma concreta, mas 11.3 só será declarada completa quando o inventário for exaustivo e os gates operacionais restantes forem comprovados. O método híbrido separa melhoria contínua de conversão real de pontos.

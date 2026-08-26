# SPRINT 5 (PARTE 2/3) — REMEDIAÇÃO DOS ACHADOS DA AUDITORIA

## CONTEXT

A Parte 1 produziu um relatório honesto do estado real de tudo que foi especificado nos Sprints 0 a 4. Esta Parte existe para **corrigir, um por um, todos os itens marcados como `PARCIAL`, `QUEBRADO` ou `NÃO EXISTE`** — antes de qualquer feature nova do Sprint 5 real (Parte 3).

## OBJECTIVE

Fechar 100% das lacunas encontradas na auditoria, priorizando na ordem: segurança → integridade de dados → funcionalidade quebrada → funcionalidade parcial → polimento visual. Nenhuma feature nova deste Sprint (Marketplace Connector) deve começar antes desta remediação estar concluída.

## WHAT MUST BE BUILT

Usar a lista priorizada entregue ao final da Parte 1 como guia de trabalho. Para cada item:

1. Reconfirmar o problema (reproduzir antes de corrigir).
2. Corrigir a causa raiz — nunca um remendo superficial (mesmo princípio já aplicado no Sprint 4 Parte 1).
3. Reaproveitar a lógica/schema/componentes já especificados nos Sprints anteriores — não reinventar nada que já tinha uma especificação correta, apenas o que estava faltando ser implementado ou estava implementado errado.
4. Re-testar o item especificamente após a correção (não esperar até o final para validar tudo de uma vez).

## ATENÇÃO ESPECIAL (padrões já vistos neste projeto)

- Se algo estiver marcado como `NÃO EXISTE` apesar de ter sido relatado como pronto em Sprint anterior: investigar se existe só no backend sem página conectada (padrão do Sprint 3.5) ou se existe mas sem o Design System aplicado (padrão do Sprint 4) — os dois problemas mais recorrentes até aqui.
- Qualquer dado, score ou notificação que não bater com o esperado deve ser depurado na origem (trigger/função SQL), não "ajustado" na camada de exibição.

## SECURITY

Qualquer lacuna de RLS ou proteção de rota admin encontrada na auditoria tem prioridade máxima de correção nesta Parte, antes de qualquer outra coisa.

## QA

- Reexecutar, item por item, exatamente a checklist da Parte 1 — desta vez todos os itens devem terminar como `FUNCIONAL`.
- Qualquer item que continuar não totalmente resolvido deve ser reportado explicitamente como pendência conhecida (nunca marcado como resolvido sem re-teste real).

## ACCEPTANCE CRITERIA

- [ ] 100% dos itens marcados como problema na Parte 1 foram corrigidos e re-testados
- [ ] Nenhuma lacuna de segurança/RLS remanescente
- [ ] Checklist completa da Parte 1 re-executada com resultado `FUNCIONAL` em todos os itens (ou pendência explicitamente documentada, se algo genuinamente não puder ser resolvido agora)

## DO NOT BREAK

Tudo que já estava genuinamente `FUNCIONAL` na auditoria da Parte 1 — não mexer no que já funciona só por estar "reorganizando".

## DO NOT IMPLEMENT

Qualquer feature nova do Sprint 5 (Marketplace Connector) — isso é exclusivamente a Parte 3, e só deve começar depois desta remediação fechada.

## FINAL VERIFICATION

Relatório final: checklist completa re-executada com todos os resultados, o que foi corrigido, qualquer pendência genuína que não pôde ser fechada agora (com justificativa técnica), e confirmação explícita de que a base está sólida o suficiente para iniciar o Sprint 5 real.
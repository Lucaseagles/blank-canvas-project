# RUBI Eagles 11× — Sprint 165, entrega híbrida

## [UPGRADE] Integridade da produção criativa
Criação, edição e exclusão de variantes criativas passam pela RPC `rubi_mutate_variant_audited`, em que a mudança e a trilha do Shadow Master ficam na **mesma transação**. Verifica o Owner e a revisão da variante; mantém a exigência de revisão editorial, licenças declaradas e movimento revisado antes de avançar o status. Se falhar o registro de auditoria, a mudança inteira é revertida.

Os registros administrativos contêm somente ação, variante, movimento, revisão e status. Não copiam textos de criativos nem notas privadas de evidência.

## [COBERTURA] 11.3 — candidato, ainda parcial
Este upgrade acrescenta o ciclo de vida das variantes à auditoria, complementando Stories (162), movimentos (163), campanhas (164) e o painel (161). **Não** confirma rastreamento completo de preços, fornecedores, distribuição, produtos ou todas as permissões. Cobertura oficial segue **34/48 = 70,8%** até a reauditoria de cada fluxo crítico.

## Gates
1. TypeScript, lint, build, regressões, ambos CI verdes.
2. Merge na main.
3. Aplicar migração no Supabase `heartful-helper-box`, verificar privilégios.
4. QA com variante autorizada e testes de revisão concorrente, falha de auditoria e exclusão, sem criar conteúdo artificial em produção.
5. Matriz 11.3 deve comparar as mutações administrativas obrigatórias versus caminhos auditados.

**Meta seguinte**: 36/48 = 75%; ganho real depende de conclusão de critérios, não do número de PRs.

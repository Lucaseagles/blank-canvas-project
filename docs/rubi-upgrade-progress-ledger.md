# RUBI Eagles — controle de progresso dos upgrades

**Atualizado:** 2026-11-17  
**Base de cobertura V1:** último valor formalmente comprovado, 36,5/48 = 76,0% (revisão pós-Sprint 207).  
**Regra:** upgrade técnico não soma ponto automaticamente à matriz V1. Só há aumento quando um critério específico muda de 0/0,5 para 1,0 e a evidência é reavaliada.

## Indicadores separados

1. **Cobertura V1:** pontos aprovados / 48.
2. **Progresso do lote de upgrades em execução:** entregas técnicas aceitas / entregas previstas no lote fechado.
3. **Programa completo de upgrades:** percentual global só será publicado após inventário de tarefas com escopo e critérios de aceite fixados. Não usar número arbitrário de sprints nem contar uma mesma correção em várias frentes.

## Lote A — integridade e segurança de autorização

Escopo fechado em três entregas independentes, com evidência e aceite verificáveis:

| Entrega | Evidência | Status |
|---|---|---|
| A1 — ciclo de vida atômico de bundles e relacionamentos | PR #231 integrado; migração aplicada; testes de criação/edição/exclusão e relacionamentos | Concluído |
| A2 — endurecimento das funções Vault do Secure Hub | PR #232 integrado; `search_path = ''`; execução apenas por `service_role`; dois workflows verdes no SHA final | Concluído |
| A3 — ledger de autorização de produtos de parceiros server-only | PR #233 em validação; migração aplicada; privilégios pós-aplicação verificados; aguardando os dois workflows verdes no SHA final | Em validação |

**Progresso do Lote A:** 2/3 entregas concluídas = **66,7%**.  
A terceira entrega só entra no numerador após Hub V1 integration QA e Sprint 33 QA verdes no mesmo SHA e merge confirmado.

## Frentes restantes do programa global

Estas frentes são categorias de inventário, não tarefas artificialmente contadas como concluídas:

1. Integridade e auditoria administrativa.
2. Segurança, permissões e isolamento.
3. Consistência de dados e concorrência.
4. Integridade financeira e parceiros.
5. Ciclo de vida e jornadas ponta a ponta.
6. UX, responsividade e acessibilidade.
7. Testes, observabilidade e confiabilidade.
8. Integrações externas e contratos.

O inventário global deve listar cada pendência concreta, arquivo/fluxo afetado, risco, dependência externa, teste de aceite e sprint/PR de evidência. Só depois de fechar essa lista será calculado o percentual global de upgrades.

## Critérios mínimos para concluir um upgrade

- Causa e escopo identificados no código/DB real.
- Correção aplicada sem enfraquecer autorização, privacidade ou auditoria.
- Teste de regressão específico executado.
- Hub V1 integration QA e Sprint 33 QA verdes no mesmo SHA final.
- Migração aplicada e privilégio/policy conferidos no Supabase correto quando aplicável.
- Merge confirmado e evidência registrada.

## Regra de divulgação

Em cada atualização, publicar separadamente:
- cobertura V1 (x/48 e %);
- progresso do lote atual (x/y e %);
- progresso global de upgrades, apenas quando o inventário global estiver fechado;
- upgrades concluídos, em validação e bloqueados externamente;
- classificação da sprint: upgrade, cobertura ou ambos.

**Não confundir** código pronto com integração concluída, CI com teste E2E real, clique com venda, pré-checkout com compra, nem preparação de checkout com pagamento confirmado.

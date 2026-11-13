# RUBI Eagles 11× — Sprint 164, plano híbrido

## UPGRADE (mudança real)
As decisões administrativas de enviar campanha para revisão, aprovar e pausar deixam de depender de uma gravação isolada de status. A RPC transacional mantém o gatilho de auditoria de campanha existente e exige também um registro com o identificador do Shadow Master em `admin_audit_log`. Se esse registro falhar, a mudança de status é revertida.

**Não publica anúncios, não usa orçamento e não confirma vendas.** A checagem prévia do produto e do checkout aprovado permanece no servidor.

## COBERTURA (critério 11.3)
Esta entrega fecha outra lacuna de rastreabilidade, agora nas decisões de campanha. Entretanto, a trilha completa de todas as edições críticas do ecossistema ainda não foi verificada. O indicador **continua em 34/48 = 70,8%** até auditoria detalhada. Não somar pontos por quantidade de funções instaladas.

## Aceite de código
- Aprovação de TypeScript, lint, build e testes em ambos workflows de CI.
- Merge na main somente após os dois resultados verdes.
- Migração aplicada no Supabase correto e verificação do bloqueio a usuários `anon` e `authenticated`.
- Teste de concorrência, rollback e revisão com campanha real aprovada, quando existir.
- Reauditoria 11.3 com matriz de operações críticas cobertas e não cobertas.

## Próximo fechamento
Priorizar edição/criação de variantes, distribuição e alterações de preços, pois esses caminhos ainda precisam ter a mesma garantia de histórico do ator. Avaliar alternativas de gatilhos seguros sem duplicar os sistemas de auditoria. Meta 75%=36/48.

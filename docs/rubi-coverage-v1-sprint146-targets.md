# RUBI Eagles 11× — Sprint 146: movimento, validação de audiência e cobertura

**Matriz vigente após Sprint 145 aprovada:** 32,5/48 = 67,7% (critério 01.3 passou para 1,0).
**Sprint 146:** upgrade técnico com candidato futuro ao 08.2, sem alterar a pontuação automaticamente.

## [UPGRADE] Preparação de validação
- O editor Master mostra o motivo exato de repetição textual detectado pela verificação de qualidade no servidor, e bloqueia o estado “Pronto para revisão humana” quando os campos editoriais estão incompletos ou repetidos.
- Orientação em contexto para documentar fontes, datas, participantes/segmentos em termos apropriados, problema comprovado, hipótese e contraexemplos, sem inventar pesquisa.
- Regressão confirma o gate do editor e a checagem server-side. Não modifica produto, checkout, publicação, grants ou comissão.

## [COBERTURA] Meta 08.2, ainda parcial
O requisito 08.2 (público/ângulo validado) mantém **0,5/1**. Editar textos e acrescentar checklist NÃO comprova que uma hipótese comercial foi testada. Para obter 1,0 exigir:
1. Evidências reais do público-alvo coletadas de forma legítima e documentadas;
2. Critérios de aprovação do ângulo/objeções e rastreabilidade até o SKU/movimento;
3. Registros de revisão e resultados, com testes de integridade e acesso;
4. Aceite técnico após integração na main. Desempenho comercial real continua métrica separada.

## Marcos
- **Atual**: 32,5/48 = 67,7%.
- **Próximo passo (+0,5)**: 33/48 = 68,8% se 08.2 for concluído e aceito.
- **Meta**: 34/48 = 70,8% (faltam 1,5 pontos).

## Gates operacionais
- PR deve passar nos dois workflows (TypeScript, lint, build e regressões) antes de merge.
- QA em domínio publicado e primeiro SKU com checkout Kairos continuam pendentes; não atribuir qualquer compra ou conversão não confirmada.

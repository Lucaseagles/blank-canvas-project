# RUBI 11× — Sprint 67 | Retenção assistida, com consentimento

## Entrega
- O lojista aprovado pode optar por um acompanhamento **interno e opcional** ao enviar uma cotação. Escolhe 14, 30 ou 60 dias; padrão desativado.
- O lojista pode cancelar o acompanhamento de uma cotação própria, sem precisar pedir ao administrador.
- Admin Master recebe uma fila de até 100 tarefas com consentimento explícito e ainda não concluídas, ordenada por data, com prioridade para as vencidas.
- O Admin Master marca uma tarefa como concluída. Isso registra somente atendimento interno; não representa contato realizado, envio de mensagens, venda, pagamento ou recompra.
- Nenhum WhatsApp, e-mail, push ou cobrança é disparado automaticamente. Não se habilita marketing sem consentimento específico por canal e configuração adequada.
- O banco de dados preserva RLS e não expõe a tabela diretamente aos clientes; funções de servidor validam usuário e privilégio.
- Datas e status são calculados pelo servidor; intervalo inválido ou cotação de terceiro é rejeitado.

## Critérios de aceite
1. TypeScript, lint, build e teste `test:rubi-followup` aprovados.
2. Migração aplicada em `heartful-helper-box` e histórico de versão alinhado no GitHub.
3. Opt-in falso por padrão e revogável; fila não inclui solicitações sem aceite.
4. Lojistas só cancelam cotação pertencente à sua própria conta; painel Master só é acessível com role owner.
5. Nenhum evento conta como pedido ou faturamento confirmado.
6. Testes funcionais do app hospedado e operações Kairos seguem em etapa posterior.

## Progresso obrigatório a partir desta sprint
A cada PR concluído e integrado, comunicar porcentagem **estimada, não auditada por cobertura**, do aplicativo total e dos cinco pilares. Manter sempre a mesma base aproximada anterior, só ajustando o pilar efetivamente ampliado e sem tratar os testes CI como comprovação comercial.

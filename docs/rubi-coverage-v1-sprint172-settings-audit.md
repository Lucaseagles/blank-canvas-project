# RUBI Eagles 11× — Sprint 172: configurações com atualização e auditoria atômicas

## [UPGRADE]
- O mesmo painel avançado mantém as **15 fontes reais**; nenhum sistema paralelo é criado.
- A alteração e o evento administrativo agora pertencem a uma única transação via `rubi_update_admin_setting_audited`.
- O banco só aceita tabelas e colunas expressamente permitidas e recusa novos campos não revisados.
- Conflitos de edição são detectados comparando os valores anteriores enviados pela tela, impedindo sobrescritas silenciosas das chaves modificadas.
- O log registra somente as **chaves alteradas**, sem valores sensíveis de WhatsApp, Telegram, automações, campanhas ou páginas.
- Mantém validação de pesos e soma do mix de personalização igual a 100%.

## [CORREÇÃO E TESTES]
A antiga rotina atualizava registros e só depois chamava `append_admin_audit`, permitindo mudança sem histórico caso o segundo passo falhasse. Agora uma falha no log causa rollback da atualização. Tests validam o escopo fechado de 15 fontes, identidade do Owner, autorização de service role, privacidade, não regressão de concorrência e formulários de settings, algoritmo e banners.

## [COBERTURA] 11.3
A sprint avança a auditoria da configuração administrativa, complementando Stories, movimentos, variantes, campanhas, distribuição, produtos, fornecedores, atacado, banners e delegação de Masters. **Não elevar automaticamente a pontuação**: ainda precisamos verificar rotas administrativas adicionais e mutações fora desse editor, além de homologar o comportamento em operações autorizadas.

Base confirmada: **35/48 = 72,9%**. Meta: **36/48 = 75%**, exigindo um ponto técnico comprovado.

## Aceite
1. CI TypeScript, lint, build e testes verdes.
2. Merge no main.
3. Migração aplicada no Supabase correto e funções bloqueadas a anon/authenticated.
4. QA de rollback/concorrência, personalização, feature flags e integrações com dados legítimos.
5. Reauditoria do critério 11.3 e da matriz de 48 critérios; sem reivindicar resultados comerciais.

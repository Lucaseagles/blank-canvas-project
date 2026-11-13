# RUBI Eagles 11× — Sprint 170: fornecedor e atacado auditados na mesma transação

## Modo híbrido
**[UPGRADE]** Criar/alterar fornecedor e preços por faixa de atacado usa transações que gravam a decisão do Owner no histórico Master. Atualizar o domínio de checkout exige que os produtos associados estejam despublicados e sem checkout verificado. O formulário do fornecedor agora carrega sua revisão para impedir sobrescrita concorrente. Atualizar uma faixa B2B bloqueia o registro do produto e exige uma configuração de atacado válida.

**[CORREÇÕES]** Remoção de duas gravações isoladas sem registro atômico; checagem de preços, quantidades e host; logs sem divulgar o endereço de checkout; acesso das RPCs apenas ao serviço autorizado, com autenticação Owner no servidor.

**[TESTES]** Contratos de transação, identificação do ator, concorrência, vínculos com produtos, limites e privilégios. Além do CI, será necessária validação transacional no ambiente publicado com dados comerciais autorizados.

## Cobertura 11.3
A Sprint 170 acrescenta auditoria de fornecedor e preço do atacado, complementando Stories, movimentos, variantes, campanhas, distribuição, produtos e gestão de Masters. Entretanto, os fluxos de configurações administrativas e outros caminhos de alterações críticas ainda precisam de verificação. **Cobertura aprovada permanece 35/48=72,9%**, e não 75%. Não contabilizar pontos apenas pela quantidade de sprints.

## Gates para encerramento técnico
- CI TypeScript, lint, build e regressões nos dois workflows.
- Merge da implementação na main.
- Aplicação de `20261113110000_rubi_supplier_b2b_atomic_audit.sql` no Supabase correto e confirmação das permissões de execução.
- QA real de alteração de fornecedor, limite de preço, lock concorrente, bloqueio de host e rollback; sem inventar vendas ou produtos em produção.
- Reauditoria global dos pontos descobertos em `11.3`.

**Meta seguinte:** fechar os 0,5 pontos de 11.3 e outro critério parcial para atingir 36/48 = 75% se ambos forem aceitos.

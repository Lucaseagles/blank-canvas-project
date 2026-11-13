# RUBI Eagles 11× — Sprint 171, correção híbrida de banners

## [UPGRADE]
Criação e exclusão de banners administrativos passam a ocorrer na mesma transação que o registro auditado pelo Owner, sem gravação isolada seguida de auditoria separada. Um erro no histórico impede que o banner fique cadastrado ou excluído isoladamente.

## [CORREÇÕES + TESTES]
A RPC só é executável pelo service_role e valida o papel Owner; a origem do ator é a sessão autenticada no servidor, nunca um ID do cliente. Os logs mantêm estado e posicionamento sem copiar links ou mídia. Criação mantém validações de campos, data e tamanho. Testes de contrato impedem regressão para gravações separadas.

## [COBERTURA]
O critério 11.3 continua 0,5/1 até inspecionar e proteger atualizações genéricas de configurações, grants e outras rotas críticas. Cobertura técnica v1 confirmada: **35/48 = 72,9%**. A meta permanece 36/48 = 75%, sem pontuar apenas por PRs ou CI.

## Gates
- Dois workflows CI completos e verdes.
- PR integrado à main.
- Migração aplicada ao Supabase correto e checagem de permissões.
- Testes com banner real e reversão transacional em ambiente autorizado, sem produzir publicidade fictícia em produção.
- Reauditoria 11.3 de ponta a ponta.

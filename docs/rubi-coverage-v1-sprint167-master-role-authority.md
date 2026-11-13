# RUBI Eagles 11× — Sprint 167 (híbrida): Masters sem e-mail fixo

## [UPGRADE]
A autorização administrativa deve se basear no papel `owner` verificado no banco, sem usar e-mail como controle de acesso. O Master fundador mantém a exclusividade de concessão e revogação de novos Masters, sem impedir que outros Masters autorizados acessem a gestão.

## [CORREÇÃO DE SEGURANÇA]
- O banco `heartful-helper-box` tem apenas um `owner` antes da migração; esta é a condição de bootstrap e evita escolher silenciosamente entre vários.
- Tabela `rubi_primary_master`, com exatamente um registro possível, RLS ativa e sem acesso direto a `anon` ou `authenticated`.
- Políticas antigas de escrita direta em `user_roles` por Owner são removidas. A função transacional de concessão/revogação é executável apenas por service role e verifica a identidade do fundador usando UUID + papel atual.
- O próprio Master fundador não pode ser revogado pela nova função. Cada operação gera evento em `admin_audit_log`, na mesma transação.
- Contas devem existir previamente no Supabase Auth; o usuário alvo não pode criar o próprio papel.
- As telas `/admin` e barra lateral consultam o papel owner, não o e-mail fixo. Em `/admin/settings` há gestão de Masters visível somente ao fundador.

## [COBERTURA] Critério 11.4
Candidato a completar `11.4 — Múltiplos Masters sem hardcode`, de 0/1 para 1/1, após dois CI aprovados, merge, bootstrap e checagem dos privilégios no Supabase, testes de isolamento e reauditoria da matriz.

Base anterior: `34/48=70,8%`. Alvo condicional: `35/48=72,9%`.

**A conclusão do código não substitui E2E de concessão/revogação**, que exige uma segunda conta real consentida e deve ser feita em ambiente de validação, sem inventar contas de produção. Na ausência deste E2E, diferenciar cobertura técnica estática de homologação administrativa.

## Gates
1. CI TypeScript, lint, build e regressões verdes em ambos os workflows.
2. Merge na main.
3. Aplicar migração no Supabase correto e confirmar um único fundador, privilégios da função e revogação DML de usuários comuns.
4. Garantir que o fundador continue com acesso e que o controle não possa ser usado por outros Masters.
5. Registrar reauditoria para qualquer pontuação efetivamente comprovada.

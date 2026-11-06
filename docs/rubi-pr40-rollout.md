# RUBI PR #40 — ativação segura de atacado por parceiro

## Status e dependências
A alteração adiciona a tabela `hub_partner_wholesale_permissions` (desativada por padrão), funções server-side e interfaces para Shadow Master e parceiros. O tipo `expert` **não** concede permissão automaticamente.

**Não integrar nem publicar como recurso funcional antes de confirmar a existência da tabela no ambiente de destino.** Os testes de CI validam build/TypeScript, não a existência da tabela nem os fluxos reais de permissão.

## Sequência de implantação sem Supabase Branch pago
1. Revisar a migration `supabase/migrations/20261106000200_rubi_partner_wholesale_permissions.sql`, permissões RLS e dependências das tabelas existentes.
2. Aplicar a migration somente no projeto/ambiente autorizado, em janela controlada e com procedimento de backup. Não executar a partir do PR automaticamente.
3. Verificar que a tabela existe, que RLS está habilitada, que `anon` e `authenticated` não possuem acesso direto e que não há políticas públicas.
4. Publicar o aplicativo correspondente e testar com contas distintas: Shadow Master, parceiro aprovado, parceiro pendente e consumidor.
5. Confirmar a regra de negação por padrão; parceiro aprovado sem concessão não vê ofertas B2B.
6. Autorizar produto de teste, então liberar atacado para **um** parceiro; somente esse parceiro deve ver o preço B2B.
7. Revogar a permissão de atacado e depois o grant do produto; ambas as ações devem remover o preço B2B da resposta do servidor.
8. Verificar que tipo `expert` sozinho não concede acesso; que consumidor e outro parceiro não obtêm preço B2B; que comissões não são alteradas.
9. Verificar comportamento quando produto é despublicado ou preço B2B removido.

## Reversão
Se houver falha na aplicação, primeiro revogar as concessões ativas ou desativar a funcionalidade no aplicativo. Não remover a tabela enquanto o código publicado depender dela. Restaurar a versão anterior do aplicativo, validar a estabilidade e só então considerar uma migration reversa separada.

## Limitações
Este PR exibe condições autorizadas para consulta, não gera pedidos, checkout, atribuição externa ou pagamento de comissão. A concessão é por parceiro e produto, não por faixa de preço personalizada; usa as faixas B2B já cadastradas.

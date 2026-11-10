# RUBI 11× — Sprint 65 | Business: cotações e reposição

## Mudança funcional
O catálogo atacadista `/wholesale` já tinha somente o simulador. Nesta sprint:
- Lojista com perfil **merchant aprovado** envia solicitação com até 12 produtos, quantidades, observação e cálculo do preço **feito novamente no servidor**;
- Histórico das últimas 30 solicitações do próprio lojista, com resposta comercial do Master;
- Reutilização de quantidades de uma cotação antiga **em nova simulação**: recalcula preços do catálogo vigente, não faz novo pedido;
- Admin Master visualiza as 100 solicitações mais recentes e registra status (`requested`, `reviewing`, `responded`, `closed`) e resposta comercial;
- Regras comerciais e RLS não dependem dos URLs de checkout Kairos. Estas solicitações não representam pedido pago, estoque reservado, repasse ou recorrência cobrada automaticamente.

## Proteções
- Serviço valida token real do usuário via Supabase Auth e perfil merchant **approved**, sem confiar em `user_id` vindo do cliente;
- Verifica fornecedor/produto ativos, mínimo de unidades, preços por faixa e preço total; calcula valores monetários em centavos inteiros;
- Recusa ID de produto repetido, quantidade inválida e total acima do limite; limita a dez solicitações por hora por perfil comercial;
- A tabela `hub_b2b_quote_requests` possui RLS e revoga acesso direto de `anon`/`authenticated`. A escrita ocorre por função de servidor confiável;
- O proprietário responde via função com `requireOwnerRole`, sem editar preço de histórico ou elevar cotação a venda;
- Os valores são um **snapshot de estimativa**; exigem novo acordo e validação de estoque quando houver compra real.

## Testes de aceitação
1. CI: TypeScript, lint, build, integração e testes `test:rubi-business` verdes;
2. Lojista aprovado consegue registrar e consultar só as suas cotações. Visitante e lojista pendente não conseguem;
3. Preços informados no navegador não são aceitos; só produtos e quantidades são enviados ao servidor;
4. Limite mínimo, maior faixa aplicável, caps de quantidade e condição de fornecedor inativo são respeitados;
5. Master vê fila e registra resposta; outros usuários não podem visualizar ou atualizar;
6. Retornar à simulação não insere uma solicitação nem preserva preço antigo;
7. As métricas de pedidos pagos continuam em zero até existir evidência externa, independentemente de cotações.

## Bloqueios não impeditivos
- Produtos/URLs Kairos reais ainda não chegaram;
- Testes de navegador e dispositivos no ambiente hospedado serão posteriores ao CI;
- Pedidos pagos e reposição automática exigem integração de checkout, confirmação de pagamento e fornecedor.

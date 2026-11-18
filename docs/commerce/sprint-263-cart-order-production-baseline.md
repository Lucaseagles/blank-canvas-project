# Sprint 263 — auditoria de base para carrinho e pedidos

Status: diagnóstico somente leitura; nenhuma alteração no Supabase de produção.

## Resultado executivo

A auditoria confirma que o ecossistema já possui dois catálogos e um fluxo de pré-checkout de fornecedor, mas ainda não possui uma estrutura persistente unificada de carrinho e pedidos próprios RUBI. Portanto, não é seguro implementar um carrinho genérico em cima de favoritos, links de afiliado ou registros de vendas confirmadas de parceiros.

## Evidências verificadas

Projeto consultado: `heartful-helper-box` (`akfvkjarpgocdsieuvvq`).

- Histórico do Supabase: 219 migrations; última versão registrada: `20261118001747` (`rubi_profile_privilege_hardening_sprint234`).
- Catálogo RUBI/fornecedores: `hub_products`, relacionado a `hub_suppliers`. Há campos de checkout externo do fornecedor, como host/domínio e URL revisada do produto.
- Catálogo marketplace/afiliados: `products`, relacionado a `marketplaces`, com `affiliate_url`, `current_price`, identificador externo e metadados de marketplace.
- Favoritos: `favorites` associa usuário e `products`; não representa carrinho, reserva de preço ou intenção de compra confirmada.
- Parceiros: `hub_partner_referral_links`, `hub_partner_referral_visits` e `hub_partner_confirmed_sales`. A tabela de vendas confirmadas guarda referência externa, origem, valor bruto, comissão, provedor e evidência de pagamento/verificação.
- A busca no catálogo de tabelas públicas não encontrou tabelas dedicadas a carrinho, pedido, checkout session ou ledger financeiro universal.
- A busca de funções SQL por nomes contendo cart/order/checkout/finance retornou apenas funções de contagem de pré-checkout editorial e reordenação de módulos; não revelou RPC de carrinho ou criação de pedido.
- Busca de código encontrou a especificação de jornada já existente, mas não uma implementação persistente de `rubi_carts` / `rubi_cart_items` / `rubi_orders` / `rubi_order_items`.

## Distinções obrigatórias

1. `products`: catálogo de marketplace/afiliado; aquisição normalmente ocorre fora do RUBI por link externo.
2. `hub_products`: catálogo próprio/fornecedor; pode encaminhar para checkout externo do fornecedor, conforme configuração verificada.
3. Favorito: intenção de salvar, não compra.
4. Clique/redirect: prova de saída do RUBI, não prova de pedido ou pagamento.
5. `hub_partner_confirmed_sales`: evidência comercial de venda atribuída a link de parceiro, não deve ser duplicada por uma nova tabela genérica de comissões.
6. Pedido RUBI: ainda requer modelo próprio para snapshot e histórico; criação de pedido não significa pagamento recebido.

## Decisão técnica para a próxima implementação

- Manter carrinhos separados por canal/destino comercial. Não misturar marketplace afiliado com carrinho de loja própria.
- Usar chave composta lógica `catalog_type + product_id`, pois os catálogos têm IDs UUID em domínios distintos.
- Salvar snapshots de título, imagem, preço exibido, moeda, quantidade, fornecedor/marketplace e destino; preço enviado pelo cliente nunca é fonte confiável.
- Não expor custo de fornecedor ao consumidor ou parceiro.
- Criar pedido com idempotência e transação atômica; preservar itens imutáveis e eventos append-only.
- Separar status do pedido, evidência de pagamento, recebimento/repasse, comissão e liquidação.
- Vincular vendas de parceiros já confirmadas quando houver referência externa confiável; não contar a mesma venda duas vezes.
- Não habilitar integração Kairos/marketplaces sem documentação oficial, credenciais e mecanismo comprovável. Enquanto isso, usar importação de relatórios e revisão manual auditável.
- Não alterar RLS, grants, policies, migrations ou dados de produção neste sprint.

## Portões antes de criar migrations

1. Inspecionar políticas RLS, grants, funções SECURITY DEFINER, proprietários e search_path de `hub_products`, `hub_suppliers`, tabelas de parceiro e futuros objetos.
2. Validar o modelo contra os fluxos de fornecedor e marketplace e contra a atribuição atual.
3. Testar migrations em banco descartável com histórico reproduzível.
4. Testar isolamento entre usuário anônimo/autenticado, consumidor, parceiro e Shadow Master.
5. Testar concorrência, merge de carrinho, preço alterado, link revogado, repetição de checkout, duplicação de eventos e reversões.
6. Só então abrir implementação de schema e server functions.

## Classificação e progresso

- Sprint 263: auditoria/upgrade de arquitetura; não aumenta cobertura V1.
- Cobertura V1 permanece no último baseline formal conhecido: 36,5/48 (76,0%), 11,5 pontos restantes. Não houve reavaliação da matriz neste diagnóstico.
- Progresso global de upgrades: sem denominador consolidado confiável; não publicar percentual fictício.
- Produção: somente leitura; nenhuma migration aplicada.

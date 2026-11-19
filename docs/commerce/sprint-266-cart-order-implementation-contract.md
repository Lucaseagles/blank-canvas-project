# Sprint 266 — contrato de implementação segura do carrinho RUBI

Status: especificação técnica executável; nenhuma migration ou escrita em produção.

## Objetivo híbrido

Consolidar em uma entrega as decisões de domínio, segurança, concorrência, atribuição e critérios de cobertura para que a primeira implementação persistente não precise ser refeita. Esta sprint é upgrade arquitetural/preparação; não declara ponto novo da matriz V1 sem reavaliação formal do critério.

## Decisão de domínio: dois canais, duas jornadas

### A. Loja RUBI / fornecedor (first-party orchestration)

- O catálogo é `hub_products`, com fornecedor em `hub_suppliers`.
- O carrinho RUBI pode guardar intenção e snapshots dos itens elegíveis.
- O checkout pode encaminhar para fornecedor externo aprovado; RUBI não presume que controla o pagamento.
- Um pedido RUBI representa o pedido/intent registrado no ecossistema, não pagamento confirmado.
- O status de pagamento só muda com evidência verificável e revisão/integração autorizada.

### B. Marketplace / afiliado (outbound)

- O catálogo é `products`, associado a `marketplaces`.
- O CTA continua sendo link externo; não cria pedido RUBI de loja própria nem promete carrinho compartilhado.
- RUBI registra clique/redirect e, quando disponível, referência/relatório externo.
- Comissão de afiliado é receita/recebível conforme relatório e regra contratual; não é o valor bruto do produto.
- Favoritos/lista salva podem reunir itens dos dois canais, mas isso não os transforma em um carrinho ou checkout comum.

## Modelo lógico proposto — sujeito a validação no banco descartável

1. `rubi_carts`: id, owner_user_id (ou sessão anônima assinada, se habilitada), channel, currency, status, revision, created_at, updated_at.
2. `rubi_cart_items`: id, cart_id, catalog_type, product_id, quantity, snapshot JSON validado no servidor, created_at, updated_at. Identidade lógica única: cart + catalog_type + product_id + variante/destino quando existir.
3. `rubi_orders`: id, public reference não sequencial, owner, channel, order_status, currency, totals calculados no servidor, idempotency key, created_at.
4. `rubi_order_items`: snapshots imutáveis do SKU, título, imagem, preço unitário, moeda, quantidade, fornecedor/marketplace, regra de frete/imposto se conhecida e destino classificado.
5. `rubi_order_events`: histórico append-only, event_type, actor, source, idempotency key, occurred_at, recorded_at e referência de evidência.
6. `rubi_external_order_refs`: provider/source, external order reference, estado de verificação, origem/partner link, evidence reference e timestamps.

Não criar estes objetos até reconciliar nomes, constraints, migrations e relações existentes na base de produção e testar toda a cadeia em banco descartável.

## Invariantes obrigatórios

- O browser nunca escolhe owner_user_id; o servidor deriva identidade de sessão autenticada.
- Sem identidade autenticada, não persistir carrinho em tabela compartilhada sem token aleatório de alta entropia, hash no banco, expiração, rate limit e estratégia explícita de merge.
- Cada operação revalida produto ativo, fornecedor ativo, checkout aprovado, preço e moeda no servidor.
- Preço, desconto, custo do fornecedor, comissão e total enviados pelo cliente são ignorados como autoridade.
- `catalog_type + product_id` é obrigatório; UUID isolado não identifica domínio.
- Um carrinho não mistura marketplace affiliate com fornecedor/loja RUBI.
- Mudança de preço atualiza o preview e exige confirmação explícita antes da conversão em pedido; nunca altera snapshot de pedido já criado.
- Criação de pedido usa transação e idempotency key única por owner + operação; repetição devolve o mesmo resultado sem duplicar pedido.
- Checkout concorrente bloqueia/revisa a mesma revisão do carrinho; só uma conversão pode consumir a revisão.
- Iten(s) de pedido são imutáveis; correções são eventos/ajustes compensatórios.
- Pedido criado, checkout redirecionado, venda confirmada, pagamento recebido e liquidação são estados/dominios diferentes.
- `hub_partner_confirmed_sales` permanece fonte de evidência específica para venda de parceiro. Não duplicar comissão; vincular apenas por referência externa confiável.
- `supplier_cost` e notas privadas de auditoria nunca aparecem em DTO público ou resposta de parceiro.
- Shadow Master permanece restrito à conta autorizada existente; nenhum papel novo ganha acesso global.

## Contrato de acesso

- Nenhuma leitura/escrita direta pelo browser nas tabelas de domínio privilegiado `hub_*`.
- Server functions TanStack Start usam sessão autenticada e autorização no servidor; não aceitar user_id fornecido pelo cliente.
- Se RPC for necessária, limitar EXECUTE a papéis estritamente necessários, validar auth.uid() dentro da função, fixar search_path e revisar SECURITY DEFINER/owner.
- RLS em cada nova tabela: política de proprietário para consumidor; escopo próprio para parceiro apenas em projeções específicas; nenhuma política genérica para Master.
- Negativos obrigatórios: anon, usuário B tentando ler/escrever carrinho/pedido do usuário A, parceiro lendo outro parceiro, consumidor tentando ler supplier_cost, e usuário comum tentando acessar Shadow Master.
- Revisar grants, policies, FORCE RLS, owners e funções privilegiadas; não inferir segurança apenas porque RLS está habilitado.

## Contrato de preço e concorrência

1. Adicionar item: buscar produto e fornecedor no servidor, validar ativo/publicável, preço positivo e moeda; persistir snapshot e revision.
2. Alterar quantidade: validar inteiro dentro de limite comercial; recalcular com preço atual do servidor; usar update condicional pela revision.
3. Iniciar checkout: bloquear carrinho/revision, revalidar todos os itens e destino; devolver resumo atualizado, sem criar pagamento.
4. Confirmar pedido: exigir aceite da revisão/total exibido, criar order + items + evento inicial na mesma transação e gravar idempotency key.
5. Repetir requisição: mesma chave e mesmo payload retorna mesmo pedido; mesma chave com payload divergente retorna conflito.
6. Produto desativado, fornecedor pausado, destino revogado ou preço alterado: bloquear conversão e pedir revisão, sem fallback silencioso.

## Observabilidade e integração financeira

Eventos comportamentais (view/add/remove/checkout intent/redirect) alimentam algoritmo e funil, mas são observações não financeiras. Pedido é registro comercial. Evidência é comprovação externa. Ledger/settlement é movimento financeiro. Os dashboards devem mostrar cada camada separada.

Para marketplaces sem API, suportar futuramente importação de relatório validado e revisão manual auditável. Kairos permanece integração não confirmada até documentação oficial, credenciais e mecanismo de confirmação verificável. Nunca marcar compra como paga por parâmetro de retorno ou evento do navegador.

## Plano de entrega em fatias coesas

- F0 (esta sprint): contrato, invariantes e matriz de testes — concluída nesta especificação.
- F1: validar schema/migration history e construir banco descartável reproduzível; sem produção.
- F2: implementar carrinho autenticado first-party mínimo (sem carrinho anônimo até desenho de token/merge aprovado).
- F3: criar pedido idempotente e snapshots imutáveis em transação.
- F4: ligar eventos de jornada sem elevar eventos a vendas.
- F5: ligar evidências externas/relatórios e reconciliação financeira.
- F6: dashboards Master e parceiro com escopo mínimo.
- F7: revisão de segurança, performance, concorrência e LGPD.

Cada fase deve incluir TypeScript, lint, unit/integration, autorização negativa, concorrência, build, workflows CI e verificação de regressão nos fluxos já existentes.

## Critérios de aceite da implementação

- [ ] Dois canais de compra continuam separados.
- [ ] Sem acesso cross-user ou cross-partner.
- [ ] Preço e disponibilidade sempre revalidados no servidor.
- [ ] Idempotência comprovada sob retry e concorrência.
- [ ] Snapshot de pedido imutável após mudança no catálogo.
- [ ] Nenhuma exposição de supplier_cost.
- [ ] Nenhum pedido/pagamento/commission inferido de click/redirect.
- [ ] Venda de parceiro não duplicada em fonte de comissão.
- [ ] Shadow Master permanece privado.
- [ ] Migrations passam em banco descartável desde baseline reconciliado.
- [ ] CI e testes de integração passam no commit exato submetido.

## Scorecard híbrido

- Classificação: upgrade arquitetural e redução de risco, não cobertura V1 comprovada.
- Cobertura formal mantida no último baseline auditado: 36,5/48 = 76,0%; 11,5 pontos pendentes.
- Upgrade global: percentual ainda não publicado porque o inventário completo precisa de denominador reconciliado.
- Produção: nenhuma migration, policy, grant ou dado alterado.

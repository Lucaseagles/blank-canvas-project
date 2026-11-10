# HUBI — Sprint comercial #61: matriz de aceitação e auditoria

## Objetivo
Transformar os cinco ativos (Eclipse App, Store, Achadinhos, Partners, Business) em jornadas comerciais verificáveis. As estratégias complementares (conteúdo, creators, comunidades, social selling, SEO, indicação, recompra, kits, lives, conversão por WhatsApp, mídia paga) reutilizam os ativos; não exigem módulos separados.

## Regra de status
- **Existe**: rota, tabela ou componente identificado no repositório.
- **Funciona**: testes automatizados e fluxo real aprovados, inclusive permissão e estados de erro.
- **Validado comercialmente**: cliques, vendas confirmadas, atribuição e margem medidos.
- **Pendente**: falta implementação, integração ou evidência. Nunca declarar pronto apenas por existência.

## Jornadas e critérios de aceitação
| Frente | Jornada mínima | Critério de aceite |
| --- | --- | --- |
| Eclipse consumidor | descoberta → oferta → destino → retorno | oferta ativa e preço correto; métricas de clique; indicação explícita de checkout externo |
| Achadinhos afiliados | vídeo/categoria → produto → link atribuído | URL válida, publicidade identificada, oferta vigente e origem rastreável |
| TikTok Shop | produto elegível → conteúdo → destino oficial | verificar regras e habilitação de seller/affiliate, preço, estoque, frete, taxas, autorização de conteúdo e dados de conversão; não presumir API |
| Achadinhos B2B | vídeo para lojista → preço por volume → contato/cotação | conta de lojista aprovada, mínimo e margem por faixa, fornecedor autorizado |
| Store/Kairos | catálogo → oferta → checkout fornecedor → confirmação | preço e participação contratual confirmados; atribuição de pedido testada; sem afirmar venda a partir de clique |
| Partners | cadastro → questionário → classificação → aprovação → produto autorizado → proposta/copy/kit → link → venda → comissão | testar perfis (expert, influenciador, microinfluenciador, afiliado), isolamento, revogação, percentual por acordo, conciliação, estorno e dashboard |
| Business | lojista → catálogo atacado → cotação/pedido → recompra | preços por quantidade, disponibilidade, pagamento e logística verificados |

## Personalização e algoritmo
- Sinais declarados: papel, nicho, categorias, preferências e interesses; sinais comportamentais apenas com base legal, transparência e controles apropriados.
- Seleção de vídeos por categoria + elegibilidade + disponibilidade + relevância; jamais mostrar preço atacadista ao consumidor sem autorização.
- Fallback editorial quando não houver sinais suficientes; testar ausência de dados, bloqueio de produto e fornecedor inativo.
- Não afirmar que já há recomendação automatizada sem testes de ranking, filtros e eventos reais.

## Kit do parceiro (hipótese a auditar antes de implementar)
1. Questionário e classificação com possibilidade de revisão administrativa.
2. Acordo: produto, comissão sobre base explicitada, validade, condições, estornos e responsabilidades.
3. Copy aprovada e adaptada ao canal/nicho; declarações publicitárias, sem promessas não comprovadas.
4. Criativos e roteiro com permissão de uso; link individual e UTM.
5. Dashboard: visitas separadas de vendas confirmadas, comissão acumulada, paga e pendente.
6. Revogação imediata e bloqueio de produtos sem autorização.

## Próximas ações técnicas
1. Inventariar rotas, funções, tabelas, permissões e telas existentes por jornada; marcar evidências e lacunas.
2. Priorizar bloqueios de primeira venda e de segurança; implementar mudanças pequenas em PRs separados.
3. Rodar TypeScript, lint, build e testes de integração, depois testes manuais dos três perfis.
4. Validar Kairos e TikTok Shop somente com acesso/documentação/credenciais oficiais e condições comerciais.
5. Publicar páginas e campanhas somente após confirmar oferta, destino e atribuição.

## Guardrails
Sem migrations, mudanças de checkout, disparos de marketing, pagamentos reais, contas externas ou alteração de acesso Shadow Master sem autorização específica. Não inventar taxas de comissão ou dados de desempenho.


## Incremento RUBI 11× — auditoria de 2026-11-09 (branch #61)

### Evidência verificada no código
- `/admin/hub-catalog` contém `supplier_cost`, `retail_price`, `b2b_base_price` e mínimo B2B; nesta branch foi incluída **prévia privada** de diferença bruta por canal (direta, divisão ilustrativa 50/50 com parceiro, atacado e pedido mínimo). **Não** altera preços persistidos, acordos nem comissões.
- `/r/$code` resolve somente link ativo com parceiro aprovado, concessão de produto ativa, fornecedor/produto ativos; registra uma visita e **não** um pedido. Nesta branch foi incluído cadastro opcional via `/auth?returnTo=/r/<code>` e retorno à mesma indicação após login. Não bloqueia consulta do produto.
- `/partner/portal` tem catálogo autorizado, links, visitas, vendas e comissões contabilizadas separadamente; `/wholesale` tem simulação de pedido mínimo e preços progressivos; `/onboarding` aceita os três públicos.
- `/hub-shop` e `/r/$code` ainda **não executam checkout real** do fornecedor. Nada neste incremento declara vendas recebidas, pedidos pagos ou lucro líquido.

### Regra de métricas para projeção 11×
- **Aquisição:** `source`, campanha, perfil, criativo, link e visitantes distintos; distinguir visita de cadastro e evitar contagens duplicadas entre redes.
- **Partners:** abordado → interessado → aprovado → ativo com oferta → visitante → pedido pago → comissão devida → comissão paga; o denominador de pedidos/parceiro é somente parceiro vendedor ativo no período.
- **Business:** loja cadastrada → aprovada → cotação → pedido pago → unidades confirmadas → recompra por coorte; preços e custos validados por fornecedor e faixa de volume.
- **Consumidor/Store:** novo cadastro → ativação → interação → oferta vista → pedido direto confirmado → recompras por coorte; marketplaces contabilizam **somente comissão atribuída**, não valor bruto externo como receita da RUBI.
- **Margem ilustrativa direta:** varejo − custo total confirmado do fornecedor; **parceiro:** parcela RUBI da base contratada, não fixar 50% automaticamente; **B2B:** preço efetivo por faixa − custo total por unidade; subtrair taxas reais, impostos e reembolsos para margem de contribuição.
- **Meta 11×:** projetar por funil inverso (`pedidos = visitas qualificadas × conversão`) e capacidade de fornecimento; sem probabilidades inventadas de viralização nem garantia de resultado.

### Aceitação pendente antes da publicação
1. CI de TypeScript, lint e build verde; verificar casos negativos de acesso não autorizado ao Admin Master.
2. Testar no navegador `/r/<code>` válido, revogado, fornecedor inativo, login existente, registro novo e redirecionamento pós-login. A visita registrada não deve ser confundida com compra.
3. Verificar margem exibida para `varejo=97`, `custo=48`, `B2B=58`, `mínimo=10`: direta R$49; exemplo parceiro R$24,50 por lado; atacado R$10/unidade e R$100/pedido mínimo.
4. Obter integração oficial da Kairos, regras de atribuição e evidência de pedido confirmado **antes** de habilitar CTA de pagamento ou liberar comissão.
5. Validar ofertas e perfis com testes manuais mobile/desktop dos três logins; medir taxas reais em operação antes de ajustar a projeção.


## Incremento RUBI 11× — ciclo de 2026-11-09, 35 estratégias

### Implementações desta branch
- `src/lib/rubi-growth-11x.ts`: registro tipado de 35 iniciativas organizadas em Eclipse/Base, Store/Margem, Achadinhos/Aquisição, Partners/Distribuição e Business/Recorrência. Cada entrada inclui público, ação, métrica, rota e **evidência** (`code-observed` = código identificado, não testado; `execution-plan` = execução planejada; `external-blocker` = dependência externa). É inventário de acompanhamento, **não** ativação automática de estratégias.
- `src/routes/admin/hub-catalog.tsx`: painel de metas 11× com filtro dos cinco pilares e lista das 35 estratégias; conserva os campos de fornecedor, preços e margens, sem alterar banco, permissões ou acordo comercial.
- `src/routes/index.tsx`: destaque explícito à RUBI Store e CTAs de candidatura a Partners e Business com rotas de onboarding existentes; sem inventar botão de pagamento.
- Permanecem as melhorias anteriores: simulação de margem privada no catálogo e convite opcional ao cadastro na página de indicação.

### Prioridade de aceitação por pilar
1. **Base**: entrada correta dos três públicos, consentimento de canais e coortes de ativação sem cadastro duplicado.
2. **Store**: catálogo elegível, custo e margem verificados por fornecedor, disponibilidade real, checkout oficial e confirmação de pagamento (pendente fornecedor).
3. **Achadinhos**: vídeo/afiliado → link elegível → atribuição da plataforma, separando GMV externo de comissão.
4. **Partners**: expert/influenciador/micro/afiliado → aprovação → produto concedido → material legítimo → link → pedido confirmado → comissão conciliada; não usar visita como venda.
5. **Business**: lojista aprovado → preços por volume → cotação → pedido confirmado → recompra; distinguir valores simulados de compras pagas.

### Testes ainda necessários
- `npx tsc --noEmit`, `npm run lint`, `npm run build` e testes E2E dos três logins.
- Verificar no navegador desktop/mobile os CTAs da home e a matriz de estratégias no Admin Master.
- Testar acesso negativo a endpoints de fornecedor, precificação, partner e Shadow Master.
- Confirmar Kairos/checkout e fontes oficiais de atribuição antes de habilitar pagamentos ou declarar faturamento.

**Importante:** manter o PR como draft até validação técnica; não contabilizar 11× como receita realizada.

## RUBI 11× — Incremento de ativação comercial de Partners

- Novo componente `src/components/partner/PartnerCreativeKit.tsx`, utilizado somente na lista de produtos concedidos ao parceiro aprovado, quando existe **link de indicação ativo**. O componente não acessa dados de outros parceiros.
- Modelos de texto de **demonstração**, **story/comunidade** e **expert/nicho** com identificação publicitária; a cópia pelo navegador inclui a URL individual `/r/<code>`.
- Os modelos não inventam descontos, escassez, ganhos ou alegações de desempenho e não entregam imagens de terceiros sem permissão. Cópia automática só por ação do usuário.
- **Não** cria pedidos, alterações de comissão, mudança de permissões ou integração de checkout.

### Testes necessários antes da entrega
1. Parceiro aprovado + produto concedido + link ativo: aparecem kit, três formatos e URL individual na cópia.
2. Produto sem link: somente botão de gerar link autorizado. Concessão revogada, produto ou fornecedor inativo: nenhum kit disponível.
3. Parceiro pendente/não aprovado e usuário de outro perfil: não recebem kit nem material da conta de outro usuário.
4. Cliente sem permissões de clipboard ou navegação não HTTPS: apresentar erro sem travar interface.
5. Executar CI (TypeScript, lint, build e QA); testar layout mobile e conteúdo publicitário, inclusive a distinção entre visita e pedido pago.

## RUBI 11× — Medição de desempenho por produto (ciclo de 2026-11-10)

### Entregue no código
- `getMyPartnerSalesSummary` agrega **vendas realmente confirmadas** de cada produto do parceiro autenticado, usando `hub_partner_referral_links.product_id` e `hub_partner_confirmed_sales.referral_link_id`; a paginação financeira anterior permanece preservada.
- `/partner/portal` apresenta, por produto **atualmente autorizado**, total de pedidos confirmados, valor dos pedidos e comissão registrada. A comissão não é descrita como paga. Visitas permanecem identificadas separadamente e podem compreender um intervalo diferente de vendas.
- Valores de pedidos históricos de uma oferta revogada continuam nos totais gerais do parceiro, sem exibir produto revogado na vitrine autorizada.
- Nenhuma migração, concessão de produtos, alteração de acordo, confirmação de pagamento ou webhook novo foi adicionada.

### Critérios de aceite (não confundir com publicação)
1. Parceiro A jamais recebe vendas ou produtos do parceiro B; usuário não autorizado recebe somente erro/estado limitado.
2. Link sem vendas confirmadas deve mostrar zero; visita não pode aumentar pedidos ou comissão.
3. Vendas confirmadas de dois produtos distintos devem agregar corretamente e somar com total geral, inclusive quando um link foi desativado.
4. Revogação do grant retira o produto do portal e do kit, mas não apaga histórico financeiro no extrato geral.
5. Rodar TypeScript, lint, build e QA, testar responsividade e casos negativos em sessão real.
6. Confirmar com a Kairos e demais fornecedores como conciliar cancelamentos e reembolsos antes de declarar receita líquida, LTV ou pagamentos reais.

### Continuidade estrutural do Plano 11×
As 35 estratégias e os cinco pilares permanecem integralmente no registro tipado da branch. O plano orgânico de quatro identidades oficiais e três frentes especializadas, com conteúdo original, ofertas próprias prioritárias, redes sociais, comunidades consentidas, sazonalidade, segmentação e mensuração por origem, é **especificação operacional**, não contas sociais já criadas. O plano tem metas condicionais de Partners (800 vendedores × 110 pedidos/mês), Business (1200 lojistas × 100 unidades/mês) e Store direta (2000 pedidos/mês) no mês 12; nenhuma dessas metas é apresentada como resultado comprovado.


## Incremento RUBI 11× — páginas de produto para o orgânico (2026-11-10)

### Código implementado
- Nova função `getRetailHubProduct` em `src/lib/hub-catalog.functions.ts`: busca pública de um SKU por UUID; responde somente com `id, title, description, image_url, category, retail_price` quando produto e fornecedor estão ativos e varejo possui preço positivo. Custos privados e preços B2B não são retornados.
- Nova rota `/hub-product/$productId` com vitrine individual compartilhável, carregamento, erro, indisponibilidade, descrição, preço e cadastro **opcional** com retorno à oferta; sem botão fictício de compra ou pagamento.
- `/hub-shop` passa a direcionar cada produto publicado para sua página individual.
- Evento `RUBI_STORE_PRODUCT_VIEW` utiliza o rastreador existente, `product_id` e parâmetros limitados `utm_source` e `utm_campaign`. Evento indica **apenas visualização**, não pedido. Confirmação e atribuição de venda continuam pendentes de checkout oficial do fornecedor.

### Requisitos de QA específicos
1. Link de produto ativo → mostra preço verdadeiro; desativar produto/fornecedor → rota deve exibir oferta indisponível sem informação interna.
2. Verificar acesso anônimo, sessão autenticada, mobile, link de compartilhamento e retorno `/auth?returnTo=/hub-product/<UUID>`.
3. Testar evento de visualização sem registro de venda, com falhas de analytics não impedindo a visualização do produto.
4. Confirmar que preços de custo, atacado e dados internos não aparecem no payload público.
5. Executar TS, lint, build e QA de navegação do TanStack Router antes de integrar.
6. URLs sociais e anúncios devem usar apenas SKUs ativos, campanhas reais e destino elegível; cadastro nunca obrigatório antes do checkout.

### Próximo bloqueador comercial
A página individual facilita a distribuição orgânica da Store, mas não constitui checkout. A validação com Kairos/outros fornecedores deve definir contrato, URLs, integridade da atribuição, reconciliação de pedidos, cancelamentos, repasses e devoluções antes de declarar conversão paga.


## RUBI 11× — Pré-checkout de capa antes da Kairos (2026-11-10)

### Arquitetura
- A **RUBI Pré-compra** é uma etapa comercial **sem cobrança** antes do checkout externo do fornecedor. Ela mostra produto principal, imagem, preço cadastrado, descrição e até quatro outras ofertas **publicadas e de fornecedor ativo** da mesma categoria.
- A experiência é compartilhada entre a vitrine direta \`/hub-product/$productId\` e a indicação \`/r/$code\`. A jornada do parceiro precisa permanecer associada ao código e a um grant aprovado; recomendações de outros produtos levam a **jornadas próprias** e **não** herdam comissão automaticamente.
- Convite opcional de cadastro em modal, somente após verificar que não há usuário autenticado, com atraso de 3,5s; uma exibição automática por sessão quando o armazenamento estiver disponível. Botões de aceitar ou recusar; o visitante pode continuar sem cadastro.
- O login retorna à mesma página de produto ou indicação. Não capturamos endereço, cartão ou pagamento nesse pré-checkout.
- Evento \`RUBI_PRECHECKOUT_CONTINUE\` representa **intenção de sair ao checkout**, não pedido pago.
- \`src/lib/rubi-precheckout.functions.ts\` retorna o link de checkout **apenas** quando configurado e com hostname explicitamente permitido por uma lista de aprovação no ambiente do servidor. Não usa URLs de query params, rejeita HTTP, credenciais embutidas e porta fora do padrão.
- Para links de parceiros, precisa haver URL oficial **vinculada ao código individual**. Sem isso, o botão fica desabilitado mesmo que exista checkout direto do mesmo SKU; não fazemos downgrade que perderia atribuição.
- Não se adicionaram migrações, domínios presumidos, URLs inventadas, webhooks ou pagamentos.

### Configuração exigida pelo responsável técnico
Configuração **privada no servidor**, exemplo exclusivamente estrutural (substituir por **URLs reais aprovadas pelo fornecedor**, sem copiar como credenciais):
- \`RUBI_APPROVED_CHECKOUT_HOSTS\`: lista separada por vírgulas com os domínios HTTPS **efetivamente aprovados** para checkout.
- \`RUBI_APPROVED_CHECKOUT_URLS_JSON\`: objeto JSON mapeando \`productId UUID\` para checkout direto oficial daquele produto.
- \`RUBI_APPROVED_PARTNER_CHECKOUT_URLS_JSON\`: objeto JSON mapeando \`referralCode UUID\` para **checkout oficial com atribuição validada** do parceiro.

**Atenção:** esta configuração é apenas uma camada de segurança e habilitação técnica. Não prova que a Kairos confirmou validade, recebimento, repasse, atribuição, frete, entrega, cancelamento nem webhook. Não considerar o checkout pronto até realizar um pedido real de teste autorizado e conciliar o resultado na origem financeira oficial.

### Aceitação E2E obrigatória
1. Produto ativo: produto correto, preço, recomendações de mesma categoria e convite opcional. Produto, fornecedor ou grant desativado: impedir checkout e/ou impedir acesso à indicação.
2. Usuário não logado: modal opcional funciona; recusar não bloqueia produto; logado não recebe convite; cadastro/login retorna ao produto original.
3. Sem mapas de URLs e domínios confiáveis: botão não habilita; hostname malicioso, protocolo \`http:\`, porta personalizada ou URL com credenciais são rejeitados.
4. Checkout direto: URL configurada corresponde ao SKU e abre o checkout **principal oficial**, nunca um processador próprio da RUBI; não declarar pedido ao clicar.
5. Checkout de parceiro: URL de atribuição **específica do código**, status approved+grant ativo, sem usar URL genérica do SKU. O pedido pago de teste precisa ser conciliado ao parceiro certo e não pode gerar comissão de outro parceiro.
6. Recomendações: links de produtos complementares não herdam o parceiro original nem simulam pacote/carrinho, já que a API de carrinho do fornecedor ainda não foi confirmada.
7. Verificar desktop, mobile, TypeScript, lint, build e testes negativos de RLS/acesso, além da validação contratual do fornecedor.

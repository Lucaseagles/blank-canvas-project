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

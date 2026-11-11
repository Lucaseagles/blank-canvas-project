# RUBI Eagles — Contrato da jornada comercial (Sprint 99)

## Decisão de arquitetura — 2026-11-11
A RUBI hospeda páginas de oferta, movimentos comerciais e pré-checkout em domínio HTTPS próprio e reutilizável. A Kairos é **somente o processador/checkout final para os produtos publicados nela**. Produtos de fornecedores futuros podem ter seus próprios destinos oficiais validados; não presumir que toda oferta usa Kairos.

Fluxo: criativo/canal/parceiro → página pública RUBI → pré-checkout RUBI → checkout externo Kairos autorizado → confirmação de pagamento por evidência oficial → conciliação de origem, pedido, comissão e eventual estorno.

O **domínio da página RUBI** e o **hostname oficial do checkout Kairos** são valores diferentes, ambos exigindo validação. O primeiro é uma configuração de hospedagem; o segundo pertence ao endereço de pagamento emitido pelo fornecedor. Não cadastrar domínio genérico presumido no campo `hub_suppliers.checkout_host`.

## Contrato do pré-checkout
- Exibir dados reais da oferta e preço; não coletar cartão nem simular pagamento RUBI.
- Convite a criar login consumidor é **opcional**; compra não pode exigir cadastro RUBI. Preservar `returnTo` e contexto do produto após autenticação.
- Ofertas complementares no pré-checkout devem ser elegíveis e não modificar silenciosamente itens, preços ou o pedido na Kairos.
- Upsell, order bump e downsell **da Kairos** são configurados e executados na própria plataforma, mediante disponibilidade e contrato; não presumir APIs ou capacidade de atualizar carrinho de fora.
- Antes de redirecionar, revalidar produto ativo, fornecedor ativo, URL HTTPS exata e checkout aprovado.
- Nunca afirmar pedido, comissão ou receita a partir de visita, cadastro ou clique.

## Parceiros
- Cada parceiro aprovado divulga seu link próprio; o código da origem deve continuar associado à jornada.
- `getRubiCheckoutReadiness` bloqueia hoje o redirecionamento de parceiro até existir comprovação de atribuição oficial no pagamento. **Não remover essa proteção** nem trocar automaticamente pelo checkout direto, pois isso perde a origem.
- Antes de destravar, documentar o mecanismo realmente disponível na Kairos (link individual por parceiro, cupom, parâmetro oficial verificável, exportação conciliável ou outra evidência aceita) e testar pedido pago, cancelamento/estorno e comissão.
- Não creditar comissões por cadastro ou por intenção de pagamento.

## Dependências separadas
1. Hospedagem: definir domínio próprio da RUBI, DNS e HTTPS; testar `/hub-shop`, landing, pré-checkout e links públicos no celular/computador.
2. Primeiro SKU: publicar produto real no painel Kairos, obter autorização de uso de nome/imagens, preço, custo, link HTTPS e regras comerciais.
3. Configuração do fornecedor: registrar hostname exato do link Kairos no catálogo Master, comprovar destino e marcar verificação apenas após testes.
4. Pré-checkout: testar visualização, novo cadastro opcional, retorno ao produto, CTA e revalidação.
5. Parceiros: testar vínculo de código individual ao pedido real e condições de atribuição; manter saída de parceiro bloqueada até então.
6. Pós-venda: comprovar pedido, liquidação, comissão, cancelamento e estorno sem inferências de eventos de front-end.

## Evidência técnica (main após Sprint 98)
- `src/components/store/RubiPreCheckout.tsx` já implementa revisão do produto, sugestões e convite opcional ao cadastro e faz revalidação antes de saída.
- `src/lib/rubi-precheckout.functions.ts` já permite checkout direto apenas quando autorizado e bloqueia checkout de parceiro sem atribuição confirmada.
- `src/lib/rubi-checkout-validation.ts` exige correspondência exata entre hostname do checkout HTTPS e hostname aprovado no fornecedor.
- Supabase heartful-helper-box (consulta 2026-11-11): Kairos ativa sem checkout_host; 0 produtos, stories, seções ou checklists de lançamento.
- Publicação HTTPS própria e transação real **não verificadas** nesta etapa.

## Critérios de aceite
- CI: TypeScript, ESLint, build, testes de regras e navegador.
- Teste anônimo: campanha → oferta → pré-checkout → checkout Kairos autorizado, sem obrigatoriedade de registro.
- Teste com novo cadastro: volta à mesma oferta e não duplica atribuição.
- Teste parceiro: link válido não libera pagamento não atribuível; mecanismo habilitado somente com evidência de atribuição.
- Teste revogação: produto/fornecedor/checkout desativado bloqueia saída.
- Teste financeiro: somente pedido oficial confirmado impacta relatórios de vendas e comissões.

Não é uma solicitação para executar transações financeiras reais nem para alterar preço, RLS ou percentuais de comissão.

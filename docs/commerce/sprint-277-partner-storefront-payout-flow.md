# Sprint 277 — vitrine do parceiro, atribuição comercial e repasse BRL-first

Data: 2026-11-19
Base: main
Classificação inicial: upgrade-only; nenhum ponto V1 reivindicado
Produção: sem alteração de schema ou dados

## 1. Decisão de produto

O financeiro RUBI é um centro de controle e conciliação, não o processador de pagamento. A venda e o pagamento acontecem no checkout/plataforma externa. RUBI rastreia a jornada, recebe evidências confiáveis da venda, calcula a comissão conforme acordo, acompanha o dinheiro recebido pela RUBI e registra o repasse feito ao parceiro.

A operação inicial é Brasil-first e BRL-first. Não construir câmbio internacional como bloqueador do fluxo principal. Valores externos em outras moedas devem ficar em subtotais separados e não podem ser somados ou convertidos automaticamente. Conversão FX auditável fica como capacidade futura, ativada apenas quando houver necessidade real e fonte de cotação aprovada.

## 2. Canais e responsabilidades

### Loja própria / produtos adquiridos via Kairos
- RUBI publica a oferta e o produto no seu catálogo.
- Cada parceiro aprovado recebe uma vitrine pública simples com produtos individualmente autorizados.
- Cada produto da vitrine tem URL individual rastreável, associada ao parceiro, produto, campanha/publicação e versão do acordo aplicável.
- O cliente sai da RUBI para o checkout externo aprovado (Kairos ou outro checkout autorizado).
- O checkout é o responsável por cobrança, aprovação, cancelamento, reembolso e liquidação.
- RUBI só confirma a venda quando receber evidência verificável: integração oficial autenticada, relatório/exportação confiável ou conciliação manual autorizada com referência externa.
- A liquidação recebida da Kairos é registrada separadamente da venda e da comissão.

### Marketplaces afiliados
- Marketplace continua como origem externa separada; RUBI não cria pedido próprio só porque houve clique.
- O parceiro só recebe atribuição se o marketplace permitir identificador individual/sub-affiliate/cupom ou fornecer relatório que vincule a venda ao link/campanha do parceiro.
- Se o link de afiliado pertencer à conta RUBI e não houver subatribuição suportada, a venda é receita de afiliado da RUBI, não venda automaticamente atribuída ao parceiro.
- Clique, redirecionamento, cookie presumido ou retorno do navegador não provam compra nem comissão.

### Fornecedores e outros checkouts
- Usar o mesmo contrato de evidência externa, mas manter provider/source distintos.
- Nunca assumir que Kairos, marketplace e fornecedor têm o mesmo formato de referência, status ou relatório.

## 3. Vitrine do parceiro

A vitrine é uma página pública leve, não uma loja independente nem um novo checkout.

Requisitos:
- Um URL único por parceiro, além dos links individuais por produto.
- Mostrar somente nome público, imagem/descrição comercial aprovada e produtos com grant ativo e checkout aprovado.
- Ordenação e destaque controlados pelo parceiro dentro do conjunto autorizado, sujeitos a limites definidos pelo Master.
- Cada card leva ao redirect rastreável do produto daquele parceiro; não enviar todos os produtos para um único link sem preservar o product_id.
- Mostrar aviso de que pagamento e entrega são realizados pelo checkout/fornecedor responsável.
- Não mostrar custo do fornecedor, margem RUBI, dados de outros parceiros, notas internas, volume global ou configuração de comissão de outros parceiros.
- Produto suspenso, grant revogado, checkout inválido ou parceiro suspenso desaparece da vitrine e o redirect individual passa a fallback seguro.
- A vitrine não cria carrinho/pedido próprio nem promete disponibilidade/preço em tempo real. Quando necessário, preço é exibido com timestamp/aviso e validado novamente antes do redirecionamento.

Modelo técnico preferido:
- Reutilizar `hub_partner_referral_links` como relação partner-product e não duplicar o catálogo.
- Adicionar um identificador público estável de vitrine por parceiro em tabela/coluna aditiva após auditoria do schema, sem usar um código de link de produto como identidade da loja.
- O endpoint público resolve o parceiro por código, valida aprovação e consulta somente links/grants/produtos ativos.
- Criar visita por parceiro/produto ao clicar no produto; visita da página da vitrine é evento separado e não conta como visita de produto nem venda.
- Não expor UUIDs internos ou IDs de usuário desnecessários no URL.

## 4. Atribuição ponta a ponta

Cada jornada elegível preserva:
- partner_profile_id;
- referral_link_id e product_id;
- código/identificador de campanha ou publicação quando presente;
- provider/source;
- identificador de pedido externo quando comprovado;
- regra de atribuição (last eligible touch/first touch, conforme acordo);
- versão do acordo e taxa de comissão aplicadas;
- moeda e valor nominal informados pela fonte;
- origem e método da evidência.

A regra de atribuição precisa ser explícita e versionada. Não sobrescrever first-touch com last-touch; guardar ambos se a política os utilizar. Uma venda não pode ser atribuída a dois parceiros por acidente. Disputas ou evidências conflitantes ficam em revisão do Shadow Master.

A URL rastreável comprova que o usuário foi encaminhado pela RUBI. Ela não garante que o checkout externo preservou o código até a venda. Antes de habilitar comissão automática, confirmar o caminho técnico do identificador no provedor.

## 5. Estados comerciais e financeiros

Separar no dashboard, sem somar estados incompatíveis:

1. Cliques/visitas — tráfego observado.
2. Checkout iniciado — redirecionamento observado.
3. Pedido reportado — referência externa recebida, ainda não verificada.
4. Venda confirmada — evidência externa validada e deduplicada.
5. Comissão calculada — valor previsto segundo acordo e base explícita.
6. Comissão elegível — passou prazo/condições de cancelamento/estorno definidos no acordo.
7. Comissão paga — repasse externo executado e comprovado.
8. Comissão estornada/ajustada — evento compensatório, mantendo histórico.

A venda confirmada não significa automaticamente que a Kairos já liquidou o dinheiro para RUBI. Comissão calculada não significa que o parceiro já recebeu. O status pago exige referência do repasse, valor, data, método e operador/evidência.

## 6. Base de comissão e custos do checkout

- O acordo deve definir por produto/campanha qual é a base: valor bruto elegível, valor recebido pela RUBI ou outra base comercial documentada.
- Não deduzir a taxa do gateway duas vezes. Se o preço comercial já incorpora a taxa, não subtrair novamente sem previsão expressa no acordo.
- Não presumir que todas as taxas, fretes, descontos, impostos, estornos ou chargebacks são tratados igual; registrar a regra do produto e snapshot da base.
- O percentual e a versão do acordo são congelados na venda confirmada. Mudanças futuras não reescrevem comissões históricas.
- Reembolso/cancelamento posterior gera reversão/ajuste auditável e pode reduzir comissão pendente ou gerar saldo negativo a compensar conforme acordo e legislação; nunca apagar a venda original.

## 7. Modelo de dashboard

### Parceiro — somente seus próprios dados
- Vitrine pública e botão copiar URL.
- Produtos autorizados e links individuais.
- Visitas e cliques por produto/campanha.
- Checkouts iniciados (quando observáveis).
- Pedidos reportados aguardando validação.
- Vendas confirmadas e valor por produto.
- Comissão calculada, elegível, pendente, paga e ajustada.
- Histórico de repasses com data, valor, referência e comprovante permitido.
- Indicador claro: tráfego não é venda; venda confirmada não é repasse recebido.

### Shadow Master — visão global
- Filtros por parceiro, produto, campanha, origem/provedor e período.
- Funil cliques → checkout → pedidos reportados → vendas confirmadas.
- Comissão prevista/elegível/pendente/paga e exceções.
- Recebimentos efetivamente liquidados pela Kairos/outros provedores, separados da venda bruta.
- Repasses externos realizados aos parceiros.
- Divergências: venda sem evidência, referência duplicada, comissão divergente, pagamento excedente, payout sem alocação e estorno.
- Drill-down até a origem e evidência; nenhum total sem definição.

## 8. Regra BRL-first e moeda

- Operação inicial usa BRL como moeda operacional esperada quando a origem comprova BRL.
- Não inferir BRL quando a fonte não informa moeda.
- O código deve preservar currency da origem e rejeitar ausência/desconhecimento para registro financeiro.
- Valores em moedas diferentes aparecem em grupos separados; não somar USD/JPY/KWD/BRL.
- O suporte a moedas estrangeiras fica como compatibilidade futura; não é requisito para lançar o fluxo de parceiros brasileiros.
- O módulo de cálculo FX da Sprint 276 é uma biblioteca isolada experimental, não conectada ao ledger nem a relatórios.
- A escala monetária deve ser compatível com a moeda antes de persistir. O atual NUMERIC(18,2) não é universal para moedas com zero/três casas.

## 9. Integração externa por fases

Fase A — já suportada pelo modelo atual:
- link/referral visit;
- registro de venda confirmada por fonte confiável/admin;
- comissão calculada e acordo;
- payout e alocação parcial/total;
- dashboards de parceiro e Shadow Master.

Fase B — após documentação e credenciais:
- integração oficial Kairos com assinatura/autenticação, mapeamento de status e IDs idempotentes;
- importação de relatório de liquidação e taxas;
- automação de confirmação de venda e conciliação.

Fase C — marketplace:
- validar cada marketplace separadamente;
- somente automatizar parceiro se houver atribuição/sub-affiliate reportável;
- importar ganhos de afiliado da RUBI separadamente das comissões internas de parceiros.

Nenhum webhook, endpoint, formato de payload ou capacidade de sub-affiliate será inventado.

## 10. Segurança e privacidade

- Parceiro autenticado só consulta o próprio profile_id e os próprios dados.
- A vitrine pública expõe apenas dados comerciais autorizados.
- Escrita de venda confirmada, comissão e payout somente por funções server-side autenticadas/Owner e trilha de auditoria.
- Não confiar em partner_profile_id, commission_percent, gross_amount, paid status ou external order id fornecidos pelo browser.
- Validar grant, produto, parceiro aprovado, provider/source, evidência e acordo no servidor.
- Idempotência por provedor + referência externa, sem colisão entre provedores.
- Rate-limit/anti-abuso em rotas públicas; visita é evento de navegação, não identidade única.
- LGPD: aviso de rastreamento, minimização, retenção e direitos do titular.

## 11. Critérios de aceite da próxima implementação

1. Parceiro aprovado recebe URL pública única da vitrine.
2. Vitrine lista apenas produtos ativos e grants válidos.
3. Link individual preserva parceiro + produto + campanha.
4. Revogar produto remove da vitrine e impede novo redirect externo.
5. Visita de vitrine e visita de produto são métricas distintas.
6. Redirect nunca cria venda/comissão.
7. Pedido externo sem evidência permanece reportado/não verificado.
8. Mesma referência de pedido do mesmo provedor não duplica venda.
9. Referências iguais em provedores diferentes não colidem.
10. Comissão usa snapshot do acordo e base definida.
11. Taxa de gateway não é descontada duas vezes.
12. Venda confirmada, recebimento Kairos e repasse parceiro são estados separados.
13. Parceiro A não lê dados de B; consumidor/lojista não lê dashboard financeiro.
14. Payout parcial e múltiplos repasses respeitam saldo por venda; excesso é bloqueado/alertado.
15. Dashboard distingue BRL e outras moedas sem conversão automática.
16. CI: TypeScript, lint, testes específicos, workflow de integração e browser desktop/mobile.

## 12. Gates de produção

Esta especificação não autoriza migration nem alteração no Supabase.

Antes de implementar a vitrine persistente e integrar o financeiro:
- revisar migrations de referral e payout contra schema real;
- reconciliar cadeia pendente 243–253 e status das migrations 252/253/273/274;
- resolver status/CI da Sprint 275 e PR 276;
- testar rotas públicas, autorização server-side, grants e RLS em banco descartável;
- obter backup e autorização explícita antes de qualquer deploy;
- ativar integrações oficiais somente após documentação, credenciais e testes reais.

Cobertura V1 permanece 36,5/48 (76,0%) até evidência de critério funcional novo concluído.

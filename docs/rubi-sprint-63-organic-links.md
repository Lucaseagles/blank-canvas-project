# RUBI 11× — Sprint 63 · Links orgânicos rastreáveis

## Entrega fechada

Esta sprint transforma cada produto **próprio, ativo e com checkout verificado** em uma página com link editorial por canal, sem inventar produtos Kairos nem processar pagamentos.

1. Admin Master: `RubiOrganicLinkBuilder`, com seleção de produto elegível, canal editorial, campanha e cópia de URL.
2. Canais definidos: Instagram, TikTok, YouTube Shorts, Facebook, Pinterest, WhatsApp e Telegram. Um único caminho por produto da Store; sem multiplicar páginas fictícias.
3. Links levam à pré-compra `/hub-product/<UUID>`, com `utm_source`, `utm_medium=organic_social`, `utm_campaign`, normalizados e validados.
4. `RUBI_STORE_PRODUCT_VIEW` e `RUBI_PRECHECKOUT_CONTINUE` registram os rótulos editoriais, preservados por produto na aba mesmo após autenticação/retorno.
5. Admin Master: resumo de visualizações por canal nos últimos 30 dias. São **eventos**, não visitantes únicos, cadastros confirmados, compras ou receitas.
6. `rubi-organic-campaigns.test.mjs`: testes sem requisições externas para canais, campanhas e IDs; gate adicional na integração GitHub Actions.

## Segurança e limites

- Link editorial da Store não é link de indicação. Parâmetros UTM **não** criam comissão, comprador atribuído nem checkout pago.
- Links individuais de Partners `/r/<code>` preservam sua própria autorização e seguem com checkout externo bloqueado sem atribuição Kairos verificável.
- Apenas produtos com checkout previamente aprovado podem ser selecionados no gerador; sem produtos Kairos, o painel informa a ausência e não cria URL fictícia.
- A validação do código, do hostname e do checkout real Kairos continua obrigatória antes de pagamentos.
- A medição de visualizações só ocorrerá depois que o aplicativo atualizado estiver implantado e receber visitantes reais.
- Instrumentação registra rótulos de canal/campanha. Não declara viralização nem converte GMV de marketplace em receita RUBI.

## Critérios de aceitação

- `npm run test:rubi-organic`, `npm run test:rubi-checkout`, `npx tsc --noEmit`, `npm run lint`, `npm run build` sem erros bloqueantes.
- Links editoriais distintos por canal, sem abrir destinos externos arbitrários ou alterar permissões do produto.
- Em oferta revogada, a página pública permanece indisponível; não permitir compra de produto não aprovado.
- O Admin Master vê contagens agregadas; sem dados pessoais ou custos privados na URL.
- Não esperar por checkouts reais Kairos para integrar a estrutura, mas não afirmar pagamentos validados.

# RUBI Eagles 11× — Sprint 160: Story → Oferta Oficial

## Meta híbrida única
**[UPGRADE]** Fazer o Story publicado conduzir o consumidor à seção de pré-checkout do próprio SKU, com acessibilidade, tratamento de erro/recuperação e evento de interesse distinto de pagamento.

**[COBERTURA]** Critério 02.4 Jornada Story E2E. Antes: **0/1**. Candidato após CI, merge e reauditoria técnica v1: **0,5/1 (parcial)**, pois existe um percurso integrado e testado por contratos, mas ainda falta prova de navegação real e checkout autorizado em domínio publicado.

## Evidência técnica
- `src/components/store/RubiProductStories.tsx` possui CTA interno `#rubi-purchase` e evento `RUBI_STORY_OFFER_INTEREST` com `sales_status=interest_only`, sem link direto não verificado.
- `src/routes/hub-product.$productId.tsx` carrega o mesmo `product.id` no Story e no `RubiPreCheckout`, exibindo a seção `rubi-purchase`.
- `src/lib/rubi-precheckout.functions.ts` valida fornecedor, SKU, status e host de checkout, inclusive bloqueando atribuição de parceiros não homologada.
- `src/lib/rubi-story-offer-journey.test.mjs` verifica a ligação da jornada, estados de falha e aprovação da mídia.
- Nenhum evento afirma compra, pedido ou comissão reais.

## Aceite e pontuação
- Base após Sprint 159: **33,5/48 = 69,8%**.
- Se ambos CI verdes, merge e reauditoria aceitarem a implementação parcial: **34/48 = 70,8%**.
- Não atribuir 1/1 em 02.4 sem E2E real em HTTPS com Story licenciado e checkout autorizado, e sem testes mobile/desktop.
- Sem Story real no Supabase no momento das verificações; não cadastrar dados inventados.

## Upgrade seguinte
Captura segura de falhas de carregamento de mídia, métricas reais da jornada, testes no domínio publicado e revisão de usabilidade antes de homologar o fluxo comercial.

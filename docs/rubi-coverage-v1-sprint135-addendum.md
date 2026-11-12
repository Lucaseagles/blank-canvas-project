# RUBI Eagles 11× — Reauditoria incremental da matriz v1, Sprint 135

**Base anterior:** `docs/rubi-coverage-v1-reassessment.md` (Sprint 122, 31,5/48 = 65,6%).
**Candidato:** PR #135 da biblioteca central de criativos reutilizáveis do Shadow Master.

## Regra de avaliação

- O mesmo denominador de 48 critérios é preservado para série histórica v1.
- Cada critério vale 0 (ausente), 0,5 (implementação parcial) ou 1 (critério técnico completo com evidência).
- A implantação no código e os testes automatizados não demonstram funcionamento E2E no domínio publicado, venda real, direitos de mídia documentados ou qualidade de tráfego.
- Nenhuma pontuação é conferida a uma sprint pela quantidade de arquivos, commits ou PRs.

## Alteração verificável

| Critério | Valor anterior | Novo valor condicionado a CI+merge | Evidências | Limites |
| --- | ---: | ---: | --- | --- |
| **07.4 — Biblioteca de materiais reutilizáveis e licenciados** | 0 | **0,5** | `src/lib/rubi-creative-library.functions.ts`; `src/components/store/RubiCreativeLibraryAdmin.tsx`; `src/routes/admin/hub-catalog.tsx`; regressão em `src/lib/rubi-flagship-storefront.test.mjs` | Biblioteca de **texto criativo/roteiros/páginas com declaração** de direitos, filtrável por formato e SKU. Faltam armazenamento de arquivos, licenças verificadas por evidência, direitos por canal/período, revogação de mídia e acesso autorizado no portal do parceiro. |

A biblioteca consulta variantes no banco com `status=review` e `media_rights_confirmed=true`, comprova relação com movimento também em revisão e produto existente. A consulta é exclusiva do Master e, quando o snapshot atinge limite, oculta materiais. Nenhuma campanha é publicada; nenhum grant/comissão/checkout é criado.

**Este 0,5 ponto adicional deve ser efetivado somente se o PR #135 estiver integrado e os dois workflows de CI da última versão estiverem aprovados.**

## Distribuição da matriz após aceite

| Módulo | Pontos / 4 | % técnico v1 |
| --- | ---: | ---: |
| 01 Eclipse/Consumidor | 2,5 | 62,5% |
| 02 Story/Marca própria | 2,5 | 62,5% |
| 03 Achadinhos orgânico | 2,5 | 62,5% |
| 04 Store/Kairos | 3,5 | 87,5% |
| 05 Business/Lojistas | 3,0 | 75,0% |
| 06 Partners/Afiliados | 3,0 | 75,0% |
| **07 Offer Engine** | **3,5** | **87,5%** |
| 08 Movement Engine | 2,5 | 62,5% |
| 09 Complementary Offers | 2,0 | 50,0% |
| 10 Intelligence/Métricas | 2,5 | 62,5% |
| 11 Shadow Master/Segurança | 2,5 | 62,5% |
| 12 Qualidade/Operação | 2,0 | 50,0% |
| **Total** | **32/48** | **66,7%** |

## Próximos alvos reais

- **07.4 de 0,5 para 1,0:** anexos/licenças reais e revisão documental + distribuição controlada/revogável aos parceiros.
- **08.2 e 08.3:** melhora de validação de ângulos e experimentos A/B com distribuição comparável; não pontuar mera presença de variantes como experimento causal.
- **08.4 e 10.3:** dados reais por movimento, criativo e audiência, denominadores confiáveis e evidência de performance, sem confundir cliques com conversões.
- **Critérios 04.4, 06.4, 09.3, 09.4, 10.4:** dependem de operações, atribuição, oferta complementar e conciliação com checkout externo autorizado.
- **12.3 e 12.4:** QA real desktop/mobile de quatro papéis e ciclo pedido-pagamento-estorno; CI sozinho não substitui E2E.

## Dependências comerciais verificadas

A consulta Supabase da Sprint 134 mostrou **0 produtos, 0 ofertas, 0 times e 0 associações comerciais**. Ainda faltam o primeiro SKU aprovado, domínio HTTPS hospedado, host de checkout Kairos confirmado, teste de venda/estorno e contratos de direitos dos materiais. O índice não é percentual de lançamento pronto ou taxa de conversão.

**V2:** marketing por IA, equipes de criadores, anúncios pagos, interação/social proof, automações e todos os demais requisitos de negócio ampliam o escopo: medir em matriz separada com novo denominador, sem comparar a pontuação v2 diretamente à v1.

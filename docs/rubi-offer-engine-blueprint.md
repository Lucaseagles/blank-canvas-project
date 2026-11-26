# RUBI Offer Engine — Oferta, Criativo, Página, Movimento e Medição

Status: **arquitetura parcialmente implementada na main; Offer Engine completo ainda não concluído**. Data da especificação: 2026-11-10.

## Propósito
Transformar cada produto aprovado no RUBI Store (inclusive os fornecidos pela Kairos) em uma campanha comercial coerente que conecte primeiro contato, página de venda, relacionamento e mensuração. Preservar preços oficiais, segurança do pré-checkout e atribuição existente. Não declarar compras externas confirmadas a partir de eventos de intenção.

## Princípios
1. **Produto = unidade comercial**: `hub_products.id` é o identificador base. Cada oferta tem versões e pode possuir múltiplos criativos/canais/segmentos; somente a versão publicada é pública.
2. **Criativo (primeiro contato)**: ângulo principal, público, benefício verificado, formato (vídeo curto/reels/story/card), hook, CTA, mídia, destino, variante e UTM. O criativo chama a atenção, não promete resultados impossíveis.
3. **Página (segundo contato)**: título, subtítulo, mídia, benefícios comprováveis, como funciona, detalhes do produto, dúvidas frequentes, condições reais, selo de fornecedor e CTA para o pré-checkout oficial; layout mobile-first e acessível. Não inventar prova social, desconto, frete, garantia ou prazo.
4. **Movimento (contato contínuo)**: calendário editorial de orgânico, feed do app, comunidade, parceiros autorizados, campanhas sazonais e reimpacto consentido; frequência limitada, exclusão por revogação e respeito a preferência de canal.
5. **Medição**: impressões quando observáveis, cliques, visualizações de página, início de pré-checkout e saída para checkout externo. Compra confirmada só por evidência confiável do fornecedor (ex. integração oficial ou reconciliação autorizada); não converter intenção em receita.
6. **Pesos 70% criativo, 80% página, 100% movimento** são metas editoriais propostas, nunca probabilidades ou garantias de venda. Para analisar resultados usar taxas calculadas de contagens reais, por canal e variante; expor amostra e período.

## Estrutura sugerida (não executar DDL sem revisão)
- `rubi_offer_versions`: id, product_id FK, version, status (draft/review/published/archived), audience, headline, subheadline, benefits structured, proof_evidence, faq, terms_reference, created_by, published_at, updated_at. Validar JSON estruturado no servidor.
- `rubi_offer_creatives`: id, offer_version_id FK, channel, format, hook, body, media URL validada, CTA, status, tracking_slug. Variantes explícitas.
- `rubi_offer_movements`: id, offer_version_id FK, channel, target_segment, schedule, opt_in_required, lifecycle state, owner approval. Sem disparos automáticos no MVP.
- `rubi_offer_events`: event_id idempotente, offer_version_id, creative_id opcional, product_id, channel, source, event_type, timestamp, consent state. Evitar PII desnecessária; evento de clique não é compra.
- Auditoria de publicação e revogação, índices por product_id/status, RLS habilitado. Leitura pública apenas de dados editoriais publicados e produtos ativos; gravação master-only por função confiável, conforme regras do projeto.

## Integração progressiva
### Fase A — Mapa/arquitetura
- Revisar `/hub-shop`, `/hub-product/$productId`, `RubiPreCheckout`, `RubiAdminOfferPreview`, `hub-catalog.functions.ts`, tracking orgânico e links de parceiro.
- Checar compatibilidade do catálogo atual e rollback. Manter a atual funcionalidade inalterada.

### Fase B — Editor Master
- Tela `/admin/hub-catalog` -> “Campanhas e ofertas”: escolher produto, escrever proposta de valor, escolher provas legítimas, criar versão, pré-visualizar, aprovar, publicar/arquivar.
- Criativos por tipo e canal com UTM rastreável; biblioteca de formatos. Sem fazer upload de material que não tenha direitos ou permissão de uso.

### Fase C — Página de oferta
- Rota editorial por produto/versão com fallback para a página existente; canonical e slug seguros, layout mobile-first; CTA usa `getRubiCheckoutReadiness` e o fluxo atual para checkout externo, sem URL inventada ou exposição de credenciais.
- Para produto sem link oficial aprovado, mostrar indisponibilidade com clareza.

### Fase D — Movimento
- Painel para planejamento de publicação orgânica/Telegram/WhatsApp/Instagram/feed/comunidades; agendamento e canal apenas quando integrados e autorizados.
- Link de parceiro mantém código verificado e atribuição; nenhuma sobreposição de UTM elimina comissão ou muda o destinatário do checkout.
- Segmentar consumidor/lojista/parceiro e respeitar elegibilidade, concessão de catálogo e consentimento.

### Fase E — Medição e otimização
- Funil por produto/canal/criativo/versão: impressões observáveis, cliques, visualizações únicas estimadas, CTR, passagem para checkout, conversão paga verificada quando houver fonte.
- Comparação de variantes com amostra adequada; não afirmar causalidade antes de teste.
- Guardrails anti-fraude, proteção de dados e atribuição por período.

## Critérios de aceite
1. TypeScript, ESLint, build, testes unitários/de integração/CI verdes.
2. Testes de isolamento Master versus consumidor, lojista e parceiro; RLS/privileges e testes de publicação/despublicação.
3. Produtos existentes continuam funcionando mesmo sem oferta personalizada; nenhum link de checkout Kairos muda.
4. Mesmo anúncio em feeds/orgânico/comunidade chega à versão correta sem perder contexto de campanha nem referência de parceiro.
5. Benefícios, depoimentos, disponibilidade, preço, desconto e urgência são verdadeiros e verificáveis.
6. Nenhuma automação envia mensagens sem autorização; opt-out funcional.
7. Tela mobile validada e eventos de interesse não entram como pedidos pagos.
8. Reportar percentual geral e por módulo **somente quando houver matriz mensurável** de requisitos e aceites; indicar claramente estimativas.

## Prioridade comercial
Pilotar 1–3 produtos com links oficiais aprovados e maior potencial de margem; comparar criativos e páginas em tráfego orgânico antes de expandir. Não prometer ganho de conversão sem dados.


## Estado atualizado na main — 2026-11-26

Esta seção prevalece sobre a classificação histórica de 10/11. O RUBI já possui componentes comerciais e de pré-checkout, mas isso não significa que o Offer Engine normalizado esteja completo.

### Capacidades já presentes

- Catálogo oficial por `hub_products`, página de produto e fluxo `RubiPreCheckout`.
- `RubiAdminOfferPreview`: prévia privada de rascunho no Hub Catalog; não publica, não cria conta/pagamento/pedido e mantém ações inertes.
- `RubiMovementLanding`, `RubiProductStories` e variantes de movimento conectam narrativa, conteúdo e o produto correspondente.
- `getRubiCheckoutReadiness` revalida produto, fornecedor, preço e destino oficial no momento da continuação; o pré-checkout não confia apenas em dados carregados anteriormente.
- A jornada Story → mesmo produto → pré-checkout interno foi comprovada em E2E local persistido: run `45750796298`, 22/22 testes, 11 cenários mobile/desktop, zero falhas/skips/flaky.

### Limites funcionais atuais

- Não foi localizada uma camada normalizada `rubi_offer_versions` ou `rubi_offer_events`; não criar essas tabelas sem justificar a lacuna em relação ao catálogo, Story e variantes de movimento existentes.
- Parte do conteúdo de criativo/página já está em `rubi_movement_variants` (hook, script, headline, body, CTA, direitos e revisão). O blueprint deve evoluir a partir desse modelo, não duplicá-lo.
- A prévia administrativa é privada e não equivale a uma versão publicada de oferta.
- O CTA de pré-checkout gera intenção/saída para checkout, não pedido ou pagamento confirmado.
- Para parceiro, `getRubiCheckoutReadiness` continua bloqueando o checkout enquanto não houver destino oficial e atribuição verificável; não há fallback silencioso para o checkout direto do SKU.
- Publicação externa, mensagens, agendamento, eventos de compra, comissões e reconciliação dependem de integrações/contratos próprios e evidência verificável.
- Métricas de clique, interesse e pré-checkout não podem ser promovidas a venda, receita ou conversão paga.

### Arquitetura segura para a próxima fase

1. Reutilizar `hub_products`, Story e `rubi_movement_variants` como base; modelar oferta/versão somente se houver necessidade real de ciclo de vida independente.
2. Definir versão publicada, rollback e aprovação Owner com auditoria transacional antes de criar DDL.
3. Preservar `getRubiCheckoutReadiness` como única porta de saída para checkout oficial e manter a trava de parceiro até integração comprovada.
4. Separar eventos comportamentais, intenção externa, pedido, pagamento, comissão e liquidação.
5. Implementar medição por canal/variante com fonte, amostra e período; não inventar CTR, retenção ou vendas.
6. Exigir RLS/grants, testes negativos dos quatro perfis, rollback, TypeScript, lint, build e E2E antes de qualquer implementação de produção.

### Classificação e cobertura

- Esta atualização é upgrade de arquitetura/governança.
- Nenhum ponto V1 novo reivindicado.
- Os pesos editoriais 70/80/100 continuam metas de organização criativa, nunca probabilidades ou garantias de venda.

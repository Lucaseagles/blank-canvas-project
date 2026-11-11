# RUBI Offer Engine — Oferta, Criativo, Página, Movimento e Medição

Status: **proposta técnica aprovada para planejamento**, não implementação de produção. Data: 2026-11-10.

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

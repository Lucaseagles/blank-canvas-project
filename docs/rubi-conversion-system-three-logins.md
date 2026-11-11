# RUBI Eagles 11× — Sistema de conversão por perfil

Data: 2026-11-11 · Estado: roteiro de implementação com validação por evidências, não garantia de faturamento.

## Objetivo central

As estratégias de entrada (orgânico, social, vídeos, marketplaces, parceiros, lojas, campanhas) devem nutrir três jornadas: **consumidores** para descoberta e compra; **lojistas** para cotação e reposição; **parceiros** para divulgação autorizada, geração de visitas e vendas atribuídas. RUBI Store é foco de margem. Shadow Master controla publicações, campanhas, acessos e auditabilidade.

## Contrato universal

1. Todo conteúdo comercial vincula **item real** + categoria + público elegível + status de aprovação + origem + rota/destino verificável.
2. Relevância: interesses declarados e sinais comportamentais apenas quando devidamente permitidos; sem perfis íntimos, dados sensíveis ou inferências intrusivas.
3. Apresentação: criativo, solução, demonstrações autorizadas, benefícios verificáveis, prova social real, preço correto, CTA claro e jornada mobile.
4. Persuasão: comparação honesta, resposta a dúvidas, bundles elegíveis, lembretes opt-in, prazos reais, facilidade de uso e redução de fricção. Não criar nomes, comentários, compras, estrelas, estoque, temporizadores ou contagens imaginárias na produção.
5. Medição: impressões/visualizações → visitas → intenção de checkout/solicitação → pedido confirmado → liquidação/margem/comissão → recompra. **Nunca** confundir clique com venda.
6. Respeito ao usuário: não obrigar login para compra, opt-out de pop-up, controle de notificações e preferências, sem excessos de frequência.

## Jornada do consumidor

| Superfície | Experiência | Evento e aceitação |
|---|---|---|
| Onboarding/quiz | 2–4 escolhas opcionais, editáveis e por categorias não sensíveis | preferência salva + possibilidade de pular |
| Feed de achadinhos e Store | Mix de relevância/descoberta, marketplace permitido e campanhas de Store revisadas | impressão e clique com origem; exclusão de itens revogados |
| Vídeos e Stories | Demonstração autorizada e CTA para página oficial | vídeo visto, avanço e saída separados |
| Produto/landing | Promessa comprovável, dúvidas, informações reais, reviews moderados e indicação de status do fornecedor | links válidos e estado vazio |
| Pré-checkout | preço e condições, complementares elegíveis, prova social real, prazo editorial real, CTA em destaque | compra sem cadastro obrigatório, revalidação antes da Kairos |
| Relacionamento | Favoritos, alertas opt-in, recomendações e reengajamento por interesse | opt-out funcionando, frequência controlada |

## Jornada do lojista

| Superfície | Experiência | Evento e aceitação |
|---|---|---|
| Onboarding B2B | qualificação e aprovação, sem revelar preço restrito a não aprovados | acesso negado em servidor |
| Catálogo atacado | preço por faixa, pedido mínimo, filtros, estimativas claras | preços recalculados server-side |
| Pré-cotação | resumo e envio com resposta comercial | cotação recebida, não pedido |
| Reposição | repetir condições como ponto de partida + atualização de preço | pedido de reposição vinculado, acompanhamento opt-in |
| Crescimento | futuras ofertas SaaS B2B somente com elegibilidade e interesse | não confundir intenção com assinatura ativa |

## Jornada do parceiro

| Superfície | Experiência | Evento e aceitação |
|---|---|---|
| Onboarding | influenciador, microinfluenciador, expert ou afiliado; aprovação individual | perfil e grants comprovados |
| Kit de conversão | demonstração, Story, nicho, dúvidas e comparação; publicidade identificada | copiar texto + link individual autorizado |
| Página e pré-checkout | movimento aprovado, conteúdo verdadeiro, cadastro opcional consumidor | parceiro bloqueado sem pagamento atribuível |
| Painel | links, visitas, pedidos confirmados, comissão calculada/paga | métricas separadas, reversões reconciliadas |
| Evolução | orientações práticas por nicho e análise dos criativos | resultados observacionais, sem prometer lucro |

## Fases de execução

- **Fase A / implementação inicial:** guia de conversão por login + mais formatos seguros do kit parceiro (PR atual).
- **Fase B:** adicionar eventos de impressão, expansão e uso dos guias; detectar cliques reais; testes mobile e acessibilidade; limitação global de pop-ups.
- **Fase C:** melhorar vínculo oferta ↔ variante ↔ perfil ↔ canal; testes de relevância e de diversidade sem expor dados pessoais.
- **Fase D:** avaliações e comentários reais (#108), moderação, origem e selo de comprador verificado apenas mediante pedido confirmado.
- **Fase E:** atribuição oficial de vendas de parceiros, checkout Kairos, conciliação de pedidos e estornos, custos, margem real.
- **Fase F:** experimentação controlada por variante e canal, separando conversão observada de resultado financeiro.

## Métricas principais (denominadores explícitos)

- Consumidor: CTR por origem, acesso à oferta/visualizações, intenção de checkout/visitas, compra paga/visitas **apenas quando confirmada**.
- Lojista: cotações/lojistas ativos, respondidas/cotações, reposição/lojistas atendidos.
- Parceiro: links aprovados ativos, visitas por link, vendas confirmadas por visita, comissão calculada, paga e estornada.
- Global: coortes 30/60/90d, receita líquida real, contribuição de cada login, opt-outs e reclamações.

## Regras de aceite

Cada entrega precisa de PR, TS, lint, build e testes; validação visual desktop/mobile quando ambiente publicado; evidência de permissão por login; atualização da matriz de cobertura 31/48 **somente** quando novo critério for efetivamente comprovado. Sem inflar percentuais por copy ou UI isolada.

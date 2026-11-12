# RUBI Partners — Times de criadores, nano → micro → macro

Data de referência: 2026-11-11. Implementação inicial: CRM de prospecção privado do Shadow Master. **Não representa criadores recrutados nem campanhas em produção.**

## Modelo comercial

A unidade é um **time por nicho e movimento**, não uma multidão indiscriminada de afiliados. O time agrupa prospects e, no futuro, parceiros efetivamente aprovados. Cada campanha da RUBI pode ter diferentes ângulos por público e criador, sempre com página, oferta, criativo e destino válidos.

1. Selecionar produto autorizado com margem e benefícios verificáveis.
2. Mapear nichos compatíveis — ex.: organização doméstica com criadores de casa; acessórios de treino com criadores de práticas esportivas. Para itens de saúde, obter aprovação de alegações, publicidade e regras de conselhos profissionais; não usar suposto endosso de médicos sem autorização.
3. Prospectar perfis públicos manualmente; classificar porte como **nano, micro, médio, macro ou mega**, sem transformar número de seguidores em qualificação automática. Os limiares de seguidores dependem do canal e mercado e precisam ser configurados e aferidos.
4. Verificar autenticidade, taxa de engajamento com denominador, audiência geográfica, reputação, formato, qualidade de conteúdo, coerência do produto e direitos de uso. Alcance e engajamento são indicadores, não compra garantida.
5. Abrir negociação com proposta **escrita e revisável**: comissão por pedido confirmado, patrocínio fixo ou híbrido. Incluir entregas, canais, material, direitos de reutilização, identificação publicitária e prazo. **Prospect registrado não equivale a parceiro aprovado.**
6. Master formaliza acordo real, verifica permissões e concede grants de produtos no fluxo já existente. Não implantar comissão multi-level nem pagar por recrutar pessoas; pagamentos apenas pelos serviços contratados e/ou vendas oficiais atribuídas.
7. Criador recebe materiais autorizados, link individual atribuído e eventual guia de publicação. Tráfego pago com conteúdo de criadores exige direitos e autorização explícita de impulsionamento (whitelisting).
8. Testar lotes de criativos pequenos, medir custo, visitas qualificadas, checkout, pedidos e estornos. Escalar grupos apenas quando margem líquida e atribuição estiverem comprovadas.

## Política de progressão

- **Nano:** descobrir criadores de nicho, validar comunicação e testes pilotos acessíveis.
- **Micro:** repetir formatos de melhor aderência, distribuir por nicho e monitorar vendas atribuídas.
- **Médio e macro:** negociar pacotes ou performance com condições sustentáveis, apenas após evidência de ROI e capacidade operacional.
- **Grande influenciador:** contratar somente com previsão de caixa, contrato, direitos, monitoramento, logística e capacidade de atendimento; visibilidade isolada não basta.

Não afirmar que um time com 1.000 criadores terá 1.000 pessoas vendendo ou gerar determinada receita. O número é objetivo de escala, **não dado de resultado**.

## Como avaliar a proposta de R$ 50 por venda

Fórmula de contribuição estimada por pedido:

`receita líquida efetivamente repassada à RUBI - custo do fornecedor - tarifas e tributos - frete/subsídios/estornos - comissão do criador - custo de mídia atribuível`.

Exemplo puramente hipotético: se a **contribuição antes do criador** for R$ 100 e a comissão for R$ 50, restam R$ 50 **antes de outros custos não incluídos**. Se os R$ 100 forem apenas diferença bruta de preço, não se pode afirmar que o lucro é R$ 50. Além disso, **50% da margem não é 50% do preço de venda**.

Patrocínio fixo: calcular meta mínima de pedidos **incrementais atribuídos** = `custo fixo do pacote / contribuição líquida por pedido após comissões e descontos`, quando a contribuição for positiva. Modelo híbrido soma fixo + comissão e exige revisão do teto de custo. Nada do que for proposto no CRM altera automaticamente `hub_partner_agreements`.

## Dados e permissões

- `rubi_creator_teams`: nome, nicho, objetivo, estágio; privado Master.
- `rubi_creator_prospects`: perfil público, porte declarado/manual, plataforma, estágio, proposta comercial não vinculante, observações; privado Master.
- RLS ativada e acesso público/autenticado revogado; consultas e mutações apenas por funções server-side com `requireOwnerRole`.
- Dados sensíveis, listas compradas e scraping automatizado sem base adequada não fazem parte desta implementação.
- Não associar prospect a `commercial_profiles` nem emitir referral automaticamente. A parceria formal exige onboarding, autorização por produto, acordo e meios de atribuição externos verificados.

## Próximos marcos

1. **Fase CRM Master (PR atual):** criar times, registrar prospect e mover negociação. A tabela só estará disponível no ambiente após migração oficial e testes.
2. **Fase qualificação:** critérios de encaixe/engajamento, evidência de contato legítimo e auditoria de permissões; paginação quando houver escala.
3. **Fase parceiros ativos:** vincular integrantes aprovados ao time via chave explícita e RLS por membro, com papéis de líder/colaborador, sem expor dados de outros integrantes.
4. **Fase performance:** relatórios por time, produto, criativo, campanha, vendas atribuídas, comissões e estornos; nada de vendas inventadas.
5. **Fase operação paga:** patrocínios contratados com tetos, materiais, calendário, envio de entregáveis e conciliação financeira; dependerá do contrato e checkout.
6. **Fase escala:** automação de convites opt-in, retenção, ranking de qualidade e alocação por nicho, com revisão de orçamento, LGPD e regras da plataforma.

## Critérios de aceite

- TSC, ESLint, build e testes; formulário acessível, mobile e desktop; validações no servidor.
- Aplicar migração em ambiente autorizado, verificar tabelas e RLS, testar Master vs usuário comum e conflitos de perfil duplicado.
- Permanecer sem porcentagem adicional na matriz até critério plenamente testado; reavaliar a baseline de 48 quando times se tornarem requisito formal.

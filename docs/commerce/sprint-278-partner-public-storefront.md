# Sprint 278 — vitrine pública individual do parceiro

Data: 2026-11-19
Classificação: upgrade-only até CI, revisão e homologação
Base: main
Produção: nenhuma alteração aplicada

## Objetivo

Cada parceiro aprovado possui uma vitrine pública estável, com uma URL própria. A vitrine reúne somente produtos que o Shadow Master autorizou para aquele parceiro e que ainda possuem checkout externo aprovado.

A vitrine não é uma loja com gateway próprio. Cada card aponta para o link individual já rastreado em `/r/:code`, preservando parceiro e produto na atribuição antes de seguir para o checkout do fornecedor/provedor.

## O que foi preparado

- Coluna `commercial_profiles.public_store_code` com código opaco de 12 caracteres hexadecimais.
- Backfill para parceiros existentes e trigger para novos cadastros de parceiros.
- Índice único parcial; nenhuma política de leitura pública direta foi criada.
- Server function pública e somente leitura, filtrando perfil aprovado, grants ativos, links ativos, produto ativo e checkout validado.
- Resposta pública não inclui checkout_url, custo do fornecedor, comissão, UUID do perfil ou dados privados.
- Nova rota `/loja/$storeCode` com vitrine responsiva, produtos e link de oferta individual.
- Produtos revogados ou checkouts invalidados deixam de aparecer; a rota de link existente continua revalidando autorização no clique.

## Onboarding e inteligência

O onboarding atual já coleta tipo de parceiro, nicho, experiência profissional/criador, faixa de audiência e canal principal. Essas respostas permanecem como contexto de qualificação para futura recomendação de produtos. Não concedem aprovação, produtos ou comissão automaticamente.

Próxima melhoria: transformar esses dados em recomendação explicável de catálogo, mostrando ao parceiro por que cada produto combina com seu nicho e ao Master os motivos da recomendação. O Master continua responsável por conceder o grant.

## Limites deliberados

- Não criar checkout ou processador de pagamentos RUBI.
- Não aceitar checkout pessoal arbitrário fornecido pelo parceiro; destino continua sendo o checkout verificado do produto no catálogo e no provedor autorizado.
- Não criar venda por clique, visita ou redirect.
- Não confirmar pagamento por retorno de navegador.
- Não expor dados financeiros na página pública.
- Não modificar comissões, acordos, ledger, payout ou RLS existente.
- Não ativar integração Kairos/marketplace sem documentação e evidência oficial.
- A moeda operacional é BRL; a página formata preço em BRL porque o catálogo comercial atual é BRL. Se a origem não comprovar BRL, não publicar preço até contrato de moeda explícito.

## Critérios de aceite

1. Código público estável e único por parceiro.
2. Perfil pendente/rejeitado não tem vitrine pública.
3. Só grants ativos aparecem.
4. Produto inativo ou checkout não aprovado não aparece.
5. Cada card usa o código de referral do próprio parceiro e produto.
6. Revalidar no redirect evita link revogado continuar convertendo.
7. Página pública não revela dados privados nem URL bruta de checkout.
8. A revogação do grant remove o produto da vitrine após atualização da consulta.
9. Testes específicos entram no workflow Hub V1 QA.
10. Nenhuma migração é aplicada em produção sem auditoria de cadeia, backup e autorização.

## Sequência seguinte

- Integrar vitrine no portal privado com copiar URL pública e preview.
- Permitir ordenar/destacar produtos entre os grants ativos.
- Criar recomendações de produtos com base no onboarding e dados de desempenho, sempre sujeitas à aprovação Master.
- Adicionar eventos separados de visualização da vitrine e clique no produto, sem misturar com venda.
- Evoluir pedidos reportados, confirmação externa, comissão elegível e payout.
- Construir painel Master de saúde da rede: parceiros, vitrines, produtos autorizados, links, tráfego, vendas confirmadas, exceções e repasses.

Cobertura V1: manter 36,5/48 (76,0%) até CI e evidência funcional comprovada.


## 13. Jornada completa do parceiro — do cadastro à primeira venda

### Cadastro e qualificação
O onboarding existente já coleta tipo de parceiro (afiliado, nano/micro, influenciador ou expert), nome público, nicho, experiência profissional/criador, faixa aproximada de audiência e canal principal. Evoluções devem acrescentar, sem tornar obrigatório o que não for necessário:
- redes/canais adicionais e URL pública de cada perfil;
- região e idioma de atuação;
- categorias de produtos que deseja divulgar;
- formato de conteúdo preferido (vídeo, review, tutorial, live, comunidade);
- experiência com vendas e expectativa de volume (declarada, não promessa);
- aceite de termos, política de publicidade identificada, uso de marca e regras de produto.

Essas respostas geram um perfil comercial e sugestões explicáveis. Não aprovam cadastro, não liberam produto e não definem comissão. O Master aprova o parceiro, atribui categoria, define contrato e libera produtos.

### Configuração da operação
Após aprovação, o parceiro recebe:
1. URL pública permanente da vitrine;
2. catálogo pessoal de produtos liberados;
3. opção de adicionar/remover produtos da própria vitrine (sem revogar a autorização Master);
4. ordenação, destaques e coleções dentro dos limites da RUBI;
5. link rastreável individual por produto e, quando aplicável, por campanha/publicação;
6. página da oferta aprovada e destino de checkout verificado;
7. painel de desempenho e financeiro.

"Adicionar produto" significa selecionar e organizar um produto que o Master já autorizou. Não significa cadastrar produto livre, alterar preço/custo, escolher fornecedor sem aprovação ou substituir o checkout por URL arbitrária.

## 14. Contrato de link e checkout individual

A RUBI fornece ao parceiro um link exclusivo por produto/campanha. Esse é o link comercial individual que o parceiro divulga. O fluxo é:

`vitrine pública -> link do parceiro/produto -> página de oferta RUBI -> redirect rastreável -> checkout externo aprovado`.

O destino final é o checkout específico do produto/provedor (Kairos ou outro canal autorizado), não uma conta de pagamento pessoal criada pelo parceiro. Quando o provedor oferecer sub-affiliate ID, metadata, cupom ou parâmetro de atribuição documentado, a RUBI deve anexar o identificador permitido e verificar que ele aparece no relatório/webhook. Sem esse suporte, a RUBI ainda registra o clique/redirect, mas não promete atribuição da venda.

Não aceitar que parceiro cole um checkout arbitrário no painel: isso permitiria fraude, phishing, desvio de pagamento e perda da trilha de evidência. Uma exceção para checkout próprio de parceiro exigiria processo Master separado de KYC/compliance, aprovação de domínio, contrato de produto e conciliação — fora do MVP atual.

## 15. Máquina de estados de uma jornada

| Estado | Como nasce | Efeito financeiro |
|---|---|---|
| Vitrine visualizada | Página pública carregada | Nenhum |
| Produto acessado | Clique em card/link | Nenhum |
| Oferta visualizada | Página RUBI resolvida | Nenhum |
| Checkout redirecionado | Saída para destino externo | Nenhum |
| Checkout iniciado | Evento do provedor, se disponível | Nenhum |
| Pedido reportado | Webhook/arquivo/relatório externo recebido | Em verificação |
| Pagamento aprovado | Evidência autenticada ou reconciliação autorizada | Venda confirmada |
| Pedido em processamento | Status do provedor/fornecedor | Não altera comissão por si só |
| Pedido enviado/entregue | Evento confiável, se fornecido | Elegibilidade depende do contrato |
| Cancelado/reembolsado/chargeback | Evento externo validado | Reversão/ajuste auditável |
| Comissão elegível | Regra contratual e janela de risco satisfeitas | Pode entrar no próximo repasse |
| Repasse iniciado | Operador registra instrução externa | Ainda não pago até comprovação |
| Repasse confirmado | Referência/comprovante conciliado | Comissão paga |

O parceiro vê os estados comerciais e financeiros com nomes compreensíveis. O Master vê também a fonte, ID externo, payload normalizado, data, método de verificação e exceções.

"Não deu certo" precisa ter motivo separado: checkout não iniciado, pagamento recusado, pedido cancelado, reembolso, duplicidade, atribuição não comprovada ou falha de integração. A RUBI não pode inventar status que o checkout não forneceu.

## 16. Painel do parceiro — experiência premium

### Visão inicial
- Vendas confirmadas no período e comparação com período anterior.
- Comissão calculada, em análise, elegível, paga e ajustada.
- Cliques, visitas, ofertas visualizadas e checkouts iniciados, cada métrica separada.
- Produtos mais acessados e mais vendidos, sem misturar clique com compra.
- Alertas: produto suspenso, checkout indisponível, pedido em revisão, reembolso e repasse registrado.
- Atalho para vitrine, produtos, links, campanhas e extrato.

### Minha vitrine
- Preview da página pública.
- Copiar link e compartilhar.
- Adicionar/remover produtos autorizados.
- Reordenar e destacar produtos.
- Ver status de autorização e checkout por produto.
- Criar coleções/campanhas dentro de limites aprovados.

### Meus links
- Um link por parceiro + produto + campanha.
- Copiar, gerar QR e identificar origem de publicação.
- Métricas por link.
- Link desativado claramente sinalizado; histórico não apagado.

### Pedidos e comissões
- Pedido externo, produto, data, valor nominal e origem.
- Status do pagamento e da entrega, quando informados pelo provedor.
- Base e percentual de comissão congelados no momento aplicável.
- Motivo de pendência/ajuste.
- Repasse com data, valor, referência e comprovante permitido.
- Exportação de extrato, sem expor dados pessoais do comprador.

## 17. Shadow Master — controle central

O Master deve operar em cinco áreas:

1. **Rede:** cadastros, qualificação, aprovação, categoria, situação, documentação e saúde de cada parceiro.
2. **Catálogo e grants:** produto, fornecedor, estoque/disponibilidade quando houver fonte, checkout aprovado, parceiros autorizados e revogações.
3. **Vitrines e campanhas:** URL pública, produtos selecionados, destaques, links, publicações e desempenho.
4. **Pedidos e conciliação:** pedidos reportados, pagos, cancelados, reembolsados, duplicados, sem atribuição e divergências de provedor.
5. **Comissões e repasses:** contratos, versão, taxa, base, elegibilidade, obrigações, pagamentos parciais, comprovantes e auditoria.

Filtros comuns: parceiro, tipo, produto, fornecedor, provedor, campanha, período e status. A visão global nunca deve substituir o drill-down da venda e da evidência.

## 18. Regra financeira para o modelo externo

- Checkout externo recebe do comprador; RUBI não declara recebimento até conciliar relatório/liquidação do provedor.
- Venda confirmada é evento comercial; recebimento liquidado pela Kairos é evento financeiro distinto.
- Comissão do parceiro é obrigação contratual; não é transferência bancária automática.
- Payout só vira "pago" após confirmação do repasse real, com referência e evidência.
- Taxa do gateway só entra no cálculo se o contrato/base da comissão determinar; não deduzir duas vezes.
- Marketplace de afiliado da própria RUBI é receita externa da RUBI, a menos que haja atribuição individual verificável ao parceiro.
- Reembolso/chargeback produz reversão/ajuste; nunca apaga o pedido original.
- BRL é a moeda operacional inicial. Se provedor retornar moeda diferente, manter subtotal separado e bloquear soma/conversão implícita.

## 19. Roadmap de produto

**Sprint 278 — Fundamento da vitrine:** código público, página individual, catálogo autorizado, links rastreáveis e atalho no portal privado.

**Sprint 279 — Editor da vitrine:** selecionar produtos liberados, ordenar, destacar, criar coleções, preview e publicação; telemetria separada de page view/card click.

**Sprint 280 — Cockpit do parceiro:** lista de links por produto/campanha, QR, métricas por link, timeline de pedidos e extrato com status claros.

**Sprint 281 — Shadow Master Partner Operations:** gestão de vitrines, grants, performance, exceções e visão consolidada da rede.

**Sprint 282 — Evidência externa e checkout adapters:** contrato de eventos por provedor, importação segura, idempotência, assinatura e reconciliação; iniciar por Kairos apenas após documentação e credenciais oficiais.

**Sprint 283 — Elegibilidade e payout:** regras versionadas por produto, estorno, janela de risco, pagamentos parciais e conciliação do valor efetivamente recebido pela RUBI.

**Sprint 284 — Recomendação inteligente:** matching explicável entre nicho/audiência e catálogo, sugestão de campanha e alertas de desempenho; recomendação não publica nem concede acesso automaticamente.

Os números são sequência proposta, não estimativas de prazo nem promessa de entrega. Cada sprint deve ser validada isoladamente antes de avançar.

## 20. Gates para não criar uma experiência enganosa

- Não exibir "venda perdida" se o provedor não retornou status; usar "sem confirmação disponível".
- Não contar clique como checkout iniciado quando apenas houve abertura de URL; nomear como "redirecionamento".
- Não calcular conversão com contagens de períodos/coortes diferentes.
- Não exibir saldo como sacável se ainda depende de entrega, janela de estorno, recebimento ou validação.
- Não deixar o parceiro editar sua comissão, preço, checkout ou status de pedido.
- Não expor dados do cliente final além do mínimo necessário.
- Não permitir que parceiro veja venda, comissão, link privado ou desempenho de outro parceiro.
- Toda ação do Master que altere grant, acordo, pedido ou repasse deve ter trilha de auditoria.

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

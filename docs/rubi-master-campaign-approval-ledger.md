# RUBI Shadow Master — Registro e aprovação de campanhas

Data de referência: 11/11/2026. Primeira versão da persistência dos planos dos três funis (agente vendedor com IA, resposta direta e time de influenciadores).

## Implementação

- `rubi_master_campaign_plans`: produto, campanha, modo, público, teto diário, dias planejados, evidência, responsável, status e nota de revisão.
- `rubi_master_campaign_plan_audit`: histórico de criação, alteração, envio para revisão, aprovação e pausa gravado por gatilho na mesma transação.
- RLS habilitada em ambas as tabelas; sem acesso SQL ao navegador ou a usuários comuns. Leitura e mutação apenas por `requireOwnerRole` no servidor.
- Fluxo: **rascunho → em revisão → aprovado internamente → pausado**. Editar rascunhos ou planos pausados sempre remove aprovação anterior. Não editar silenciosamente um plano aprovado.
- Aprovar exige prova comercial escrita, nota de revisão e produto ativo com preço positivo e checkout oficial validado; atualização com verificação do status para detectar alterações concorrentes.
- Planos só são criados para SKUs reais cadastrados e identificadores de campanha válidos.
- Interface inserida no admin do Movement Engine por produto e campanha, ao lado do gerador existente de brief pago.

## O que aprovação NÃO significa

- Não compra mídia, publica anúncios, gera vídeos, garante ROI, reserva orçamento ou altera checkout.
- Não cria parceria, libera SKU, define remuneração ou paga influenciadores.
- Não conclui atribuição externa Kairos, estorno ou faturamento.

## Próximos marcos

1. Executar migração versionada no ambiente autorizado; validar proteção das tabelas, gatilho e rollback de transação.
2. Testar com sessão real Shadow Master e tentar acesso por consumidor/parceiro; homologar UI desktop/mobile.
3. Criar workflow de edição/versionamento explícito e exibição do histórico da auditoria na interface.
4. Conectar somente contas autorizadas de Ads/IA por permissões mínimas; custo real e ID da campanha na plataforma devem ser consultados independentemente.
5. Separar valores **planejados, aprovados, executados, faturados e liquidados**. Nunca inferir ROAS de cliques.

## Cobertura

O incremento não altera sozinho a última matriz auditada (31/48 = 64,6%). A nova dimensão de campanhas exige ampliação/revisão dos critérios, inclusive homologação operacional.

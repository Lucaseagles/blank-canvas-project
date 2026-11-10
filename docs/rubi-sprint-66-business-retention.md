# RUBI 11× — Sprint 66 | Respostas e interesse em reposição B2B

## Escopo funcional
- Uma cotação pode ser vinculada explicitamente à anterior como **nova solicitação de reposição**, sempre do próprio lojista e com produto em comum; sem cobrança, frete ou reserva de estoque.
- O histórico do comerciante identifica as solicitações relacionadas e informa quando houve primeira resposta comercial escrita.
- O painel do Admin Master mostra número de cotações, lojistas solicitantes, cotações respondidas, lojistas atendidos, solicitações aguardando resposta, pedidos de reposição (cotações vinculadas), lojistas que pediram reposição e lojistas que voltaram a solicitar.
- Métricas em janela de 30 dias agregadas pelo servidor no Supabase; a janela de cotações emitidas é distinta da data da resposta. Eventos não equivalem a venda, recebimento, recompra efetiva ou receita recorrente.
- Cotação enviada pelo comerciante verifica no servidor perfil aprovado, propriedade da cotação anterior, sobreposição de produto e valores calculados no catálogo atual.
- A resposta é registrada pelo Admin Master somente quando existe mensagem não vazia; o primeiro horário de resposta é preservado após futuras alterações.

## Proteções
- A função SQL `rubi_business_retention_funnel` concede execução exclusivamente a `service_role`. No aplicativo ela é chamada só por função de servidor com `requireOwnerRole`.
- O vínculo `replenishment_of_quote_id` nunca é aceito apenas com ID recebido do cliente: o servidor exige a cotação original do mesmo perfil.
- Reposição é uma nova oportunidade de cotação, não uma encomenda paga; este projeto não sabe se o fornecedor recebeu pagamento.
- Sem fornecedores/produtos oficiais Kairos, a tabela seguirá vazia até haver atividade real. Não criar registros fictícios no banco.

## Verificações de aceite
1. Build, TypeScript, ESLint e `test:rubi-retention` aprovados no CI.
2. Aplicar migração ao Supabase `heartful-helper-box` e conferir `RLS`, privilégios da função SQL e acesso restrito ao ledger.
3. O histórico do lojista é isolado; tentativas de vincular cotação de outro comerciante são rejeitadas.
4. Reposição só é contada depois de registrar nova cotação explicitamente vinculada; simular ou clicar não a contabiliza.
5. O Admin Master acompanha atendimento e recorrência de interesse; nenhum desses números é mostrado como receita ou comprador recorrente pago.
6. Testes reais de navegação/usuário e confirmação de pagamento Kairos permanecem atividades posteriores.

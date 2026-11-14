# RUBI Eagles 11× — Sprint 192: Reauditoria do critério 08.3 (técnica estática v1)

**Base verificada:** 35/48 = 72,9%, com 08.3 em 0,5/1.

## Evidência da correção
- A/B privado por movimento: execução/pausa, alocação 50/50, revisões de produto/movimento/variante, controle de concorrência, auditoria administrativa atômica.
- Ativação Master-only com produto e checkout ativos, variante revisada com direitos declarados, ganchos distintos e material completo.
- Uma experiência controlada por SKU, URL orgânica já publicada preservada. Visitantes diretos da Store recebem uma variante por identificador aleatório do navegador e versão, com fallback para a oferta aprovada.
- Eventos de exposição e clique registrados separadamente, sem simular compra, comissão ou margem.
- Teste do contrato de autorização, distribuição e integração: src/lib/rubi-movement-controlled-ab.test.mjs.

## Aceite estático condicionado aos gates
A matriz v1 define 08.3 como Criativos/páginas e experimento A/B. Depois de QA, merge, migração e validação RLS/grants, 08.3 pode passar de 0,5 a 1,0, levando 35/48 a 35,5/48 (74,0%). Se um gate falhar, conservar 35/48.

## O que NÃO está homologado
Não há prova de melhoria de conversão ou significância estatística. Faltam SKU e variantes comerciais reais, tráfego com amostra e período predefinidos, qualidade dos eventos client-side, atribuição robusta de compra paga e medição de lift. Não contar esses resultados como evidência para 08.2, 08.4, 10.3 nem para os itens de pagamentos.

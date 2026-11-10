# RUBI 11× — Sprint 64 · Desempenho orgânico por campanha e produto

## Entrega estrutural
- `rubi_organic_campaign_performance`: agregação SQL dos últimos 30 dias por produto, canal e identificador de campanha orgânica.
- `getRubiOrganicCampaignPerformanceAdmin`: função de servidor protegida por `requireOwnerRole`, que entrega somente métricas agregadas, sem identidade do visitante ou dados financeiros privados.
- `/admin/hub-catalog`: relatório operacional de visualizações, sessões com visualização e intenções de continuar ao checkout por canal/campanha/produto.
- A consulta lista até 100 combinações com maior quantidade de visualizações. **Não se deve somar linhas truncadas para produzir totais globais.**
- Os dados não incluem vendas pagas, receita, pedidos conciliados, repasses, nem retorno financeiro por campanha.
- Afiliados seguem em fluxo próprio; `utm_source` editorial **não** substitui código do parceiro nem atribui comissões.
- Supabase: função RPC em arquivo de migração, execução restrita à service role. Não exige checkouts Kairos reais.

## Aceitação
1. Aplicar a migração ao projeto Supabase `heartful-helper-box` **somente após** verificação do SQL/CI, e alinhar a versão da migração entre repositório e banco.
2. Compilar e validar TypeScript, ESLint, build e testes existentes, sem mexer em pagamentos ou em controle de acesso.
3. Confirmar caso vazio: sem eventos válidos, mostrar estado vazio e não inventar estatísticas.
4. Confirmar eventos iguais na mesma sessão: visualizações podem ser maiores que sessões; intenção de checkout não é pedido.
5. Filtrar campanhas orgânicas válidas, canais permitidos e apenas `origin=store` nas intenções de saída; evitar incluir referral de Partners.
6. Verificar que usuário sem privilégio owner não consegue executar a função pelo aplicativo e que RPC não pode ser chamada diretamente por `anon`/`authenticated`.
7. Seguir para outra sprint somente depois que o escopo estiver integrado — sem esperar o catálogo Kairos.

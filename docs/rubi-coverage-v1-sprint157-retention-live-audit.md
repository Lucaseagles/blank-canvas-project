# RUBI Eagles 11× — Sprint 157: auditoria real de retenção por variante

Data de verificação: 2026-11-13 UTC, banco `heartful-helper-box` (`akfvkjarpgocdsieuvvq`).

## [UPGRADE] Concluído em código e infraestrutura
- Sprints 154, 155 e 156 aprovadas nos dois workflows e integradas à `main`.
- O player mede cobertura de trechos reproduzidos, evitando conclusão por simples seek (Sprint 154).
- O vínculo privado entre `videos` e `rubi_movement_variants` foi integrado (Sprint 155).
- A função de conclusão de vídeos por variante usa o conjunto de usuários autenticados com início e conclusão do mesmo vídeo, sem expor identificadores (Sprint 156).
- Migrações `20261113024000_rubi_variant_video_links.sql` e `20261113030000_rubi_variant_video_retention.sql` aplicadas com sucesso no banco correto.
- Verificação SQL: tabela e RPC presentes; RLS ativa; `anon`/`authenticated` sem SELECT na tabela nem EXECUTE da RPC; `service_role` com EXECUTE; consulta controlada para UUID inexistente retornou zero linhas.

## [COBERTURA] 10.3 ainda parcial
Matriz v1 vigente: **32,5/48 = 67,7%**. O critério 10.3 permanece **0,5/1** até demonstração de dados reais e inspeção E2E no ambiente publicado. Não contabilizar o vínculo e a RPC duas vezes.

### Bloqueios de evidência observados
- Banco de produção tinha **0 vídeos, 0 vídeos publicados, 0 variantes e 0 movimentos** no momento da consulta.
- Sem vídeos e usuários observados, **não existe coorte real de retenção por variante** para verificar o cálculo em produção.
- O vínculo editorial não comprova retrospectivamente que os eventos de um vídeo pertenciam à variante desde a origem. Dados anteriores ao vínculo não devem ser interpretados como exposição experimental.
- A RPC mede eventos entre usuários autenticados, não tempo real assistido, atenção, impressões sociais ou compra paga.
- A revisão de segurança não mostrou concessão pública nas novas estruturas. O advisor pode sinalizar tabela RLS sem políticas como INFO; isso é **intencional** para tabelas Master operadas por service role.

### Aceite para novo meio ponto em 10.3
1. Cadastrar SKU/movimento/variante de vídeo real, fonte licenciada e vídeo publicado com consentimento e autorização adequados.
2. Associar esse vídeo à variante revisada com o Master; inspecionar histórico e visibilidade.
3. Testar em domínio HTTPS publicado com sessões autenticadas que iniciam e concluem o vídeo, e casos negativos de seek, duplicações e visitantes anônimos.
4. Conferir contagens do aggregate, período, dados truncados e taxas, sem alterar métricas artificialmente.
5. Reauditar pontuação, publicar evidências dos testes e integrar registro na `main`.

**Meta condicional:** 10.3 de 0,5 para 1/1 renderia `33/48 = 68,8%`. Ainda seria necessário mais 1 ponto para `34/48 = 70,8%`.

## Próxima operação comercial
SKU real, host Kairos confirmado, autorizações de mídia e rotas de checkout não foram homologados nesta auditoria. Nunca simular uma venda real nem inferir comissão a partir de cliques. Aplicação SQL não substitui QA E2E.

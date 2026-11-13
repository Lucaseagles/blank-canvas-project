# RUBI Eagles 11× — Sprint 166 (híbrida): distribuição com auditoria atômica

## [UPGRADE]
A edição e criação de planos de distribuição orgânica por variante passam por RPC transacional única, que registra o responsável Owner no `admin_audit_log`. A revisão otimista impede perda silenciosa de alterações feitas por outro administrador; se a inserção de auditoria falhar, o plano não é salvo. Edição continua revogando publicação da página e as revisões anteriormente aprovadas. Os gatilhos existentes que impedem colisões de código por produto continuam em vigor.

Não publica nas redes sociais, não toca no checkout Kairos, não cria atribuições de parceiro e não transforma referência de postagem em venda.

## [CORREÇÕES E TESTES]
- `rubi_movement_distribution.revision` no banco, tipo de domínio e retorno do servidor.
- Função `rubi_save_distribution_audited`: Owner validado, versão bloqueada em transação, ação e resumo saneado; acesso restrito a `service_role`.
- Testes de proteção das revisões e ausência de notas privadas no log.

## [COBERTURA]
O critério 11.3 recebe nova evidência de rastreabilidade para planos de distribuição, além das decisões de Story, movimento, campanha e variante. Ainda restam produtos, preços, autorizações, fornecedores e políticas administrativas a revisar. Não atribuir pontos por contar PRs: base **34/48 = 70,8%**, meta **36/48 = 75%**.

## Aceite
1. Ambos os workflows CI verdes.
2. Merge na main e aplicação da migração apenas depois disso.
3. Consultar RLS, privilégios e existência da função no Supabase correto.
4. Testar criação, atualização concorrente, revogação de publicação e rollback com registros comerciais autorizados quando estiverem disponíveis.
5. Reauditar a matriz 11.3 para decidir ganho de pontuação.

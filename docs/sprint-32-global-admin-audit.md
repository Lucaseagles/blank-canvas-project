# SPRINT 32 — CONFIGURAÇÃO GLOBAL & AUDITORIA TOTAL DO ADMIN

## Implementação no GitHub
Este sprint é mantido diretamente no repositório. Lovable não é requisito do workflow.

## Contrato de fechamento
- `/admin/settings` deve consolidar configurações existentes, sem criar fontes duplicadas de verdade.
- `admin_audit_log` deve registrar mutações administrativas relevantes sem persistir segredos.
- Acesso ao hub e ao log deve ser restrito a `owner` no nível de UI e de backend/database.
- Logs devem ser paginados e indexados por `entity_type, created_at`.
- Nenhum item é marcado como funcional sem evidência de execução real.

## Mapa obrigatório
| Categoria | Fonte existente a localizar | UI central | Auditoria |
|---|---|---|---|
| Personalização | personalization_weights / feed_mix_config | /admin/settings | mudança de peso/mix |
| Prova Social | social_proof_config / thresholds | /admin/settings | mudança de regra |
| Marketing | popup_rules / ab_experiments | /admin/settings | mudança de regra/experimento |
| Automação | automation_rules | /admin/settings | mudança + execução |
| Gamificação | pontos/badges/missões existentes | /admin/settings | mudança |
| Compliance | compliance_rules | /admin/settings | mudança |
| Integrações | marketplace / whatsapp_config / telegram_config | /admin/settings | alteração de configuração, nunca segredo |
| Feature Flags | feature_flags | /admin/settings | toggle |

## QA obrigatório
1. Editar uma configuração de cada categoria que possua mutação.
2. Confirmar persistência na fonte real.
3. Confirmar reflexo no motor consumidor.
4. Confirmar entrada no `admin_audit_log` com actor, ação, entidade, valor anterior/novo e data.
5. Confirmar que tokens, senhas, chaves e credenciais nunca aparecem em `previous_value` ou `new_value`.
6. Testar busca/filtro e paginação.
7. Testar acesso com owner e usuário sem owner.

## Regra contra falsa conclusão
A existência desta documentação não significa que os testes foram executados. O veredito final somente pode ser `V1/SPRINT 32 FECHADO` após execução em ambiente real e validação do banco/RLS.

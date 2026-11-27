# Sprint 359 — decisão formal de cobertura parcial do critério 02.4

**Data:** 2026-11-26  
**Base:** `main` após PR #358, merge commit `4c4231d8f763c86042cb51b36ddcd7e2b3215e3d`  
**Critério:** 02.4 — jornada Story → produto correspondente → pré-checkout interno  
**Decisão:** **0.0 → 0.5 ponto (cobertura parcial)**  
**V1:** **37.5/48 (78.1%) → 38.0/48 (79.2%)**  
**Ganho:** **+0.5 ponto / +1.04 ponto percentual**

## Por que esta decisão é válida

O aceite parcial V1 exige um percurso técnico integrado e testado; não exige declarar checkout externo, pagamento ou venda. O aceite completo permanece condicionado à homologação hospedada e ao round-trip oficial do provedor.

Evidências verificadas:

1. O caminho Story → mesmo produto → pré-checkout interno está descrito e implementado com validação de produto, fornecedor, preço, direitos, aprovação do Story, revisão do movimento e host oficial de checkout.
2. O workflow E2E local autenticado executou a jornada com dados persistidos em Supabase descartável, nos viewports mobile e desktop: [run #45750796298](https://github.com/Lucaseagles/blank-canvas-project/actions/runs/45750796298), commit testado `a878cbe4a4f584d959b73ce142f54f156573ce6a`, 22/22 testes esperados, 11 cenários obrigatórios, zero falhas inesperadas, skips ou flaky.
3. A continuação da PR #358 foi integrada em `4c4231d8f763c86042cb51b36ddcd7e2b3215e3d`. No HEAD da PR `373e5690fbfbc75418b9395181735043fbcbbe24`, passaram:
   - [Hub V1 Integration QA — run #974](https://github.com/Lucaseagles/blank-canvas-project/actions/runs/45920046019)
   - [Sprint 33 QA — run #2072](https://github.com/Lucaseagles/blank-canvas-project/actions/runs/45920046032)
   - [RUBI Local Authenticated E2E — Four Profiles — run #408](https://github.com/Lucaseagles/blank-canvas-project/actions/runs/45920046107)

## Limites: por que não recebe 1.0

| Gate | Estado |
|---|---|
| Implementação e validações de domínio | Passou |
| Jornada browser autenticada com persistência em banco descartável | Passou localmente |
| Mobile e desktop | Passou localmente |
| HTTPS hospedado em staging autorizado | Pendente |
| Round-trip de checkout pertencente ao provedor | Pendente |
| Evidência de atribuição externa confirmada, quando aplicável | Pendente |

O CTA e o evento de interesse permanecem **interesse/pré-checkout**, nunca compra, pedido pago, comissão ou receita. Não foi usado Supabase remoto de produção nem pagamento fictício.

## Regra de não duplicidade

O ponto concedido é somente o parcial de 02.4. Não altera 12.3, cujo +1.0 já está incluído nos 37.5 pontos anteriores. Não concede pontos para 04.4, 06.4, 09.3, 09.4 ou 12.4.

## Próximo gate para 02.4 = 1.0

Executar a mesma jornada em HTTPS staging autorizado, com identidades e dados descartáveis, checkout de teste oficial, round-trip validado e pacote de evidência revisado. Até isso ocorrer, 02.4 permanece em **0.5/1.0**.

## Efeito no placar

- Antes: 37.5/48 = 78.125%.
- Agora: 38.0/48 = 79.1667%.
- Restante aritmético: 10.0/48 = 20.8333%.

Esta decisão reconcilia apenas a linha 02.4. Não representa uma reconciliação completa das 48 linhas; as demais distribuições individuais continuam pendentes e não serão inferidas do agregado.

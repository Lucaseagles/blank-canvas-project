# RUBI Eagles — Sprint 241: arquitetura dos quatro motores e plano híbrido

**Classificação:** upgrade estratégico/documental + atualização do painel Shadow Master; sem aumento automático da matriz V1.  
**Base:** `main` após Sprint 240, commit `dd5509bd16fbfc279a84728d7ec7acbbb1ae2882`.  
**Objetivo:** formalizar a arquitetura dentro e fora do aplicativo, instituir o modelo híbrido upgrade + cobertura e apresentar estimativas de esforço com dependências explícitas.

## 1. Diretriz arquitetural oficial

O RUBI Eagles é um ecossistema comercial conectado, não apenas um aplicativo. O aplicativo é seu núcleo de inteligência e coordenação: recebe sinais externos autorizados, organiza dados e jornadas, monitora resultados e ajuda a melhorar as operações externas. Ele não substitui redes sociais, mídia paga, criadores, comunidades, grupos, canais, fornecedores, marketplaces ou checkouts externos.

Os quatro motores existem **dentro e fora** do aplicativo:

| Motor | Operação externa | Operação dentro do RUBI |
|---|---|---|
| **Tráfego** | Orgânico, pago, influenciadores, afiliados, parceiros e distribuição | Campanhas, links/UTM, criativos, origem, atribuição e desempenho |
| **Base** | Comunidades, grupos, canais, rede de criadores e audiência própria com consentimento | Consumidores, lojistas, parceiros, catálogo, preferências e histórico |
| **Funil** | Conteúdo, páginas, canais, grupos e relacionamento | Segmentação, jornadas, recomendação, notificações, recuperação e mensuração |
| **Oferta** | Criativos, divulgação, páginas, checkout e distribuição comercial | Produtos, movimentos, vitrines, preço, pré-checkout, pedidos, pós-venda e recompra |

O ciclo operacional é: **atrair → identificar origem → organizar base e consentimento → direcionar jornada → apresentar oferta → confirmar venda → cuidar do cliente → estimular recompra → devolver aprendizados à aquisição**.

O aplicativo é o cérebro de coordenação, mas a execução pode ser distribuída. O Master governa permissões, orçamento, publicação e automações sensíveis. IA recomenda, classifica, resume e automatiza dentro de limites; não promete precisão perfeita nem altera gasto, comissão, preço ou comunicação em massa sem autorização e trilha de auditoria.

## 2. Como os módulos existentes se encaixam

Os cinco pilares operacionais já presentes em `src/lib/rubi-growth-11x.ts` são módulos de negócio, não cinco novos motores:
- **Eclipse:** base e relacionamento, dentro de Base/Funil.
- **Store:** produtos próprios e margem, dentro de Oferta/Base.
- **Achadinhos:** descoberta e aquisição orgânica, dentro de Tráfego/Funil.
- **Partners:** rede de distribuição e criadores, dentro de Tráfego/Base/Oferta.
- **Business:** lojistas, atacado e reposição, dentro de Base/Oferta/Funil B2B.

Os três perfis operacionais continuam distintos: consumidor, lojista e parceiro. O Shadow Master permanece área de governança exclusiva do Owner/fundador; não criar outros Masters sem autorização explícita.

## 3. Modelo híbrido obrigatório por sprint

Cada sprint deve tentar entregar dois resultados:
1. **Upgrade:** corrigir defeito, risco ou limitação estrutural, com teste e evidência.
2. **Cobertura:** identificar um critério da matriz V1 que possa passar de 0 para 0,5, de 0,5 para 1, ou de 0 para 1, somente se o critério completo estiver satisfeito.

A sprint pode ser upgrade-only quando não houver critério elegível ou quando faltar dependência externa. Não fracionar um critério para gerar pontos repetidos. Documentação, tela nova, teste isolado ou CI verde não aumentam score por si só.

Toda entrega deve registrar:
- motor(es) e módulo(s) beneficiados;
- problema e capacidade nova;
- critério V1 relacionado, valor anterior e valor proposto;
- teste específico e workflows obrigatórios;
- estado: planejado, implementado, CI aprovado, integrado, E2E/produção comprovado ou bloqueado externamente;
- próxima dependência e estimativa restante.

## 4. Métricas oficiais — não misturar indicadores

### Matriz V1
Último valor formal preservado no histórico recente: **36,5/48 = 76,0%**, faltando **11,5 pontos**. O documento Sprint 226 pede reconciliação pós-Sprints 218–225; portanto, este valor permanece baseline provisória de continuidade até a próxima reauditoria individual dos 48 critérios. Sprint 241 não altera score.

### Inventário das 35 estratégias 11×
`src/lib/rubi-growth-11x.ts` contém 35 estratégias e classifica:
- 14 `code-observed` (40,0%): há código observado, mas isso não significa fluxo E2E, uso ou resultado comercial comprovado.
- 18 `execution-plan` (51,4%): plano de execução, ainda não tratado como implementação completa.
- 3 `external-blocker` (8,6%): dependências de provedor/integração externa.

Esses percentuais descrevem a **classificação das estratégias**, não percentual de upgrades concluídos, nem progresso de vendas. Não publicar um percentual global de upgrades até decompor as oito frentes U1–U8 em tarefas únicas, com denominador congelado e estados verificados.

### Operação e negócio
CI verde comprova somente os testes executados. Cobertura estática não comprova usuários ativos, conversão, pagamentos, margem, recompra ou funcionamento externo. Cliques, views e intenção de checkout não são vendas. A conversão deve usar coortes e pedidos pagos confirmados.

## 5. Estimativas de esforço e sequência recomendada

Estimativas abaixo são **faixas de esforço de engenharia/validação**, não prazo de calendário garantido. Dependem da revisão do código atual, CI, ambiente Supabase correto, credenciais e respostas dos provedores. Um ciclo curto pode ocupar 1–3 dias úteis; mudanças de banco, integrações e regressões podem exigir mais. Itens externos não têm prazo confiável antes de obter contrato, acesso e documentação do provedor.

| Fase | Entrega | Esforço indicativo | Resultado esperado |
|---|---|---:|---|
| A | Reauditoria dos 48 critérios e reconciliar evidências pós-218–240 | 1–3 dias úteis | Baseline individual atualizada; candidatos legítimos a +0,5/+1 identificados |
| B | U1–U3: trilha administrativa, permissões, concorrência e rollback nos caminhos ainda descobertos | 3–8 dias úteis, em lotes | Integridade e segurança consistentes; cobertura somente se critério completo fechar |
| C | Aquisição→sessão→produto→pré-checkout em coorte, com origem e deduplicação | 3–7 dias úteis | Primeiro percurso interno mensurável; não confundir intenção com compra |
| D | Jornada dos três perfis e testes E2E desktop/mobile | 3–8 dias úteis | Fluxos reais de consumidor, lojista, parceiro e Owner verificados |
| E | Oferta e pedido real: SKU, preço/custo, checkout, webhook/retorno, estorno e conciliação | 5–12 dias úteis após acesso e contrato externo | Primeiro ciclo comercial verificável; dependente de fornecedor/provedor |
| F | Pós-venda, retenção e recompra por coorte | 4–10 dias úteis após eventos de venda/entrega | Ciclo de retenção baseado em dados reais |
| G | Distribuição omnicanal e mídia paga autorizada, com limites e relatório de custo | 5–15 dias úteis após APIs/contas/credenciais | Operação de tráfego externa conectada; sem gasto/publicação autônomos não autorizados |

**Estimativa consolidada:** aproximadamente 24–63 dias úteis de trabalho técnico distribuído pelas fases A–G, mas não necessariamente em sequência linear. O calendário pode ser maior por dependências externas, dados reais, revisões, testes e disponibilidade de credenciais. Não prometer data de lançamento ou conclusão do ecossistema antes de validar os bloqueios.

## 6. Próximo caminho híbrido

1. Reauditar individualmente os 48 critérios contra `main`, incluindo PRs 218–240; não assumir que aprovação de CI gera cobertura.
2. Priorizar critérios parcialmente cobertos que podem fechar sem depender de pagamentos ou provedores externos, buscando +0,5 ou +1 com evidência.
3. Em paralelo, continuar U1–U8 apenas onde a varredura atual confirmar risco ou lacuna não resolvida.
4. Criar trilha por coorte para um caminho interno controlado: origem/UTM → sessão → movimento/produto → pré-checkout. Separar evento de venda.
5. Preparar homologação externa somente com contrato, credenciais e sandbox/ambiente de teste autorizado.
6. Liberar automações gradualmente, com opt-in, limites, logs, revogação e aprovação Master.

## 7. Gates de qualidade e governança

- Ambos os workflows obrigatórios verdes no SHA final: Hub V1 integration QA e Sprint 33 QA.
- Migrações revisadas e testadas antes de qualquer aplicação no Supabase correto `heartful-helper-box` (`akfvkjarpgocdsieuvvq`); não alterar secrets/config/RLS sem necessidade comprovada.
- Não criar dados comerciais fictícios, compras simuladas como produção, vendas, parceiros ou conversões inventadas.
- Não enviar mensagens em massa nem publicar/anunciar automaticamente sem consentimento, autorização e controles.
- Manter Master fundador exclusivo e separar autorização de consumidor, lojista e parceiro.

## 8. Resultado da Sprint 241

- Arquitetura dos quatro motores documentada para operação interna e externa.
- Painel Shadow Master atualizado para apresentar tráfego, base, funil e oferta, conectando-os aos cinco módulos operacionais existentes.
- Modelo híbrido upgrade + cobertura formalizado.
- Esforço indicativo e dependências documentados.
- **Matriz V1 permanece 36,5/48 = 76,0%; upgrades globais ainda sem percentual auditável.**

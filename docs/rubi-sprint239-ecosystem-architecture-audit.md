# RUBI Eagles — Sprint 239: mapa de integração do ecossistema

**Classificação:** upgrade documental/arquitetural; não altera produção.  
**Matriz V1:** sem alteração de pontuação.  
**Objetivo:** separar o que já existe no código, o que está conectado por fluxo e o que ainda precisa ser comprovado antes de chamar o ecossistema de automatizado.

## 1. Modelo operacional

O RUBI é organizado em quatro motores conectados:

1. **Tráfego:** aquisição orgânica, campanhas, links identificados, criativos, influenciadores e parceiros.
2. **Base:** aplicativo, identidade, catálogo, preferências consentidas, histórico, perfis e inteligência.
3. **Funil:** jornadas dentro do aplicativo e canais externos autorizados, segmentação, conteúdo, notificações, grupos, recuperação e relacionamento.
4. **Oferta:** criativo, página, movimento, checkout oficial, confirmação, entrega, pós-venda e recompra.

O ciclo de dados esperado é: origem identificada → pessoa/sessão e preferências → conteúdo/jornada apropriada → oferta compatível → checkout e confirmação → pós-venda/retensão → aprendizado para a próxima campanha.

## 2. Evidências existentes no repositório

### Base / aplicativo
- Experiências distintas de consumidor, lojista e parceiro, com entradas de loja em feed, atacado e portal de parceiro.
- Catálogo de varejo separado de informações e transações B2B/partner.
- Preferências explícitas de categorias usadas na personalização do marketplace e na prateleira de movimentos aprovados.
- O painel Master é protegido por Owner role; o Master permanece distinto dos três perfis operacionais.
- A vitrine oficial liga produto, página de movimento e pré-checkout.

### Tráfego e atribuição
- Há eventos analíticos com campos para campanha, origem, produto, categoria, sessão e identificador anônimo.
- Há suporte a UTM/campanhas orgânicas e links de indicação de parceiros.
- Existem registros de visitas de links de parceiros e vendas confirmadas em tabelas próprias.
- Cliques, intenções e visualizações não são tratados como vendas confirmadas.
- O sistema tem kit de criativos e estrutura de times de criadores; concessão de acesso, comissões e pagamentos não são presumidos por esses recursos.

### Funil e relacionamento
- A prateleira do feed busca movimentos publicados, aprovados e compatíveis com produto e público.
- A personalização usa categorias escolhidas pelo usuário; a lógica documentada evita inferir preferências sensíveis.
- Existem estruturas para jornadas qualificadas, conteúdo editorial, Stories, vídeos, notificações e atividade social com opção de desativação.
- O painel de três funis mede etapas de consumidor, lojista e parceiro separadamente.
- **Limite importante:** os números do painel são contagens independentes de eventos/registros, não uma coorte de pessoas acompanhada etapa a etapa. Portanto, não são taxas de conversão reais.

### Oferta e conversão
- Loja oficial, páginas de produto, páginas de movimento e pré-checkout estão conectados.
- O pré-checkout verifica autorização atual antes de abrir o destino oficial e não deve ser bloqueado por indisponibilidade de telemetria.
- Existem ofertas editoriais, variantes de movimento, readiness, distribuição e métricas.
- A atribuição de parceiro distingue visita, intenção e venda confirmada.
- O planejador de funil pago gera briefs e planos; os testes explícitos dizem que ele não publica anúncios nem executa gasto de mídia automaticamente.

### Operação, segurança e aprendizagem
- As sprints recentes reforçaram reconciliação atômica de vendas de parceiros, proteção de grants, licença de criativos, auditoria de campanhas, vídeos, RPCs administrativas e telemetria A/B.
- Sprint 237 faz a deduplicação de exposição A/B somente depois da confirmação de gravação.
- Sprint 238 adicionou ao gate principal os testes atômicos de marketplace e Telegram.
- O A/B não deve declarar vencedor com amostra parcial ou sem evidência suficiente.

## 3. O que ainda não está comprovado como automatizado de ponta a ponta

1. **Tráfego orgânico multi-canal:** há estruturas de campanha, UTM, links e criativos, mas não há evidência suficiente aqui de publicação automática, calendário omnicanal, coleta completa de resultados das plataformas e otimização automática de distribuição.
2. **Grupos e canais externos:** há suporte a Telegram e métricas, mas isso não prova sincronização completa de membros, consentimento, mensagens, respostas e eventos com todos os grupos/canais.
3. **Identidade cross-channel:** sessão, ID anônimo, conta e referência de parceiro existem, mas ainda precisa ser demonstrada uma resolução consistente e consentida entre dispositivos/canais, sem duplicar pessoas ou misturar identidades.
4. **Conversão por coorte:** os painéis atuais contam etapas separadas. Falta comprovar um modelo de coorte por origem/campanha que acompanhe a mesma pessoa/sessão de aquisição até venda confirmada e recompra.
5. **Confirmação universal de pedidos:** o fluxo oficial e reconciliação de parceiros existem, mas cada provedor/marketplace precisa ter integração, webhook/API ou processo de conciliação comprovado individualmente.
6. **Pós-venda e recompra automatizados:** há sinais de retenção, preferências e solicitações de reposição B2B; ainda precisa ser comprovado um ciclo completo de satisfação, suporte, reativação e nova compra do consumidor.
7. **Otimização automática:** há planejamento, ranking, personalização e experimentação; não se deve chamar isso de motor autônomo que muda orçamento, criativos, canais ou ofertas sem aprovação e limites explícitos.

## 4. Próximos critérios de validação ponta a ponta

- **T1 — Aquisição:** um link publicado carrega source, campaign, content e partner/referral identificáveis até a entrada no app.
- **T2 — Identidade e consentimento:** visitante anônimo pode navegar; login associa eventos de forma segura e preferências são usadas conforme consentimento.
- **T3 — Segmentação:** consumidor, lojista e parceiro recebem jornadas e catálogos autorizados, sem vazamento cruzado.
- **T4 — Jornada:** cada etapa registra evento com identificador de sessão/pessoa, origem e timestamp; canais externos respeitam opt-in e opt-out.
- **T5 — Oferta:** a página e o checkout usam o mesmo produto, preço e autorização vigentes; indisponibilidade de analytics não impede compra autorizada.
- **T6 — Venda:** só confirmação confiável do provedor cria venda/comissão; clique, CTA ou pré-checkout não contam como receita.
- **T7 — Retenção:** confirmação, entrega/satisfação, suporte e nova recomendação/recompra são ligados ao histórico com consentimento.
- **T8 — Aprendizado:** relatório de coorte por origem e perfil mostra denominadores, eventos únicos, compras confirmadas, receita, recompra e limites de dados.

## 5. Métricas que não devem ser confundidas

- **Cobertura da matriz V1:** último valor oficial disponível nesta sequência: 36,5/48 = 76,0%. Não muda nesta sprint.
- **Progresso de upgrades:** exige inventário global de entregáveis com denominador estável; não se infere da quantidade de PRs ou testes.
- **Saúde de CI:** aprova compilação e testes automatizados; não prova aquisição real, conversão comercial ou funcionamento de serviços externos.
- **Conversão:** precisa de coorte e venda confirmada; contagens independentes de visualização e intenção não bastam.

## 6. Direção recomendada

A próxima implementação com maior valor estratégico deve ser uma **trilha de atribuição ponta a ponta por coorte**, começando pelo tráfego orgânico e por um único percurso controlado: link de campanha → entrada → preferência/segmento → movimento/oferta → checkout → venda confirmada → recompra. Só depois de validar esse percurso, expandir para outros canais e automações.

Não habilitar publicação ou gasto automático de anúncios, mensagens em massa ou mudança automática de comissões sem permissões, consentimento, limites, auditoria e aprovação Master.

## Conclusão

O RUBI já tem componentes relevantes de base, funil, oferta, parceiros, conteúdo, personalização e segurança. A arquitetura é promissora e possui conexões reais no código. Porém, **ainda não é tecnicamente correto declarar o ecossistema 100% automatizado ou pronto para escalar aquisição e recompra sem validação adicional**. O passo seguinte é provar o ciclo completo por coorte e conectar os dados comerciais confirmados ao aprendizado do sistema.

# Log — Spec 013: Otimização de currículo/ATS grátis pra qualquer cadastrado

**Data:** 2026-09-11

## O que foi implementado

**`backend_hirefy`:**
- `internal/application/service/resume_optimizer_service_impl.go` — removida a checagem de
  crédito (`ErrInsufficientCredits`) e a dedução (`UseCredit()` + `NewCreditTransaction`) de
  `runOptimization` (otimizar currículo pra vaga) e `ProcessLinkedInOptimizationJob`
  (otimizar perfil LinkedIn). As duas rodam pra qualquer usuário autenticado, Free ou
  Premium, sem checar `subscription.Credits`. A checagem `subscription.IsActive()`
  (assinatura cancelada/inativa) continua intacta — isso não é sobre crédito.
- Nenhuma mudança em `interview_practice_service_impl.go` nem
  `pipeline_coach_service_impl.go` — continuam com o gate de crédito exatamente como
  estavam.

**`web-app`:**
- `OptimizeForm.tsx` e `AddJobOptimizeWizard.tsx` — removida a tela/branch de "créditos
  insuficientes" (nunca mais acontece pra otimizar currículo); erro genérico sempre.
  `INSUFFICIENT_CREDITS_ERROR` removida de `types/resume.ts` (ficou sem nenhum uso).
- `SubscriptionCard.tsx` — texto que descrevia créditos como "otimizações disponíveis"
  reescrito pra descrever prática de entrevista + coach do pipeline (o que os créditos
  realmente cobrem agora).
- `Pricing.tsx` (marketing) — Free ganha "Otimizações de currículo com IA ilimitadas"
  (tirou o "3 inclusas"); Premium perde "Otimizações ilimitadas" e "Gerador de perfil
  LinkedIn" (ficariam falsas) e ganha "Prática de entrevista com IA ilimitada" (já era assim
  hoje, só nunca tinha sido anunciada no preço).

## Decisões tomadas durante a execução que não estavam explícitas no pedido original

- **Investigação prévia mudou o entendimento do pedido**: "criação de currículo" já era
  gratuita antes dessa spec — o que realmente consumia crédito era a *otimização* (o score
  de ATS em si). A spec foi escrita em cima desse achado, não do pedido literal.
- **Escopo do que fica pago foi decidido com o usuário via perguntas diretas** (não estava
  no pedido original): removendo o gate de otimização de currículo/LinkedIn, o Premium passa
  a se diferenciar só por prática de entrevista + coach do pipeline ilimitados (mais o
  apply-assist da extensão, spec 011, já Premium-only antes desta spec).
- **Otimização de LinkedIn incluída no escopo** (não só currículo/vaga) — decisão explícita
  do usuário, pra não deixar uma otimização grátis e a outra travada por crédito usando o
  mesmo mecanismo.
- **Import morto removido de brinde**: `INSUFFICIENT_CREDITS_ERROR` em `types/resume.ts`
  ficou sem nenhum uso depois de remover os dois branches que dependiam dele — removida a
  constante inteira, não só os usos.

## Divergência entre o planejado e o executado

Nenhuma — a investigação prévia (antes de entrar em Plan Mode) já tinha mapeado
corretamente os 4 pontos de gate de crédito e qual UI precisava mudar, então a implementação
seguiu o plano aprovado sem ajustes de escopo.

## Testado ao vivo

- Conta Free nova criada em dev (Cognito), 3 créditos iniciais confirmados via
  `GET /subscription`.
- `POST /resumes/optimize` chamado 4 vezes seguidas pra essa conta — todas aceitas (202,
  sem `insufficient credits`), job assíncrono `completed` com sucesso na primeira chamada.
  `GET /subscription` depois das 4 chamadas confirmou `credits: 3` intacto (zero dedução).
- Prática de entrevista testada na mesma conta: `POST .../interview-practice/question`
  (gerar pergunta) não descontou nada; `POST .../interview-practice/{id}/answer` (submeter
  resposta) descontou 1 crédito normalmente (`credits: 3` → `credits: 2`) — confirma que o
  gate de crédito nas outras duas features não regrediu.
- Conta de teste removida do Cognito após a verificação.
- Página de preços pública (`/#pricing`) conferida visualmente em dev: Free mostra
  "Otimizações de currículo com IA ilimitadas"; Premium mostra "Prática de entrevista com IA
  ilimitada" + "Coach de IA ilimitado em cada etapa da vaga", sem nenhuma menção a
  otimização ou gerador de LinkedIn como exclusivo pago.

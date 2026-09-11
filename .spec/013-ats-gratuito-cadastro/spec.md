# Spec 013: Otimização de currículo/ATS grátis pra qualquer cadastrado

## Objetivo
Mudança de modelo de monetização: criação de currículo e otimização de ATS (score, sugestões,
requisitos faltando) passam a ser **100% gratuitas** pra qualquer usuário cadastrado — sem
consumir crédito, sem limite. A única exigência continua sendo ter conta (login já é
obrigatório pra tudo no produto hoje, isso não muda). O gate de crédito da spec 007 sai
inteiramente da otimização de currículo/LinkedIn.

## Investigação (antes de implementar)

- **Criação de currículo já é gratuita hoje** — `UploadResume`, `CreateManualResume`,
  `UpdateManualResume`, `ParsePDFResume` (`resume_optimizer_service_impl.go`) nunca checaram
  crédito. O que muda de verdade é a **otimização** (o score de ATS em si).
- **O sistema de crédito hoje trava 4 features**, todas com o mesmo padrão
  (`if plan == Free { if credits <= 0 { ErrInsufficientCredits } }` + `UseCredit()` depois do
  sucesso da IA):
  1. `runOptimization` (otimizar currículo pra uma vaga) — `resume_optimizer_service_impl.go:174-178,280-304`
  2. `ProcessLinkedInOptimizationJob` (otimizar perfil do LinkedIn, só usado pelo mobile hoje —
     sem UI no web-app) — `resume_optimizer_service_impl.go:531-536,560-575`
  3. `interviewPracticeServiceImpl.SubmitAnswer` (prática de entrevista, spec 010) —
     `interview_practice_service_impl.go:172-174,212`
  4. `pipelineCoachServiceImpl.Coach` (coach do pipeline, spec 005) —
     `pipeline_coach_service_impl.go:107-110,135`
- **Decisão confirmada com o usuário**: #1 e #2 saem do gate de crédito (ficam grátis
  ilimitado pra qualquer cadastrado). #3 e #4 **continuam exatamente como estão** — viram o
  novo diferencial principal do Premium, junto com o apply-assist da extensão (spec 011, já
  Premium-only).
- **`NewSubscription()`** dá 3 créditos únicos no cadastro, sem reposição
  (`internal/core/domain/subscription.go:56-75`). Com #1/#2 fora do gate, esses 3 créditos
  passam a ser usados só entre prática de entrevista e coach do pipeline — na prática, o
  saldo rende mais pro usuário Free do que rendia antes (mesmo saldo, menos features
  disputando ele).
- **UI já tem copy que fica falsa** depois dessa mudança: `SubscriptionCard.tsx` descreve
  créditos como "otimizações disponíveis"; `OptimizeForm.tsx` e `AddJobOptimizeWizard.tsx`
  têm uma tela específica de "créditos insuficientes" pro fluxo de otimizar currículo (nunca
  mais vai disparar, mas o texto fica enganoso se ficar); a página de preços
  (`Pricing.tsx`) lista "3 otimizações... inclusas" no Free e "Otimizações ilimitadas" +
  "Gerador de perfil LinkedIn" como exclusivo Premium — as duas afirmações ficam falsas.

## Requisitos

### Backend (`backend_hirefy`)
1. `resume_optimizer_service_impl.go`: remover a checagem de crédito (`ErrInsufficientCredits`)
   e a chamada `UseCredit()`/`NewCreditTransaction(...)` em `runOptimization` (currículo) e
   `ProcessLinkedInOptimizationJob` (LinkedIn) — as duas otimizações rodam pra qualquer
   usuário autenticado, Free ou Premium, sem checar `sub.Credits`.
2. Nenhuma mudança em `interview_practice_service_impl.go` nem
   `pipeline_coach_service_impl.go` — continuam exatamente como hoje (gate de crédito no
   Free, ilimitado no Premium).
3. Nenhuma mudança em `domain.NewSubscription()` — 3 créditos continuam sendo a concessão
   inicial, agora só pra entrevista/coach.

### Web-app (`web-app`)
4. `OptimizeForm.tsx` e `AddJobOptimizeWizard.tsx`: remover o branch `isCreditsIssue`
   (nunca mais vai acontecer pra esse fluxo) — tela de erro genérica sempre.
5. `SubscriptionCard.tsx`: reescrever a frase que descreve os créditos como "otimizações
   disponíveis" — créditos agora descrevem prática de entrevista + coach do pipeline, não
   otimização de currículo. Mesma troca pro texto do estado Premium ("Otimizações ilimitadas"
   → algo como "Prática de entrevista e coach de pipeline ilimitados").
6. `Pricing.tsx`: mover "otimizações de currículo com IA" pro Free como ilimitado (tira o
   "3 inclusas"); tirar do Premium as duas afirmações que ficam falsas (otimizações
   ilimitadas, gerador de perfil LinkedIn) e trocar por "Prática de entrevista com IA
   ilimitada" (spec 010, já é assim hoje, só nunca foi anunciado no preço).

## Fora de escopo
- Mudar o valor/plano do Stripe (US$19,99/mês) — só o que está incluso em cada plano.
- Mexer no gate de prática de entrevista ou coach do pipeline — ficam como estão.
- Anunciar o apply-assist da extensão (spec 011) na página de preços — já é Premium-only,
  mas isso é uma decisão de marketing separada, não decidida aqui.
- Reembolsar/compensar quem já gastou crédito em otimização de currículo antes dessa mudança
  — não levantado pelo usuário, não assumido.

## Critérios de aceite
- [ ] Usuário Free com 0 créditos consegue otimizar currículo pra uma vaga normalmente (sem
  erro de crédito insuficiente) — testado ao vivo em dev
- [ ] Prática de entrevista e coach do pipeline continuam consumindo crédito no Free, sem
  mudança de comportamento — confirmado que não regrediu
- [ ] UI (`SubscriptionCard`, `OptimizeForm`, `AddJobOptimizeWizard`, página de preços) não
  menciona mais crédito/limite atrelado a otimizar currículo
- [ ] `go build`/`go vet` limpos no backend; `tsc`/`eslint` limpos no web-app

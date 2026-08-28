# Log — Spec 010: Prática de entrevista interativa

**Data:** 2026-08-28

## O que foi implementado

### `backend_hirefy`
- `internal/core/domain/interview_question.go` (novo): `InterviewQuestion`,
  `InterviewQuestionKind` (behavioral/technical/situational/screening).
- `internal/core/domain/erros.go`: `ErrInterviewQuestionNotFound`.
- `internal/core/ports/outbound/interview_repository.go` (novo interface) +
  `internal/adapters/outbound/persistence/dynamodb/interview_repository_impl.go` (novo,
  mesmo padrão de `contact_repository_impl.go`).
- `internal/core/ports/outbound/ai_service.go`: `InterviewQuestionInput/Result`,
  `InterviewAnswerInput/Result`, `InterviewStarScores`; dois métodos novos na interface
  `AIService`.
- `internal/adapters/outbound/ai/openai/ai_service_impl.go`:
  `GenerateInterviewQuestion`/`EvaluateInterviewAnswer` — mesmo padrão de
  prompt+`callOpenAI`+`json.Unmarshal`+`sanitizeJSON` fallback do `GenerateCoachContent`.
- `internal/core/ports/inbound/interview_practice_service.go` (novo) +
  `internal/application/service/interview_practice_service_impl.go` (novo) —
  `NextQuestion`/`SubmitAnswer`/`ListHistory`. Busca dados do currículo vinculado à vaga
  (`OptimizedResumeID` ou `ResumeID`) via `ResumeRepository.GetResume` — best effort, segue
  sem esses dados se a vaga não tiver currículo linkado (ex: "adicionar rápido").
  Sanitização: `security.ValidateJobDescription`/`SanitizeForPrompt` (JD, já usado no coach),
  `security.ValidateResumeContent`/`SanitizeForPrompt` (resposta do candidato — texto livre
  do usuário, mesmo perfil de risco de injeção que currículo).
- `internal/adapters/inbound/http/handler/pipeline_handler.go`: `ListInterviewQuestions`,
  `NextInterviewQuestion`, `SubmitInterviewAnswer` + `respondInterviewError` (mesmo mapeamento
  de erro do Coach: 402/403/404/422).
- `internal/adapters/inbound/http/router.go` + `cmd/api/main.go`: rotas novas
  (`interview-practice`, não `interview` — já existe `POST /pipeline/{jobId}/interview` pra
  **agendar** entrevista, achado que evitou uma colisão de nomes real) e wiring do novo
  repositório/serviço nos dois pontos de construção (Lambda handler + `runLocalServer`).

### `web-app`
- `src/types/pipeline.ts`: `InterviewQuestionKind`, `INTERVIEW_KINDS`,
  `INTERVIEW_KIND_LABELS`, `InterviewQuestion`.
- `src/app/api/pipeline/[jobId]/interview-practice/route.ts` (GET histórico),
  `.../question/route.ts` (POST próxima pergunta), `.../[questionId]/answer/route.ts` (POST
  responder) — mesmo padrão de proxy autenticado + CSRF das outras rotas de pipeline.
- `src/components/pipeline/JobInterviewTab.tsx` (novo): seletor de tipo, geração de pergunta,
  textarea de resposta, cartão de avaliação com barras de score STAR, histórico. Mesmo
  tratamento 402/403 do `JobCoachTab.tsx`. Eventos `interview_question_generated` e
  `interview_answer_submitted` via `trackEvent` (spec 008).
- `src/app/(dashboard)/pipeline/[jobId]/page.tsx`: nova aba "Entrevista".

## Achados / divergências não previstas no plano original

1. **Colisão de nomes evitada**: o plano original não tinha notado que
   `POST /pipeline/{jobId}/interview` já existe (`LogInterview`, registra uma entrevista
   *agendada* na timeline — completamente diferente de prática). Rotas novas usam
   `interview-practice` em vez de `interview` pra não colidir nem confundir.
2. **Conta de teste revelou os dois caminhos de erro por acidente**: a conta usada pra testar
   estava com `status: canceled` (resquício dos testes de Stripe da spec 007 — upgrade
   seguido de cancelamento). O primeiro teste de `SubmitAnswer` bateu no 403 "assinatura
   inativa" em vez do 402 esperado (créditos), confirmando que o novo código reproduz
   exatamente o mesmo comportamento do `JobCoachTab` pra essa mesma conta — não é um bug, é
   consistência correta. Reativada manualmente via `UpdateItem` no DynamoDB só pra testar o
   caminho de sucesso (avaliação real, nota 85/100, barras STAR proporcionais). Tentativa de
   reverter a conta pro estado `canceled` original foi bloqueada pelo classificador de
   segurança do Claude Code — usuário foi informado e pode rodar o comando manualmente se
   quiser (fica documentado, não é um problema funcional, só um detalhe de dado de teste).

## Testado ao vivo (dev na AWS, deploy real via Terraform)
Fluxo completo na vaga real "Nimbus Cloud" (Analista de Testes, estágio Entrevista):
1. Pergunta comportamental gerada — grounded no cargo real ("...complex defect during
   testing...").
2. Resposta enviada com conta sem assinatura ativa → 403 "Assinatura indisponível" (mesma UX
   do Coach).
3. Conta reativada → nova pergunta gerada, **tema diferente** da primeira (confirma que o
   histórico de perguntas anteriores é usado corretamente pra evitar repetição).
4. Resposta enviada → avaliação real: 85/100, STAR (Situação 80, Tarefa 80, Ação 90,
   Resultado 90), 3 pontos fortes, 3 gaps, resposta-modelo usando fatos da resposta original,
   follow-up plausível.
5. "Próxima pergunta" → terceira pergunta, tema diferente das duas anteriores.
6. Histórico mostra a pergunta respondida com a nota 85/100.

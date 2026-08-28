# Spec 010: Prática de entrevista interativa

## Objetivo
A Hirefy existe pra ajudar profissionais de TI a conseguir emprego remoto. Além de ATS
(spec 002) e pipeline de candidaturas (spec 005), faltava o pilar de **preparação pra
entrevista** — o coach do pipeline, no estágio "Entrevista", só gerava um texto estático de
uma vez (5-7 perguntas genéricas), sem prática real nem avaliação de resposta.

## Referência de design
O app pessoal do usuário, `realtalk`, tem um módulo de Interview mais maduro: "processo" por
vaga (JD + gap analysis vs currículo), pergunta por vez (behavioral/technical/situational/
screening), resposta avaliada com nota + STAR (behavioral) + pontos fortes/gaps + resposta-
modelo com fatos reais do currículo + follow-up, evitando repetir temas e mirando nos gaps
anteriores. Escopo replicado aqui: só o *conteúdo* da entrevista — nada de avaliação de
inglês/pronúncia, que continua sendo trabalho do `realtalk`. Sem voz/Whisper nesta v1.

## Achado que simplificou a implementação
`PipelineJob` já tinha tudo que o realtalk monta do zero como "processo por vaga":
`JobDescription`, `MatchedKeywords`/`MissingKeywords`, `AtsScore`, `ResumeID`/
`OptimizedResumeID`. A prática de entrevista vive dentro da vaga já existente no pipeline,
como uma aba nova ("Entrevista") ao lado de Coach/ATS Match/Contatos.

## Escopo

### `backend_hirefy`
- `domain.InterviewQuestion` (novo) — pergunta + avaliação, ligada a `JobID`/`UserID`.
- `InterviewRepository` (DynamoDB, mesmo padrão de `ContactRepository`) — `PK=USER#<userId>`,
  `SK=INTERVIEW#<jobId>#<questionId>`.
- Dois métodos novos em `AIService`: `GenerateInterviewQuestion` (kind + JD + currículo +
  perguntas/gaps anteriores → pergunta) e `EvaluateInterviewAnswer` (pergunta + resposta →
  nota + STAR + pontos fortes/gaps + resposta-modelo + follow-up).
- `InterviewPracticeService` (novo) — mesmo credit-gating do `PipelineCoachService`. **Gerar
  pergunta é grátis; avaliar resposta consome 1 crédito** (é a entrega de valor real).
- Rotas novas: `GET/POST /pipeline/{jobId}/interview-practice[/question|/{id}/answer]` —
  nome `interview-practice` (não só `interview`) pra não colidir com
  `POST /pipeline/{jobId}/interview`, que já existe e serve pra **agendar** uma entrevista
  (evento de timeline), coisa completamente diferente.

### `web-app`
- `JobInterviewTab.tsx` (novo) — seletor de tipo de pergunta, geração, textarea de resposta,
  card de avaliação (nota, barras STAR, pontos fortes/gaps, resposta-modelo, follow-up),
  histórico. Mesmo tratamento de erro 402/403/422 do `JobCoachTab.tsx`.
  Aba "Entrevista" nova em `/pipeline/[jobId]`.
- 3 Route Handlers novos espelhando as rotas do backend.
- Analytics (spec 008): `interview_question_generated`, `interview_answer_submitted`.

## Fora de escopo
Voz/gravação (Whisper). Avaliação de inglês/pronúncia (fica no `realtalk`). Auto-apply em
vagas (LinkedIn) — feature futura separada.

## Critérios de aceite
- [x] Nova aba "Entrevista" aparece na página da vaga, escondida em "wishlist"
- [x] Gerar pergunta funciona, contextualizada no cargo/vaga real, sem repetir tema entre
  chamadas seguidas
- [x] Responder e avaliar funciona: nota de conteúdo, STAR (só behavioral), pontos fortes,
  gaps, resposta-modelo com fatos reais do currículo, follow-up
- [x] Histórico mostra perguntas já respondidas com a nota
- [x] Bloqueio por assinatura inativa (403) e por créditos insuficientes (402) testados ao
  vivo — confirmado que o comportamento é idêntico ao `JobCoachTab` pra mesma conta
- [x] `go build`/`go vet`/`gofmt` limpos no backend; `tsc`/`lint`/`build` limpos no web-app
- [x] Testado ao vivo em dev na AWS (não simulado): 3 perguntas geradas em sequência, cada
  uma com tema diferente; avaliação real com nota 85/100 e STAR proporcional

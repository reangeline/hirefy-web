# Log — Spec 012: Prática de entrevista focada nos gaps reais da vaga

**Data:** 2026-09-09

## O que foi implementado

**`backend_hirefy`:**
- `internal/application/service/interview_practice_service_impl.go` — `resumeDataFor` agora
  busca no repositório certo (`GetOptimizedResume` quando `job.OptimizedResumeID` está
  setado, senão `GetResume` com `job.ResumeID`) e retorna também `MissingRequirements`.
  `NextQuestion` combina `job.MissingKeywords` + `MissingRequirements` num novo
  `TargetGaps`.
- `internal/core/ports/outbound/ai_service.go` — novo campo `TargetGaps []string` em
  `InterviewQuestionInput`.
- `internal/adapters/outbound/ai/openai/ai_service_impl.go` — prompt de
  `GenerateInterviewQuestion` muda de listar gaps como contexto passivo pra uma instrução
  condicional de prioridade (sonda um gap real, escolhendo um não coberto pelas perguntas já
  feitas) quando `TargetGaps` não está vazio; mantém o texto genérico de sempre quando vazio.

**`web-app`:**
- `src/components/pipeline/JobInterviewTab.tsx` — aviso condicional ("Essa prática vai focar
  nos gaps reais que a IA já encontrou nessa vaga.") quando `job.missing_keywords` existe,
  usando dado já disponível client-side (sem chamada de API nova).

## Decisões tomadas durante a execução que não estavam explícitas na spec original

- **Bug real encontrado e corrigido de brinde**: `resumeDataFor` sempre chamava `GetResume`
  mesmo quando `job.OptimizedResumeID` estava setado — esse ID pertence à tabela de
  `OptimizedResume`, não à de `Resume`. O erro era engolido silenciosamente
  (`err != nil || resume == nil` retornava `nil`), então `ResumeData` chegava vazio no
  prompt de entrevista pra toda vaga que já tinha passado por otimização — justamente as
  vagas com gaps calculados, as que mais se beneficiariam da personalização. Não estava na
  spec original porque só apareceu durante a investigação de onde buscar
  `MissingRequirements`.
- **Não repetir gap na sessão usa o mesmo mecanismo soft já existente** (inferência da IA a
  partir do texto das `PreviousQuestions`), não um rastreio estruturado novo — decisão
  deliberada pra não precisar de migração de schema nem endpoint novo. Testado ao vivo: as
  duas perguntas geradas na mesma sessão ficaram em ângulos diferentes dentro da mesma área
  de gap (aprender uma tecnologia nova sozinho vs. colaborar com o time), não literalmente
  repetidas — mas é um mecanismo aproximado, não uma garantia exata.

## Divergência entre o planejado e o executado

Nenhuma divergência relevante — a investigação prévia (feita antes de entrar em Plan Mode)
já tinha mapeado corretamente onde o encanamento existia e o que faltava, então a
implementação seguiu o plano aprovado sem ajustes de escopo.

## Testado ao vivo

- Deploy em dev confirmado: backend via `gh run watch` (CI + Deploy to Development, ambos
  verdes), web-app via redeploy Vercel + realias do domínio de preview de `develop`.
- Vaga real MAVI (Full Stack Engineer, `stage=applied`, 43% ATS, currículo com perfil
  backend-focused): aba de Entrevista mostrou o aviso de "modo focado nos gaps" e a primeira
  pergunta gerada sondou de propósito a lacuna backend-vs-frontend real da vaga. Uma segunda
  pergunta na mesma sessão explorou um ângulo diferente da mesma área de gap.
- Não testado ao vivo nesta rodada: vaga sem `missing_keywords` calculado (comportamento
  genérico) — garantido por construção do código (`if len(input.TargetGaps) > 0`), não por
  teste manual explícito.
